import { WritingWorkspace } from "@/components/WritingWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Writing Workspace | NEXORA AI", description: "Draft and refine content with private NEXORA AI writing tools.", robots: { index: false, follow: false } };
export default function WritingPage() { return <WritingWorkspace />; }