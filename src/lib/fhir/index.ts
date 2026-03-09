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
