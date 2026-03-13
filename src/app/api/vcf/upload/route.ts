import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { parseVcfToVariants } from '@/lib/vcf';
import { VariantSchema } from '@/lib/schemas';
import { generateCaseId } from '@/lib/utils/ids';
import { CaseService } from '@/lib/cases/service';
import { annotateVariants } from '@/lib/annotate/service';

// Define Node.js runtime
export const runtime = 'nodejs';

// Request body schema
const RequestSchema = z.object({
  vcf: z.string().min(1, 'VCF content is required'),
  patientName: z.string().optional(),
  patientId: z.string().optional(),
  tumorType: z.string().optional(),
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
    let patientName: string | undefined;
    let patientId: string | undefined;
    let tumorType: string | undefined;

    // Check content type to determine how to parse the request
    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await parseFormData(request);
      vcfContent = formData.vcf;
    } else {
      const body = await request.json();
      const validatedBody = RequestSchema.parse(body);
      vcfContent = validatedBody.vcf;
      patientName = validatedBody.patientName;
      patientId = validatedBody.patientId;
      tumorType = validatedBody.tumorType;
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
    
    // Generate case ID
    const caseId = generateCaseId();

    // Annotate variants with OncoKB, ClinVar, and DGIdb
    console.log('🔬 Annotating variants with external sources...');
    const { evidence, therapies, errors: annotationErrors } = await annotateVariants(validatedVariants);
    console.log(`Generated ${evidence.length} evidence items, ${therapies.length} therapies, ${annotationErrors.length} annotation errors`);

    // Enrich variants with annotation data (ClinVar significance, OncoKB level)
    const enrichedVariants = validatedVariants.map(v => {
      const gene = v.gene || '';
      const oncokbEvidence = evidence.find(e => e.source === 'OncoKB' && e.evidenceId.includes(gene));
      const clinvarEvidence = evidence.find(e => e.source === 'ClinVar' && e.evidenceId.includes(gene));
      return {
        ...v,
        oncokbLevel: oncokbEvidence?.level,
        clinvarSignificance: clinvarEvidence?.level,
      };
    });

    // Store case data
    const caseData = await CaseService.create({
      id: caseId,
      metadata: {
        patientId: patientId || patientName,
        tumorType,
        reportSource: 'VCF',
        parsingConfidence: 1.0,
        timestamp: new Date().toISOString(),
      },
      variants: enrichedVariants,
      evidence,
      therapies,
      annotationErrors: annotationErrors.length > 0 ? annotationErrors : undefined,
      qc: {
        source: 'VCF',
        metrics: {
          totalVariants: validatedVariants.length,
        },
        flags: [],
        confidence: 1.0,
      },
    });

    // Return case ID and variants
    return NextResponse.json({
      caseId,
      variants: validatedVariants,
    }, { status: 200 });
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
