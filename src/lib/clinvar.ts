import { sonnetJson } from './sonnet';
import { Variant } from './schemas';
import { z } from 'zod';

// ClinVar annotation schema
export const ClinVarAnnotationSchema = z.object({
  gene: z.string(),
  variant: z.string(),
  clinicalSignificance: z.enum([
    'Pathogenic',
    'Likely Pathogenic',
    'Benign',
    'Likely Benign',
    'VUS',
    'Unknown'
  ]),
  source: z.literal('ClinVar')
});

export type ClinVarAnnotation = z.infer<typeof ClinVarAnnotationSchema>;

/**
 * Fetch annotations from ClinVar E-utilities
 * @param variants - Array of variants to annotate
 * @returns Array of ClinVar annotations
 */
export async function fetchClinVar(variants: Variant[]): Promise<ClinVarAnnotation[]> {
  if (!process.env.CLINVAR_EUTILS) {
    throw new Error('ClinVar E-utilities not configured');
  }
  
  const annotations: ClinVarAnnotation[] = [];
  
  // Process each variant
  for (const variant of variants) {
    try {
      const geneSymbol = variant.gene || '';
      const hgvsNotation = `${variant.chrom}:g.${variant.pos}${variant.ref}>${variant.alt}`;
      
      // Construct query parameters
      const params = new URLSearchParams({
        db: 'clinvar',
        term: `${geneSymbol}[gene] AND ${hgvsNotation}[hgvs]`,
        retmode: 'json',
        retmax: '1'
      });
      
      // Call ClinVar E-utilities API
      const response = await fetch(
        `${process.env.CLINVAR_EUTILS}/esearch.fcgi?${params.toString()}`
      );
      
      if (!response.ok) {
        throw new Error(`ClinVar API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Check if we have results
      if (data.esearchresult && data.esearchresult.idlist && data.esearchresult.idlist.length > 0) {
        // Get the first ID
        const id = data.esearchresult.idlist[0];
        
        // Fetch the summary for this ID
        const summaryParams = new URLSearchParams({
          db: 'clinvar',
          id: id,
          retmode: 'json'
        });
        
        const summaryResponse = await fetch(
          `${process.env.CLINVAR_EUTILS}/esummary.fcgi?${summaryParams.toString()}`
        );
        
        if (!summaryResponse.ok) {
          throw new Error(`ClinVar summary API error: ${summaryResponse.statusText}`);
        }
        
        const summaryData = await summaryResponse.json();
        
        // Extract clinical significance if available
        let clinicalSignificance = 'Unknown';
        if (summaryData.result && summaryData.result[id] && summaryData.result[id].clinical_significance) {
          const significance = summaryData.result[id].clinical_significance.toLowerCase();
          
          if (significance.includes('pathogenic') && !significance.includes('likely')) {
            clinicalSignificance = 'Pathogenic';
          } else if (significance.includes('likely pathogenic')) {
            clinicalSignificance = 'Likely Pathogenic';
          } else if (significance.includes('benign') && !significance.includes('likely')) {
            clinicalSignificance = 'Benign';
          } else if (significance.includes('likely benign')) {
            clinicalSignificance = 'Likely Benign';
          } else if (significance.includes('uncertain') || significance.includes('vus')) {
            clinicalSignificance = 'VUS';
          }
        }
        
        // Add annotation
        annotations.push({
          gene: geneSymbol || 'Unknown',
          variant: hgvsNotation,
          clinicalSignificance: clinicalSignificance as any,
          source: 'ClinVar'
        });
      } else {
        // No results found
        annotations.push({
          gene: geneSymbol || 'Unknown',
          variant: hgvsNotation,
          clinicalSignificance: 'Unknown',
          source: 'ClinVar'
        });
      }
    } catch (error) {
      console.error(`Error fetching ClinVar data for variant ${variant.gene || 'Unknown'}:`, error);
      
      // Add basic annotation for failed variant
      annotations.push({
        gene: variant.gene || 'Unknown',
        variant: `${variant.chrom}:${variant.pos}${variant.ref}>${variant.alt}`,
        clinicalSignificance: 'Unknown',
        source: 'ClinVar'
      });
    }
  }
  
  return annotations;
}

/**
 * Use Sonnet to annotate variants with ClinVar data
 * @param variants - Array of variants to annotate
 * @returns Array of ClinVar annotations
 */
export async function annotateClinVarWithSonnet(variants: Variant[]): Promise<ClinVarAnnotation[]> {
  const system = `Eres un genetista clínico. A partir de variantes genéticas, devuelve su significancia según ClinVar.
Devuelve SOLO JSON válido:

[
  {
    "gene": string,
    "variant": string,
    "clinicalSignificance": "Pathogenic"|"Likely Pathogenic"|"Benign"|"Likely Benign"|"VUS"|"Unknown",
    "source": "ClinVar"
  }
]

IMPORTANTE: Responde SOLO con JSON válido sin ningún formato markdown, sin backticks, sin \`\`\`json, sin comentarios adicionales.`;
  
  const userPrompt = `
    Por favor, analiza las siguientes variantes genómicas y proporciona su significancia clínica según ClinVar:
    
    ${JSON.stringify(variants, null, 2)}
    
    Para cada variante, proporciona:
    1. gene: El gen afectado
    2. variant: La notación de la variante en formato chrom:pos:ref>alt
    3. clinicalSignificance: "Pathogenic", "Likely Pathogenic", "Benign", "Likely Benign", "VUS", o "Unknown"
    4. source: Siempre "ClinVar"
    
    Responde SOLO con un array JSON de objetos, sin texto adicional.
  `;
  
  return await sonnetJson(
    "claude-sonnet-4-5-20250929",
    system,
    userPrompt,
    'ClinVarAnnotations',
    z.array(ClinVarAnnotationSchema)
  );
}
