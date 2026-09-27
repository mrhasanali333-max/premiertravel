import { randomUUID } from "node:crypto";
import { NextRequest } from "next/server";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";
import { recordUploadedFile, reserveUsage } from "@/lib/usage";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
const maxFileSize = 20 * 1024 * 1024;
const allowedTypes: Record<string, string> = {
  ".pdf": "application/pdf",
  ".txt": "text/plain",
  ".csv": "text/csv",
  ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
};

export async function POST(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    if (!services.bucket) throw new ApiError("File storage is not configured. Set FIREBASE_STORAGE_BUCKET.", 503);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) throw new ApiError("Select a PDF file to upload.", 400);
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const expectedType = allowedTypes[extension];
    if (!expectedType || file.type !== expectedType) throw new ApiError("Supported files: PDF, TXT, CSV, DOCX, PNG, JPEG and WebP.", 415);
    if (file.size <= 0 || file.size > maxFileSize) throw new ApiError("Files must be under 20 MB.", 413);
    const bytes = Buffer.from(await file.arrayBuffer());
    const signatures: Record<string, (value: Buffer) => boolean> = {
      ".pdf": (value) => value.subarray(0, 5).toString("ascii") === "%PDF-",
      ".docx": (value) => value.subarray(0, 2).toString("hex") === "504b",
      ".png": (value) => value.subarray(0, 8).toString("hex") === "89504e470d0a1a0a",
      ".jpg": (value) => value[0] === 0xff && value[1] === 0xd8,
      ".jpeg": (value) => value[0] === 0xff && value[1] === 0xd8,
      ".webp": (value) => value.subarray(0, 4).toString("ascii") === "RIFF" && value.subarray(8, 12).toString("ascii") === "WEBP",
      ".txt": (value) => !value.includes(0),
      ".csv": (value) => !value.includes(0),
    };
    if (!signatures[extension]?.(bytes)) throw new ApiError("The file content does not match its declared type.", 415);
    await reserveUsage(services.db, userId, "files");
    const id = randomUUID();
    const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").slice(0, 120) || `document${extension}`;
    const storagePath = `users/${userId}/files/${id}-${safeName}`;
    await services.bucket.file(storagePath).save(bytes, {
      metadata: { contentType: "application/pdf", metadata: { userId, originalName: file.name } },
      resumable: false,
    });
    const document = services.db.collection("files").doc(id);
    await document.set({ id, userId, name: file.name, size: file.size, mimeType: file.type, storagePath, createdAt: new Date() });
    await recordUploadedFile(services.db, userId);
    await createNotification(services.db, userId, "File uploaded", `${file.name} is ready for analysis.`, "/files");
    return Response.json({ file: { id, name: file.name, size: file.size, createdAt: new Date().toISOString() } }, { status: 201 });
  } catch (error) {
    return apiErrorResponse(error);
  }
}