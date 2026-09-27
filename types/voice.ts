export type VoiceTask = "transcribe" | "speech" | "meeting" | "summarize";
export type VoiceTranscript = { text: string; language?: string; createdAt?: unknown };