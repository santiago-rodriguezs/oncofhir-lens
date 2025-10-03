import { parseVcfToVariants } from './src/lib/vcf';

// VCF content from the user
const vcfContent = `##PEDIGREE=<Derived=Patient_01_Somatic,Original=Patient_01_Germline>
#CHROM  POS ID  REF ALT QUAL    FILTER  INFO        FORMAT  Patient_01_Germline Patient_01_Somatic
1   69091   .   A   C,G .       PASS    AF=0.1122   GT      1/0                 2/1
1   69849   .   G   A,C .       PASS    AF=0.1122   GT      1/0                 2/1
1   69511   .   A   C,G .       PASS    AF=0.3580   GT      1/1                 2/2`;

// Try to parse the VCF
try {
  console.log('Attempting to parse VCF...');
  const variants = parseVcfToVariants(vcfContent);
  console.log('Successfully parsed variants:');
  console.log(JSON.stringify(variants, null, 2));
  console.log(`Total variants found: ${variants.length}`);
} catch (error) {
  console.error('Error parsing VCF:', error);
}
