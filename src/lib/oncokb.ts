import { sonnetJson } from './sonnet';
import { Variant } from './schemas';
import { z } from 'zod';

// OncoKB annotation schema
export const OncoKBAnnotationSchema = z.object({
  gene: z.string(),
  variant: z.string(),
  oncogenicity: z.enum(['Oncogenic', 'Likely Oncogenic', 'Unknown']),
  evidenceLevel: z.enum(['1', '2', '3', '4', 'R1', 'R2', 'Unknown']),
  therapies: z.array(
    z.object({
      drug: z.string(),
      level: z.string()
    })
  )
});

export type OncoKBAnnotation = z.infer<typeof OncoKBAnnotationSchema>;

/**
 * Fetch annotations from OncoKB API
 * @param variants - Array of variants to annotate
 * @returns Array of OncoKB annotations
 */
export async function fetchOncoKB(variants: Variant[]): Promise<OncoKBAnnotation[]> {
  if (!process.env.ONCOKB_API_KEY || !process.env.ONCOKB_BASE_URL) {
    throw new Error('OncoKB API not configured');
  }
  
  const annotations: OncoKBAnnotation[] = [];
  
  // Process each variant
  for (const variant of variants) {
    try {
      // Skip variants without gene information
      if (!variant.gene) {
        console.warn('Skipping variant without gene information:', variant);
        continue;
      }
      
      // Construct query parameters
      const params = new URLSearchParams({
        hugoSymbol: variant.gene,
        alteration: `${variant.ref}${variant.pos}${variant.alt}`,
      });
      
      // Call OncoKB API
      const response = await fetch(
        `${process.env.ONCOKB_BASE_URL}/annotate/mutations/byGenomicChange?${params.toString()}`,
        {
          headers: {
            'Authorization': `Bearer ${process.env.ONCOKB_API_KEY}`,
            'Content-Type': 'application/json',
          },
        }
      );
      
      if (!response.ok) {
        throw new Error(`OncoKB API error: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Transform OncoKB response to our annotation format
      const oncogenicity = data.oncogenic === 'Oncogenic' || data.oncogenic === 'Likely Oncogenic'
        ? data.oncogenic
        : 'Unknown';
      
      // Extract therapies if available
      const therapies = [];
      if (data.treatments && Array.isArray(data.treatments)) {
        for (const treatment of data.treatments) {
          therapies.push({
            drug: treatment.drugs.map((drug: any) => drug.drugName).join(' + '),
            level: treatment.level || 'Unknown'
          });
        }
      }
      
      // Add annotation
      annotations.push({
        gene: variant.gene,
        variant: `${variant.chrom}:${variant.pos}${variant.ref}>${variant.alt}`,
        oncogenicity,
        evidenceLevel: data.highestSensitiveLevel || 'Unknown',
        therapies
      });
    } catch (error) {
      console.error(`Error fetching OncoKB data for variant ${variant.gene || 'Unknown'}:`, error);
      
      // Add basic annotation for failed variant
      annotations.push({
        gene: variant.gene || 'Unknown',
        variant: `${variant.chrom}:${variant.pos}${variant.ref}>${variant.alt}`,
        oncogenicity: 'Unknown',
        evidenceLevel: 'Unknown',
        therapies: []
      });
    }
  }
  
  return annotations;
}

/**
 * Use Sonnet to annotate variants with OncoKB data
 * @param variants - Array of variants to annotate
 * @returns Array of OncoKB annotations
 */
export async function annotateOncoKBWithSonnet(variants: Variant[]): Promise<OncoKBAnnotation[]> {
  const system = `Eres un oncólogo molecular. Tienes acceso al conocimiento de OncoKB hasta 2025.
Para cada variante dada, devuelve JSON válido:

[
  {
    "gene": string,
    "variant": string,
    "oncogenicity": "Oncogenic"|"Likely Oncogenic"|"Unknown",
    "evidenceLevel": "1"|"2"|"3"|"4"|"R1"|"R2"|"Unknown",
    "therapies": [{ "drug": string, "level": string }]
  }
]

Solo JSON, sin markdown. Si no hay terapias conocidas, deja therapies: []
IMPORTANTE: Responde SOLO con JSON válido sin ningún formato markdown, sin backticks, sin \`\`\`json, sin comentarios adicionales.`;
  
  const userPrompt = `
    Por favor, analiza las siguientes variantes genómicas y proporciona anotaciones oncológicas según OncoKB:
    
    ${JSON.stringify(variants, null, 2)}
    
    Para cada variante, proporciona:
    1. gene: El gen afectado
    2. variant: La notación de la variante en formato chrom:pos:ref>alt
    3. oncogenicity: "Oncogenic", "Likely Oncogenic", o "Unknown"
    4. evidenceLevel: "1", "2", "3", "4", "R1", "R2", o "Unknown"
    5. therapies: Array de objetos {drug, level} con posibles tratamientos dirigidos
    
    Responde SOLO con un array JSON de objetos, sin texto adicional.
  `;
  
  return await sonnetJson(
    "claude-sonnet-4-5-20250929",
    system,
    userPrompt,
    'OncoKBAnnotations',
    z.array(OncoKBAnnotationSchema)
  );
}
