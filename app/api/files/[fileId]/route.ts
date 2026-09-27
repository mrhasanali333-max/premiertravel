import { NextRequest } from "next/server";
import { FieldValue } from "firebase-admin/firestore";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function PATCH(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  try {
    const { userId, services } = await requireUser(request);
    const { fileId } = await context.params;
    const body = await request.json() as { name?: unknown };
    if (typeof body.name !== "string" || !body.name.trim() || body.name.trim().length > 120 || /[\\/]/.test(body.name)) throw new ApiError("Enter a file name under 120 characters without a path.", 400);
    const reference = services.db.collection("files").doc(fileId);
    const snapshot = await reference.get();
    if (!snapshot.exists || snapshot.data()?.userId !== userId) throw new ApiError("File not found.", 404);
    const oldName = String(snapshot.data()?.name || "file");
    const extension = oldName.includes(".") ? oldName.slice(oldName.lastIndexOf(".")) : "";
    const base = body.name.trim();
    await reference.update({ name: base.toLowerCase().endsWith(extension.toLowerCase()) ? base : `${base}${extension}`, updatedAt: FieldValue.serverTimestamp() });
    return Response.json({ renamed: true, name: base.toLowerCase().endsWith(extension.toLowerCase()) ? base : `${base}${extension}` });
  } catch (error) {
    return apiErrorResponse(error);
  }
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ fileId: string }> }) {
  try {
    const { userId, services } = await requireUser(request);
    if (!services.bucket) throw new ApiError("File storage is not configured. Set FIREBASE_STORAGE_BUCKET.", 503);
    const { fileId } = await context.params;
    const reference = services.db.collection("files").doc(fileId);
    const snapshot = await reference.get();
    if (!snapshot.exists || snapshot.data()?.userId !== userId) throw new ApiError("File not found.", 404);
    const storagePath = snapshot.data()?.storagePath;
    if (typeof storagePath === "string") await services.bucket.file(storagePath).delete({ ignoreNotFound: true });
    await reference.delete();
    return Response.json({ deleted: true });
  } catch (error) {
    return apiErrorResponse(error);
  }
}