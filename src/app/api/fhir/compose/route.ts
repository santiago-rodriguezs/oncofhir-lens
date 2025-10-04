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
    const system = "Eres un experto en HL7 FHIR Genomics.\nConvierte los datos consolidados en un Bundle R4 (type: \"collection\") con recursos:\n- Patient (stub)\n- Specimen (stub)\n- Observation (genetic variant) por cada entrada\n\nUsa LOINC codes:\n- 69548-6: Genetic variant assessment\n- 48018-6: Gene studied\n- 48004-6: DNA change (c.HGVS)\n- 48005-3: Amino acid change (p.HGVS)\n- 81258-6: Variant allele frequency (VAF)\n\nIncluye `note` con terapias sugeridas y fuentes.\nDevuelve SOLO JSON válido del esquema FhirBundle.\n\nCRÍTICO: Cada recurso Observation DEBE incluir el campo 'category' con al menos un elemento para 'laboratory'. Ejemplo:\n\"category\": [\n  {\n    \"coding\": [\n      {\n        \"system\": \"http://terminology.hl7.org/CodeSystem/observation-category\",\n        \"code\": \"laboratory\",\n        \"display\": \"Laboratory\"\n      }\n    ]\n  }\n]";
    
    // User prompt with annotations and metadata
    const userPrompt = "Por favor, convierte las siguientes anotaciones genómicas a un Bundle FHIR R4:\n\nAnotaciones:\n" + 
      JSON.stringify(annotations, null, 2) + "\n\n" +
      (patient ? "Información del paciente:\n" + JSON.stringify(patient, null, 2) + "\n" : "") +
      (specimen ? "Información de la muestra:\n" + JSON.stringify(specimen, null, 2) + "\n" : "") +
      "\nCrea un Bundle FHIR con:\n" +
      "1. Un recurso Patient (con los datos proporcionados o un stub)\n" +
      "2. Un recurso Specimen (con los datos proporcionados o un stub)\n" +
      "3. Un recurso Observation por cada variante genómica, usando:\n" +
      "   - LOINC 69548-6 como código principal (Genetic variant assessment)\n" +
      "   - CRÍTICO: Cada Observation DEBE incluir el campo 'category' con un array que contenga al menos un objeto con coding para 'laboratory'. Ejemplo:\n" +
      "     \"category\": [\n" +
      "       {\n" +
      "         \"coding\": [\n" +
      "           {\n" +
      "             \"system\": \"http://terminology.hl7.org/CodeSystem/observation-category\",\n" +
      "             \"code\": \"laboratory\",\n" +
      "             \"display\": \"Laboratory\"\n" +
      "           }\n" +
      "         ]\n" +
      "       }\n" +
      "     ]\n" +
      "   - Componentes con códigos LOINC:\n" +
      "     - 48018-6 para el gen (Gene studied)\n" +
      "     - 48004-6 para la notación c.HGVS (DNA change)\n" +
      "     - 48005-3 para la notación p.HGVS (AA change) si está disponible\n" +
      "     - 81258-6 para VAF si está disponible\n\n" +
      "   - Incluye un campo 'note' con las terapias sugeridas y fuentes de evidencia\n\n" +
      "Responde SOLO con el JSON del Bundle FHIR, sin texto adicional.";
    
    // Call Sonnet to generate FHIR bundle
    const bundle = await sonnetJson<FhirBundle>(
      "claude-sonnet-4-5-20250929",
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
