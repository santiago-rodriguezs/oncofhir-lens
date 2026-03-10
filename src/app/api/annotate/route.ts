import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { Variant, VariantSchema } from '@/lib/schemas';
import { fetchOncoKB, OncoKBAnnotation } from '@/lib/oncokb';
import { fetchClinVar, ClinVarAnnotation } from '@/lib/clinvar';
import { fetchDGIdb, DGIdbAnnotation } from '@/lib/dgidb';

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
  evidenceSources: z.array(z.string()),
  // Campos adicionales de OncoKB
  hotspot: z.boolean().optional(),
  geneSummary: z.string().optional(),
  variantSummary: z.string().optional(),
  suggestedDrugs: z.string().optional(),
  evidenceLevel: z.string().optional()
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
        evidenceSources,
        // Campos adicionales de OncoKB
        hotspot: oncoKB?.hotspot || false,
        geneSummary: oncoKB?.geneSummary || '',
        variantSummary: oncoKB?.variantSummary || '',
        suggestedDrugs: oncoKB?.suggestedDrugs || '',
        evidenceLevel: oncoKB?.evidenceLevel || 'Unknown'
      });
    }
    
    return consolidated;
  }
  
  // If we don't have all the data, consolidate what we have without AI
  const consolidated: ConsolidatedAnnotation[] = [];

  for (const variant of variants) {
    const gene = variant.gene || 'Unknown';
    const variantNotation = `${variant.chrom}:${variant.pos}${variant.ref}>${variant.alt}`;

    const oncoKB = oncoKBAnnotations.find(a => a.gene === gene && a.variant === variantNotation) || null;
    const clinVar = clinVarAnnotations.find(a => a.gene === gene && a.variant === variantNotation) || null;
    const dgidbMatches = dgidbAnnotations.filter(a => a.gene === gene);

    const evidenceSources = [];
    if (oncoKB) evidenceSources.push('OncoKB');
    if (clinVar) evidenceSources.push('ClinVar');
    if (dgidbMatches.length > 0) evidenceSources.push('DGIdb');

    const therapies = [];
    if (oncoKB?.therapies) {
      for (const therapy of oncoKB.therapies) {
        therapies.push({ drug: therapy.drug, level: therapy.level, source: 'OncoKB' });
      }
    }
    for (const dgidb of dgidbMatches) {
      therapies.push({ drug: dgidb.drug, level: dgidb.evidence || 'N/A', source: 'DGIdb' });
    }

    consolidated.push({
      gene,
      variant: variantNotation,
      oncogenicity: oncoKB?.oncogenicity || 'No disponible',
      clinicalSignificance: clinVar?.clinicalSignificance || 'No disponible',
      therapies,
      evidenceSources,
      hotspot: oncoKB?.hotspot || false,
      geneSummary: oncoKB?.geneSummary || '',
      variantSummary: oncoKB?.variantSummary || '',
      suggestedDrugs: oncoKB?.suggestedDrugs || '',
      evidenceLevel: oncoKB?.evidenceLevel || 'No disponible',
    });
  }

  return consolidated;
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
    const sourceErrors: { source: string; message: string }[] = [];

    // Get OncoKB annotations
    console.log('Fetching OncoKB annotations...');
    try {
      if (process.env.ONCOKB_AUTH_TOKEN && process.env.ONCOKB_BASE_URL) {
        oncoKBAnnotations = await fetchOncoKB(variants);
        console.log(`Got ${oncoKBAnnotations.length} OncoKB annotations`);
      } else {
        sourceErrors.push({ source: 'OncoKB', message: 'API no configurada (ONCOKB_AUTH_TOKEN / ONCOKB_BASE_URL)' });
      }
    } catch (error) {
      console.error('Error getting OncoKB annotations:', error);
      sourceErrors.push({ source: 'OncoKB', message: error instanceof Error ? error.message : 'Error desconocido' });
    }

    // Get ClinVar annotations
    console.log('Fetching ClinVar annotations...');
    try {
      clinVarAnnotations = await fetchClinVar(variants);
      console.log(`Got ${clinVarAnnotations.length} ClinVar annotations`);
    } catch (error) {
      console.error('Error getting ClinVar annotations:', error);
      sourceErrors.push({ source: 'ClinVar', message: error instanceof Error ? error.message : 'Error desconocido' });
    }

    // Get DGIdb annotations
    console.log('Fetching DGIdb annotations...');
    try {
      dgidbAnnotations = await fetchDGIdb(variants);
      console.log(`Got ${dgidbAnnotations.length} DGIdb annotations`);
    } catch (error) {
      console.error('Error getting DGIdb annotations:', error);
      sourceErrors.push({ source: 'DGIdb', message: error instanceof Error ? error.message : 'Error desconocido' });
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
    
    // Return consolidated annotations with error info
    return NextResponse.json({
      annotations: consolidatedAnnotations,
      ...(sourceErrors.length > 0 && { sourceErrors }),
    }, { status: 200 });
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
