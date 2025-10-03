import { parseVcf } from './vcf';

describe('VCF Parser', () => {
  const sampleVcf = `##fileformat=VCFv4.2
##FILTER=<ID=PASS,Description="All filters passed">
##fileDate=20250915
##source=OncofhirDemo
##reference=GRCh38
##INFO=<ID=GENE,Number=1,Type=String,Description="Gene symbol">
##INFO=<ID=HGVS,Number=1,Type=String,Description="HGVS protein notation">
##INFO=<ID=CONSEQUENCE,Number=1,Type=String,Description="Variant consequence">
##FORMAT=<ID=GT,Number=1,Type=String,Description="Genotype">
##FORMAT=<ID=AD,Number=R,Type=Integer,Description="Allelic depths for the ref and alt alleles in the order listed">
##FORMAT=<ID=DP,Number=1,Type=Integer,Description="Approximate read depth">
##FORMAT=<ID=VAF,Number=1,Type=Float,Description="Variant allele frequency">
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	SAMPLE1
7	55259515	rs121434568	T	G	100	PASS	GENE=EGFR;HGVS=p.L858R;CONSEQUENCE=missense_variant	GT:AD:DP:VAF	0/1:65:100:0.35
17	7577120	rs28934576	G	A	95	PASS	GENE=TP53;HGVS=p.R273H;CONSEQUENCE=missense_variant	GT:AD:DP:VAF	0/1:42:100:0.42`;

  it('should parse VCF content correctly', async () => {
    const variants = await parseVcf(sampleVcf);
    
    expect(variants).toHaveLength(2);
    
    // Check first variant
    expect(variants[0].gene).toBe('EGFR');
    expect(variants[0].hgvs).toBe('p.L858R');
    expect(variants[0].chromosome).toBe('7');
    expect(variants[0].position).toBe(55259515);
    expect(variants[0].reference).toBe('T');
    expect(variants[0].alternate).toBe('G');
    expect(variants[0].consequence).toBe('missense_variant');
    expect(variants[0].vaf).toBeCloseTo(0.35);
    expect(variants[0].quality).toBe(100);
    expect(variants[0].filter).toBeUndefined(); // PASS filter is removed
    
    // Check second variant
    expect(variants[1].gene).toBe('TP53');
    expect(variants[1].hgvs).toBe('p.R273H');
    expect(variants[1].chromosome).toBe('17');
    expect(variants[1].position).toBe(7577120);
    expect(variants[1].reference).toBe('G');
    expect(variants[1].alternate).toBe('A');
    expect(variants[1].consequence).toBe('missense_variant');
    expect(variants[1].vaf).toBeCloseTo(0.42);
    expect(variants[1].quality).toBe(95);
    expect(variants[1].filter).toBeUndefined(); // PASS filter is removed
  });

  it('should handle empty or invalid VCF content', async () => {
    const emptyVariants = await parseVcf('');
    expect(emptyVariants).toHaveLength(0);
    
    const headerOnlyVariants = await parseVcf('#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO');
    expect(headerOnlyVariants).toHaveLength(0);
  });

  it('should extract VAF correctly', async () => {
    const vcfWithVaf = `##fileformat=VCFv4.2
#CHROM	POS	ID	REF	ALT	QUAL	FILTER	INFO	FORMAT	SAMPLE1
1	100	.	A	T	60	PASS	GENE=TEST	GT:AD:DP:VAF	0/1:30:100:0.3`;

    const variants = await parseVcf(vcfWithVaf);
    expect(variants).toHaveLength(1);
    expect(variants[0].vaf).toBeCloseTo(0.3);
  });
});
