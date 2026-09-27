import { NextRequest } from "next/server";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";

export const runtime = "nodejs";

export async function GET(request: NextRequest, context: { params: Promise<{ imageId: string }> }) {
  try {
    const { userId, services } = await requireUser(request);
    if (!services.bucket) throw new ApiError("Image storage is not configured.", 503);
    const { imageId } = await context.params;
    const snapshot = await services.db.collection("images").doc(imageId).get();
    if (!snapshot.exists || snapshot.data()?.userId !== userId) throw new ApiError("Image not found.", 404);
    const storagePath = snapshot.data()?.storagePath;
    const mimeType = snapshot.data()?.mimeType;
    if (typeof storagePath !== "string" || typeof mimeType !== "string" || !mimeType.startsWith("image/")) throw new ApiError("Image metadata is invalid.", 422);
    const [buffer] = await services.bucket.file(storagePath).download();
    return new Response(new Uint8Array(buffer), { headers: { "content-type": mimeType, "content-length": String(buffer.byteLength), "cache-control": "private, no-store", "x-content-type-options": "nosniff" } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}