import { NextRequest, NextResponse } from "next/server";
import { getClaudeModel } from '@/lib/model';
import { pdfToText } from "@/lib/pdf";
import { sonnetJson } from "@/lib/sonnet";
import { VariantArraySchema } from "@/lib/schemas";
import { generateCaseId } from '@/lib/utils/ids';
import { CaseService } from '@/lib/cases/service';
import { annotateVariantsFast } from '@/lib/annotate/service';

// Define Node.js runtime
export const runtime = "nodejs";

/**
 * POST handler for PDF upload
 */
export async function POST(request: NextRequest) {
  try {
    // Parse form data
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const patientName = formData.get("patientName") as string | null;
    const patientId = formData.get("patientId") as string | null;
    const tumorType = formData.get("tumorType") as string | null;
    
    console.log("📁 File received:", file?.name, file?.type);
    
    // Validate file
    if (!file || file.type !== "application/pdf") {
      console.error("❌ Invalid file type:", file?.type);
      return NextResponse.json(
        { error: "Se requiere un archivo PDF válido" },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    console.log("🔄 Converting file to buffer...");
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract text from PDF
    console.log("📄 Extracting text from PDF...");
    const text = await pdfToText(buffer);
    console.log(`✅ Extracted ${text.length} characters`);
    
    // Validate extracted text
    if (!text || text.trim().length < 100) {
      console.error("❌ Insufficient text extracted:", text.length);
      return NextResponse.json(
        { error: "No se pudo extraer texto útil del PDF" },
        { status: 422 }
      );
    }
    
    console.log("📝 First 200 chars of extracted text:", text.substring(0, 200));
    
    // System prompt for Sonnet
    const system = "Eres un genetista clínico especializado en interpretación de informes de secuenciación.\nA partir del texto plano de un estudio genómico, extrae SOLO JSON válido (sin markdown ni comentarios) según el siguiente esquema:\n\nVariant[] = [{\n  \"gene\": string,\n  \"chrom\"?: string,\n  \"pos\"?: number,\n  \"ref\"?: string,\n  \"alt\"?: string,\n  \"hgvs_c\"?: string,\n  \"hgvs_p\"?: string,\n  \"vaf\"?: number\n}]\n\n- Usa 'vaf' entre 0 y 1 si aparece porcentaje (ej: 22% → 0.22)\n- Normaliza cromosomas (1..22,X,Y)\n- Si el texto es ambiguo, deja campos vacíos\n- Devuelve SOLO JSON, sin texto adicional";
    
    // User payload
    const user = {
      reportText: text
    };
    
    console.log("🧬 Calling Sonnet 4.6 for variant extraction...");
    
    // Extract variants using Sonnet 4.6
    const variants = await sonnetJson(
      getClaudeModel(),
      system,
      JSON.stringify(user),
      "VariantArray",
      VariantArraySchema
    );
    
    // Log extracted variants
    console.log(`✅ Extracted ${variants.length} variants from PDF`);
    if (variants.length > 0) {
      console.log("📊 First variant:", JSON.stringify(variants[0], null, 2));
    }
    
    // Generate case ID
    const caseId = generateCaseId();

    // Annotate variants with OncoKB, ClinVar, and DGIdb
    console.log('🔬 Annotating variants with external sources...');
    const { variants: annotatedVariants, evidence, therapies, errors: annotationErrors } = await annotateVariantsFast(variants);
    console.log(`Generated ${evidence.length} evidence items, ${therapies.length} therapies, ${annotationErrors.length} annotation errors`);

    // Store case data
    const caseData = await CaseService.create({
      id: caseId,
      metadata: {
        patientId: patientId || undefined,
        patientName: patientName || undefined,
        tumorType: tumorType || undefined,
        reportSource: 'PDF',
        parsingConfidence: 0.95,
        timestamp: new Date().toISOString(),
      },
      variants: annotatedVariants,
      evidence,
      therapies,
      annotationErrors: annotationErrors.length > 0 ? annotationErrors : undefined,
      qc: {
        source: 'PDF',
        metrics: {
          totalVariants: variants.length,
          textLength: text.length,
        },
        flags: [],
        confidence: 0.95,
      },
      extractedText: [text], // Convertimos el texto en un array para mantener consistencia
    });

    // Return case ID and variants
    return NextResponse.json({
      caseId,
      variants,
    }, { status: 200 });
  } catch (error) {
    console.error("❌ Error processing PDF:", error);
    console.error("Stack trace:", error instanceof Error ? error.stack : "No stack trace");
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido al procesar el PDF" },
      { status: 500 }
    );
  }
}