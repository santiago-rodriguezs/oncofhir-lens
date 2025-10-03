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
      
      const [chrom, posStr, _id, ref, alt, _qual, _filter, info, ...rest] = fields;
      
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
        }
      }
      
      variants.push(variant);
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
