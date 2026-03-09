/**
 * GA4GH Phenopackets v2 builder
 *
 * Implements the Phenopacket Schema v2 for oncology genomics:
 * https://phenopacket-schema.readthedocs.io/en/latest/
 *
 * Phenopackets provide a computable case-level representation combining:
 * - Patient demographics (Individual)
 * - Disease diagnosis
 * - Genomic interpretations (with VRS alleles)
 * - Medical actions (treatments)
 * - Biosamples
 */

import { Variant, Evidence, Therapy, CaseMetadata } from '@/core/models';
import { variantToVrsAllele, VrsAllele } from './vrs';

// ── Phenopacket v2 types ───────────────────────────────────────────────────

export interface Phenopacket {
  id: string;
  subject: Individual;
  phenotypicFeatures?: PhenotypicFeature[];
  biosamples?: Biosample[];
  interpretations?: Interpretation[];
  diseases?: Disease[];
  medicalActions?: MedicalAction[];
  metaData: MetaData;
}

export interface Individual {
  id: string;
  sex?: 'UNKNOWN_SEX' | 'FEMALE' | 'MALE' | 'OTHER_SEX';
  dateOfBirth?: string;
}

export interface OntologyClass {
  id: string;
  label: string;
}

export interface PhenotypicFeature {
  type: OntologyClass;
  excluded?: boolean;
}

export interface Biosample {
  id: string;
  individualId: string;
  sampledTissue: OntologyClass;
  tumorProgression?: OntologyClass;
  procedure?: Procedure;
}

export interface Procedure {
  code: OntologyClass;
  performed?: { timestamp?: string };
}

export interface Disease {
  term: OntologyClass;
  onset?: { age?: { iso8601duration: string } };
  diseaseStage?: OntologyClass[];
}

export interface Interpretation {
  id: string;
  progressStatus: 'SOLVED' | 'UNSOLVED' | 'IN_PROGRESS' | 'UNKNOWN';
  diagnosis?: Diagnosis;
}

export interface Diagnosis {
  disease: OntologyClass;
  genomicInterpretations: GenomicInterpretation[];
}

export interface GenomicInterpretation {
  subjectOrBiosampleId: string;
  interpretationStatus:
    | 'UNKNOWN_STATUS'
    | 'REJECTED'
    | 'CANDIDATE'
    | 'CONTRIBUTORY'
    | 'CAUSATIVE';
  variantInterpretation?: VariantInterpretation;
}

export interface VariantInterpretation {
  acmgPathogenicityClassification:
    | 'NOT_PROVIDED'
    | 'BENIGN'
    | 'LIKELY_BENIGN'
    | 'UNCERTAIN_SIGNIFICANCE'
    | 'LIKELY_PATHOGENIC'
    | 'PATHOGENIC';
  therapeuticActionability:
    | 'UNKNOWN_ACTIONABILITY'
    | 'NOT_ACTIONABLE'
    | 'ACTIONABLE';
  variationDescriptor: VariationDescriptor;
}

export interface VariationDescriptor {
  id: string;
  geneContext?: GeneDescriptor;
  expressions?: Expression[];
  vcfRecord?: VcfRecord;
  allelicState?: OntologyClass;
  vrsRef?: VrsAllele;
}

export interface GeneDescriptor {
  valueId: string;
  symbol: string;
}

export interface Expression {
  syntax: 'hgvs.c' | 'hgvs.p' | 'hgvs.g' | 'iscn';
  value: string;
}

export interface VcfRecord {
  genomeAssembly: string;
  chrom: string;
  pos: number;
  ref: string;
  alt: string;
}

export interface MedicalAction {
  treatment?: Treatment;
}

export interface Treatment {
  agent: OntologyClass;
  routeOfAdministration?: OntologyClass;
}

export interface MetaData {
  created: string;
  createdBy: string;
  phenopacketSchemaVersion: string;
  resources: Resource[];
}

