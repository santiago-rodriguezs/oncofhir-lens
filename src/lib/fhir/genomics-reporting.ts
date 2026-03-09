/**
 * HL7 FHIR Genomics Reporting IG (STU2) compliant resource builders
 *
 * Profiles implemented:
 * - GenomicReport    (DiagnosticReport)  http://hl7.org/fhir/uv/genomics-reporting/StructureDefinition/genomics-report
 * - Variant          (Observation)       http://hl7.org/fhir/uv/genomics-reporting/StructureDefinition/variant
 * - DiagnosticImplication (Observation)  http://hl7.org/fhir/uv/genomics-reporting/StructureDefinition/diagnostic-implication
 * - TherapeuticImplication (Observation) http://hl7.org/fhir/uv/genomics-reporting/StructureDefinition/therapeutic-implication
 * - ServiceRequest                       (genomic test order)
 *
 * Reference: http://hl7.org/fhir/uv/genomics-reporting/STU2/
 */

import { v4 as uuidv4 } from 'uuid';
import { Variant, Evidence, Therapy } from '@/core/models';

// ── Profile canonical URLs ──────────────────────────────────────────────────

const PROFILES = {
  genomicReport:
    'http://hl7.org/fhir/uv/genomics-reporting/StructureDefinition/genomics-report',
  variant:
    'http://hl7.org/fhir/uv/genomics-reporting/StructureDefinition/variant',
  diagnosticImplication:
    'http://hl7.org/fhir/uv/genomics-reporting/StructureDefinition/diagnostic-implication',
  therapeuticImplication:
    'http://hl7.org/fhir/uv/genomics-reporting/StructureDefinition/therapeutic-implication',
} as const;

// ── Common LOINC / system constants ─────────────────────────────────────────

const LOINC = 'http://loinc.org';
const HGNC = 'http://www.genenames.org';
const HGVS_SYSTEM = 'http://varnomen.hgvs.org';
const UCUM = 'http://unitsofmeasure.org';
const OBS_CAT = 'http://terminology.hl7.org/CodeSystem/observation-category';
const V2_0074 = 'http://terminology.hl7.org/CodeSystem/v2-0074';
const TBD_CODES = 'http://hl7.org/fhir/uv/genomics-reporting/CodeSystem/tbd-codes';
const CLINVAR_SYSTEM = 'http://www.ncbi.nlm.nih.gov/clinvar';

// ── LOINC code catalog ─────────────────────────────────────────────────────

const LOINC_CODES = {
  geneticVariantAssessment: { code: '69548-6', display: 'Genetic variant assessment' },
  geneStudied: { code: '48018-6', display: 'Gene studied [ID]' },
  dnaChangeHGVS: { code: '48004-6', display: 'DNA change (c.HGVS)' },
  aaChangeHGVS: { code: '48005-3', display: 'Amino acid change (p.HGVS)' },
  variantAlleleFrequency: { code: '81258-6', display: 'Sample variant allele frequency' },
  allelicReadDepth: { code: '82121-5', display: 'Allelic read depth' },
  genomicSourceClass: { code: '48002-0', display: 'Genomic source class' },
  clinicalSignificance: { code: '53037-8', display: 'Genetic variation clinical significance' },
  predictedPhenotype: { code: '81259-4', display: 'Associated phenotype' },
  evidenceLevel: { code: '93044-6', display: 'Level of evidence' },
  medicationAssessed: { code: '51963-7', display: 'Medication assessed [ID]' },
  genomicStudyOverall: { code: '82397-1', display: 'Genomics overall interpretation' },
  chromosomeIdentifier: { code: '48001-2', display: 'Cytogenetic (chromosome) location' },
  exactStartEnd: { code: '81254-5', display: 'Genomic allele start-end' },
  refAllele: { code: '69547-8', display: 'Genomic ref allele [ID]' },
  altAllele: { code: '69551-0', display: 'Genomic alt allele [ID]' },
  codingChangeType: { code: '48019-4', display: 'DNA change type' },
} as const;

// ── Helper: build a CodeableConcept ────────────────────────────────────────

function cc(system: string, code: string, display?: string) {
  return {
    coding: [{ system, code, ...(display ? { display } : {}) }],
    ...(display ? { text: display } : {}),
  };
}

function loincCode(key: keyof typeof LOINC_CODES) {
  const { code, display } = LOINC_CODES[key];
  return cc(LOINC, code, display);
}

// ── Helper: build a Reference ──────────────────────────────────────────────

function ref(fullUrl: string, display?: string) {
  return { reference: fullUrl, ...(display ? { display } : {}) };
}

