import type { Metadata } from "next";
import { VoiceWorkspace } from "@/components/VoiceWorkspace";

export const metadata: Metadata = { title: "AI Voice Tools | NEXORA AI", description: "Transcribe audio and create speech using NEXORA AI voice tools.", robots: { index: false, follow: false } };
export default function VoicePage() { return <VoiceWorkspace />; }