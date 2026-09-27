import { Suspense } from "react";
import { ChatClient } from "@/components/ChatClient";
import { Loading } from "@/components/Loading";

export default async function ChatPage({ searchParams }: { searchParams: Promise<{ prompt?: string; conversationId?: string }> }) {
  const { prompt = "", conversationId } = await searchParams;
  return <Suspense fallback={<Loading label="Opening chat" />}><ChatClient initialPrompt={prompt} initialConversationId={conversationId} /></Suspense>;
}