// ── Input types ────────────────────────────────────────────────────────────

export interface GenomicBundleInput {
  caseId: string;
  patient?: {
    id?: string;
    name?: string;
    gender?: string;
    birthDate?: string;
  };
  specimen?: {
    id?: string;
    type?: string;
    collectionDate?: string;
    bodySite?: string;
  };
  variants: Variant[];
  evidence?: Evidence[];
  therapies?: Therapy[];
  tumorType?: string;
  reportSource?: string;
}

// ── Build a full Genomics Reporting IG Bundle ──────────────────────────────

export function buildGenomicReportBundle(input: GenomicBundleInput) {
  const {
    caseId,
    patient,
    specimen,
    variants,
    evidence = [],
    therapies = [],
    tumorType,
  } = input;

  const entries: Array<{ fullUrl: string; resource: Record<string, unknown> }> = [];

  // 1. Patient
  const patientUuid = `urn:uuid:${uuidv4()}`;
  entries.push({
    fullUrl: patientUuid,
    resource: buildPatient(patient, patientUuid),
  });

  // 2. Specimen
  const specimenUuid = `urn:uuid:${uuidv4()}`;
  entries.push({
    fullUrl: specimenUuid,
    resource: buildSpecimen(specimen, patientUuid, specimenUuid),
  });

  // 3. ServiceRequest (genomic test order)
  const serviceRequestUuid = `urn:uuid:${uuidv4()}`;
  entries.push({
    fullUrl: serviceRequestUuid,
    resource: buildServiceRequest(patientUuid, serviceRequestUuid),
  });

  // 4. Variant Observations
  const variantUuids: string[] = [];
  for (const variant of variants) {
    const uuid = `urn:uuid:${uuidv4()}`;
    variantUuids.push(uuid);
    entries.push({
      fullUrl: uuid,
      resource: buildVariantObservation(
        variant,
        patientUuid,
        specimenUuid,
        uuid
      ),
    });
  }

  // 5. DiagnosticImplications
  const diagnosticImplUuids: string[] = [];
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    if (
      variant.clinvarSignificance ||
      variant.clinvarData ||
      variant.effect
    ) {
      const uuid = `urn:uuid:${uuidv4()}`;
      diagnosticImplUuids.push(uuid);
      entries.push({
        fullUrl: uuid,
        resource: buildDiagnosticImplication(
          variant,
          variantUuids[i],
          patientUuid,
          uuid
        ),
      });
    }
  }

  // 6. TherapeuticImplications
  const therapeuticImplUuids: string[] = [];
  for (let i = 0; i < variants.length; i++) {
    const variant = variants[i];
    // Find therapies related to this variant
    const relatedTherapies = therapies.filter(
      (t) =>
        t.biomarker.includes(variant.gene || '') &&
        (variant.gene || '') !== ''
    );
    for (const therapy of relatedTherapies) {
      const relatedEvidence = evidence.find(
        (e) => e.evidenceId === therapy.evidenceId
      );
      const uuid = `urn:uuid:${uuidv4()}`;
      therapeuticImplUuids.push(uuid);
      entries.push({
        fullUrl: uuid,
        resource: buildTherapeuticImplication(
          variant,
          therapy,
          relatedEvidence,
          variantUuids[i],
          patientUuid,
          uuid,
          tumorType
        ),
      });
    }
  }

  // 7. Recommended Tasks (follow-up actions)
  const taskUuids: string[] = [];
  for (const therapy of therapies) {
    const uuid = `urn:uuid:${uuidv4()}`;
    taskUuids.push(uuid);
    entries.push({
      fullUrl: uuid,
      resource: buildRecommendedTask(therapy, patientUuid, uuid),
    });
  }

  // 8. GenomicReport (DiagnosticReport) — wraps everything
  const reportUuid = `urn:uuid:${uuidv4()}`;
  entries.push({
    fullUrl: reportUuid,
    resource: buildGenomicReport({
      patientUuid,
      specimenUuid,
      serviceRequestUuid,
      variantUuids,
      diagnosticImplUuids,
      therapeuticImplUuids,
      reportUuid,
      caseId,
    }),
  });

  return {
    resourceType: 'Bundle',
    id: `genomic-report-${caseId}`,
    type: 'collection',
    timestamp: new Date().toISOString(),
    meta: {
      profile: [
        'http://hl7.org/fhir/uv/genomics-reporting/StructureDefinition/genomics-bundle',
      ],
    },
    entry: entries,
  };
}

// ── Individual resource builders ───────────────────────────────────────────

