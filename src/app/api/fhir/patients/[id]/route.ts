import { NextRequest, NextResponse } from 'next/server';
import { getPatientEverything } from '@/lib/fhir/hapi-client';

export const runtime = 'nodejs';

/**
 * GET /api/fhir/patients/[id]
 * Get a patient and all related resources from HAPI FHIR ($everything)
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const bundle = await getPatientEverything(id);

    // Group resources by type
    const resources: Record<string, any[]> = {};
    for (const entry of bundle.entry || []) {
      const r = entry.resource as any;
      const type = r.resourceType || 'Unknown';
      if (!resources[type]) resources[type] = [];
      resources[type].push(r);
    }

    const patient = resources.Patient?.[0];
    const observations = resources.Observation || [];

    // ── Parse variant observations ──
    const variants = observations
      .filter((obs: any) =>
        obs.meta?.profile?.some((p: string) => p.includes('/variant'))
      )
      .map((obs: any) => {
        const components = obs.component || [];
        const getComp = (loincCode: string) =>
          components.find((c: any) =>
            c.code?.coding?.some((cd: any) => cd.code === loincCode)
          );

        const gene = getComp('48018-6');
        const hgvsC = getComp('48004-6');
        const hgvsP = getComp('48005-3');
        const vaf = getComp('81258-6');
        const depth = getComp('82121-5');
        const significance = getComp('53037-8');
        const chrom = getComp('48001-2');
        const sourceClass = getComp('48002-0');
        const refAllele = getComp('69547-8');
        const altAllele = getComp('69551-0');
        const pos = getComp('81254-5');

        return {
          id: obs.id,
          gene: gene?.valueCodeableConcept?.coding?.[0]?.display || '',
          hgvs_c: hgvsC?.valueCodeableConcept?.coding?.[0]?.display || '',
          hgvs_p: hgvsP?.valueCodeableConcept?.coding?.[0]?.display || '',
          vaf: vaf?.valueQuantity?.value,
          depth: depth?.valueQuantity?.value,
          clinicalSignificance: significance?.valueCodeableConcept?.text || '',
          chromosome: chrom?.valueCodeableConcept?.coding?.[0]?.display || '',
          genomicSource: sourceClass?.valueCodeableConcept?.coding?.[0]?.display || '',
          ref: refAllele?.valueString || '',
          alt: altAllele?.valueString || '',
          position: pos?.valueRange?.low?.value,
          status: obs.status,
        };
      });

    // ── Parse diagnostic implications ──
    const diagnosticImplications = observations
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
        const evidenceLevel = components.find((c: any) =>
          c.code?.coding?.some((cd: any) => cd.code === '93044-6')
        );
        // Find which variant this is derived from
        const derivedFrom = obs.derivedFrom?.[0]?.reference || '';
        return {
          id: obs.id,
          clinicalSignificance: significance?.valueCodeableConcept?.text || '',
          phenotype: phenotype?.valueCodeableConcept?.text || '',
          evidenceLevel: evidenceLevel?.valueCodeableConcept?.text || '',
          derivedFrom,
        };
      });

    // ── Parse therapeutic implications ──
    const therapeuticImplications = observations
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
        const context = components.find((c: any) =>
          c.code?.coding?.some((cd: any) => cd.code === 'phenotypic-treatment-context')
        );
        const derivedFrom = obs.derivedFrom?.[0]?.reference || '';
        return {
          id: obs.id,
          drug: medication?.valueCodeableConcept?.text || '',
          evidenceLevel: evidenceLevel?.valueCodeableConcept?.text || '',
          tumorContext: context?.valueCodeableConcept?.text || '',
          note: obs.note?.[0]?.text || '',
          derivedFrom,
        };
      });

    // ── Parse overall interpretation ──
    const overallObs = observations.find((obs: any) =>
      obs.meta?.profile?.some((p: string) => p.includes('overall-interpretation'))
    );
    const overallInterpretation = overallObs
      ? {
          value: overallObs.valueCodeableConcept?.coding?.[0]?.display || '',
          note: overallObs.note?.[0]?.text || '',
        }
      : null;

    // ── Parse region studied ──
    const regionObs = observations.find((obs: any) =>
      obs.meta?.profile?.some((p: string) => p.includes('region-studied'))
    );
    const regionStudied = regionObs
      ? {
          genes: (regionObs.component || [])
            .filter((c: any) => c.code?.coding?.some((cd: any) => cd.code === '48018-6'))
            .map((c: any) => c.valueCodeableConcept?.coding?.[0]?.display || ''),
          description: (regionObs.component || [])
            .find((c: any) => c.code?.coding?.some((cd: any) => cd.code === 'region-description'))
            ?.valueString || '',
        }
      : null;

    // ── Parse specimen ──
    const specimenRes = resources.Specimen?.[0];
    const specimenData = specimenRes
      ? {
          type: specimenRes.type?.coding?.[0]?.display || '',
          status: specimenRes.status || '',
          collectedDate: specimenRes.collection?.collectedDateTime || '',
        }
      : null;

    // ── Parse diagnostic report ──
    const report = resources.DiagnosticReport?.[0];

    // ── Parse tasks (follow-up recommendations) ──
    const tasks = (resources.Task || []).map((t: any) => ({
      id: t.id,
      status: t.status,
      description: t.description || '',
      drug: t.input?.find((i: any) => i.type?.coding?.[0]?.code === '51963-7')?.valueString || '',
      evidenceLevel: t.input?.find((i: any) => i.type?.coding?.[0]?.code === 'evidence-level')?.valueString || '',
    }));

    // ── Compute insights ──
    const uniqueGenes = [...new Set(variants.map((v: any) => v.gene).filter(Boolean))];
    const avgVaf = variants.filter((v: any) => v.vaf != null).length > 0
      ? variants.filter((v: any) => v.vaf != null).reduce((sum: number, v: any) => sum + v.vaf, 0) /
        variants.filter((v: any) => v.vaf != null).length
      : null;
    const highVafVariants = variants.filter((v: any) => v.vaf != null && v.vaf >= 0.3);
    const pathogenicCount = diagnosticImplications.filter((d: any) =>
      d.clinicalSignificance.toLowerCase().includes('pathogenic')
    ).length;

    return NextResponse.json({
      patient: {
        id: patient?.id,
        name: patient?.name?.[0]?.text || patient?.name?.[0]?.family || 'Sin nombre',
        identifier: patient?.identifier?.[0]?.value || '',
        gender: patient?.gender || '',
        birthDate: patient?.birthDate || '',
      },
      specimen: specimenData,
      variants,
      diagnosticImplications,
      therapeuticImplications,
      overallInterpretation,
      regionStudied,
      tasks,
      report: report
        ? {
            id: report.id,
            status: report.status,
            issued: report.issued,
            conclusion: report.conclusion || '',
            resultCount: report.result?.length || 0,
          }
        : null,
      insights: {
        totalVariants: variants.length,
        uniqueGenes: uniqueGenes.length,
        geneList: uniqueGenes,
        avgVaf,
        highVafVariants: highVafVariants.length,
        pathogenicCount,
        therapeuticOptions: therapeuticImplications.length,
        tasksCount: tasks.length,
      },
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
