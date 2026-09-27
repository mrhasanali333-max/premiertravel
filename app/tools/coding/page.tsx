import type { Metadata } from "next";
import { SpecialtyWorkspace } from "@/components/SpecialtyWorkspace";

export const metadata: Metadata = { title: "AI Coding Assistant | NEXORA AI", description: "Generate, explain and debug code as text without executing it in NEXORA AI.", robots: { index: false, follow: false } };
export default function CodingPage() { return <SpecialtyWorkspace category="coding" />; }