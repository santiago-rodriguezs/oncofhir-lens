import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { sonnetJson } from '@/lib/sonnet';
import { Variant, VariantSchema } from '@/lib/schemas';
import { fetchOncoKB, annotateOncoKBWithSonnet, OncoKBAnnotation } from '@/lib/oncokb';
import { fetchClinVar, annotateClinVarWithSonnet, ClinVarAnnotation } from '@/lib/clinvar';
import { fetchDGIdb, annotateDGIdbWithSonnet, DGIdbAnnotation } from '@/lib/dgidb';

// Define Node.js runtime
export const runtime = 'nodejs';

// Request body schema
const RequestSchema = z.object({
  variants: z.array(VariantSchema),
});

// Consolidated annotation schema
const ConsolidatedAnnotationSchema = z.object({
  gene: z.string(),
  variant: z.string(),
  oncogenicity: z.string(),
  clinicalSignificance: z.string(),
  therapies: z.array(
    z.object({
      drug: z.string(),
      level: z.string(),
      source: z.string()
    })
  ),
  evidenceSources: z.array(z.string())
});

type ConsolidatedAnnotation = z.infer<typeof ConsolidatedAnnotationSchema>;

/**
 * Consolidate annotations from multiple sources
 * @param variants - Original variants
 * @param oncoKBAnnotations - Annotations from OncoKB
 * @param clinVarAnnotations - Annotations from ClinVar
 * @param dgidbAnnotations - Annotations from DGIdb
 * @returns Array of consolidated annotations
 */
