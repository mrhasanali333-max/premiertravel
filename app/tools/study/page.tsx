import { StudyWorkspace } from "@/components/StudyWorkspace";
import type { Metadata } from "next";

export const metadata: Metadata = { title: "AI Study Workspace | NEXORA AI", description: "Use private NEXORA AI study tools for explanations, notes and practice.", robots: { index: false, follow: false } };
export default function StudyPage() { return <StudyWorkspace />; }