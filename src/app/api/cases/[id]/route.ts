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

    // Verificar que demoCaseData y sus propiedades existan
    if (!demoCaseData || !demoCaseData.specimen || !demoCaseData.patient || !demoCaseData.variants) {
      console.error('Demo case data is incomplete for case detail');
      
      // Crear un caso de demostración de respaldo
      const fallbackCase: CaseData = {
        id: 'specimen-demo-001',
        patient: {
          id: 'patient-demo-001',
          resourceType: 'Patient',
          name: [{
            family: 'Smith',
            given: ['John'],
            text: 'John Smith'
          }],
          gender: 'male',
          birthDate: '1965-07-15',
          active: true
        },
        specimen: {
          id: 'specimen-demo-001',
          resourceType: 'Specimen',
          identifier: [{
            system: 'http://oncofhir.org/identifier/specimen',
            value: 'Demo Genomic Study'
          }],
          status: 'available',
          subject: {
            reference: 'Patient/patient-demo-001',
            display: 'John Smith'
          },
          collection: {
            collectedDateTime: new Date().toISOString()
          }
        },
        variants: [
          {
            id: 'variant-1',
            gene: 'EGFR',
            hgvs: 'p.L858R',
            chromosome: '7',
            position: 55259515,
            reference: 'T',
            alternate: 'G',
            consequence: 'missense_variant',
            clinvarSignificance: 'Pathogenic',
            vaf: 0.35
          },
          {
            id: 'variant-2',
            gene: 'TP53',
            hgvs: 'p.R273H',
            chromosome: '17',
            position: 7577120,
            reference: 'G',
            alternate: 'A',
            consequence: 'missense_variant',
            clinvarSignificance: 'Pathogenic',
            vaf: 0.42
          },
          {
            id: 'variant-3',
            gene: 'KRAS',
            hgvs: 'p.G12C',
            chromosome: '12',
            position: 25398284,
            reference: 'C',
            alternate: 'A',
            consequence: 'missense_variant',
            clinvarSignificance: 'Pathogenic',
            vaf: 0.28
          }
        ]
      };
      
      return NextResponse.json(fallbackCase, { status: 200 });
    }
    
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