export interface Resource {
  id: string;
  name: string;
  url: string;
  version: string;
  namespacePrefix: string;
  iriPrefix: string;
}

// ── Phenopacket builder input ──────────────────────────────────────────────

export interface PhenopacketInput {
  caseId: string;
  metadata: CaseMetadata;
  variants: Variant[];
  evidence?: Evidence[];
  therapies?: Therapy[];
  patientSex?: 'FEMALE' | 'MALE';
  patientBirthDate?: string;
}

// ── Map clinical significance to ACMG classification ───────────────────────

function toAcmgClassification(
  significance?: string
): VariantInterpretation['acmgPathogenicityClassification'] {
  if (!significance) return 'NOT_PROVIDED';
  const lower = significance.toLowerCase();
  if (lower.includes('pathogenic') && lower.includes('likely'))
    return 'LIKELY_PATHOGENIC';
  if (lower.includes('pathogenic')) return 'PATHOGENIC';
  if (lower.includes('benign') && lower.includes('likely'))
    return 'LIKELY_BENIGN';
  if (lower.includes('benign')) return 'BENIGN';
  return 'UNCERTAIN_SIGNIFICANCE';
}

function toActionability(
  variant: Variant
): VariantInterpretation['therapeuticActionability'] {
  if (
    variant.oncokbLevel ||
    variant.oncokbData?.highestSensitiveLevel ||
    variant.actionability === 'High'
  ) {
    return 'ACTIONABLE';
  }
  return 'UNKNOWN_ACTIONABILITY';
}

function toInterpretationStatus(
  variant: Variant
): GenomicInterpretation['interpretationStatus'] {
  const sig =
    variant.clinvarData?.clinicalSignificance || variant.clinvarSignificance;
  if (!sig) return 'CANDIDATE';
  const lower = sig.toLowerCase();
  if (lower.includes('pathogenic')) return 'CAUSATIVE';
  if (lower.includes('benign')) return 'REJECTED';
  return 'CANDIDATE';
}

// ── Build Phenopacket ──────────────────────────────────────────────────────

