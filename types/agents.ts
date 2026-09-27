import type { AgentId } from "@/lib/agents";

export type AgentRunStatus = "running" | "completed" | "failed";
export type AgentRun = { id: string; userId: string; agentId: AgentId; status: AgentRunStatus; input: string; tasks: { name: string; result?: string; status: "pending" | "complete" }[]; createdAt?: unknown; completedAt?: unknown };