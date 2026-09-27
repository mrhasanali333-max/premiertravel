import { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";
import { extractDocumentText } from "@/lib/documents";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";
import { reserveUsage } from "@/lib/usage";
import type { DocumentAction } from "@/types/files";

const actionPrompts: Record<DocumentAction, string> = {
  summarize: "Summarize the document accurately, preserving its key points and caveats.",
  ask: "Answer the user's question using only the document, and say when the document does not contain the answer.",
  explain: "Explain the important ideas in the document in clear language.",
  mcqs: "Create five multiple-choice questions from the document, include four options, the answer, and a brief explanation.",
  translate: "Translate the document into the language specified by the user.",
  quiz: "Generate a short quiz from the source document with an answer key and explanations.",
  "key-points": "Extract the key points and important caveats from this document.",
  notes: "Turn this document into structured study notes with headings and concise bullet points.",
  rewrite: "Rewrite the supplied text according to the user's instruction while preserving its meaning.",
  analyze: "Analyze this document and report its purpose, structure, key claims and limitations.",
  "csv-patterns": "Analyze the CSV data, summarize columns, identify patterns and caveats. Do not claim statistical certainty beyond the supplied rows.",
};
const validActions = new Set<DocumentAction>(["summarize", "ask", "explain", "mcqs", "quiz", "key-points", "notes", "translate", "rewrite", "analyze", "csv-patterns"]);

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    if (!services.bucket) throw new ApiError("File storage is not configured. Set FIREBASE_STORAGE_BUCKET.", 503);
    const body = await request.json() as { fileId?: unknown; action?: unknown; prompt?: unknown };
    if (typeof body.fileId !== "string" || typeof body.action !== "string" || !validActions.has(body.action as DocumentAction)) throw new ApiError("Choose a document and a supported action.", 400);
    if ((body.action === "ask" || body.action === "translate" || body.action === "rewrite") && (typeof body.prompt !== "string" || !body.prompt.trim())) throw new ApiError("Enter a question, target language or rewrite instruction.", 400);
    const fileDocument = await services.db.collection("files").doc(body.fileId).get();
    if (!fileDocument.exists || fileDocument.data()?.userId !== userId) throw new ApiError("File not found.", 404);
    const storagePath = fileDocument.data()?.storagePath;
    if (typeof storagePath !== "string") throw new ApiError("The stored document record is incomplete.", 422);
    const [buffer] = await services.bucket.file(storagePath).download();
    const fileData = fileDocument.data()!;
    const mimeType = String(fileData.mimeType || "application/pdf");
    await reserveUsage(services.db, userId, "files");
    const text = await extractDocumentText(buffer, mimeType, String(fileData.name || "document"));
    const additional = typeof body.prompt === "string" ? body.prompt.slice(0, 1500) : "";
    const documentText = text.slice(0, 16_000);
    const truncationNote = text.length > documentText.length ? "\n\nNote: Only the first 16,000 characters were processed; the source document is longer." : "";
    const result = await generateAIResponse([
      { role: "system", content: "Use only the supplied document as factual source material. Do not invent document contents." },
      { role: "user", content: `${actionPrompts[body.action as DocumentAction]}\n${additional}\n\nSource file: ${String(fileData.name || "document")} (${mimeType})\n\nDocument text:\n${documentText}${truncationNote}` },
    ]);
    const history = services.db.collection("history").doc();
    await history.set({ id: history.id, userId, type: "pdf", title: `${String(body.action)}: ${fileData.name || "File"}`, fileId: body.fileId, content: result, createdAt: new Date() });
    return Response.json({ result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}