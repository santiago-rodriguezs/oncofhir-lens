import { NextRequest, NextResponse } from 'next/server';
import { CaseService } from '@/lib/cases/service';
import { buildGenomicReportBundle } from '@/lib/fhir/genomics-reporting';
import { pushBundleToHapi } from '@/lib/fhir/hapi-client';

export const runtime = 'nodejs';

/**
 * POST /api/fhir/push
 * Generate FHIR bundle for a case and push it to the HAPI FHIR server
 */
export async function POST(request: NextRequest) {
  try {
    const { caseId } = await request.json();

    if (!caseId) {
      return NextResponse.json({ error: 'caseId is required' }, { status: 400 });
    }

    const caseData = await CaseService.get(caseId);
    if (!caseData) {
      return NextResponse.json({ error: 'Case not found' }, { status: 404 });
    }

    // Build the FHIR Genomics Reporting bundle
    const bundle = buildGenomicReportBundle({
      caseId,
      patient: {
        id: caseData.metadata.patientId,
        name: caseData.metadata.patientId, // Will be overridden if patient info exists
      },
      specimen: {
        id: caseData.metadata.sampleId,
      },
      variants: caseData.variants,
      evidence: caseData.evidence,
      therapies: caseData.therapies,
      tumorType: caseData.metadata.tumorType,
      reportSource: caseData.metadata.reportSource,
    });

    // Push to HAPI FHIR
    const result = await pushBundleToHapi(bundle);

    return NextResponse.json({
      success: true,
      resourcesCreated: (result as any).entry?.length || 0,
      response: result,
    });
  } catch (error) {
    console.error('Error pushing to HAPI FHIR:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to push to HAPI FHIR' },
      { status: 500 }
    );
  }
}
