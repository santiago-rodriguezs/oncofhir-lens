import {
  normalizeVcfData,
  normalizePdfData,
  normalizeOncoKbAnnotation,
  normalizeClinVarAnnotation,
  normalizeTherapies,
} from '../normalizer';

describe('Data Normalizers', () => {
  describe('VCF Normalizer', () => {
    it('should normalize VCF data with complete information', async () => {
      const mockVcfData = {
        sampleId: 'SAMPLE-001',
        variants: [
          {
            gene: 'BRAF',
            hgvs: 'p.V600E',
            effect: 'missense_variant',
            vaf: 0.45,
            depth: 500,
          },
        ],
      };

      const normalized = await normalizeVcfData(mockVcfData);

      expect(normalized.metadata.patientId).toBe('SAMPLE-001');
      expect(normalized.metadata.reportSource).toBe('VCF');
      expect(normalized.metadata.parsingConfidence).toBe(1.0);
    });

    it('should handle missing sample ID in VCF data', async () => {
      const mockVcfData = {
        variants: [],
      };

      const normalized = await normalizeVcfData(mockVcfData);

      expect(normalized.metadata.patientId).toBe('unknown');
      expect(normalized.metadata.reportSource).toBe('VCF');
    });
  });

  describe('PDF Normalizer', () => {
    it('should normalize PDF data with complete information', async () => {
      const mockPdfData = {
        patientId: 'PATIENT-001',
        variants: [
          {
            gene: 'EGFR',
            hgvs: 'p.L858R',
            effect: 'missense_variant',
          },
        ],
      };

      const normalized = await normalizePdfData(mockPdfData);

      expect(normalized.metadata.patientId).toBe('PATIENT-001');
      expect(normalized.metadata.reportSource).toBe('PDF');
      expect(normalized.metadata.parsingConfidence).toBeLessThanOrEqual(1.0);
    });

    it('should handle missing patient ID in PDF data', async () => {
      const mockPdfData = {
        variants: [],
      };

      const normalized = await normalizePdfData(mockPdfData);

      expect(normalized.metadata.patientId).toBe('unknown');
      expect(normalized.metadata.reportSource).toBe('PDF');
    });
  });

  describe('Annotation Normalizers', () => {
    it('should normalize OncoKB annotations', async () => {
      const mockOncoKbData = {
        id: 'KB-001',
        level: '1',
        description: 'Test evidence',
        tumorType: 'Melanoma',
        drugs: ['Drug A'],
        citations: ['Citation 1'],
      };
      const evidence = await normalizeOncoKbAnnotation(mockOncoKbData);
      
      expect(Array.isArray(evidence)).toBe(true);
      expect(evidence[0]).toMatchObject({
        evidenceId: 'KB-001',
        source: 'OncoKB',
        level: '1',
        description: 'Test evidence',
        tumorContext: 'Melanoma',
        drugAssociations: ['Drug A'],
        citations: ['Citation 1'],
      });
    });

    it('should normalize ClinVar annotations', async () => {
      const mockClinVarData = {
        id: 'CV-001',
        clinicalSignificance: 'Pathogenic',
        condition: 'Melanoma',
        lastEvaluated: '2025-01-01',
        citations: ['PMID:12345'],
      };
      const evidence = await normalizeClinVarAnnotation(mockClinVarData);
      
      expect(Array.isArray(evidence)).toBe(true);
      expect(evidence[0]).toMatchObject({
        evidenceId: 'CV-001',
        source: 'ClinVar',
        level: 'Pathogenic',
        description: 'Pathogenic variant associated with Melanoma',
        tumorContext: 'Melanoma',
        citations: ['PMID:12345'],
      });
    });
  });

  describe('Therapy Normalizer', () => {
    it('should combine evidence from multiple sources', async () => {
      const mockOncoKbEvidence = [
        {
          evidenceId: 'KB-001',
          source: 'OncoKB' as const,
          level: '1',
          description: 'Test evidence',
          tumorContext: 'Melanoma',
          drugAssociations: ['Drug A'],
          citations: ['Citation 1'],
          timestamp: new Date().toISOString(),
        },
      ];
      const mockClinVarEvidence = [
        {
          evidenceId: 'CV-001',
          source: 'ClinVar' as const,
          level: 'Pathogenic',
          description: 'Test evidence',
          tumorContext: 'Melanoma',
          drugAssociations: ['Drug B'],
          citations: ['PMID:12345'],
          timestamp: new Date().toISOString(),
        },
      ];

      const therapies = await normalizeTherapies(
        mockOncoKbEvidence,
        mockClinVarEvidence
      );

      expect(Array.isArray(therapies)).toBe(true);
      expect(therapies).toHaveLength(2);
      expect(therapies[0]).toMatchObject({
        drug: 'Drug A',
        level: '1',
        evidenceId: 'KB-001',
        tumorType: 'Melanoma',
      });
      expect(therapies[1]).toMatchObject({
        drug: 'Drug B',
        level: 'Pathogenic',
        evidenceId: 'CV-001',
        tumorType: 'Melanoma',
      });
    });

    it('should deduplicate therapies with same drug and tumor type', async () => {
      const mockOncoKbEvidence = [
        {
          evidenceId: 'KB-001',
          source: 'OncoKB' as const,
          level: '1',
          description: 'Test evidence 1',
          tumorContext: 'Melanoma',
          drugAssociations: ['Drug A'],
          citations: ['Citation 1'],
          timestamp: new Date().toISOString(),
        },
        {
          evidenceId: 'KB-002',
          source: 'OncoKB' as const,
          level: '2',
          description: 'Test evidence 2',
          tumorContext: 'Melanoma',
          drugAssociations: ['Drug A'],
          citations: ['Citation 2'],
          timestamp: new Date().toISOString(),
        },
      ];

      const therapies = await normalizeTherapies(mockOncoKbEvidence, []);

      expect(therapies).toHaveLength(1);
      expect(therapies[0]).toMatchObject({
        drug: 'Drug A',
        level: '1', // Should use the highest level
        evidenceId: 'KB-001',
        tumorType: 'Melanoma',
      });
    });
  });
});
