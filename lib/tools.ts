import { BookOpen, BriefcaseBusiness, Code2, FileText, Files, Image, Map, MessageSquareText, Mic2, PenLine } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import type { PlanId } from "@/lib/plans";

export type ToolStatus = "active" | "coming-soon";
export type ToolCategory = "Chat" | "Writing" | "Files" | "Image" | "Voice" | "Business" | "Travel" | "Coding" | "Study";
export type AITool = {
  id: string;
  name: string;
  description: string;
  category: ToolCategory;
  route: string;
  icon: LucideIcon;
  requiredPlan: PlanId;
  usageCategory: "chat" | "writing" | "study" | "image" | "voice" | "files" | "agents";
  status: ToolStatus;
  provider: "text" | "image" | "voice" | "firebase" | "none";
  inputSchema: string[];
  outputSchema: string[];
};

export const tools: AITool[] = [
  { id: "chat", name: "AI Chat", description: "Ask questions, explore ideas and continue saved conversations.", category: "Chat", route: "/chat", icon: MessageSquareText, requiredPlan: "free", usageCategory: "chat", status: "active", provider: "text", inputSchema: ["message"], outputSchema: ["response"] },
  { id: "writing", name: "AI Writing", description: "Draft, rewrite and refine useful content.", category: "Writing", route: "/tools/writing", icon: PenLine, requiredPlan: "free", usageCategory: "writing", status: "active", provider: "text", inputSchema: ["input", "tone", "length", "language"], outputSchema: ["result"] },
  { id: "files", name: "PDF workspace", description: "Upload and analyze your documents.", category: "Files", route: "/files", icon: Files, requiredPlan: "free", usageCategory: "files", status: "active", provider: "firebase", inputSchema: ["file", "action"], outputSchema: ["document", "analysis"] },
  { id: "study", name: "AI Study", description: "Explain topics, summarize notes and generate practice.", category: "Study", route: "/tools/study", icon: BookOpen, requiredPlan: "free", usageCategory: "study", status: "active", provider: "text", inputSchema: ["topic", "tool", "difficulty"], outputSchema: ["explanation", "practice"] },
  { id: "image", name: "AI Image", description: "Generate images and describe or edit an upload.", category: "Image", route: "/tools/image", icon: Image, requiredPlan: "free", usageCategory: "image", status: "active", provider: "image", inputSchema: ["prompt", "style", "ratio", "quality", "count"], outputSchema: ["images"] },
  { id: "voice", name: "AI Voice", description: "Transcribe audio or turn text into speech.", category: "Voice", route: "/tools/voice", icon: Mic2, requiredPlan: "free", usageCategory: "voice", status: "active", provider: "voice", inputSchema: ["audio", "text", "voice", "language"], outputSchema: ["transcript", "audio"] },
  { id: "business", name: "AI Business", description: "Develop business ideas, campaigns and product copy.", category: "Business", route: "/tools/business", icon: BriefcaseBusiness, requiredPlan: "free", usageCategory: "writing", status: "active", provider: "text", inputSchema: ["task", "business", "audience", "budget"], outputSchema: ["plan", "copy", "nextSteps"] },
  { id: "travel", name: "AI Travel", description: "Plan trips, budgets and destination-specific packing.", category: "Travel", route: "/tools/travel", icon: Map, requiredPlan: "free", usageCategory: "writing", status: "active", provider: "text", inputSchema: ["task", "destination", "dates", "budget"], outputSchema: ["itinerary", "estimate", "checklist"] },
  { id: "coding", name: "AI Coding", description: "Generate, explain and debug code without executing it.", category: "Coding", route: "/tools/coding", icon: Code2, requiredPlan: "free", usageCategory: "writing", status: "active", provider: "text", inputSchema: ["task", "language", "code", "error"], outputSchema: ["result", "explanation"] },
  { id: "agents", name: "AI Agents", description: "Run controlled, multi-step content and study workflows.", category: "Writing", route: "/agents", icon: FileText, requiredPlan: "free", usageCategory: "agents", status: "active", provider: "text", inputSchema: ["agentId", "input"], outputSchema: ["tasks", "results"] },
];

export function findTool(id: string) {
  return tools.find((tool) => tool.id === id);
}