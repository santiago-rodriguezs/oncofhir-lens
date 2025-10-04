import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseVcfToVariants } from '@/lib/vcf';
import { VariantSchema } from '@/lib/schemas';

// Define Node.js runtime
export const runtime = 'nodejs';

// Request body schema
const RequestSchema = z.object({
  vcf: z.string().min(1, 'VCF content is required'),
});

// For multipart form data with file upload
async function parseFormData(request: NextRequest) {
  const formData = await request.formData();
  const file = formData.get('file') as File | null;
  
  if (!file) {
    throw new Error('No file uploaded');
  }
  
  const vcfText = await file.text();
  if (!vcfText || vcfText.trim() === '') {
    throw new Error('VCF file is empty');
  }
  
  return { vcf: vcfText };
}

/**
 * POST handler for VCF upload
 */
export async function POST(request: NextRequest) {
  try {
    let vcfContent: string;
    
    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type') || '';
    
    if (contentType.includes('multipart/form-data')) {
      // Handle file upload
      const formData = await parseFormData(request);
      vcfContent = formData.vcf;
    } else {
      // Handle JSON body
      const body = await request.json();
      const validatedBody = RequestSchema.parse(body);
      vcfContent = validatedBody.vcf;
    }
    
    console.log(`📄 Processing VCF content (${vcfContent.length} characters)`);
    
    // Parse VCF to variants
    const variants = parseVcfToVariants(vcfContent);
    
    // Validate variants
    const validatedVariants = z.array(VariantSchema).parse(variants);
    
    console.log(`✅ Extracted ${validatedVariants.length} variants from VCF`);
    if (validatedVariants.length > 0) {
      console.log(`📊 First variant: ${JSON.stringify(validatedVariants[0], null, 2)}`);
    }
    
    // Return variants
    return NextResponse.json({ variants: validatedVariants }, { status: 200 });
  } catch (error) {
    console.error('❌ Error processing VCF:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request format', details: error.errors },
        { status: 400 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
