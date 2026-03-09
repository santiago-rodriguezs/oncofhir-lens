import { createGenomicObservation, createDetectedIssue } from './resources';
import { Variant } from '@/core/models';

// Mock the fhirClient function
jest.mock('./resources', () => {
  const originalModule = jest.requireActual('./resources');
  
  // Mock client for testing
  const mockClient = {
    create: jest.fn().mockImplementation((resourceType, resource) => {
      return Promise.resolve({
        ...resource,
        id: 'mock-id-12345'
      });
    }),
    search: jest.fn().mockImplementation(() => {
      return Promise.resolve({
        entry: []
      });
    })
  };
  
  return {
    ...originalModule,
    fhirClient: jest.fn().mockReturnValue(mockClient),
    // Re-export the non-mocked functions but with access to the mock client
    createGenomicObservation: (params: any) => {
      return originalModule.createGenomicObservation(params);
    },
    createDetectedIssue: (params: any) => {
      return originalModule.createDetectedIssue(params);
    }
  };
});

describe('FHIR Mapping Functions', () => {
  const mockVariant: Variant = {
    id: 'test-variant-id',
    gene: 'EGFR',
    hgvs: 'p.L858R',
    chrom: '7',
    pos: 55259515,
    ref: 'T',
    alt: 'G',
    effect: 'missense_variant',
    clinvarSignificance: 'Pathogenic',
    vaf: 0.35,
    quality: 100,
    filter: 'PASS',
    evidenceLevel: 'Level 1',
    evidenceLinks: [
      'https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6933030/'
    ]
  };
  
  it('should create a genomic observation with correct structure', async () => {
    const observation = await createGenomicObservation({
      patientId: 'test-patient',
      specimenId: 'test-specimen',
      variant: mockVariant
    });
    
    expect(observation).toBeDefined();
    expect(observation.id).toBe('mock-id-12345');
    expect(observation.resourceType).toBe('Observation');
    expect(observation.subject.reference).toBe('Patient/test-patient');
    expect(observation.specimen?.reference).toBe('Specimen/test-specimen');
    
    // Check components
    const components = observation.component || [];
    
    // Find gene component
    const geneComponent = components.find((c: any) =>
      c.code?.coding?.some((coding: any) => coding.code === '48018-6')
    );
    expect(geneComponent?.valueString).toBe('EGFR');

    // Find HGVS component
    const hgvsComponent = components.find((c: any) =>
      c.code?.coding?.some((coding: any) => coding.code === '48004-6')
    );
    expect(hgvsComponent?.valueString).toBe('p.L858R');

    // Find VAF component
    const vafComponent = components.find((c: any) =>
      c.code?.coding?.some((coding: any) => coding.code === '81258-6')
    );
    expect(vafComponent?.valueString).toBe('0.35');
  });
  
  it('should create a detected issue with correct structure', async () => {
    const issue = await createDetectedIssue({
      patientId: 'test-patient',
      issue: {
        title: 'EGFR L858R - Targetable Driver Mutation',
        detail: 'EGFR L858R - Targetable Driver Mutation',
        severity: 'high',
        evidence: 'EGFR L858R is a well-established driver mutation in non-small cell lung cancer.',
        suggestions: ['Osimertinib', 'Gefitinib'],
        evidenceRefs: ['https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6933030/']
      }
    });
    
    expect(issue).toBeDefined();
    expect(issue.id).toBe('mock-id-12345');
    expect(issue.resourceType).toBe('DetectedIssue');
    expect(issue.patient.reference).toBe('Patient/test-patient');
    expect(issue.severity).toBe('high');
    expect(issue.detail).toBe('EGFR L858R - Targetable Driver Mutation');
    expect(issue.mitigation).toContain('Osimertinib');
    expect(issue.mitigation).toContain('Gefitinib');
    expect(issue.evidenceUrls).toContain('https://www.ncbi.nlm.nih.gov/pmc/articles/PMC6933030/');
  });
});
