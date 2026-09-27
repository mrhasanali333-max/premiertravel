import { NextRequest } from "next/server";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";
import { generateSpeech } from "@/lib/voice-ai";
import { reserveUsage } from "@/lib/usage";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    const body = await request.json() as { text?: unknown; voice?: unknown; speed?: unknown };
    if (typeof body.text !== "string" || !body.text.trim() || body.text.length > 5000) throw new ApiError("Enter text up to 5,000 characters.", 400);
    const speed = Number(body.speed || 1);
    if (!Number.isFinite(speed) || speed < 0.5 || speed > 2) throw new ApiError("Speech speed must be between 0.5x and 2x.", 400);
    await reserveUsage(services.db, userId, "voice");
    const audio = await generateSpeech(body.text.trim(), typeof body.voice === "string" ? body.voice : "alloy", speed);
    const history = services.db.collection("history").doc();
    await history.set({ id: history.id, userId, type: "voice", title: "Generated speech", content: body.text.trim(), voice: typeof body.voice === "string" ? body.voice : "alloy", speed, createdAt: new Date() });
    await createNotification(services.db, userId, "Speech generated", "Your audio is ready to play or download.", "/tools/voice");
    return new Response(new Uint8Array(audio), { headers: { "content-type": "audio/mpeg", "content-length": String(audio.byteLength), "cache-control": "no-store", "x-nexora-history-id": history.id } });
  } catch (error) {
    return apiErrorResponse(error);
  }
}