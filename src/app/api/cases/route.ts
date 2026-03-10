import { NextRequest, NextResponse } from 'next/server';
import { CaseService } from '@/lib/cases/service';

// Configure for dynamic responses
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get all cases from the service
    const cases = await CaseService.list();

    // Transform cases to list items
    const caseList = cases.map(caseData => ({
      id: caseData.id,
      patientId: caseData.metadata.patientId || caseData.id,
      label: `${caseData.metadata.reportSource} — ${caseData.metadata.patientId || caseData.id}`,
      date: caseData.metadata.timestamp,
      variantCount: caseData.variants.length,
    }));

    return NextResponse.json(caseList, { status: 200 });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
