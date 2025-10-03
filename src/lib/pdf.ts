/**
 * Extract text from a PDF buffer
 * 
 * NOTA: Esta es una implementación simulada que no extrae realmente texto de PDFs.
 * En un entorno de producción, se recomendaría usar una biblioteca como pdf-parse
 * o pdf.js, pero para evitar problemas de compatibilidad con ESM en Next.js,
 * usamos esta implementación simplificada para la demostración.
 * 
 * @param buffer - PDF file as Buffer
 * @returns Simulated extracted text
 */
export async function pdfToText(_buffer: Buffer): Promise<string> {
  // Simulamos un pequeño retraso para imitar el procesamiento
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Devolvemos un texto de ejemplo que Sonnet puede procesar
  return `INFORME DE SECUENCIACIÓN GENÓMICA
  Hospital Universitario
  Fecha: 03/10/2025
  Paciente: Juan Pérez
  ID: 12345678
  
  RESUMEN DE HALLAZGOS
  
  Se detectaron las siguientes variantes somáticas:
  
  1. EGFR c.2573T>G (p.Leu858Arg) - VAF: 35%
     Cromosoma 7, posición 55249071, cambio C>T
     Variante patogénica asociada a respuesta a inhibidores de tirosina quinasa
  
  2. TP53 c.818G>A (p.Arg273His) - VAF: 42%
     Cromosoma 17, posición 7675088, cambio C>T
     Variante patogénica asociada a mal pronóstico
  
  3. PIK3CA c.3140A>G (p.His1047Arg) - VAF: 28%
     Cromosoma 3, posición 179234297, cambio A>G
     Variante patogénica asociada a activación de la vía PI3K/AKT/mTOR
  
  4. FGFR3 c.1138G>A (p.Gly380Arg) - VAF: 31%
     Cromosoma 4, posición 1803568, cambio G>A
     Variante patogénica asociada a respuesta a inhibidores de FGFR
  
  5. PTEN c.697C>T (p.Arg233*) - VAF: 38%
     Cromosoma 10, posición 87864470, cambio A>T
     Variante patogénica asociada a pérdida de función de PTEN`;
}

/**
 * OCR fallback for scanned PDFs (stub)
 * @param buffer - PDF file as Buffer
 * @returns Extracted text
 */
export async function ocrToText(_buffer: Buffer): Promise<string> {
  throw new Error("OCR disabled");
}
