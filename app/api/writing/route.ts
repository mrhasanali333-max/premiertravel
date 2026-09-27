import { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";
import { reserveUsage } from "@/lib/usage";
import type { WritingOptions } from "@/types/tools";

const validTools = new Set(["article", "blog", "email", "cv", "cover-letter", "rewriter", "grammar", "translator", "summarizer"]);

export async function POST(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    const body = await request.json() as { input?: unknown; options?: Partial<WritingOptions> };
    const input = typeof body.input === "string" ? body.input.trim() : "";
    const options = body.options || {};
    if (!input) throw new ApiError("Add some text or instructions first.", 400);
    if (input.length > 15_000) throw new ApiError("Input must be shorter than 15,000 characters.", 400);
    if (!options.tool || !validTools.has(options.tool)) throw new ApiError("Choose a valid writing tool.", 400);
    await reserveUsage(services.db, userId, "writing");
    const prompt = `Task: ${options.tool}\nTone: ${options.tone || "professional"}\nLength: ${options.length || "medium"}\nLanguage: ${options.language || "English"}\n\nUser input:\n${input}\n\nProduce the requested result directly. Do not claim facts that are not supported by the input.`;
    const result = await generateAIResponse([{ role: "system", content: "You are the writing assistant in NEXORA AI. Follow the requested format and preserve user intent." }, { role: "user", content: prompt }]);
    return Response.json({ result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}