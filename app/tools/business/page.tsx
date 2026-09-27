import type { Metadata } from "next";
import { SpecialtyWorkspace } from "@/components/SpecialtyWorkspace";

export const metadata: Metadata = { title: "AI Business Tools | NEXORA AI", description: "Create business ideas, marketing plans, product descriptions and ad copy with NEXORA AI.", robots: { index: false, follow: false } };
export default function BusinessPage() { return <SpecialtyWorkspace category="business" />; }