import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';
import { CaseData } from '@/types/fhir';
import { demoCaseData } from '@/lib/utils/demo-data';

// Configure for dynamic responses
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Validate auth token
    const authHeader = request.headers.get('authorization');
    if (!validateToken(authHeader)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id } = params;

    // For demo purposes, check if the ID matches our demo case
    if (id !== demoCaseData.specimen.id) {
      return NextResponse.json(
        { message: 'Case not found' },
        { status: 404 }
      );
    }

    // Return the demo case data directly
    return NextResponse.json(demoCaseData, { status: 200 });
  } catch (error) {
    console.error('Error fetching case data:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
