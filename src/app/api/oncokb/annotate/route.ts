import { NextRequest, NextResponse } from 'next/server';
import { getOncoKbAnnotations } from '@/lib/oncokb/client';

export async function POST(request: NextRequest) {
  try {
    // Get the annotations from the request body
    const annotations = await request.json();
    
    if (!Array.isArray(annotations)) {
      return NextResponse.json({ error: 'Invalid annotations format' }, { status: 400 });
    }
    
    // Get the OncoKB annotations
    const results = await getOncoKbAnnotations(annotations);
    
    // Return the results
    return NextResponse.json(results);
  } catch (error: any) {
    console.error('Error in OncoKB annotate API:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
