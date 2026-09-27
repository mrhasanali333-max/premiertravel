import { ApiError } from "@/lib/firebase-admin";

export type AIMessage = { role: "system" | "user" | "assistant"; content: string };

export interface AIProvider {
  generate(messages: AIMessage[]): Promise<string>;
}

class OpenAICompatibleProvider implements AIProvider {
  async generate(messages: AIMessage[]) {
    const apiKey = process.env.AI_API_KEY;
    if (!apiKey) throw new ApiError("AI is not configured. Add AI_API_KEY to the server environment.", 503);
    const baseUrl = (process.env.AI_BASE_URL || "https://api.openai.com/v1").replace(/\/+$/, "");
    let response: Response;
    try {
      response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: { authorization: `Bearer ${apiKey}`, "content-type": "application/json" },
        body: JSON.stringify({ model: process.env.AI_MODEL || "gpt-4o-mini", messages, temperature: 0.6 }),
        signal: AbortSignal.timeout(90_000),
      });
    } catch {
      throw new ApiError("The AI provider could not be reached. Check AI_BASE_URL and try again.", 502);
    }
    if (!response.ok) {
      const detail = await response.text().catch(() => "");
      throw new ApiError(`The AI provider returned an error (${response.status}). ${detail.slice(0, 240)}`, 502);
    }
    const result = await response.json() as { choices?: { message?: { content?: string } }[] };
    const content = result.choices?.[0]?.message?.content;
    if (!content?.trim()) throw new ApiError("The AI provider returned an empty response. Try again.", 502);
    return content.trim();
  }
}

const provider: AIProvider = new OpenAICompatibleProvider();

export function generateAIResponse(messages: AIMessage[]) {
  if (!messages.length || messages.length > 50 || messages.some((item) => item.content.length > 20_000)) {
    throw new ApiError("The request is empty or exceeds the supported message limits.", 400);
  }
  return provider.generate(messages);
}