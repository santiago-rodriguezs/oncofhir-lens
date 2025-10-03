import { sonnetJson } from '@/lib/sonnet';
import { Variant, VariantSchema, Annotation, AnnotationSchema } from '@/lib/schemas';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define Node.js runtime
export const runtime = 'nodejs';

// Request body schema
const RequestSchema = z.object({
  variants: z.array(VariantSchema),
});

/**
 * Fetch annotations from OncoKB API
 * @param variants - Array of variants to annotate
 * @returns Array of annotations
 */
async function fetchOncoKB(variants: Variant[]): Promise<Annotation[]> {
  if (!process.env.ONCOKB_API_KEY || !process.env.ONCOKB_BASE_URL) {
    throw new Error('OncoKB API not configured');
  }
  
  const annotations: Annotation[] = [];
  
  // Process each variant
  for (const variant of variants) {
    try {
      // Construct query parameters
      const params = new URLSearchParams({
        hugoSymbol: variant.gene || '',
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
      const annotation: Annotation = {
        gene: variant.gene || 'Unknown',
        variant: `${variant.chrom}:${variant.pos}${variant.ref}>${variant.alt}`,
      };
      
      // Add oncogenicity if available
      if (data.oncogenic) {
        annotation.oncogenicity = data.oncogenic === 'Oncogenic' || data.oncogenic === 'Likely Oncogenic'
          ? data.oncogenic
          : 'Unknown';
      }
      
      // Add cancer types if available
      if (data.tumorTypes && Array.isArray(data.tumorTypes)) {
        annotation.cancerTypes = data.tumorTypes.map((type: any) => type.name);
      }
      
      // Add actionability if available
      if (data.treatments && Array.isArray(data.treatments)) {
        annotation.actionability = data.treatments.map((treatment: any) => ({
          drug: treatment.drugs.map((drug: any) => drug.drugName).join(' + '),
          level: treatment.level,
        }));
      }
      
      annotations.push(annotation);
    } catch (error) {
      console.error(`Error annotating variant ${variant.gene || 'Unknown'}:`, error);
      // Add basic annotation for failed variant
      annotations.push({
        gene: variant.gene || 'Unknown',
        variant: `${variant.chrom}:${variant.pos}${variant.ref}>${variant.alt}`,
        oncogenicity: 'Unknown',
      });
    }
  }
  
  return annotations;
}

/**
 * Use Sonnet to annotate variants
 * @param variants - Array of variants to annotate
 * @returns Array of annotations
 */
async function annotateSonnet(variants: Variant[]): Promise<Annotation[]> {
  const system = "Eres un curador de conocimiento oncológico. Responde SOLO JSON válido del esquema Annotation[]. Usa conocimiento general (marcar nivel como 'Unknown' si no estás seguro).";
  
  const userPrompt = `
    Por favor, analiza las siguientes variantes genómicas y proporciona anotaciones oncológicas para cada una:
    
    ${JSON.stringify(variants, null, 2)}
    
    Para cada variante, proporciona:
    1. gene: El gen afectado
    2. variant: La notación de la variante (puedes usar la información de chrom, pos, ref, alt)
    3. cancerTypes: Tipos de cáncer asociados (array de strings) si los conoces
    4. oncogenicity: "Oncogenic", "Likely Oncogenic", o "Unknown"
    5. actionability: Array de objetos {drug, level} con posibles tratamientos dirigidos
    
    Responde SOLO con un array JSON de objetos Annotation, sin texto adicional.
  `;
  
  return await sonnetJson(
    'claude-sonnet-4.5',
    system,
    userPrompt,
    'Annotation[]',
    z.array(AnnotationSchema)
  );
}

/**
 * POST handler for variant annotation
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { variants } = RequestSchema.parse(body);
    
    let annotations: Annotation[];
    
    // Try OncoKB API if configured, otherwise use Sonnet
    if (process.env.ONCOKB_API_KEY && process.env.ONCOKB_BASE_URL) {
      try {
        annotations = await fetchOncoKB(variants);
      } catch (error) {
        console.error('OncoKB API error, falling back to Sonnet:', error);
        annotations = await annotateSonnet(variants);
      }
    } else {
      // Use Sonnet for annotation
      annotations = await annotateSonnet(variants);
    }
    
    // Validate annotations
    const validatedAnnotations = z.array(AnnotationSchema).parse(annotations);
    
    // Return annotations
    return NextResponse.json({ annotations: validatedAnnotations }, { status: 200 });
  } catch (error) {
    console.error('Error annotating variants:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
