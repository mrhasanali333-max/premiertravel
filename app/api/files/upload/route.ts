import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";
import { recordUploadedFile } from "@/lib/usage";

export const runtime = "nodejs";
const maxFileSize = 20 * 1024 * 1024;

export async function POST(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    if (!services.bucket) throw new ApiError("File storage is not configured. Set FIREBASE_STORAGE_BUCKET.", 503);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("Select a PDF file to upload.", 400);
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) throw new ApiError("Only PDF files are supported.", 415);
    if (file.size <= 0 || file.size > maxFileSize) throw new ApiError("PDF files must be under 20 MB.", 413);
    const id = randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || "document.pdf";
    const storagePath = `users/${userId}/${id}-${safeName}`;
    await services.bucket.file(storagePath).save(Buffer.from(await file.arrayBuffer()), {
      metadata: { contentType: "application/pdf", metadata: { userId, originalName: file.name } },
      resumable: false,
    });
    const document = services.db.collection("files").doc(id);
    await document.set({ id, userId, name: file.name, size: file.size, storagePath, createdAt: new Date() });
    await recordUploadedFile(services.db, userId);
    return Response.json({ file: { id, name: file.name, size: file.size, createdAt: new Date().toISOString() } }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}