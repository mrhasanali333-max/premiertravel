import { ApiError } from "@/lib/firebase-admin";

export async function extractDocumentText(buffer: Buffer, mimeType: string, fileName: string) {
  if (mimeType === "text/plain" || mimeType === "text/csv") {
    const text = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
    if (!text.trim()) throw new ApiError("This file does not contain readable text.", 422);
    return text.slice(0, 60_000);
  }
  const endpoint = mimeType === "application/pdf"
    ? process.env.PDF_TEXT_EXTRACTION_URL || process.env.DOCUMENT_EXTRACTION_URL
    : process.env.DOCUMENT_EXTRACTION_URL;
  if (!endpoint) {
    const variable = mimeType === "application/pdf" ? "PDF_TEXT_EXTRACTION_URL" : "DOCUMENT_EXTRACTION_URL";
    throw new ApiError(`Document extraction is not configured. Set ${variable} before analyzing this file type.`, 503);
  }
  const form = new FormData();
  const bytes = new Uint8Array(buffer.byteLength);
  bytes.set(buffer);
  form.append("file", new Blob([bytes.buffer as ArrayBuffer], { type: mimeType }), fileName);
  form.append("mimeType", mimeType);
  const apiKey = mimeType === "application/pdf" ? process.env.PDF_TEXT_EXTRACTION_API_KEY || process.env.DOCUMENT_EXTRACTION_API_KEY : process.env.DOCUMENT_EXTRACTION_API_KEY;
  const headers = apiKey ? { authorization: `Bearer ${apiKey}` } : undefined;
  let response: Response;
  try {
    response = await fetch(endpoint, { method: "POST", headers, body: form, signal: AbortSignal.timeout(60_000) });
  } catch {
    throw new ApiError("The configured PDF extraction service could not be reached.", 502);
  }
  if (!response.ok) throw new ApiError(`Document extraction failed (${response.status}).`, 502);
  const result = await response.json() as { text?: string };
  if (!result.text?.trim()) throw new ApiError("No readable text was found in this PDF.", 422);
  return result.text.slice(0, 60_000);
}

export function extractPdfText(buffer: Buffer) {
  return extractDocumentText(buffer, "application/pdf", "document.pdf");
}