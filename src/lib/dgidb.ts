import { sonnetJson } from './sonnet';
import { Variant } from './schemas';
import { z } from 'zod';

// DGIdb annotation schema
export const DGIdbAnnotationSchema = z.object({
  gene: z.string(),
  drug: z.string(),
  interactionType: z.string().optional(),
  evidence: z.string(),
  source: z.literal('DGIdb')
});

export type DGIdbAnnotation = z.infer<typeof DGIdbAnnotationSchema>;

/**
 * Fetch drug-gene interactions from DGIdb API
 * @param variants - Array of variants to annotate
 * @returns Array of DGIdb annotations
 */
export async function fetchDGIdb(variants: Variant[]): Promise<DGIdbAnnotation[]> {
  if (!process.env.DGIDB_BASE_URL) {
    throw new Error('DGIdb API not configured');
  }
  
  const annotations: DGIdbAnnotation[] = [];
  
  // Extract unique genes from variants
  const genes = [...new Set(variants.map(v => v.gene).filter(Boolean))];
  
  if (genes.length === 0) {
    console.warn('No genes found in variants for DGIdb query');
    return [];
  }
  
  try {
    // Construct query parameters
    const params = new URLSearchParams({
      genes: genes.join(',')
    });
    
    // Call DGIdb API
    const response = await fetch(
      `${process.env.DGIDB_BASE_URL}/interactions.json?${params.toString()}`
    );
    
    if (!response.ok) {
      throw new Error(`DGIdb API error: ${response.statusText}`);
    }
    
    const data = await response.json();
    
    // Process DGIdb response
    if (data.matchedTerms && Array.isArray(data.matchedTerms)) {
      for (const term of data.matchedTerms) {
        const gene = term.geneName;
        
        if (term.interactions && Array.isArray(term.interactions)) {
          for (const interaction of term.interactions) {
            // Create annotation for each drug interaction
            annotations.push({
              gene,
              drug: interaction.drugName,
              interactionType: interaction.interactionType || undefined,
              evidence: interaction.sources.join(', ') || 'Not specified',
              source: 'DGIdb'
            });
          }
        }
      }
    }
  } catch (error) {
    console.error('Error fetching DGIdb data:', error);
  }
  
  return annotations;
}

/**
 * Use Sonnet to annotate variants with DGIdb data
 * @param variants - Array of variants to annotate
 * @returns Array of DGIdb annotations
 */
export async function annotateDGIdbWithSonnet(variants: Variant[]): Promise<DGIdbAnnotation[]> {
  const system = `Eres un farmacólogo oncológico. Devuelve SOLO JSON válido:

[
  {
    "gene": string,
    "drug": string,
    "interactionType"?: string,
    "evidence": string,
    "source": "DGIdb"
  }
]

IMPORTANTE: Responde SOLO con JSON válido sin ningún formato markdown, sin backticks, sin \`\`\`json, sin comentarios adicionales.`;
  
  const userPrompt = `
    Por favor, analiza los siguientes genes de variantes genómicas y proporciona información sobre interacciones farmacológicas conocidas:
    
    ${JSON.stringify(variants.map(v => v.gene).filter(Boolean), null, 2)}
    
    Para cada gen, proporciona:
    1. gene: El nombre del gen
    2. drug: Nombre del fármaco que interactúa con el gen
    3. interactionType: Tipo de interacción (opcional)
    4. evidence: Evidencia o fuente de la información
    5. source: Siempre "DGIdb"
    
    Responde SOLO con un array JSON de objetos, sin texto adicional.
  `;
  
  return await sonnetJson(
    "claude-sonnet-4-5-20250929",
    system,
    userPrompt,
    'DGIdbAnnotations',
    z.array(DGIdbAnnotationSchema)
  );
}
