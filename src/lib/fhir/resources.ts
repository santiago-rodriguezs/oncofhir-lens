import { Patient, Specimen, Observation, DetectedIssue, Variant } from '@/types/fhir';
import { v4 as uuidv4 } from 'uuid';
import { fhirClient } from './client';

/**
 * Create or update a patient
 * @param patientId - Optional patient identifier
 * @returns Patient resource
 */
export async function upsertPatient(patientId?: string): Promise<Patient> {
  const client = fhirClient();
  
  try {
    if (patientId) {
      // Try to find existing patient
      const patients = await searchBundle('Patient', { identifier: patientId });
      
      if (patients && patients.length > 0) {
        return patients[0] as Patient;
      }
    }
    
    // Create a new patient
    const newPatient: Patient = {
      resourceType: 'Patient',
      id: uuidv4(),
      identifier: [
        {
          system: 'http://oncofhir.org/identifier/patient',
          value: patientId || `patient-${uuidv4().slice(0, 8)}`,
        },
      ],
      active: true,
    };
    
    return await client.create<Patient>('Patient', newPatient);
  } catch (error) {
    console.error('Error upserting patient:', error);
    throw error;
  }
}

/**
 * Parameters for creating a specimen
 */
export interface SpecimenParams {
  patientId: string;
  label?: string;
  collectionDate?: string;
}

/**
 * Create a specimen
 * @param params - Specimen parameters
 * @returns Specimen resource
 */
export async function createSpecimen(params: SpecimenParams): Promise<Specimen> {
  const client = fhirClient();
  
  try {
    const specimen: Specimen = {
      resourceType: 'Specimen',
      id: uuidv4(),
      identifier: [
        {
          system: 'http://oncofhir.org/identifier/specimen',
          value: params.label || `specimen-${uuidv4().slice(0, 8)}`,
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
        reference: `Patient/${params.patientId}`,
      },
      collection: {
        collectedDateTime: params.collectionDate || new Date().toISOString(),
      },
    };
    
    return await client.create<Specimen>('Specimen', specimen);
  } catch (error) {
    console.error('Error creating specimen:', error);
    throw error;
  }
}

/**
 * Parameters for creating a genomic observation
 */
export interface ObservationParams {
  patientId: string;
  specimenId: string;
  variant: Variant;
}

/**
 * Create a genomic observation
 * @param params - Observation parameters
 * @returns Observation resource
 */
export async function createGenomicObservation(params: ObservationParams): Promise<Observation> {
  const client = fhirClient();
  
  try {
    const observation: Observation = {
      resourceType: 'Observation',
      id: uuidv4(),
      status: 'final',
      category: [
        {
          coding: [
            {
              system: 'http://terminology.hl7.org/CodeSystem/observation-category',
              code: 'laboratory',
              display: 'Laboratory',
            },
            {
              system: 'http://hl7.org/fhir/uv/genomics-reporting/CodeSystem/tbd-codes',
              code: 'genomics',
              display: 'Genomics',
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
        text: 'Genomic Variant',
      },
      subject: {
        reference: `Patient/${params.patientId}`,
      },
      specimen: {
        reference: `Specimen/${params.specimenId}`,
      },
      effectiveDateTime: new Date().toISOString(),
      issued: new Date().toISOString(),
      component: [
        // Gene component
        {
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '48018-6',
                display: 'Gene studied',
              },
            ],
            text: 'Gene',
          },
          valueCodeableConcept: {
            coding: [
              {
                system: 'http://www.genenames.org',
                code: params.variant.gene,
                display: params.variant.gene,
              },
            ],
            text: params.variant.gene,
          },
        },
        // DNA change (HGVS)
        {
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '48004-6',
                display: 'DNA change (c.HGVS)',
              },
            ],
            text: 'HGVS Nomenclature',
          },
          valueString: params.variant.hgvs,
        },
        // Genomic source class
        {
          code: {
            coding: [
              {
                system: 'http://loinc.org',
                code: '48002-0',
                display: 'Genomic source class',
              },
            ],
            text: 'Genomic Source',
          },
          valueCodeableConcept: {
            coding: [
              {
                system: 'http://loinc.org',
                code: 'LA6684-0',
                display: 'Somatic',
              },
            ],
            text: 'Somatic',
          },
        },
      ],
    };
    
    // Add variant allele frequency if available
    if (params.variant.vaf !== undefined) {
      observation.component?.push({
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '81258-6',
              display: 'Variant allele frequency',
            },
          ],
          text: 'VAF',
        },
        valueQuantity: {
          value: params.variant.vaf,
          unit: 'ratio',
          system: 'http://unitsofmeasure.org',
          code: '1',
        },
      });
    }
    
    // Add clinical significance if available
    if (params.variant.clinvarSignificance) {
      observation.component?.push({
        code: {
          coding: [
            {
              system: 'http://loinc.org',
              code: '53037-8',
              display: 'Genetic variation clinical significance',
            },
          ],
          text: 'Clinical Significance',
        },
        valueCodeableConcept: {
          text: params.variant.clinvarSignificance,
        },
      });
    }
    
    return await client.create<Observation>('Observation', observation);
  } catch (error) {
    console.error('Error creating genomic observation:', error);
    throw error;
  }
}

/**
 * Parameters for creating a detected issue
 */
export interface DetectedIssueParams {
  patientId: string;
  issue: {
    title: string;
    detail: string;
    severity: 'high' | 'moderate' | 'low';
    evidence: string;
    suggestions?: string[];
    evidenceRefs?: string[];
  };
}

/**
 * Create a detected issue
 * @param params - DetectedIssue parameters
 * @returns DetectedIssue resource
 */
export async function createDetectedIssue(params: DetectedIssueParams): Promise<DetectedIssue> {
  const client = fhirClient();
  
  try {
    const detectedIssue: DetectedIssue = {
      resourceType: 'DetectedIssue',
      id: uuidv4(),
      status: 'final',
      code: {
        coding: [
          {
            system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
            code: 'GENTHERAPY',
            display: 'Genomic Therapy Issue',
          },
        ],
        text: params.issue.title,
      },
      severity: params.issue.severity,
      patient: {
        reference: `Patient/${params.patientId}`,
      },
      detail: params.issue.detail,
      evidence: [
        {
          detail: [
            {
              text: params.issue.evidence,
            },
          ],
        },
      ],
      mitigation: params.issue.suggestions?.map(suggestion => ({
        action: {
          text: suggestion,
        },
      })) || [],
    };
    
    return await client.create<DetectedIssue>('DetectedIssue', detectedIssue);
  } catch (error) {
    console.error('Error creating detected issue:', error);
    throw error;
  }
}

/**
 * Helper function to search for resources and extract them from bundle
 * @param resourceType - FHIR resource type to search for
 * @param params - Search parameters
 * @returns Array of resources from the bundle
 */
export async function searchBundle(resourceType: string, params: Record<string, string> = {}) {
  const client = fhirClient();
  
  try {
    const bundle = await client.search<any>(resourceType, params);
    
    if (!bundle || !bundle.entry) {
      return [];
    }
    
    return bundle.entry.map((entry: any) => entry.resource);
  } catch (error) {
    console.error(`Error searching ${resourceType}:`, error);
    throw error;
  }
}
