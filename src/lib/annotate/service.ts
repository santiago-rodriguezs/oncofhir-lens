import { VariantInput } from '@/lib/schemas';
import { Variant, Evidence, Therapy } from '@/core/models';
import { fetchOncoKB, annotateOncoKBWithSonnet } from '@/lib/oncokb';
import { fetchClinVar, annotateClinVarWithSonnet } from '@/lib/clinvar';
import { fetchDGIdb, annotateDGIdbWithSonnet } from '@/lib/dgidb';

/**
 * Annotate variants with evidence and therapies from multiple sources
 */
export async function annotateVariants(variants: Variant[]): Promise<{
  evidence: Evidence[];
  therapies: Therapy[];
}> {
  console.log(`[AnnotateService] Annotating ${variants.length} variants`);
  
  const evidence: Evidence[] = [];
  const therapies: Therapy[] = [];
  
  try {
    // Convert variants to input format for annotation APIs
    const inputVariants: VariantInput[] = variants.map(v => ({
      chrom: v.chrom || '',
      pos: v.pos || 0,
      ref: v.ref || '',
      alt: v.alt || '',
      gene: v.gene,
      vaf: v.vaf,
      hgvs_c: v.hgvs_c,
      hgvs_p: v.hgvs_p,
    }));

    // Fetch annotations from all sources in parallel
    const [oncoKBResults, clinVarResults, dgidbResults] = await Promise.allSettled([
      Promise.all(inputVariants.map(v => fetchOncoKB([v]).catch(err => {
        console.warn(`OncoKB fetch failed for ${v.gene}:`, err.message);
        return null;
      }))),
      Promise.all(inputVariants.map(v => fetchClinVar([v]).catch(err => {
        console.warn(`ClinVar fetch failed for ${v.gene}:`, err.message);
        return null;
      }))),
      Promise.all(inputVariants.map(v => fetchDGIdb([v]).catch(err => {
        console.warn(`DGIdb fetch failed for ${v.gene}:`, err.message);
        return null;
      }))),
    ]);

    // Process OncoKB annotations
    if (oncoKBResults.status === 'fulfilled') {
      const oncoKBData = oncoKBResults.value.filter(r => r !== null);
      
      for (let i = 0; i < oncoKBData.length; i++) {
        const data = oncoKBData[i];
        if (!data) continue;
        
        const variant = variants[i];
        const gene = variant.gene || 'Unknown';
        
        try {
          const annotations = await annotateOncoKBWithSonnet(data as unknown as VariantInput[]);
          
          // Process each annotation (it returns an array)
          for (const annotation of annotations) {
            // Add evidence
            if (annotation.oncogenicity && annotation.oncogenicity !== 'Unknown') {
              evidence.push({
                evidenceId: `oncokb-${gene}-${i}`,
                source: 'OncoKB',
                level: annotation.evidenceLevel || 'N/A',
                description: annotation.variantSummary || annotation.geneSummary || 'No summary available',
                tumorContext: undefined,
                drugAssociations: annotation.therapies?.map(t => t.drug) || [],
                citations: [],
                timestamp: new Date().toISOString(),
              });
            }
            
            // Add therapies
            if (annotation.therapies) {
              for (const therapy of annotation.therapies) {
                therapies.push({
                  drug: therapy.drug || 'Unknown',
                  combination: undefined,
                  level: therapy.level || 'N/A',
                  biomarker: `${gene} ${variant.hgvs || variant.hgvs_p || variant.hgvs_c || ''}`,
                  tumorType: 'All Solid Tumors',
                  approvalStatus: undefined,
                  evidenceId: `oncokb-${gene}-${i}`,
                });
              }
            }
          }
        } catch (err) {
          console.warn(`Failed to annotate OncoKB data for ${gene}:`, err);
        }
      }
    }

    // Process ClinVar annotations
    if (clinVarResults.status === 'fulfilled') {
      const clinVarData = clinVarResults.value.filter(r => r !== null);
      
      for (let i = 0; i < clinVarData.length; i++) {
        const data = clinVarData[i];
        if (!data) continue;
        
        const variant = variants[i];
        const gene = variant.gene || 'Unknown';
        
        try {
          const annotations = await annotateClinVarWithSonnet(data as unknown as VariantInput[]);
          
          // Process each annotation (it returns an array)
          for (const annotation of annotations) {
            // Add evidence
            if (annotation.clinicalSignificance && annotation.clinicalSignificance !== 'Unknown') {
              evidence.push({
                evidenceId: `clinvar-${gene}-${i}`,
                source: 'ClinVar',
                level: annotation.clinicalSignificance,
                description: `ClinVar classification: ${annotation.clinicalSignificance}`,
                tumorContext: undefined,
                drugAssociations: [],
                citations: [],
                timestamp: new Date().toISOString(),
              });
            }
          }
        } catch (err) {
          console.warn(`Failed to annotate ClinVar data for ${gene}:`, err);
        }
      }
    }

    // Process DGIdb annotations
    if (dgidbResults.status === 'fulfilled') {
      const dgidbData = dgidbResults.value.filter(r => r !== null);
      
      for (let i = 0; i < dgidbData.length; i++) {
        const data = dgidbData[i];
        if (!data) continue;
        
        const variant = variants[i];
        const gene = variant.gene || 'Unknown';
        
        try {
          const annotations = await annotateDGIdbWithSonnet(data as unknown as VariantInput[]);
          
          // Process each annotation (it returns an array)
          for (const annotation of annotations) {
            // Add therapies from DGIdb
            therapies.push({
              drug: annotation.drug || 'Unknown',
              combination: undefined,
              level: annotation.evidence || 'N/A',
              biomarker: gene,
              tumorType: 'All Solid Tumors',
              approvalStatus: undefined,
              evidenceId: `dgidb-${gene}-${i}`,
            });
            
            // Add evidence
            evidence.push({
              evidenceId: `dgidb-${gene}-${i}`,
              source: 'Other',
              level: annotation.evidence || 'N/A',
              description: `Drug-gene interaction: ${annotation.drug || 'Unknown'} targets ${gene}`,
              tumorContext: undefined,
              drugAssociations: [annotation.drug || 'Unknown'],
              citations: [],
              timestamp: new Date().toISOString(),
            });
          }
        } catch (err) {
          console.warn(`Failed to annotate DGIdb data for ${gene}:`, err);
        }
      }
    }

    console.log(`[AnnotateService] Generated ${evidence.length} evidence items and ${therapies.length} therapies`);
    
    return { evidence, therapies };
  } catch (error) {
    console.error('[AnnotateService] Error annotating variants:', error);
    return { evidence: [], therapies: [] };
  }
}
