import { Variant, Evidence, Therapy } from '@/core/models';
import { VariantInput } from '@/lib/schemas';
import { fetchOncoKB, OncoKBAnnotation } from '@/lib/oncokb';
import { fetchClinVar, ClinVarAnnotation } from '@/lib/clinvar';
import { fetchDGIdb, DGIdbAnnotation } from '@/lib/dgidb';

/** Convert core Variant to VariantInput for API calls */
function toInput(v: Variant): VariantInput {
  return {
    chrom: v.chrom || '',
    pos: v.pos || 0,
    ref: v.ref || '',
    alt: v.alt || '',
    gene: v.gene,
    vaf: v.vaf,
    hgvs_c: v.hgvs_c,
    hgvs_p: v.hgvs_p,
  };
}

/**
 * Annotate variants with evidence and therapies from multiple sources.
 * Strategy: try real APIs only — report errors clearly, never mix AI-generated data.
 */
export async function annotateVariants(variants: Variant[]): Promise<{
  evidence: Evidence[];
  therapies: Therapy[];
  errors: { source: string; message: string }[];
}> {
  console.log(`[AnnotateService] Annotating ${variants.length} variants`);

  const evidence: Evidence[] = [];
  const therapies: Therapy[] = [];
  const errors: { source: string; message: string }[] = [];
  const inputs = variants.map(toInput);

  // --- OncoKB ---
  let oncoKBAnnotations: OncoKBAnnotation[] = [];
  try {
    oncoKBAnnotations = await fetchOncoKB(inputs);
    console.log(`[AnnotateService] OncoKB API returned ${oncoKBAnnotations.length} annotations`);
  } catch (err: any) {
    console.error(`[AnnotateService] OncoKB API failed: ${err.message}`);
    errors.push({ source: 'OncoKB', message: err.message });
  }

  for (let i = 0; i < oncoKBAnnotations.length; i++) {
    const ann = oncoKBAnnotations[i];
    const gene = ann.gene || 'Unknown';

    if (ann.oncogenicity && ann.oncogenicity !== 'Unknown') {
      evidence.push({
        evidenceId: `oncokb-${gene}-${i}`,
        source: 'OncoKB',
        level: ann.evidenceLevel || 'N/A',
        description: ann.variantSummary || ann.geneSummary || `${gene}: ${ann.oncogenicity}`,
        tumorContext: undefined,
        drugAssociations: ann.therapies?.map(t => t.drug) || [],
        citations: [],
        timestamp: new Date().toISOString(),
      });
    }

    if (ann.therapies) {
      for (const therapy of ann.therapies) {
        therapies.push({
          drug: therapy.drug || 'Unknown',
          combination: undefined,
          level: therapy.level || 'N/A',
          biomarker: `${gene} ${variants[i]?.hgvs || variants[i]?.hgvs_p || variants[i]?.hgvs_c || ''}`.trim(),
          tumorType: 'All Solid Tumors',
          approvalStatus: undefined,
          evidenceId: `oncokb-${gene}-${i}`,
        });
      }
    }
  }

  // --- ClinVar ---
  let clinVarAnnotations: ClinVarAnnotation[] = [];
  try {
    clinVarAnnotations = await fetchClinVar(inputs);
    console.log(`[AnnotateService] ClinVar API returned ${clinVarAnnotations.length} annotations`);
  } catch (err: any) {
    console.error(`[AnnotateService] ClinVar API failed: ${err.message}`);
    errors.push({ source: 'ClinVar', message: err.message });
  }

  for (let i = 0; i < clinVarAnnotations.length; i++) {
    const ann = clinVarAnnotations[i];
    const gene = ann.gene || 'Unknown';

    if (ann.clinicalSignificance && ann.clinicalSignificance !== 'Unknown') {
      evidence.push({
        evidenceId: `clinvar-${gene}-${i}`,
        source: 'ClinVar',
        level: ann.clinicalSignificance,
        description: `ClinVar: ${ann.clinicalSignificance}`,
        tumorContext: undefined,
        drugAssociations: [],
        citations: [],
        timestamp: new Date().toISOString(),
      });
    }
  }

  // --- DGIdb ---
  let dgidbAnnotations: DGIdbAnnotation[] = [];
  try {
    dgidbAnnotations = await fetchDGIdb(inputs);
    console.log(`[AnnotateService] DGIdb API returned ${dgidbAnnotations.length} annotations`);
  } catch (err: any) {
    console.error(`[AnnotateService] DGIdb API failed: ${err.message}`);
    errors.push({ source: 'DGIdb', message: err.message });
  }

  for (const ann of dgidbAnnotations) {
    const gene = ann.gene || 'Unknown';

    therapies.push({
      drug: ann.drug || 'Unknown',
      combination: undefined,
      level: ann.evidence || 'N/A',
      biomarker: gene,
      tumorType: 'All Solid Tumors',
      approvalStatus: undefined,
      evidenceId: `dgidb-${gene}`,
    });

    evidence.push({
      evidenceId: `dgidb-${gene}-${ann.drug}`,
      source: 'Other',
      level: ann.evidence || 'N/A',
      description: `Interacción droga-gen: ${ann.drug || 'Unknown'} → ${gene}`,
      tumorContext: undefined,
      drugAssociations: [ann.drug || 'Unknown'],
      citations: [],
      timestamp: new Date().toISOString(),
    });
  }

  console.log(`[AnnotateService] Total: ${evidence.length} evidence items, ${therapies.length} therapies, ${errors.length} errors`);
  return { evidence, therapies, errors };
}
