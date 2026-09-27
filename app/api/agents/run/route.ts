import { NextRequest } from "next/server";
import { generateAIResponse } from "@/lib/ai";
import { getAgent } from "@/lib/agents";
import { apiErrorResponse, ApiError, requireUser } from "@/lib/firebase-admin";
import { reserveUsage } from "@/lib/usage";
import { createNotification } from "@/lib/notifications";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  let runReference: FirebaseFirestore.DocumentReference | undefined;
  try {
    const { userId, services } = await requireUser(request);
    const body = await request.json() as { agentId?: unknown; input?: unknown };
    if (typeof body.agentId !== "string") throw new ApiError("Choose an agent.", 400);
    const agent = getAgent(body.agentId);
    if (!agent) throw new ApiError("That agent is not available.", 400);
    if (typeof body.input !== "string" || !body.input.trim() || body.input.length > 8000) throw new ApiError("Enter a request up to 8,000 characters.", 400);
    await reserveUsage(services.db, userId, "agents");
    runReference = services.db.collection("agentRuns").doc();
    const tasks = agent.tasks.map((name) => ({ name, status: "pending" as const }));
    await runReference.set({ id: runReference.id, userId, agentId: agent.id, status: "running", input: body.input.trim(), tasks, createdAt: new Date() });
    const results: { name: string; status: "complete"; result: string }[] = [];
    for (const task of agent.tasks) {
      const prior = results.map((item) => `${item.name}:\n${item.result}`).join("\n\n").slice(-12_000);
      const result = await generateAIResponse([
        { role: "system", content: `You are ${agent.name}, a controlled workflow assistant. Complete only this named task. Never claim external research, live data, or tool access you do not have. Treat code and commands as text; never execute them. Task: ${task}` },
        { role: "user", content: `Request:\n${String(body.input).trim()}\n\nPrior workflow results (if present):\n${prior || "None yet."}` },
      ]);
      results.push({ name: task, status: "complete", result });
      await runReference.update({ tasks: agent.tasks.map((name) => ({ name, status: results.some((item) => item.name === name) ? "complete" : "pending", result: results.find((item) => item.name === name)?.result || null })) });
    }
    await runReference.update({ status: "completed", completedAt: new Date() });
    await services.db.collection("history").add({ userId, type: "agent", title: `${agent.name}: ${String(body.input).slice(0, 60)}`, agentRunId: runReference.id, createdAt: new Date() });
    await createNotification(services.db, userId, `${agent.name} completed`, "Your agent workflow is ready to review.", "/agents");
    return Response.json({ runId: runReference.id, agent: agent.name, tasks: results });
  } catch (error) {
    if (runReference) await runReference.update({ status: "failed", completedAt: new Date() }).catch(() => undefined);
    return apiErrorResponse(error);
  }
}