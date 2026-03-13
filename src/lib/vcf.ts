import { VariantInput, VariantSchema } from './schemas';

/**
 * Parse VCF text content to array of Variant objects
 * @param vcfText - VCF file content as string
 * @returns Array of parsed variants
 */
export function parseVcfToVariants(vcfText: string): VariantInput[] {
  const lines = vcfText.split('\n');
  const variants: VariantInput[] = [];
  const rawVariants: VariantInput[] = [];
  
  console.log(`Processing VCF with ${lines.length} lines`);
  
  // Process each line
  for (const line of lines) {
    // Skip empty lines and header lines
    if (line.trim() === '' || line.startsWith('#')) {
      continue;
    }
    
    try {
      // Split by tab or multiple spaces if tabs aren't present
      const fields = line.includes('\t') ? line.split('\t') : line.split(/\s+/);
      
      console.log(`Processing line with ${fields.length} fields:`, fields);
      
      // Ensure we have at least the basic fields
      if (fields.length < 5) {
        console.warn('Skipping line with insufficient fields:', line);
        continue;
      }
      
      const [chrom, posStr, _id, ref, altField, ...restFields] = fields;
      
      // Extract remaining fields if available
      const _qual = restFields.length > 0 ? restFields[0] : '.';
      const _filter = restFields.length > 1 ? restFields[1] : '.';
      const info = restFields.length > 2 ? restFields[2] : '';
      const rest = restFields.length > 3 ? restFields.slice(3) : [];
      
      console.log(`Parsed fields - CHROM: ${chrom}, POS: ${posStr}, REF: ${ref}, ALT: ${altField}, INFO: ${info}`);
      
      // Handle multi-allelic variants (comma-separated ALT field)
      const altAlleles = altField.split(',');
      console.log(`Found ${altAlleles.length} alternative alleles:`, altAlleles);
      
      // Create a variant for each alternative allele
      for (let i = 0; i < altAlleles.length; i++) {
        const alt = altAlleles[i];
        
        // Basic variant data
        const variant: VariantInput = {
          chrom,
          pos: parseInt(posStr, 10),
          ref,
          alt,
        };
        
        // Keep track of raw variants before validation
        rawVariants.push({...variant});
        
        // Extract fields from INFO
        if (info) {
          const infoFields = info.split(';');
          const infoMap: Record<string, string> = {};

          for (const field of infoFields) {
            if (field.includes('=')) {
              const [key, value] = field.split('=');
              infoMap[key.toUpperCase()] = value;
            }
          }

          // Gene
          if (infoMap.GENE) variant.gene = infoMap.GENE;

          // HGVS from PROTEIN, HGVS, or HGVSC
          if (infoMap.PROTEIN) variant.hgvs_p = infoMap.PROTEIN;
          if (infoMap.HGVS) variant.hgvs = infoMap.HGVS;
          if (infoMap.HGVSC) variant.hgvs_c = infoMap.HGVSC;

          // Effect from ONCOGENIC or EFFECT
          if (infoMap.ONCOGENIC) variant.effect = infoMap.ONCOGENIC.replace(/_/g, ' ');
          else if (infoMap.EFFECT) variant.effect = infoMap.EFFECT;

          // Depth from DP
          if (infoMap.DP) {
            const d = parseInt(infoMap.DP);
            if (!isNaN(d)) variant.depth = d;
          }

          // VAF from VAF or AF
          const vafStr = infoMap.VAF || infoMap.AF;
          if (vafStr) {
            const v = parseFloat(vafStr);
            if (!isNaN(v)) variant.vaf = v;
          }
        }
        
        // Extract VAF from sample field if available (FORMAT field with AF)
        if (rest.length >= 2) {
          const format = rest[0];
          const sample = rest[1];
          
          if (format && sample) {
            const formatFields = format.split(':');
            const sampleValues = sample.split(':');
            
            console.log(`FORMAT fields: ${formatFields}, SAMPLE values: ${sampleValues}`);
            
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
              console.log(`Found GT value: ${gtValue} for alt index ${i+1}`);
              
              // For now, include all variants regardless of GT value
              // We'll just log the GT value for debugging
            }
          }
        }
        
        // Set hgvs from hgvs_p or hgvs_c for display
        if (!variant.hgvs) {
          variant.hgvs = variant.hgvs_p || variant.hgvs_c;
        }

        // Add variant to the list
        variants.push(variant);
      }
    } catch (error) {
      console.error('Error parsing VCF line:', error);
      // Continue with next line
    }
  }
  
  console.log(`Found ${variants.length} variants before validation`);
  
  // If we have raw variants but validation fails, use them anyway
  if (variants.length === 0 && rawVariants.length > 0) {
    console.warn('No variants passed initial processing, but we have raw variants. Using raw variants.');
    for (const rawVariant of rawVariants) {
      // Ensure we have the minimum required fields
      if (rawVariant.chrom && rawVariant.pos && rawVariant.ref && rawVariant.alt) {
        variants.push(rawVariant);
      }
    }
  }
  
  // Validate with Zod and throw error if empty
  if (variants.length === 0) {
    throw new Error('No valid variants found in VCF file');
  }
  
  try {
    // Try to validate with Zod
    return VariantSchema.array().parse(variants);
  } catch (error) {
    console.error('Zod validation error:', error);
    
    // If Zod validation fails but we have variants, return them anyway
    if (variants.length > 0) {
      console.warn('Returning unvalidated variants as fallback');
      return variants as VariantInput[];
    }
    
    // If we have no variants, throw the original error
    throw error;
  }
}