async function consolidateAnnotations(
  variants: Variant[],
  oncoKBAnnotations: OncoKBAnnotation[],
  clinVarAnnotations: ClinVarAnnotation[],
  dgidbAnnotations: DGIdbAnnotation[]
): Promise<ConsolidatedAnnotation[]> {
  // If we have all the data, we can consolidate directly
  if (oncoKBAnnotations.length > 0 && clinVarAnnotations.length > 0) {
    const consolidated: ConsolidatedAnnotation[] = [];
    
    // Process each variant
    for (const variant of variants) {
      const gene = variant.gene || 'Unknown';
      const variantNotation = `${variant.chrom}:${variant.pos}${variant.ref}>${variant.alt}`;
      
      // Find matching annotations
      const oncoKB = oncoKBAnnotations.find(a => a.gene === gene && a.variant === variantNotation) || null;
      const clinVar = clinVarAnnotations.find(a => a.gene === gene && a.variant === variantNotation) || null;
      
      // Find all DGIdb entries for this gene
      const dgidbMatches = dgidbAnnotations.filter(a => a.gene === gene);
      
      // Collect evidence sources
      const evidenceSources = [];
      if (oncoKB) evidenceSources.push('OncoKB');
      if (clinVar) evidenceSources.push('ClinVar');
      if (dgidbMatches.length > 0) evidenceSources.push('DGIdb');
      
      // Collect therapies
      const therapies = [];
      
      // Add OncoKB therapies
      if (oncoKB && oncoKB.therapies) {
        for (const therapy of oncoKB.therapies) {
          therapies.push({
            drug: therapy.drug,
            level: therapy.level,
            source: 'OncoKB'
          });
        }
      }
      
      // Add DGIdb therapies
      for (const dgidb of dgidbMatches) {
        therapies.push({
          drug: dgidb.drug,
          level: dgidb.evidence || 'N/A',
          source: 'DGIdb'
        });
      }
      
      // Create consolidated annotation
      consolidated.push({
        gene,
        variant: variantNotation,
        oncogenicity: oncoKB?.oncogenicity || 'Unknown',
        clinicalSignificance: clinVar?.clinicalSignificance || 'Unknown',
        therapies,
        evidenceSources
      });
    }
    
    return consolidated;
  }
  
  // If we don't have all the data, use Sonnet to consolidate
  const system = `Eres un integrador clínico.
Fusiona las anotaciones de OncoKB, ClinVar y DGIdb en un resumen único por variante.
Para cada variante devuelve:

[
  {
    "gene": string,
    "variant": string,
    "oncogenicity": string,
    "clinicalSignificance": string,
    "therapies": [{ "drug": string, "level": string, "source": string }],
    "evidenceSources": string[]
  }
]

Usa el conocimiento de las bases si falta información. Devuelve SOLO JSON.
IMPORTANTE: Responde SOLO con JSON válido sin ningún formato markdown, sin backticks, sin \`\`\`json, sin comentarios adicionales.`;
  
  const userPrompt = `
    Por favor, consolida las siguientes anotaciones de diferentes fuentes para las variantes genómicas:
    
    Variantes originales:
    ${JSON.stringify(variants, null, 2)}
    
    Anotaciones de OncoKB:
    ${JSON.stringify(oncoKBAnnotations, null, 2)}
    
    Anotaciones de ClinVar:
    ${JSON.stringify(clinVarAnnotations, null, 2)}
    
    Interacciones de DGIdb:
    ${JSON.stringify(dgidbAnnotations, null, 2)}
    
    Para cada variante, proporciona:
    1. gene: El gen afectado
    2. variant: La notación de la variante
    3. oncogenicity: Oncogenicidad según OncoKB o inferida
    4. clinicalSignificance: Significancia clínica según ClinVar o inferida
    5. therapies: Array de objetos {drug, level, source} con posibles tratamientos dirigidos
    6. evidenceSources: Array de fuentes de evidencia utilizadas
    
    Responde SOLO con un array JSON de objetos, sin texto adicional.
  `;
  
  return await sonnetJson(
    "claude-sonnet-4-5-20250929",
    system,
    userPrompt,
    'ConsolidatedAnnotations',
    z.array(ConsolidatedAnnotationSchema)
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
    
    console.log(`🧬 Annotating ${variants.length} variants`);
    
    // Initialize annotation arrays
    let oncoKBAnnotations: OncoKBAnnotation[] = [];
    let clinVarAnnotations: ClinVarAnnotation[] = [];
    let dgidbAnnotations: DGIdbAnnotation[] = [];
    
    // Get OncoKB annotations
    console.log('📊 Fetching OncoKB annotations...');
    try {
      if (process.env.ONCOKB_API_KEY && process.env.ONCOKB_BASE_URL) {
        oncoKBAnnotations = await fetchOncoKB(variants);
      } else {
        console.log('⚠️ OncoKB API not configured, using Sonnet fallback');
        oncoKBAnnotations = await annotateOncoKBWithSonnet(variants);
      }
      console.log(`✅ Got ${oncoKBAnnotations.length} OncoKB annotations`);
    } catch (error) {
      console.error('❌ Error getting OncoKB annotations:', error);
      console.log('⚠️ Using Sonnet fallback for OncoKB');
      oncoKBAnnotations = await annotateOncoKBWithSonnet(variants);
    }
    
    // Get ClinVar annotations
    console.log('📊 Fetching ClinVar annotations...');
    try {
      if (process.env.CLINVAR_EUTILS) {
        clinVarAnnotations = await fetchClinVar(variants);
      } else {
        console.log('⚠️ ClinVar E-utilities not configured, using Sonnet fallback');
        clinVarAnnotations = await annotateClinVarWithSonnet(variants);
      }
      console.log(`✅ Got ${clinVarAnnotations.length} ClinVar annotations`);
    } catch (error) {
      console.error('❌ Error getting ClinVar annotations:', error);
      console.log('⚠️ Using Sonnet fallback for ClinVar');
      clinVarAnnotations = await annotateClinVarWithSonnet(variants);
    }
    
    // Get DGIdb annotations
    console.log('📊 Fetching DGIdb annotations...');
    try {
      if (process.env.DGIDB_BASE_URL) {
        dgidbAnnotations = await fetchDGIdb(variants);
      } else {
        console.log('⚠️ DGIdb API not configured, using Sonnet fallback');
        dgidbAnnotations = await annotateDGIdbWithSonnet(variants);
      }
      console.log(`✅ Got ${dgidbAnnotations.length} DGIdb annotations`);
    } catch (error) {
      console.error('❌ Error getting DGIdb annotations:', error);
      console.log('⚠️ Using Sonnet fallback for DGIdb');
      dgidbAnnotations = await annotateDGIdbWithSonnet(variants);
    }
    
    // Consolidate annotations
    console.log('🔄 Consolidating annotations...');
    const consolidatedAnnotations = await consolidateAnnotations(
      variants,
      oncoKBAnnotations,
      clinVarAnnotations,
      dgidbAnnotations
    );
    console.log(`✅ Consolidated ${consolidatedAnnotations.length} annotations`);
    
    // Return consolidated annotations
    return NextResponse.json({ annotations: consolidatedAnnotations }, { status: 200 });
  } catch (error) {
    console.error('❌ Error annotating variants:', error);
    
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
