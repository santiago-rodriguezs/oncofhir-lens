// FHIR Resource Types

export interface Patient {
  id: string;
  resourceType: 'Patient';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  name?: Array<{
    family: string;
    given: string[];
    text?: string;
  }>;
  gender?: string;
  birthDate?: string;
  active?: boolean;
}

export interface Specimen {
  id: string;
  resourceType: 'Specimen';
  identifier?: Array<{
    system: string;
    value: string;
  }>;
  status?: 'available' | 'unavailable' | 'unsatisfactory' | 'entered-in-error';
  type?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  };
  subject: {
    reference: string;
    display?: string;
  };
  collection?: {
    collectedDateTime?: string;
    method?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
    bodySite?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
    };
  };
}

export interface Observation {
  id: string;
  resourceType: 'Observation';
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  category: Array<{
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
  }>;
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  subject: {
    reference: string;
    display?: string;
  };
  specimen?: {
    reference: string;
    display?: string;
  };
  effectiveDateTime?: string;
  issued?: string;
  valueCodeableConcept?: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text?: string;
  };
  component?: Array<{
    code: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    valueString?: string;
    valueCodeableConcept?: {
      coding: Array<{
        system: string;
        code: string;
        display: string;
      }>;
      text?: string;
    };
    valueQuantity?: {
      value: number;
      unit: string;
      system: string;
      code: string;
    };
  }>;
}

export interface DetectedIssue {
  id: string;
  resourceType: 'DetectedIssue';
  status: 'registered' | 'preliminary' | 'final' | 'amended';
  code: {
    coding: Array<{
      system: string;
      code: string;
      display: string;
    }>;
    text: string;
  };
  severity: 'high' | 'moderate' | 'low';
  patient: {
    reference: string;
    display?: string;
  };
  identifiedDateTime?: string;
  evidence: string | Array<{ detail: Array<{ text: string }> }>;
  detail: string;
  reference?: string[];
  mitigation?: string[] | Array<{ action: { text: string } }>;
  evidenceUrls?: string[];
}

// Application-specific types — Variant is the canonical model from @/core/models
export type { Variant } from '@/core/models';
import type { Variant } from '@/core/models';

export interface CaseData {
  id: string;
  patient: Patient;
  specimen: Specimen;
  variants: Variant[];
  detectedIssues?: DetectedIssue[];
}

// API Response Types

export interface IngestResponse {
  caseId: string;
  persistedCounts: {
    patients: number;
    specimens: number;
    observations: number;
    detectedIssues: number;
  };
  fhirRefs: string[];
}

export interface CaseListItem {
  id: string;
  patientId: string;
  label: string;
  date: string;
  variantCount: number;
}
