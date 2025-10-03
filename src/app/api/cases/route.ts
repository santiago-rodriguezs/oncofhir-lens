import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';
import { CaseListItem } from '@/types/fhir';
import { demoCaseData } from '@/lib/utils/demo-data';

// Configure for dynamic responses
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Validate auth token
    const authHeader = request.headers.get('authorization');
    if (!validateToken(authHeader)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    // For demo purposes, create a case list item from the demo data
    const demoCase: CaseListItem = {
      id: demoCaseData.specimen.id,
      patientId: demoCaseData.patient.id,
      label: demoCaseData.specimen.identifier?.[0]?.value || 'Demo Genomic Study',
      date: demoCaseData.specimen.collection?.collectedDateTime || new Date().toISOString(),
      variantCount: demoCaseData.variants.length
    };

    // Return an array with the demo case
    return NextResponse.json([demoCase], { status: 200 });
  } catch (error) {
    console.error('Error fetching cases:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
