import type { Metadata } from "next";
import { AgentWorkspace } from "@/components/AgentWorkspace";

export const metadata: Metadata = { title: "AI Agents | NEXORA AI", description: "Run controlled, multi-step AI workflows in your private NEXORA AI workspace.", robots: { index: false, follow: false } };
export default function AgentsPage() { return <AgentWorkspace />; }