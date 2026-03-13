import { NextRequest, NextResponse } from 'next/server';
import { getPatientEverything } from '@/lib/fhir/hapi-client';

export const runtime = 'nodejs';

/**
 * GET /api/fhir/patients/[id]
 * Get a patient and all related resources from HAPI FHIR ($everything)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const bundle = await getPatientEverything(id);

    // Group resources by type
    const resources: Record<string, any[]> = {};
    for (const entry of bundle.entry || []) {
      const r = entry.resource as any;
      const type = r.resourceType || 'Unknown';
      if (!resources[type]) resources[type] = [];
      resources[type].push(r);
    }

    // Extract patient info
    const patient = resources.Patient?.[0];

    // Parse variant observations
    const variants = (resources.Observation || [])
      .filter((obs: any) =>
        obs.meta?.profile?.some((p: string) => p.includes('variant'))
      )
      .map((obs: any) => {
        const components = obs.component || [];
        const getComponent = (loincCode: string) =>
          components.find((c: any) =>
            c.code?.coding?.some((cd: any) => cd.code === loincCode)
          );

        const gene = getComponent('48018-6');
        const hgvsC = getComponent('48004-6');
        const hgvsP = getComponent('48005-3');
        const vaf = getComponent('81258-6');
        const depth = getComponent('82121-5');
        const significance = getComponent('53037-8');

        return {
          id: obs.id,
          gene: gene?.valueCodeableConcept?.coding?.[0]?.display || '',
          hgvs_c: hgvsC?.valueCodeableConcept?.coding?.[0]?.display || '',
          hgvs_p: hgvsP?.valueCodeableConcept?.coding?.[0]?.display || '',
          vaf: vaf?.valueQuantity?.value,
          depth: depth?.valueQuantity?.value,
          clinicalSignificance: significance?.valueCodeableConcept?.text || '',
          status: obs.status,
        };
      });

    // Parse diagnostic implications
    const diagnosticImplications = (resources.Observation || [])
      .filter((obs: any) =>
        obs.meta?.profile?.some((p: string) => p.includes('diagnostic-implication'))
      )
      .map((obs: any) => {
        const components = obs.component || [];
        const significance = components.find((c: any) =>
          c.code?.coding?.some((cd: any) => cd.code === '53037-8')
        );
        const phenotype = components.find((c: any) =>
          c.code?.coding?.some((cd: any) => cd.code === '81259-4')
        );
        return {
          id: obs.id,
          clinicalSignificance: significance?.valueCodeableConcept?.text || '',
          phenotype: phenotype?.valueCodeableConcept?.text || '',
        };
      });

    // Parse therapeutic implications
    const therapeuticImplications = (resources.Observation || [])
      .filter((obs: any) =>
        obs.meta?.profile?.some((p: string) => p.includes('therapeutic-implication'))
      )
      .map((obs: any) => {
        const components = obs.component || [];
        const medication = components.find((c: any) =>
          c.code?.coding?.some((cd: any) => cd.code === '51963-7')
        );
        const evidenceLevel = components.find((c: any) =>
          c.code?.coding?.some((cd: any) => cd.code === '93044-6')
        );
        return {
          id: obs.id,
          drug: medication?.valueCodeableConcept?.text || '',
          evidenceLevel: evidenceLevel?.valueCodeableConcept?.text || '',
          note: obs.note?.[0]?.text || '',
        };
      });

    // Parse diagnostic report
    const report = resources.DiagnosticReport?.[0];

    return NextResponse.json({
      patient: {
        id: patient?.id,
        name: patient?.name?.[0]?.text || patient?.name?.[0]?.family || 'Sin nombre',
        identifier: patient?.identifier?.[0]?.value || '',
        gender: patient?.gender || '',
        birthDate: patient?.birthDate || '',
      },
      variants,
      diagnosticImplications,
      therapeuticImplications,
      report: report ? {
        id: report.id,
        status: report.status,
        issued: report.issued,
        resultCount: report.result?.length || 0,
      } : null,
      resourceSummary: Object.fromEntries(
        Object.entries(resources).map(([type, items]) => [type, items.length])
      ),
      rawBundle: bundle,
    });
  } catch (error) {
    console.error('Error fetching patient data from HAPI:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch patient data' },
      { status: 500 }
    );
  }
}
