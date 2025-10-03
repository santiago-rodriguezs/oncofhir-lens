import { Variant } from '@/types/fhir';
import { v4 as uuidv4 } from 'uuid';

// Interface for VCF line data
interface VcfLine {
  chrom: string;
  pos: number;
  id: string;
  ref: string;
  alt: string;
  qual: number;
  filter: string;
  info: Record<string, string>;
  format?: string;
  samples?: Record<string, Record<string, string>>;
}

/**
 * Parse a VCF file content and extract variants
 * @param content - The content of the VCF file as a string
 * @returns Array of parsed variants
 */
export async function parseVcf(content: string): Promise<Variant[]> {
  const lines = content.split('\n');
  const variants: Variant[] = [];
  let headerLines: string[] = [];
  let formatColumns: string[] = [];
  
  // First pass: collect header lines and identify format columns
  for (const line of lines) {
    if (line.startsWith('#')) {
      headerLines.push(line);
      if (line.startsWith('#CHROM')) {
        formatColumns = line.split('\t');
      }
    }
  }
  
  // Extract sample names from the header
  const sampleNames = formatColumns.slice(9);
  
  // Second pass: parse variant lines
  for (const line of lines) {
    if (line.trim() === '' || line.startsWith('#')) {
      continue;
    }
    
    try {
      const parsedLine = parseVcfLine(line, sampleNames);
      const variant = convertToVariant(parsedLine);
      variants.push(variant);
    } catch (error) {
      console.error('Error parsing VCF line:', error);
      // Continue with next line
    }
  }
  
  return variants;
}

/**
 * Parse a single VCF line into structured data
 * @param line - A single line from a VCF file
 * @param sampleNames - Array of sample names from the VCF header
 * @returns Structured VCF line data
 */
function parseVcfLine(line: string, sampleNames: string[]): VcfLine {
  const fields = line.split('\t');
  
  if (fields.length < 8) {
    throw new Error('Invalid VCF line: insufficient columns');
  }
  
  // Parse the INFO field into a key-value object
  const infoField = fields[7];
  const info: Record<string, string> = {};
  
  infoField.split(';').forEach(item => {
    if (item.includes('=')) {
      const [key, value] = item.split('=');
      info[key] = value;
    } else {
      info[item] = 'true';
    }
  });
  
  // Parse sample data if available
  const samples: Record<string, Record<string, string>> = {};
  
  if (fields.length > 8) {
    const format = fields[8];
    const formatKeys = format.split(':');
    
    for (let i = 0; i < sampleNames.length; i++) {
      const sampleIndex = i + 9;
      if (sampleIndex < fields.length) {
        const sampleValues = fields[sampleIndex].split(':');
        const sampleData: Record<string, string> = {};
        
        for (let j = 0; j < formatKeys.length; j++) {
          if (j < sampleValues.length) {
            sampleData[formatKeys[j]] = sampleValues[j];
          }
        }
        
        samples[sampleNames[i]] = sampleData;
      }
    }
  }
  
  return {
    chrom: fields[0],
    pos: parseInt(fields[1]),
    id: fields[2],
    ref: fields[3],
    alt: fields[4],
    qual: parseFloat(fields[5]),
    filter: fields[6],
    info,
    format: fields.length > 8 ? fields[8] : undefined,
    samples: Object.keys(samples).length > 0 ? samples : undefined
  };
}

/**
 * Convert a parsed VCF line to our application's Variant type
 * @param vcfLine - Parsed VCF line data
 * @returns Variant object
 */
function convertToVariant(vcfLine: VcfLine): Variant {
  // Extract gene from INFO field
  // Different VCF formats store gene information differently
  let gene = 'Unknown';
  
  // Try common gene annotation fields
  if (vcfLine.info.GENE) {
    gene = vcfLine.info.GENE;
  } else if (vcfLine.info.ANN) {
    // Extract from Snpeff ANN field
    const annParts = vcfLine.info.ANN.split('|');
    if (annParts.length > 3) {
      gene = annParts[3];
    }
  } else if (vcfLine.info.CSQ) {
    // Extract from VEP CSQ field
    const csqParts = vcfLine.info.CSQ.split('|');
    if (csqParts.length > 3) {
      gene = csqParts[3];
    }
  }
  
  // Extract HGVS notation
  let hgvs = 'Unknown';
  if (vcfLine.info.HGVS) {
    hgvs = vcfLine.info.HGVS;
  } else if (vcfLine.info.HGVSC) {
    hgvs = vcfLine.info.HGVSC;
  } else if (vcfLine.info.ANN) {
    // Try to extract from Snpeff ANN field
    const annParts = vcfLine.info.ANN.split('|');
    if (annParts.length > 9) {
      hgvs = annParts[9]; // HGVS.c notation in SnpEff
    }
  }
  
  // Extract consequence/effect
  let consequence = 'Unknown';
  if (vcfLine.info.EFFECT) {
    consequence = vcfLine.info.EFFECT;
  } else if (vcfLine.info.CONSEQUENCE) {
    consequence = vcfLine.info.CONSEQUENCE;
  } else if (vcfLine.info.ANN) {
    // Extract from Snpeff ANN field
    const annParts = vcfLine.info.ANN.split('|');
    if (annParts.length > 1) {
      consequence = annParts[1];
    }
  } else if (vcfLine.info.CSQ) {
    // Extract from VEP CSQ field
    const csqParts = vcfLine.info.CSQ.split('|');
    if (csqParts.length > 1) {
      consequence = csqParts[1];
    }
  }
  
  // Calculate VAF (Variant Allele Frequency) if AD (Allele Depth) is available
  let vaf: number | undefined = undefined;
  
  if (vcfLine.samples && Object.keys(vcfLine.samples).length > 0) {
    const firstSample = vcfLine.samples[Object.keys(vcfLine.samples)[0]];
    
    if (firstSample.AD) {
      // AD is typically formatted as "ref,alt"
      const depths = firstSample.AD.split(',').map(Number);
      if (depths.length >= 2) {
        const altDepth = depths[1];
        const totalDepth = depths.reduce((sum, depth) => sum + depth, 0);
        if (totalDepth > 0) {
          vaf = altDepth / totalDepth;
        }
      }
    }
  }
  
  // Create the variant object
  return {
    id: uuidv4(),
    gene,
    hgvs,
    chromosome: vcfLine.chrom,
    position: vcfLine.pos,
    reference: vcfLine.ref,
    alternate: vcfLine.alt,
    consequence,
    vaf,
    quality: vcfLine.qual,
    filter: vcfLine.filter,
  };
}
