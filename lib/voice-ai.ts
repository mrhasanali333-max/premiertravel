import { ApiError } from "@/lib/firebase-admin";

function config() {
  const apiKey = process.env.VOICE_PROVIDER_API_KEY;
  const baseUrl = (process.env.VOICE_PROVIDER_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
  if (!apiKey) throw new ApiError("Voice services are not configured. Set VOICE_PROVIDER_API_KEY.", 503);
  return { apiKey, baseUrl };
}

export async function transcribeAudio(file: File, language?: string) {
  const { apiKey, baseUrl } = config();
  const form = new FormData();
  form.append("file", file, file.name);
  form.append("model", process.env.VOICE_TRANSCRIPTION_MODEL || "whisper-1");
  if (language) form.append("language", language);
  const response = await fetch(`${baseUrl}/audio/transcriptions`, { method: "POST", headers: { authorization: `Bearer ${apiKey}` }, body: form, signal: AbortSignal.timeout(120_000) });
  if (!response.ok) throw new ApiError(`Voice provider returned an error (${response.status}).`, 502);
  const payload = await response.json() as { text?: string };
  if (!payload.text?.trim()) throw new ApiError("The audio provider returned an empty transcript.", 502);
  return payload.text.trim();
}

export async function generateSpeech(text: string, voice: string, speed: number) {
  const { apiKey, baseUrl } = config();
  const response = await fetch(`${baseUrl}/audio/speech`, {
    method: "POST",
    headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
    body: JSON.stringify({ model: process.env.VOICE_SPEECH_MODEL || "tts-1", voice, speed, input: text, response_format: "mp3" }),
    signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new ApiError(`Speech provider returned an error (${response.status}).`, 502);
  return Buffer.from(await response.arrayBuffer());
}