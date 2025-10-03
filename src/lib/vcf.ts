import { Variant, VariantSchema } from './schemas';

/**
 * Parse VCF text content to array of Variant objects
 * @param vcfText - VCF file content as string
 * @returns Array of parsed variants
 */
export function parseVcfToVariants(vcfText: string): Variant[] {
  const lines = vcfText.split('\n');
  const variants: Variant[] = [];
  
  // Process each line
  for (const line of lines) {
    // Skip empty lines and header lines
    if (line.trim() === '' || line.startsWith('#')) {
      continue;
    }
    
    try {
      const fields = line.split('\t');
      
      // Ensure we have at least the basic fields
      if (fields.length < 5) {
        continue;
      }
      
      const [chrom, posStr, _id, ref, altField, _qual, _filter, info, ...rest] = fields;
      
      // Handle multi-allelic variants (comma-separated ALT field)
      const altAlleles = altField.split(',');
      
      // Create a variant for each alternative allele
      for (let i = 0; i < altAlleles.length; i++) {
        const alt = altAlleles[i];
        
        // Basic variant data
        const variant: Variant = {
          chrom,
          pos: parseInt(posStr, 10),
          ref,
          alt,
        };
        
        // Extract gene from INFO field if available
        if (info) {
          // Parse INFO field
          const infoFields = info.split(';');
          
          for (const field of infoFields) {
            // Look for GENE= or gene= field
            if (field.toUpperCase().startsWith('GENE=')) {
              variant.gene = field.split('=')[1];
            }
            
            // Look for AF= field for variant allele frequency
            // Note: For multi-allelic sites, this might be the combined AF or the AF of the first alt
            if (field.toUpperCase().startsWith('AF=')) {
              const afValue = parseFloat(field.split('=')[1]);
              if (!isNaN(afValue)) {
                variant.vaf = afValue;
              }
            }
          }
        }
        
        // Extract VAF from sample field if available (FORMAT field with AF)
        if (rest.length >= 2) {
          const format = rest[0];
          const sample = rest[1];
          
          if (format && sample) {
            const formatFields = format.split(':');
            const sampleValues = sample.split(':');
            
            // Find AF in FORMAT field
            const afIndex = formatFields.findIndex(f => f === 'AF');
            if (afIndex !== -1 && afIndex < sampleValues.length) {
              const afValue = parseFloat(sampleValues[afIndex]);
              if (!isNaN(afValue)) {
                variant.vaf = afValue;
              }
            }
            
            // If GT (genotype) field is present, try to use it to determine if this alt allele is present
            const gtIndex = formatFields.findIndex(f => f === 'GT');
            if (gtIndex !== -1 && gtIndex < sampleValues.length) {
              const gtValue = sampleValues[gtIndex];
              // For multi-allelic sites, GT values use indices (0=ref, 1=first alt, 2=second alt, etc.)
              // Check if the current alt index (i+1) is present in the GT field
              const altIdx = i + 1;
              if (!gtValue.includes(altIdx.toString())) {
                // Skip this alt allele if it's not present in the genotype
                continue;
              }
            }
          }
        }
        
        variants.push(variant);
      }
    } catch (error) {
      console.error('Error parsing VCF line:', error);
      // Continue with next line
    }
  }
  
  // Validate with Zod and throw error if empty
  if (variants.length === 0) {
    throw new Error('No valid variants found in VCF file');
  }
  
  return VariantSchema.array().parse(variants);
}
