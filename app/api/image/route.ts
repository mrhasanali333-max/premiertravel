import { NextRequest } from "next/server";
import { randomUUID } from "node:crypto";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";
import { generateImage, processImage, type ImageOptions } from "@/lib/image-ai";
import { reserveUsage } from "@/lib/usage";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";
const maxImageSize = 10 * 1024 * 1024;
const imageTypes = new Set(["image/png", "image/jpeg", "image/webp"]);

export async function POST(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    if (!services.bucket) throw new ApiError("Image results need Firebase Storage. Set FIREBASE_STORAGE_BUCKET.", 503);
    const form = await request.formData();
    const action = form.get("action");
    const prompt = form.get("prompt");
    let output: { images?: string[]; image?: string; prompt?: string };
    if (action === "generate") {
      if (typeof prompt !== "string" || !prompt.trim() || prompt.length > 4000) throw new ApiError("Enter an image prompt under 4,000 characters.", 400);
      const count = Number(form.get("count") || 1);
      if (!Number.isInteger(count) || count < 1 || count > 4) throw new ApiError("Generate between 1 and 4 images per request.", 400);
      await reserveUsage(services.db, userId, "image");
      const options: ImageOptions = {
        style: String(form.get("style") || "natural"),
        aspectRatio: ["square", "portrait", "landscape"].includes(String(form.get("aspectRatio"))) ? String(form.get("aspectRatio")) as ImageOptions["aspectRatio"] : "square",
        quality: form.get("quality") === "high" ? "high" : "standard",
        count,
      };
      output = { images: await generateImage(prompt.trim(), options) };
    } else {
      const file = form.get("file");
      if (!(file instanceof File) || !imageTypes.has(file.type) || file.size <= 0 || file.size > maxImageSize) throw new ApiError("Choose a PNG, JPEG or WebP image under 10 MB.", 415);
      if (!["describe", "remove-background", "enhance"].includes(String(action))) throw new ApiError("Choose a supported image action.", 400);
      await reserveUsage(services.db, userId, "image");
      output = await processImage(action as "describe" | "remove-background" | "enhance", file, typeof prompt === "string" ? prompt : undefined);
    }
    const generated = output.images || (output.image ? [output.image] : []);
    const imageIds: string[] = [];
    for (const image of generated) {
      const match = image.match(/^data:(image\/(?:png|jpeg|webp));base64,([A-Za-z0-9+/=]+)$/);
      if (!match) continue;
      const imageId = randomUUID();
      const mimeType = match[1];
      const storagePath = `users/${userId}/images/${imageId}.${mimeType.split("/")[1]}`;
      const buffer = Buffer.from(match[2], "base64");
      if (buffer.byteLength > 20 * 1024 * 1024) throw new ApiError("The generated image exceeds the 20 MB storage limit.", 413);
      await services.bucket.file(storagePath).save(buffer, { metadata: { contentType: mimeType, metadata: { userId, imageId } }, resumable: false });
      await services.db.collection("images").doc(imageId).set({ id: imageId, userId, storagePath, mimeType, prompt: typeof prompt === "string" ? prompt.slice(0, 4000) : "", createdAt: new Date() });
      imageIds.push(imageId);
    }
    const history = services.db.collection("history").doc();
    await history.set({ id: history.id, userId, type: "image", title: `Image ${String(action)}`, prompt: typeof prompt === "string" ? prompt : "", images: generated.filter((image) => /^https:\/\//i.test(image)), imageIds, resultPrompt: output.prompt || "", createdAt: new Date() });
    await createNotification(services.db, userId, "Image task complete", "Your image result is ready in history.", "/tools/image");
    return Response.json({ ...output, historyId: history.id, imageIds, savedToHistory: generated.every((image) => !image.startsWith("data:") || imageIds.length > 0) });
  } catch (error) {
    return apiErrorResponse(error);
  }
}