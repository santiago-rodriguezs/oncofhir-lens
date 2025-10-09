import { NextRequest, NextResponse } from 'next/server';
import { CaseService } from '@/lib/cases/service';

export const runtime = 'nodejs';

/**
 * GET /api/cases/[id]/fhir
 * Generate FHIR Bundle from case data
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: caseId } = await params;
    
    // Get case data
    const caseData = await CaseService.get(caseId);
    
    if (!caseData) {
      return NextResponse.json(
        { error: 'Case not found' },
        { status: 404 }
      );
    }

    // Generate FHIR Bundle
    const bundle = {
      resourceType: 'Bundle',
      type: 'collection',
      id: `case-${caseId}`,
      timestamp: new Date().toISOString(),
      entry: [] as any[],
    };

    // Add Patient resource
    bundle.entry.push({
      fullUrl: `urn:uuid:patient-${caseId}`,
      resource: {
        resourceType: 'Patient',
        id: `patient-${caseId}`,
        identifier: caseData.metadata.patientId ? [
          {
            system: 'http://hospital.example.org/patients',
            value: caseData.metadata.patientId,
          },
        ] : undefined,
      },
    });

    // Add Specimen resource
    if (caseData.metadata.sampleId) {
      bundle.entry.push({
        fullUrl: `urn:uuid:specimen-${caseId}`,
        resource: {
          resourceType: 'Specimen',
          id: `specimen-${caseId}`,
          identifier: [
            {
              system: 'http://hospital.example.org/specimens',
              value: caseData.metadata.sampleId,
            },
          ],
          subject: {
            reference: `urn:uuid:patient-${caseId}`,
          },
          type: {
            coding: [
              {
                system: 'http://snomed.info/sct',
                code: '119297000',
                display: 'Blood specimen',
              },
            ],
          },
        },
      });
    }

    // Add Observation resources for each variant
    caseData.variants.forEach((variant, index) => {
      bundle.entry.push({
        fullUrl: `urn:uuid:observation-variant-${index}`,
        resource: {
          resourceType: 'Observation',
          id: `observation-variant-${index}`,
          status: 'final',
          category: [
            {
              coding: [
                {
                  system: 'http://terminology.hl7.org/CodeSystem/observation-category',
                  code: 'laboratory',
                  display: 'Laboratory',
                },
              ],
            },
          ],
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '69548-6',
                display: 'Genetic variant assessment',
              },
            ],
          },
          subject: {
            reference: `urn:uuid:patient-${caseId}`,
          },
          specimen: caseData.metadata.sampleId ? {
            reference: `urn:uuid:specimen-${caseId}`,
          } : undefined,
          valueCodeableConcept: {
            coding: [
              {
                system: 'http://varnomen.hgvs.org',
                code: variant.hgvs || variant.hgvs_p || variant.hgvs_c || 'unknown',
                display: `${variant.gene}: ${variant.hgvs || variant.hgvs_p || variant.hgvs_c || 'unknown'}`,
              },
            ],
          },
          component: [
            variant.gene ? {
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '48018-6',
                    display: 'Gene studied [ID]',
                  },
                ],
              },
              valueCodeableConcept: {
                coding: [
                  {
                    system: 'http://www.genenames.org',
                    code: variant.gene,
                    display: variant.gene,
                  },
                ],
              },
            } : undefined,
            variant.vaf !== undefined ? {
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '81258-6',
                    display: 'Variant allele frequency',
                  },
                ],
              },
              valueQuantity: {
                value: variant.vaf,
                unit: '%',
                system: 'http://unitsofmeasure.org',
                code: '%',
              },
            } : undefined,
            variant.depth !== undefined ? {
              code: {
                coding: [
                  {
                    system: 'http://loinc.org',
                    code: '82121-5',
                    display: 'Allelic read depth',
                  },
                ],
              },
              valueQuantity: {
                value: variant.depth,
                system: 'http://unitsofmeasure.org',
                code: '{reads}',
              },
            } : undefined,
          ].filter(Boolean),
        },
      });
    });

    // Add MedicationStatement resources for therapies
    caseData.therapies.forEach((therapy, index) => {
      bundle.entry.push({
        fullUrl: `urn:uuid:medication-${index}`,
        resource: {
          resourceType: 'MedicationStatement',
          id: `medication-${index}`,
          status: 'active',
          medicationCodeableConcept: {
            coding: [
              {
                system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
                display: therapy.drug,
              },
            ],
            text: therapy.drug,
          },
          subject: {
            reference: `urn:uuid:patient-${caseId}`,
          },
          note: [
            {
              text: `Evidence level: ${therapy.level}. Biomarker: ${therapy.biomarker}. ${therapy.tumorType ? `Tumor type: ${therapy.tumorType}` : ''}`,
            },
          ],
        },
      });
    });

    return NextResponse.json({ bundle }, { status: 200 });
  } catch (error) {
    console.error('Error generating FHIR bundle:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