function buildPatient(
  input: GenomicBundleInput['patient'],
  fullUrl: string
) {
  const id = fullUrl.replace('urn:uuid:', '');
  return {
    resourceType: 'Patient',
    id,
    ...(input?.name
      ? {
          name: [
            {
              text: input.name,
              ...(input.name.includes(' ')
                ? {
                    family: input.name.split(' ').pop(),
                    given: input.name.split(' ').slice(0, -1),
                  }
                : { family: input.name }),
            },
          ],
        }
      : {}),
    ...(input?.gender ? { gender: input.gender } : {}),
    ...(input?.birthDate ? { birthDate: input.birthDate } : {}),
    identifier: [
      {
        system: 'http://oncofhir.org/identifier/patient',
        value: input?.id || id.slice(0, 8),
      },
    ],
  };
}

function buildSpecimen(
  input: GenomicBundleInput['specimen'],
  patientUuid: string,
  fullUrl: string
) {
  const id = fullUrl.replace('urn:uuid:', '');
  const specimenType = input?.type || 'Tumor tissue';
  // Map common specimen types to SNOMED codes
  const snomedMap: Record<string, { code: string; display: string }> = {
    'Tumor tissue': { code: '127457009', display: 'Tumor tissue sample' },
    'Blood': { code: '119297000', display: 'Blood specimen' },
    'FFPE': { code: '441673008', display: 'Formalin-fixed paraffin-embedded tissue' },
    'Liquid biopsy': { code: '258580003', display: 'Whole blood sample' },
    'Bone marrow': { code: '119359002', display: 'Bone marrow specimen' },
    'DNA': { code: '258566005', display: 'Deoxyribonucleic acid sample' },
  };
  const snomed = snomedMap[specimenType] || { code: '127457009', display: specimenType };

  return {
    resourceType: 'Specimen',
    id,
    identifier: [
      {
        system: 'http://oncofhir.org/identifier/specimen',
        value: input?.id || `specimen-${id.slice(0, 8)}`,
      },
    ],
    status: 'available',
    type: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: snomed.code,
          display: snomed.display,
        },
      ],
    },
    subject: ref(patientUuid),
    collection: {
      collectedDateTime:
        input?.collectionDate || new Date().toISOString(),
      ...(input?.bodySite
        ? {
            bodySite: {
              coding: [
                {
                  system: 'http://snomed.info/sct',
                  display: input.bodySite,
                },
              ],
            },
          }
        : {}),
    },
  };
}

function buildServiceRequest(patientUuid: string, fullUrl: string) {
  const id = fullUrl.replace('urn:uuid:', '');
  return {
    resourceType: 'ServiceRequest',
    id,
    status: 'completed',
    intent: 'order',
    category: [cc(LOINC, '108252007', 'Laboratory procedure')],
    code: cc(LOINC, '94076-7', 'Oncology targeted gene mutation analysis panel'),
    subject: ref(patientUuid),
    authoredOn: new Date().toISOString(),
  };
}

