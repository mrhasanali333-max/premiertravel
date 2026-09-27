import { NextRequest } from "next/server";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

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