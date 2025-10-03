import { Variant, Patient, Specimen, DetectedIssue } from '@/types/fhir';
import { v4 as uuidv4 } from 'uuid';

/**
 * Demo data for testing the application without a real FHIR server
 */

// Demo patient
export const demoPatient: Patient = {
  id: 'patient-demo-001',
  resourceType: 'Patient',
  identifier: [
    {
      system: 'http://oncofhir.org/identifier/patient',
      value: 'DEMO-001',
    },
  ],
  name: [
    {
      family: 'Smith',
      given: ['John'],
      text: 'John Smith',
    },
  ],
  gender: 'male',
  birthDate: '1965-07-15',
  active: true,
};

// Demo specimen
export const demoSpecimen: Specimen = {
  id: 'specimen-demo-001',
  resourceType: 'Specimen',
  identifier: [
    {
      system: 'http://oncofhir.org/identifier/specimen',
      value: 'Lung biopsy - 2025-09-15',
    },
  ],
  status: 'available',
  type: {
    coding: [
      {
        system: 'http://terminology.hl7.org/CodeSystem/v2-0487',
        code: 'DNA',
        display: 'DNA',
      },
    ],
  },
  subject: {
    reference: 'Patient/patient-demo-001',
    display: 'John Smith',
  },
  collection: {
    collectedDateTime: '2025-09-15T10:30:00Z',
    method: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '86273004',
          display: 'Biopsy',
        },
      ],
    },
    bodySite: {
      coding: [
        {
          system: 'http://snomed.info/sct',
          code: '39607008',
          display: 'Lung structure',
        },
      ],
    },
  },
};

// Demo variants
export const demoVariants: Variant[] = [
  {
    id: uuidv4(),
    gene: 'EGFR',
    hgvs: 'p.L858R',
    chromosome: '7',
    position: 55259515,
    reference: 'T',
    alternate: 'G',
    consequence: 'missense_variant',
    clinvarSignificance: 'Pathogenic',
    vaf: 0.35,
    quality: 100,
    filter: 'PASS',
    evidenceLevel: 'Level 1',
    evidenceUrls: [
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6933030/',
      'https://www.nccn.org/guidelines/guidelines-detail?category=1&id=1450',
    ],
    oncokbData: {
      oncogenic: 'Oncogenic',
      mutationEffect: 'Gain of function',
      highestSensitiveLevel: 'Level 1',
    },
    clinvarData: {
      clinicalSignificance: 'Pathogenic',
      reviewStatus: 'criteria provided, multiple submitters, no conflicts',
      lastUpdated: '2024-05-15',
      variantId: '16609',
    },
  },
  {
    id: uuidv4(),
    gene: 'TP53',
    hgvs: 'p.R273H',
    chromosome: '17',
    position: 7577120,
    reference: 'G',
    alternate: 'A',
    consequence: 'missense_variant',
    clinvarSignificance: 'Pathogenic',
    vaf: 0.42,
    quality: 95,
    filter: 'PASS',
    evidenceLevel: 'Level 3',
    evidenceUrls: [
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC4833231/',
    ],
    clinvarData: {
      clinicalSignificance: 'Pathogenic',
      reviewStatus: 'criteria provided, multiple submitters, no conflicts',
      lastUpdated: '2024-03-10',
      variantId: '12347',
    },
  },
  {
    id: uuidv4(),
    gene: 'KRAS',
    hgvs: 'p.G12C',
    chromosome: '12',
    position: 25398284,
    reference: 'C',
    alternate: 'A',
    consequence: 'missense_variant',
    clinvarSignificance: 'Pathogenic',
    vaf: 0.28,
    quality: 90,
    filter: 'PASS',
    evidenceLevel: 'Level 1',
    evidenceUrls: [
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC8118268/',
      'https://www.fda.gov/drugs/resources-information-approved-drugs/fda-grants-accelerated-approval-sotorasib-kras-g12c-mutated-nsclc',
    ],
    oncokbData: {
      oncogenic: 'Oncogenic',
      mutationEffect: 'Gain of function',
      highestSensitiveLevel: 'Level 1',
    },
  },
  {
    id: uuidv4(),
    gene: 'STK11',
    hgvs: 'p.F354L',
    chromosome: '19',
    position: 1220321,
    reference: 'C',
    alternate: 'G',
    consequence: 'missense_variant',
    clinvarSignificance: 'Likely pathogenic',
    vaf: 0.31,
    quality: 85,
    filter: 'PASS',
    evidenceLevel: 'Level 3',
  },
  {
    id: uuidv4(),
    gene: 'CDKN2A',
    hgvs: 'p.W110*',
    chromosome: '9',
    position: 21971186,
    reference: 'G',
    alternate: 'A',
    consequence: 'stop_gained',
    clinvarSignificance: 'Pathogenic',
    vaf: 0.45,
    quality: 92,
    filter: 'PASS',
    evidenceLevel: 'Level 3',
  },
];

// Demo detected issues
export const demoDetectedIssues: DetectedIssue[] = [
  {
    id: uuidv4(),
    resourceType: 'DetectedIssue',
    status: 'final',
    identifiedDateTime: '2025-09-15T14:30:00Z',
    code: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'GENTHERAPY',
          display: 'Genomic Therapy Issue',
        },
      ],
      text: 'EGFR L858R - Targetable Driver Mutation',
    },
    severity: 'high',
    patient: {
      reference: 'Patient/patient-demo-001',
    },
    detail: 'EGFR L858R is a well-established driver mutation in non-small cell lung cancer that predicts response to EGFR tyrosine kinase inhibitors.',
    evidence: 'EGFR L858R is a well-established driver mutation in non-small cell lung cancer that predicts response to EGFR tyrosine kinase inhibitors.',
    mitigation: ['Osimertinib', 'Gefitinib', 'Erlotinib', 'Afatinib'],
  },
  {
    id: uuidv4(),
    resourceType: 'DetectedIssue',
    status: 'final',
    identifiedDateTime: '2025-09-15T14:30:00Z',
    code: {
      coding: [
        {
          system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
          code: 'GENTHERAPY',
          display: 'Genomic Therapy Issue',
        },
      ],
      text: 'KRAS G12C - Newly Targetable Mutation',
    },
    severity: 'high',
    patient: {
      reference: 'Patient/patient-demo-001',
    },
    detail: 'KRAS G12C is now targetable with specific inhibitors in non-small cell lung cancer and other tumors.',
    evidence: 'KRAS G12C is now targetable with specific inhibitors in non-small cell lung cancer and other tumors.',
    mitigation: ['Sotorasib', 'Adagrasib', 'Clinical trial enrollment'],
  },
];

// Combined demo case data for API responses
export const demoCaseData = {
  patient: demoPatient,
  specimen: demoSpecimen,
  variants: demoVariants,
  detectedIssues: demoDetectedIssues,
};