function buildVariantObservation(
  variant: Variant,
  patientUuid: string,
  specimenUuid: string,
  fullUrl: string
) {
  const id = fullUrl.replace('urn:uuid:', '');
  const components: Array<Record<string, unknown>> = [];

  // Gene studied (48018-6) — required
  if (variant.gene) {
    components.push({
      code: loincCode('geneStudied'),
      valueCodeableConcept: cc(HGNC, variant.gene, variant.gene),
    });
  }

  // DNA change c.HGVS (48004-6)
  const hgvsC = variant.hgvs_c || variant.hgvs;
  if (hgvsC) {
    components.push({
      code: loincCode('dnaChangeHGVS'),
      valueCodeableConcept: cc(HGVS_SYSTEM, hgvsC, hgvsC),
    });
  }

  // Amino acid change p.HGVS (48005-3)
  if (variant.hgvs_p) {
    components.push({
      code: loincCode('aaChangeHGVS'),
      valueCodeableConcept: cc(HGVS_SYSTEM, variant.hgvs_p, variant.hgvs_p),
    });
  }

  // Chromosome (48001-2)
  if (variant.chrom) {
    components.push({
      code: loincCode('chromosomeIdentifier'),
      valueCodeableConcept: cc(
        LOINC,
        variant.chrom.replace('chr', ''),
        `Chromosome ${variant.chrom.replace('chr', '')}`
      ),
    });
  }

  // Ref allele (69547-8)
  if (variant.ref) {
    components.push({
      code: loincCode('refAllele'),
      valueString: variant.ref,
    });
  }

  // Alt allele (69551-0)
  if (variant.alt) {
    components.push({
      code: loincCode('altAllele'),
      valueString: variant.alt,
    });
  }

  // Genomic source class (48002-0) — somatic for oncology
  components.push({
    code: loincCode('genomicSourceClass'),
    valueCodeableConcept: cc(LOINC, 'LA6684-0', 'Somatic'),
  });

  // Coding change type (48019-4)
  if (variant.type || variant.effect) {
    const changeType = variant.type || inferChangeType(variant.effect);
    if (changeType) {
      components.push({
        code: loincCode('codingChangeType'),
        valueCodeableConcept: {
          coding: [
            {
              system: 'http://sequenceontology.org',
              display: changeType,
            },
          ],
          text: changeType,
        },
      });
    }
  }

  // VAF (81258-6)
  if (variant.vaf !== undefined) {
    components.push({
      code: loincCode('variantAlleleFrequency'),
      valueQuantity: {
        value: variant.vaf,
        unit: 'relative frequency of a particular allele in the specimen',
        system: UCUM,
        code: '1',
      },
    });
  }

  // Allelic read depth (82121-5)
  if (variant.depth !== undefined) {
    components.push({
      code: loincCode('allelicReadDepth'),
      valueQuantity: {
        value: variant.depth,
        unit: 'reads',
        system: UCUM,
        code: '{reads}',
      },
    });
  }

  // Clinical significance (53037-8)
  if (variant.clinvarSignificance || variant.clinvarData) {
    const sig =
      variant.clinvarData?.clinicalSignificance ||
      variant.clinvarSignificance ||
      'Uncertain significance';
    components.push({
      code: loincCode('clinicalSignificance'),
      valueCodeableConcept: {
        coding: [
          {
            system: CLINVAR_SYSTEM,
            display: sig,
          },
        ],
        text: sig,
      },
    });
  }

  return {
    resourceType: 'Observation',
    id,
    meta: {
      profile: [PROFILES.variant],
    },
    status: 'final',
    category: [
      {
        coding: [
          { system: OBS_CAT, code: 'laboratory', display: 'Laboratory' },
        ],
      },
      {
        coding: [{ system: V2_0074, code: 'GE', display: 'Genetics' }],
      },
    ],
    code: loincCode('geneticVariantAssessment'),
    subject: ref(patientUuid),
    specimen: ref(specimenUuid),
    effectiveDateTime: new Date().toISOString(),
    issued: new Date().toISOString(),
    // Variant present
    valueCodeableConcept: cc(LOINC, 'LA9633-4', 'Present'),
    component: components,
  };
}

function buildDiagnosticImplication(
  variant: Variant,
  variantUuid: string,
  patientUuid: string,
  fullUrl: string
) {
  const id = fullUrl.replace('urn:uuid:', '');
  const components: Array<Record<string, unknown>> = [];

  // Clinical significance (53037-8)
  const significance =
    variant.clinvarData?.clinicalSignificance ||
    variant.clinvarSignificance ||
    'Uncertain significance';
  components.push({
    code: loincCode('clinicalSignificance'),
    valueCodeableConcept: {
      coding: [{ system: CLINVAR_SYSTEM, display: significance }],
      text: significance,
    },
  });

  // Predicted phenotype (81259-4) — from effect/consequence
  if (variant.effect) {
    components.push({
      code: loincCode('predictedPhenotype'),
      valueCodeableConcept: {
        coding: [
          {
            system: 'http://sequenceontology.org',
            display: variant.effect,
          },
        ],
        text: variant.effect,
      },
    });
  }

  // Evidence level (93044-6)
  if (variant.evidenceLevel) {
    components.push({
      code: loincCode('evidenceLevel'),
      valueCodeableConcept: {
        text: variant.evidenceLevel,
      },
    });
  }

  return {
    resourceType: 'Observation',
    id,
    meta: {
      profile: [PROFILES.diagnosticImplication],
    },
    status: 'final',
    category: [
      {
        coding: [
          { system: OBS_CAT, code: 'laboratory', display: 'Laboratory' },
        ],
      },
      {
        coding: [{ system: V2_0074, code: 'GE', display: 'Genetics' }],
      },
    ],
    code: cc(TBD_CODES, 'diagnostic-implication', 'Diagnostic Implication'),
    subject: ref(patientUuid),
    // derivedFrom is required (1..*) — links to the Variant observation
    derivedFrom: [ref(variantUuid)],
    component: components,
  };
}

