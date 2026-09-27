import { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";
import { recordAIRequest } from "@/lib/usage";
import type { StudyTool } from "@/types/tools";

const validTools = new Set<StudyTool>(["homework", "notes", "mcq", "quiz", "planner", "explain"]);

export async function POST(request: NextRequest) {
  try {
    const { userId, services } = await requireUser(request);
    const body = await request.json() as { tool?: unknown; input?: unknown; count?: unknown; difficulty?: unknown; language?: unknown };
    if (typeof body.tool !== "string" || !validTools.has(body.tool as StudyTool)) throw new ApiError("Choose a supported study tool.", 400);
    const input = typeof body.input === "string" ? body.input.trim() : "";
    if (!input) throw new ApiError("Enter a topic or question first.", 400);
    if (input.length > 12_000) throw new ApiError("Input must be shorter than 12,000 characters.", 400);
    const count = Math.min(20, Math.max(1, Number(body.count) || 5));
    const prompt = `Study tool: ${body.tool}\nNumber of questions: ${count}\nDifficulty: ${String(body.difficulty || "medium")}\nLanguage: ${String(body.language || "English")}\n\nQuestion or topic:\n${input}\n\nFor homework, explain the reasoning step by step and finish with one practice question. For MCQ or quiz, provide numbered questions, four lettered options, the correct answer, and a concise explanation. For notes, provide a structured summary. For planner, make a realistic schedule. For explain, teach the concept clearly.`;
    const result = await generateAIResponse([{ role: "system", content: "You are a patient study assistant. Show reasoning steps at a useful level without inventing facts." }, { role: "user", content: prompt }]);
    await recordAIRequest(services.db, userId);
    const history = services.db.collection("history").doc();
    await history.set({ id: history.id, userId, type: "study", title: `${String(body.tool)}: ${input.slice(0, 70)}`, createdAt: new Date() });
    return Response.json({ result });
  } catch (error) {
    return apiErrorResponse(error);
  }
}