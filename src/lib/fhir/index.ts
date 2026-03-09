/**
 * FHIR API client and helper functions
 */

export { fhirClient } from './client';
export {
  upsertPatient,
  createSpecimen,
  createGenomicObservation,
  createDetectedIssue,
  searchBundle,
} from './resources';
export type { SpecimenParams, ObservationParams, DetectedIssueParams } from './resources';

// Genomics Reporting IG (STU2) compliant builders
export { buildGenomicReportBundle } from './genomics-reporting';
export type { GenomicBundleInput } from './genomics-reporting';
