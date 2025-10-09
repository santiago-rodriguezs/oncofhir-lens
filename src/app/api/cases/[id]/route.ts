import { NextRequest, NextResponse } from 'next/server';
import { CaseService } from '@/lib/cases/service';

// Configure for dynamic responses
export const dynamic = 'force-dynamic';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;

    // Obtener el caso del servicio
    const caseData = await CaseService.get(id);
    
    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(caseData);
  } catch (error) {
    console.error('Error fetching case:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
