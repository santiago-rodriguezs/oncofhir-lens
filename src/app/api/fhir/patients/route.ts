import { NextRequest, NextResponse } from 'next/server';
import { searchHapi } from '@/lib/fhir/hapi-client';

export const runtime = 'nodejs';

/**
 * GET /api/fhir/patients
 * List all patients from the HAPI FHIR server
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const name = searchParams.get('name') || undefined;
    const identifier = searchParams.get('identifier') || undefined;

    const params: Record<string, string> = {
      _sort: '-_lastUpdated',
      _count: '50',
    };
    if (name) params.name = name;
    if (identifier) params.identifier = identifier;

    const bundle = await searchHapi('Patient', params);

    const patients = (bundle.entry || []).map((e) => {
      const r = e.resource as any;
      return {
        id: r.id,
        name: r.name?.[0]?.text || r.name?.[0]?.family || 'Sin nombre',
        identifier: r.identifier?.[0]?.value || '',
        gender: r.gender || '',
        birthDate: r.birthDate || '',
        lastUpdated: r.meta?.lastUpdated || '',
      };
    });

    return NextResponse.json({ patients, total: bundle.total || patients.length });
  } catch (error) {
    console.error('Error fetching patients from HAPI:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to connect to FHIR server' },
      { status: 500 }
    );
  }
}
