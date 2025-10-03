import { sonnetJson } from '@/lib/sonnet';
import { Annotation, AnnotationSchema, FhirBundle, FhirBundleSchema } from '@/lib/schemas';
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

// Define Node.js runtime
export const runtime = 'nodejs';

// Request body schema
const RequestSchema = z.object({
  annotations: z.array(AnnotationSchema),
  patient: z.object({
    id: z.string().optional(),
    name: z.string().optional(),
    gender: z.string().optional(),
    birthDate: z.string().optional(),
  }).optional(),
  specimen: z.object({
    id: z.string().optional(),
    type: z.string().optional(),
    collectionDate: z.string().optional(),
  }).optional(),
});

/**
 * Optional function to persist FHIR bundle to a FHIR store
 * Not implemented yet - stub for future development
 */
async function persistToFhirStore(bundle: FhirBundle): Promise<string> {
  // Check if FHIR store is configured
  if (!process.env.GOOGLE_PROJECT_ID || !process.env.HEALTHCARE_DATASET || !process.env.FHIR_STORE) {
    throw new Error('FHIR store not configured');
  }
  
  // This is a stub function - would implement actual FHIR store persistence here
  console.log('Would persist bundle to FHIR store:', 
    `${process.env.GOOGLE_PROJECT_ID}/${process.env.HEALTHCARE_DATASET}/${process.env.FHIR_STORE}`);
  
  return 'fhir-bundle-id-placeholder';
}

/**
 * POST handler for FHIR bundle composition
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();
    const { annotations, patient, specimen } = RequestSchema.parse(body);
    
    // System prompt for Sonnet
    const system = `Eres integrador HL7 Genomics on FHIR (R4). Devuelve SOLO JSON FhirBundle estricto. 
    Usa LOINC 69548-6 (Genetic variant assessment), 48018-6 (Gene studied), 48004-6 (DNA change c.HGVS), 
    48005-3 (AA change p.HGVS), 81258-6 (VAF). Bundle.type='collection'.`;
    
    // User prompt with annotations and metadata
    const userPrompt = `
      Por favor, convierte las siguientes anotaciones genómicas a un Bundle FHIR R4:
      
      Anotaciones:
      ${JSON.stringify(annotations, null, 2)}
      
      ${patient ? `Información del paciente:\n${JSON.stringify(patient, null, 2)}\n` : ''}
      ${specimen ? `Información de la muestra:\n${JSON.stringify(specimen, null, 2)}\n` : ''}
      
      Crea un Bundle FHIR con:
      1. Un recurso Patient (con los datos proporcionados o un stub)
      2. Un recurso Specimen (con los datos proporcionados o un stub)
      3. Un recurso Observation por cada variante genómica, usando:
         - LOINC 69548-6 como código principal (Genetic variant assessment)
         - Componentes con códigos LOINC:
           - 48018-6 para el gen (Gene studied)
           - 48004-6 para la notación c.HGVS (DNA change)
           - 48005-3 para la notación p.HGVS (AA change) si está disponible
           - 81258-6 para VAF si está disponible
      
      Responde SOLO con el JSON del Bundle FHIR, sin texto adicional.
    `;
    
    // Call Sonnet to generate FHIR bundle
    const bundle = await sonnetJson<FhirBundle>(
      'claude-sonnet-4.5',
      system,
      userPrompt,
      'FhirBundle',
      FhirBundleSchema
    );
    
    // Log the bundle to the console
    console.log('FHIR_BUNDLE', JSON.stringify(bundle, null, 2));
    
    // Return the bundle
    return NextResponse.json({ bundle }, { status: 200 });
  } catch (error) {
    console.error('Error creating FHIR bundle:', error);
    
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
