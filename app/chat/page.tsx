import { Suspense } from "react";
import type { Metadata } from "next";
import { ChatClient } from "@/components/ChatClient";
import { Loading } from "@/components/Loading";

export const metadata: Metadata = { title: "AI Chat | NEXORA AI", description: "Continue private AI conversations in your NEXORA workspace.", robots: { index: false, follow: false } };

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ prompt?: string; conversationId?: string }> }) {
  const { prompt = "", conversationId } = await searchParams;
  return <Suspense fallback={<Loading label="Opening chat" />}><ChatClient initialPrompt={prompt} initialConversationId={conversationId} /></Suspense>;
}