import { NextRequest, NextResponse } from 'next/server';
import { validateToken } from '@/lib/auth';
import { IngestResponse } from '@/types/fhir';
import { demoCaseData } from '@/lib/utils/demo-data';

// Configure for dynamic responses
export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    // Validate auth token
    const authHeader = request.headers.get('authorization');
    if (!validateToken(authHeader)) {
      return NextResponse.json(
        { message: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    // For demo purposes, we'll use the demo data instead of parsing a real file
    // In a real implementation, you would parse the form data and process the file
    
    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return demo response
    const response: IngestResponse = {
      caseId: demoCaseData.specimen.id,
      persistedCounts: {
        patients: 1,
        specimens: 1,
        observations: demoCaseData.variants.length,
        detectedIssues: demoCaseData.detectedIssues?.length || 0,
      },
      fhirRefs: [
        `Patient/${demoCaseData.patient.id}`,
        `Specimen/${demoCaseData.specimen.id}`,
        ...demoCaseData.variants.map(v => `Observation/${v.id}`),
        ...(demoCaseData.detectedIssues?.map(i => `DetectedIssue/${i.id}`) || []),
      ],
    };
    
    return NextResponse.json(response, { status: 200 });
  } catch (error) {
    console.error('Error processing file:', error);
    return NextResponse.json(
      { message: error instanceof Error ? error.message : 'An unknown error occurred' },
      { status: 500 }
    );
  }
}
