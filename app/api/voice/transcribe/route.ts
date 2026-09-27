import { NextRequest } from "next/server";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";
import { transcribeAudio } from "@/lib/voice-ai";
import { reserveUsage } from "@/lib/usage";
import { createNotification } from "@/lib/notifications";
import { generateAIResponse } from "@/lib/ai";

export const runtime = "nodejs";
const audioTypes = new Set(["audio/mpeg", "audio/mp4", "audio/wav", "audio/webm", "audio/ogg", "audio/x-m4a"]);

export async function POST(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File) || !audioTypes.has(file.type) || file.size <= 0 || file.size > 25 * 1024 * 1024) throw new ApiError("Choose a supported audio file under 25 MB.", 415);
    const task = String(form.get("task") || "transcribe");
    if (!["transcribe", "meeting", "summarize"].includes(task)) throw new ApiError("Choose transcription, meeting notes or audio summary.", 400);
    await reserveUsage(services.db, userId, "voice");
    const transcript = await transcribeAudio(file, typeof form.get("language") === "string" ? String(form.get("language")) : undefined);
    const analysis = task === "transcribe" ? "" : await generateAIResponse([
      { role: "system", content: "Summarize only the supplied transcript. Do not invent speakers, decisions, facts or action items. Mark uncertain attribution clearly." },
      { role: "user", content: `${task === "meeting" ? "Create a concise meeting summary, key points and action items." : "Summarize this audio transcript and list its important points and keywords."}\n\nTranscript:\n${transcript}` },
    ]);
    const history = services.db.collection("history").doc();
    await history.set({ id: history.id, userId, type: "voice", title: `${task === "meeting" ? "Meeting notes" : task === "summarize" ? "Audio summary" : "Transcript"}: ${file.name}`, content: transcript, analysis, createdAt: new Date() });
    await createNotification(services.db, userId, task === "transcribe" ? "Transcription complete" : "Audio notes complete", `${file.name} is ready to review.`, "/tools/voice");
    return Response.json({ transcript, analysis, historyId: history.id });
  } catch (error) {
    return apiErrorResponse(error);
  }
}