import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { CaseService } from '@/lib/cases/service';
import { buildPhenopacket } from '@/lib/ga4gh';

export const runtime = 'nodejs';

const RequestSchema = z.object({
  caseId: z.string(),
  patientSex: z.enum(['FEMALE', 'MALE']).optional(),
  patientBirthDate: z.string().optional(),
});

/**
 * POST /api/export/phenopacket
 * Export case data as GA4GH Phenopacket v2
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { caseId, patientSex, patientBirthDate } = RequestSchema.parse(body);

    const caseData = await CaseService.get(caseId);

    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    const phenopacket = buildPhenopacket({
      caseId,
      metadata: caseData.metadata,
      variants: caseData.variants,
      evidence: caseData.evidence,
      therapies: caseData.therapies,
      patientSex,
      patientBirthDate,
    });

    return NextResponse.json({ phenopacket }, { status: 200 });
  } catch (error) {
    console.error('Error generating Phenopacket:', error);

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
