import { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";
import { extractPdfText } from "@/lib/documents";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";
import { recordAIRequest } from "@/lib/usage";
import type { DocumentAction } from "@/types/files";

const actionPrompts: Record<DocumentAction, string> = {
  summarize: "Summarize the document accurately, preserving its key points and caveats.",
  ask: "Answer the user's question using only the document, and say when the document does not contain the answer.",
  explain: "Explain the important ideas in the document in clear language.",
  mcqs: "Create five multiple-choice questions from the document, include four options, the answer, and a brief explanation.",
  translate: "Translate the document into the language specified by the user.",
};
const validActions = new Set<DocumentAction>(["summarize", "ask", "explain", "mcqs", "translate"]);

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    if (!services.bucket) throw new ApiError("File storage is not configured. Set FIREBASE_STORAGE_BUCKET.", 503);
    const body = await request.json() as { fileId?: unknown; action?: unknown; prompt?: unknown };
    if (typeof body.fileId !== "string" || typeof body.action !== "string" || !validActions.has(body.action as DocumentAction)) throw new ApiError("Choose a document and a supported action.", 400);
    const fileDocument = await services.db.collection("files").doc(body.fileId).get();
    if (!fileDocument.exists || fileDocument.data()?.userId !== userId) throw new ApiError("File not found.", 404);
    const storagePath = fileDocument.data()?.storagePath;
    if (typeof storagePath !== "string") throw new ApiError("The stored document record is incomplete.", 422);
    const [buffer] = await services.bucket.file(storagePath).download();
    const text = await extractPdfText(buffer);
    const additional = typeof body.prompt === "string" ? body.prompt.slice(0, 2000) : "";
    const result = await generateAIResponse([
      { role: "system", content: "Use only the supplied document as factual source material. Do not invent document contents." },
      { role: "user", content: `${actionPrompts[body.action as DocumentAction]}\n${additional}\n\nDocument text:\n${text}` },
    ]);
    await recordAIRequest(services.db, userId);
    const history = services.db.collection("history").doc();
    await history.set({ id: history.id, userId, type: "pdf", title: `${String(body.action)}: ${fileDocument.data()?.name || "PDF"}`, createdAt: new Date() });
    return Response.json({ result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}