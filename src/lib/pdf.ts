const pdfParse = require('pdf-parse');

/**
 * Extract text from a PDF buffer
 * @param buffer - PDF file as Buffer
 * @returns Extracted text with basic normalization
 */
export async function pdfToText(buffer: Buffer): Promise<string> {
  const data = await pdfParse(buffer);
  return (data.text || "")
    .replace(/\r/g, "\n")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

/**
 * OCR fallback for scanned PDFs (stub)
 * @param buffer - PDF file as Buffer
 * @returns Extracted text
 */
export async function ocrToText(_buffer: Buffer): Promise<string> {
  throw new Error("OCR disabled");
}
