import { NextRequest, NextResponse } from 'next/server';
import { CaseService } from '@/lib/cases/service';
import { buildGenomicReportBundle } from '@/lib/fhir/genomics-reporting';

export const runtime = 'nodejs';

/**
 * GET /api/cases/[id]/fhir
 * Generate HL7 FHIR Genomics Reporting IG (STU2) compliant Bundle
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;

    const caseData = await CaseService.get(caseId);

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const bundle = buildGenomicReportBundle({
      caseId,
      patient: {
        id: caseData.metadata.patientId,
        name: caseData.metadata.patientName,
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

    return NextResponse.json({ bundle }, { status: 200 });
  } catch (error) {
    console.error('Error generating FHIR bundle:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
