import { NextRequest, NextResponse } from "next/server";
import { pdfToText } from "@/lib/pdf";
import { sonnetJson } from "@/lib/sonnet";
import { VariantArraySchema } from "@/lib/schemas";

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
    
    // Validate file
    if (!file || file.type !== "application/pdf") {
      return NextResponse.json(
        { error: "Se requiere un archivo PDF válido" },
        { status: 400 }
      );
    }
    
    // Convert file to buffer
    const buffer = Buffer.from(await file.arrayBuffer());
    
    // Extract text from PDF
    const text = await pdfToText(buffer);
    
    // Validate extracted text
    if (!text || text.trim().length < 100) {
      return NextResponse.json(
        { error: "No se pudo extraer texto útil del PDF" },
        { status: 422 }
      );
    }
    
    // System prompt for Sonnet
    const system = `Eres un curator genómico. A partir de texto de un informe, extrae SOLO JSON válido Variant[] con el esquema exacto:
{ chrom: string; pos: number; ref: string; alt: string; gene?: string; vaf?: number }.

Normaliza cromosomas como "1..22,X,Y".

pos entero 1-based.

Si hay c.HGVS/p.HGVS, úsalo para inferir ref/alt cuando sea trivial; si no, deja ref/alt según lo explícito.

vaf en 0..1 si está el porcentaje (convierte 23% → 0.23).

Si no puedes extraer nada confiable, devuelve [].
Solo JSON válido, sin markdown, sin comentarios.`;
    
    // User payload
    const user = {
      reportText: text,
      hints: {}
    };
    
    // Extract variants using Sonnet
    const variants = await sonnetJson(
      "claude-3-7-sonnet-2025-04-21",
      system,
      JSON.stringify(user),
      "VariantArray",
      VariantArraySchema
    );
    
    // Log extracted variants
    console.log(`Extracted ${variants.length} variants from PDF`);
    
    // Return variants
    return NextResponse.json({ variants }, { status: 200 });
  } catch (error) {
    console.error("Error processing PDF:", error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido al procesar el PDF" },
      { status: 500 }
    );
  }
}
