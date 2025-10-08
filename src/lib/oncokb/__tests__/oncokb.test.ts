import { annotateByProteinChange, annotateCNA, annotateSV } from '../client';

// Mock fetch
global.fetch = jest.fn();

describe('OncoKB Client', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.ONCOKB_AUTH_TOKEN = 'test-token';
    process.env.ONCOKB_BASE_URL = 'https://www.oncokb.org';
  });

  test('annotateByProteinChange handles sensitive mutation with level 1/2', async () => {
    // Mock response
    const mockResponse = {
      oncogenic: 'Oncogenic',
      hotspot: true,
      geneSummary: 'BRAF is a gene...',
      variantSummary: 'V600E is a hotspot...',
      highestSensitiveLevel: '1',
      treatments: [
        {
          drugs: [{ drugName: 'Vemurafenib' }],
          level: '1',
          levelAssociatedCancerType: { name: 'Melanoma' },
          pmids: ['12345678']
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockResponse]
    });

    const result = await annotateByProteinChange([{
      hugoSymbol: 'BRAF',
      alteration: 'V600E',
      tumorType: 'MEL',
      referenceGenome: 'GRCh37'
    }]);

    expect(result).toEqual([mockResponse]);
    expect(global.fetch).toHaveBeenCalledTimes(1);
    expect(global.fetch).toHaveBeenCalledWith(
      'https://www.oncokb.org/api/v1/annotate/mutations/byProteinChange',
      expect.objectContaining({
        method: 'POST',
        headers: {
          'Authorization': 'Bearer test-token',
          'Content-Type': 'application/json',
        }
      })
    );
  });

  test('annotateCNA handles CNA without therapy', async () => {
    // Mock response
    const mockResponse = {
      oncogenic: 'Likely Oncogenic',
      hotspot: false,
      geneSummary: 'MYC is a gene...',
      highestSensitiveLevel: null,
      treatments: []
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockResponse]
    });

    const result = await annotateCNA([{
      hugoSymbol: 'MYC',
      copyNameAlterationType: 'Amplification',
      tumorType: 'LUAD',
      referenceGenome: 'GRCh37'
    }]);

    expect(result).toEqual([mockResponse]);
  });

  test('annotateSV handles functional fusion', async () => {
    // Mock response
    const mockResponse = {
      oncogenic: 'Oncogenic',
      hotspot: false,
      geneSummary: 'ALK is a gene...',
      highestSensitiveLevel: '1',
      treatments: [
        {
          drugs: [{ drugName: 'Crizotinib' }],
          level: '1',
          levelAssociatedCancerType: { name: 'Lung Adenocarcinoma' },
          pmids: ['23456789']
        }
      ]
    };

    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [mockResponse]
    });

    const result = await annotateSV([{
      hugoSymbolA: 'EML4',
      hugoSymbolB: 'ALK',
      structuralVariantType: 'FUSION',
      isFunctionalFusion: true,
      tumorType: 'LUAD',
      referenceGenome: 'GRCh37'
    }]);

    expect(result).toEqual([mockResponse]);
  });

  test('handles 429 rate limit with retry', async () => {
    // First call returns 429
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      status: 429,
      headers: new Map([['Retry-After', '1']]),
    });
    
    // Second call succeeds
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: async () => [{ oncogenic: 'Oncogenic' }]
    });

    const result = await annotateByProteinChange([{
      hugoSymbol: 'EGFR',
      alteration: 'L858R',
      tumorType: 'LUAD',
      referenceGenome: 'GRCh37'
    }]);

    expect(result).toEqual([{ oncogenic: 'Oncogenic' }]);
    expect(global.fetch).toHaveBeenCalledTimes(2);
  });
});
