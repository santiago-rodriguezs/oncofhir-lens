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
  ),
  // Additional fields
  cancerTypes: z.array(z.string()).optional(),
  hotspot: z.boolean().optional(),
  geneSummary: z.string().optional(),
  variantSummary: z.string().optional(),
  suggestedDrugs: z.string().optional()
});

export type OncoKBAnnotation = z.infer<typeof OncoKBAnnotationSchema>;

/**
 * Fetch annotations from OncoKB API
 * @param variants - Array of variants to annotate
 * @returns Array of OncoKB annotations
 */
export async function fetchOncoKB(variants: Variant[]): Promise<OncoKBAnnotation[]> {
  if (!process.env.ONCOKB_AUTH_TOKEN || !process.env.ONCOKB_BASE_URL) {
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
      // Format: chromosome,start,end,reference,variant
      const genomicLocation = `${variant.chrom},${variant.pos},${variant.pos},${variant.ref},${variant.alt}`;
      console.log(`📝 Genomic location: ${genomicLocation}`);
      
      const params = new URLSearchParams({
        genomicLocation,
      });
      
      // We don't have tumor type in our variant schema, so we'll leave it out for now
      
      // Log auth info (without exposing full token)
      const tokenPreview = process.env.ONCOKB_AUTH_TOKEN!.substring(0, 5) + '...' + process.env.ONCOKB_AUTH_TOKEN!.substring(process.env.ONCOKB_AUTH_TOKEN!.length - 5);
      console.log(`🔑 Using OncoKB token in oncokb.ts: ${tokenPreview}`);
      
      const url = `${process.env.ONCOKB_BASE_URL}/annotate/mutations/byGenomicChange?${params.toString()}`;
      console.log(`🌐 Calling OncoKB API from oncokb.ts: ${url}`);
      
      const headers = {
        'Authorization': `Bearer ${process.env.ONCOKB_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      };
      
      console.log('📤 Request headers from oncokb.ts:', JSON.stringify(headers));
      
      // Call OncoKB API
      const response = await fetch(url, { headers });
      
      console.log(`📥 Response status from oncokb.ts: ${response.status} ${response.statusText}`);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ OncoKB API error from oncokb.ts: ${errorText}`);
        throw new Error(`OncoKB API error: ${errorText}`);
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
      
      // Extract therapies with drug names
      const actionability = therapies.length > 0 ? therapies : [];
      
      // Get the drug names as a comma-separated string for display
      const drugNames = therapies.map(t => t.drug).join(', ');
      
      // Add annotation with enhanced information
      annotations.push({
        gene: variant.gene || 'Unknown',
        variant: `${variant.chrom}:${variant.pos}${variant.ref}>${variant.alt}`,
        oncogenicity: oncogenicity,
        evidenceLevel: data.highestSensitiveLevel || 'Unknown',
        therapies: actionability,
        // Add additional fields from OncoKB
        cancerTypes: data.tumorTypeSummary ? [data.tumorTypeSummary] : [],
        hotspot: data.hotspot || false,
        geneSummary: data.geneSummary || '',
        variantSummary: data.variantSummary || '',
        suggestedDrugs: drugNames || 'No sugerencias disponibles'
      });
    } catch (error) {
      console.error(`Error fetching OncoKB data for variant ${variant.gene || 'Unknown'}:`, error);
      
      // Add basic annotation for failed variant with all fields
      annotations.push({
        gene: variant.gene || 'Unknown',
        variant: `${variant.chrom}:${variant.pos}${variant.ref}>${variant.alt}`,
        oncogenicity: 'Unknown',
        evidenceLevel: 'Unknown',
        therapies: [],
        cancerTypes: [],
        hotspot: false,
        geneSummary: '',
        variantSummary: '',
        suggestedDrugs: 'No disponible'
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
    "therapies": [{ "drug": string, "level": string }],
    "cancerTypes": string[],
    "hotspot": boolean,
    "geneSummary": string,
    "variantSummary": string,
    "suggestedDrugs": string
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
    6. cancerTypes: Array de strings con tipos de cáncer relevantes
    7. hotspot: Boolean indicando si es un hotspot conocido
    8. geneSummary: Resumen del gen
    9. variantSummary: Resumen de la variante
    10. suggestedDrugs: String con drogas sugeridas separadas por comas
    
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
