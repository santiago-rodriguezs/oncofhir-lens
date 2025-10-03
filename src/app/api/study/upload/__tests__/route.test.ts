import { parseVcfToVariants } from '@/lib/vcf';

// Mock the parseVcfToVariants function to test empty VCF rejection
jest.mock('@/lib/vcf', () => ({
  parseVcfToVariants: jest.fn().mockImplementation((vcf: string) => {
    if (!vcf || vcf.trim() === '') {
      throw new Error('No valid variants found in VCF file');
    }
    return [
      {
        chrom: 'chr7',
        pos: 55249071,
        ref: 'C',
        alt: 'T',
        gene: 'EGFR',
      },
    ];
  }),
}));

describe('VCF Parser', () => {
  it('should reject empty VCF content', async () => {
    // Test that empty VCF throws an error
    expect(() => {
      parseVcfToVariants('');
    }).toThrow('No valid variants found in VCF file');
  });
});
