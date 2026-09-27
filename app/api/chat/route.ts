import { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";
import { apiErrorResponse, requireUser } from "@/lib/firebase-admin";
import { reserveUsage } from "@/lib/usage";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    const body = await request.json() as { message?: unknown; messages?: unknown };
    const message = typeof body.message === "string" ? body.message.trim() : "";
    const messages = Array.isArray(body.messages) ? body.messages as { role: "user" | "assistant"; content: string }[] : [{ role: "user" as const, content: message }];
    if (!messages.length || messages.length > 50 || messages.some((item) => !["user", "assistant"].includes(item.role) || typeof item.content !== "string" || !item.content.trim())) return Response.json({ error: "Enter a valid message (up to 50 messages per request)." }, { status: 400 });
    await reserveUsage(services.db, userId, "chat");
    const reply = await generateAIResponse([{ role: "system", content: "You are NEXORA AI, a clear and useful general assistant. Be accurate and say when you are uncertain." }, ...messages]);
    return Response.json({ response: reply });
  } catch (error) {
    return apiErrorResponse(error);
  }
}