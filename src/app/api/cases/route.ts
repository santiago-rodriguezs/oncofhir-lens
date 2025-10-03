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

    // Verificar que demoCaseData y sus propiedades existan
    if (!demoCaseData || !demoCaseData.specimen || !demoCaseData.patient || !demoCaseData.variants) {
      console.error('Demo case data is incomplete');
      
      // Crear un caso de demostración de respaldo
      const fallbackCase: CaseListItem = {
        id: 'specimen-demo-001',
        patientId: 'patient-demo-001',
        label: 'Demo Genomic Study',
        date: new Date().toISOString(),
        variantCount: 3
      };
      
      return NextResponse.json([fallbackCase], { status: 200 });
    }

    // For demo purposes, create a case list item from the demo data
    const demoCase: CaseListItem = {
      id: demoCaseData.specimen.id || 'specimen-demo-001',
      patientId: demoCaseData.patient.id || 'patient-demo-001',
      label: demoCaseData.specimen.identifier?.[0]?.value || 'Demo Genomic Study',
      date: demoCaseData.specimen.collection?.collectedDateTime || new Date().toISOString(),
      variantCount: demoCaseData.variants.length || 0
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
