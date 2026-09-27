import { ApiError } from "@/lib/firebase-admin";

export async function extractPdfText(buffer: Buffer) {
  const endpoint = process.env.PDF_TEXT_EXTRACTION_URL;
  if (!endpoint) throw new ApiError("PDF text extraction is not configured. Add PDF_TEXT_EXTRACTION_URL before analyzing documents.", 503);
  const form = new FormData();
  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(buffer);
  form.append("file", new Blob([bytes.buffer as ArrayBuffer], { type: "application/pdf" }), "document.pdf");
  const headers = process.env.PDF_TEXT_EXTRACTION_API_KEY ? { authorization: `Bearer ${process.env.PDF_TEXT_EXTRACTION_API_KEY}` } : undefined;
  let response: Response;
  try {
    response = await fetch(endpoint, { method: "POST", headers, body: form, signal: AbortSignal.timeout(60_000) });
  } catch {
    throw new ApiError("The configured PDF extraction service could not be reached.", 502);
  }
  if (!response.ok) throw new ApiError(`PDF extraction failed (${response.status}).`, 502);
  const result = await response.json() as { text?: string };
  if (!result.text?.trim()) throw new ApiError("No readable text was found in this PDF.", 422);
  return result.text.slice(0, 60_000);
}