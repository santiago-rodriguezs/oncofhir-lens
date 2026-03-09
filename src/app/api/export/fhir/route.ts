import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CaseService } from '@/lib/cases/service';
import { buildGenomicReportBundle } from '@/lib/fhir/genomics-reporting';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  caseId: z.string(),
  patientName: z.string().optional(),
  patientGender: z.string().optional(),
  patientBirthDate: z.string().optional(),
  specimenType: z.string().optional(),
  specimenBodySite: z.string().optional(),
});

/**
 * POST /api/export/fhir
 * Export case data as HL7 FHIR Genomics Reporting IG (STU2) Bundle
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      caseId,
      patientName,
      patientGender,
      patientBirthDate,
      specimenType,
      specimenBodySite,
    } = RequestSchema.parse(body);

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
        name: patientName,
        gender: patientGender,
        birthDate: patientBirthDate,
      },
      specimen: {
        id: caseData.metadata.sampleId,
        type: specimenType,
        bodySite: specimenBodySite,
      },
      variants: caseData.variants,
      evidence: caseData.evidence,
      therapies: caseData.therapies,
      tumorType: caseData.metadata.tumorType,
      reportSource: caseData.metadata.reportSource,
    });

    return NextResponse.json({ bundle }, { status: 200 });
  } catch (error) {
    console.error('Error exporting FHIR bundle:', error);

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
