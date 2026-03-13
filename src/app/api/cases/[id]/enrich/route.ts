import { NextResponse } from 'next/server';
import { CaseService } from '@/lib/cases/service';
import { annotateVariantsSlow } from '@/lib/annotate/service';

export const runtime = 'nodejs';

// Prevent multiple enrichments running simultaneously for the same case
const enrichingCases = new Set<string>();

/**
 * POST /api/cases/[id]/enrich
 * Runs slow annotation sources (CIViC, PharmGKB, gnomAD) and merges results
 * into the existing case. Called by the visualizer for progressive loading.
 */
export async function POST(
  _request: Request,
  { params }: { params: { id: string } }
) {
  const caseId = params.id;

  // Check if already enriching
  if (enrichingCases.has(caseId)) {
    return NextResponse.json(
      { status: 'in_progress', message: 'Enrichment already running for this case' },
      { status: 202 }
    );
  }

  try {
    const caseData = await CaseService.get(caseId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Check if already enriched (has CIViC/PharmGKB/gnomAD evidence)
    const hasSlowSources = caseData.evidence.some(
      (e) => e.source === 'CIViC' || e.source === 'PharmGKB' || e.source === 'gnomAD'
    );
    const hasGnomad = caseData.variants.some((v) => v.gnomadAF != null);

    if (hasSlowSources && hasGnomad) {
      return NextResponse.json({
        status: 'already_enriched',
        evidence: caseData.evidence,
        therapies: caseData.therapies,
        variants: caseData.variants,
      });
    }

    enrichingCases.add(caseId);

    // Run slow annotations
    const slowResult = await annotateVariantsSlow(caseData.variants);

    // Merge slow data into existing case
    const mergedEvidence = [...caseData.evidence, ...slowResult.evidence];
    const mergedTherapies = [...caseData.therapies, ...slowResult.therapies];
    const mergedErrors = [
      ...(caseData.annotationErrors || []),
      ...slowResult.errors,
    ];

    // Merge enriched variant data (gnomAD fields)
    const mergedVariants = caseData.variants.map((v) => {
      const enriched = slowResult.variants.find(
        (sv) => sv.chrom === v.chrom && sv.pos === v.pos && sv.ref === v.ref && sv.alt === v.alt
      );
      return enriched ? { ...v, ...enriched } : v;
    });

    // Update case in storage
    await CaseService.update(caseId, {
      variants: mergedVariants,
      evidence: mergedEvidence,
      therapies: mergedTherapies,
      annotationErrors: mergedErrors.length > 0 ? mergedErrors : undefined,
    });

    enrichingCases.delete(caseId);

    return NextResponse.json({
      status: 'enriched',
      newEvidence: slowResult.evidence,
      newTherapies: slowResult.therapies,
      variants: mergedVariants,
      evidence: mergedEvidence,
      therapies: mergedTherapies,
      errors: slowResult.errors,
    });
  } catch (error) {
    enrichingCases.delete(caseId);
    console.error(`[Enrich] Error enriching case ${caseId}:`, error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
