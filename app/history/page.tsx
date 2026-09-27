import type { Metadata } from "next";
import { HistoryWorkspace } from "@/components/HistoryWorkspace";

export const metadata: Metadata = { title: "Private History | NEXORA AI", description: "Review your private NEXORA AI workspace history.", robots: { index: false, follow: false } };
export default function HistoryPage() { return <HistoryWorkspace />; }