export function buildPhenopacket(input: PhenopacketInput): Phenopacket {
  const {
    caseId,
    metadata,
    variants,
    evidence = [],
    therapies = [],
    patientSex,
    patientBirthDate,
  } = input;

  const subjectId = metadata.patientId || `patient-${caseId}`;
  const biosampleId = metadata.sampleId || `sample-${caseId}`;

  // 1. Individual
  const subject: Individual = {
    id: subjectId,
    ...(patientSex ? { sex: patientSex } : {}),
    ...(patientBirthDate ? { dateOfBirth: patientBirthDate } : {}),
  };

  // 2. Biosample
  const biosamples: Biosample[] = [
    {
      id: biosampleId,
      individualId: subjectId,
      sampledTissue: {
        id: 'UBERON:0000479',
        label: 'Tissue',
      },
      tumorProgression: {
        id: 'HP:0030731',
        label: 'Primary neoplasm',
      },
      procedure: {
        code: {
          id: 'NCIT:C15189',
          label: 'Biopsy',
        },
      },
    },
  ];

  // 3. Disease
  const diseases: Disease[] = [];
  if (metadata.tumorType) {
    diseases.push({
      term: {
        id: `NCIT:unknown`,
        label: metadata.tumorType,
      },
    });
  }

  // 4. Genomic interpretations
  const genomicInterpretations: GenomicInterpretation[] = variants.map(
    (variant, idx) => {
      const expressions: Expression[] = [];
      if (variant.hgvs_c || variant.hgvs) {
        expressions.push({
          syntax: 'hgvs.c',
          value: variant.hgvs_c || variant.hgvs || '',
        });
      }
      if (variant.hgvs_p) {
        expressions.push({
          syntax: 'hgvs.p',
          value: variant.hgvs_p,
        });
      }

      const vrs = variantToVrsAllele(variant);

      const variationDescriptor: VariationDescriptor = {
        id: `variant-${idx}`,
        ...(variant.gene
          ? {
              geneContext: {
                valueId: `HGNC:${variant.gene}`,
                symbol: variant.gene,
              },
            }
          : {}),
        expressions:
          expressions.length > 0 ? expressions : undefined,
        ...(variant.chrom && variant.pos && variant.ref && variant.alt
          ? {
              vcfRecord: {
                genomeAssembly: 'GRCh38',
                chrom: variant.chrom,
                pos: variant.pos,
                ref: variant.ref,
                alt: variant.alt,
              },
            }
          : {}),
        ...(vrs ? { vrsRef: vrs } : {}),
        ...(variant.zygosity
          ? {
              allelicState: {
                id:
                  variant.zygosity === 'heterozygous'
                    ? 'GENO:0000135'
                    : 'GENO:0000136',
                label: variant.zygosity,
              },
            }
          : {}),
      };

      const significance =
        variant.clinvarData?.clinicalSignificance ||
        variant.clinvarSignificance;

      return {
        subjectOrBiosampleId: biosampleId,
        interpretationStatus: toInterpretationStatus(variant),
        variantInterpretation: {
          acmgPathogenicityClassification:
            toAcmgClassification(significance),
          therapeuticActionability: toActionability(variant),
          variationDescriptor,
        },
      };
    }
  );

  const interpretations: Interpretation[] = [
    {
      id: `interpretation-${caseId}`,
      progressStatus: 'IN_PROGRESS',
      ...(diseases.length > 0
        ? {
            diagnosis: {
              disease: diseases[0].term,
              genomicInterpretations,
            },
          }
        : {}),
    },
  ];

  // 5. Medical actions (therapies)
  const medicalActions: MedicalAction[] = therapies.map((therapy) => ({
    treatment: {
      agent: {
        id: `DrugBank:unknown`,
        label: therapy.drug,
      },
    },
  }));

  // 6. MetaData
  const metaData: MetaData = {
    created: new Date().toISOString(),
    createdBy: 'OncoFHIR Lens',
    phenopacketSchemaVersion: '2.0.0',
    resources: [
      {
        id: 'ncit',
        name: 'NCI Thesaurus',
        url: 'https://ncithesaurus.nci.nih.gov/ncitbrowser/',
        version: '2024',
        namespacePrefix: 'NCIT',
        iriPrefix: 'http://purl.obolibrary.org/obo/NCIT_',
      },
      {
        id: 'hgnc',
        name: 'HUGO Gene Nomenclature Committee',
        url: 'https://www.genenames.org/',
        version: '2024',
        namespacePrefix: 'HGNC',
        iriPrefix: 'https://www.genenames.org/data/gene-symbol-report/#!/hgnc_id/',
      },
      {
        id: 'geno',
        name: 'Genotype Ontology',
        url: 'http://www.genoontology.org/',
        version: '2024',
        namespacePrefix: 'GENO',
        iriPrefix: 'http://purl.obolibrary.org/obo/GENO_',
      },
      {
        id: 'hp',
        name: 'Human Phenotype Ontology',
        url: 'https://hpo.jax.org/',
        version: '2024',
        namespacePrefix: 'HP',
        iriPrefix: 'http://purl.obolibrary.org/obo/HP_',
      },
      {
        id: 'so',
        name: 'Sequence Ontology',
        url: 'http://www.sequenceontology.org/',
        version: '2024',
        namespacePrefix: 'SO',
        iriPrefix: 'http://purl.obolibrary.org/obo/SO_',
      },
    ],
  };

  return {
    id: `phenopacket-${caseId}`,
    subject,
    biosamples,
    diseases: diseases.length > 0 ? diseases : undefined,
    interpretations,
    medicalActions:
      medicalActions.length > 0 ? medicalActions : undefined,
    metaData,
  };
}