function buildTherapeuticImplication(
  variant: Variant,
  therapy: Therapy,
  relatedEvidence: Evidence | undefined,
  variantUuid: string,
  patientUuid: string,
  fullUrl: string,
  tumorType?: string
) {
  const id = fullUrl.replace('urn:uuid:', '');
  const components: Array<Record<string, unknown>> = [];

  // Medication assessed (51963-7)
  components.push({
    code: loincCode('medicationAssessed'),
    valueCodeableConcept: {
      coding: [
        {
          system: 'http://www.nlm.nih.gov/research/umls/rxnorm',
          display: therapy.drug,
        },
      ],
      text: therapy.drug,
    },
  });

  // Evidence level (93044-6)
  if (therapy.level) {
    components.push({
      code: loincCode('evidenceLevel'),
      valueCodeableConcept: {
        text: therapy.level,
      },
    });
  }

  // Phenotypic treatment context (tumor type)
  const context = tumorType || therapy.tumorType;
  if (context) {
    components.push({
      code: cc(TBD_CODES, 'phenotypic-treatment-context', 'Phenotypic treatment context'),
      valueCodeableConcept: {
        text: context,
      },
    });
  }

  return {
    resourceType: 'Observation',
    id,
    meta: {
      profile: [PROFILES.therapeuticImplication],
    },
    status: 'final',
    category: [
      {
        coding: [
          { system: OBS_CAT, code: 'laboratory', display: 'Laboratory' },
        ],
      },
      {
        coding: [{ system: V2_0074, code: 'GE', display: 'Genetics' }],
      },
    ],
    code: cc(TBD_CODES, 'therapeutic-implication', 'Therapeutic Implication'),
    subject: ref(patientUuid),
    derivedFrom: [ref(variantUuid)],
    component: components,
    ...(relatedEvidence
      ? {
          note: [
            {
              text: `Source: ${relatedEvidence.source}. ${relatedEvidence.description}`,
            },
          ],
        }
      : {}),
  };
}

function buildRecommendedTask(
  therapy: Therapy,
  patientUuid: string,
  fullUrl: string
) {
  const id = fullUrl.replace('urn:uuid:', '');
  return {
    resourceType: 'Task',
    id,
    status: 'requested',
    intent: 'proposal',
    code: cc(
      TBD_CODES,
      'followup-recommendation',
      'Recommended follow-up'
    ),
    description: `Consider ${therapy.drug} for ${therapy.biomarker} (${therapy.tumorType}). Evidence level: ${therapy.level}.`,
    for: ref(patientUuid),
    authoredOn: new Date().toISOString(),
    input: [
      {
        type: cc(LOINC, '51963-7', 'Medication assessed'),
        valueString: therapy.drug,
      },
      {
        type: cc(TBD_CODES, 'evidence-level', 'Evidence level'),
        valueString: therapy.level,
      },
    ],
  };
}

function buildGenomicReport(refs: {
  patientUuid: string;
  specimenUuid: string;
  serviceRequestUuid: string;
  variantUuids: string[];
  diagnosticImplUuids: string[];
  therapeuticImplUuids: string[];
  reportUuid: string;
  caseId: string;
}) {
  const id = refs.reportUuid.replace('urn:uuid:', '');
  // Collect all result references
  const results = [
    ...refs.variantUuids.map((u) => ref(u)),
    ...refs.diagnosticImplUuids.map((u) => ref(u)),
    ...refs.therapeuticImplUuids.map((u) => ref(u)),
  ];

  return {
    resourceType: 'DiagnosticReport',
    id,
    meta: {
      profile: [PROFILES.genomicReport],
    },
    status: 'final',
    category: [
      {
        coding: [{ system: V2_0074, code: 'GE', display: 'Genetics' }],
      },
    ],
    code: cc(LOINC, '81247-9', 'Master HL7 genetic variant reporting panel'),
    subject: ref(refs.patientUuid),
    specimen: [ref(refs.specimenUuid)],
    basedOn: [ref(refs.serviceRequestUuid)],
    issued: new Date().toISOString(),
    result: results,
  };
}

// ── Utility ────────────────────────────────────────────────────────────────

function inferChangeType(effect?: string): string | null {
  if (!effect) return null;
  const lower = effect.toLowerCase();
  if (lower.includes('missense')) return 'SO:0001583';
  if (lower.includes('nonsense') || lower.includes('stop_gained'))
    return 'SO:0001587';
  if (lower.includes('frameshift')) return 'SO:0001589';
  if (lower.includes('splice')) return 'SO:0001629';
  if (lower.includes('synonymous')) return 'SO:0001819';
  if (lower.includes('inframe_deletion')) return 'SO:0001822';
  if (lower.includes('inframe_insertion')) return 'SO:0001821';
  return null;
}
