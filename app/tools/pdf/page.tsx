import type { Metadata } from "next";
import { FilesWorkspace } from "@/components/FilesWorkspace";

export const metadata: Metadata = { title: "AI PDF Workspace | NEXORA AI", description: "Analyze private PDFs and documents in NEXORA AI.", robots: { index: false, follow: false } };
export default function PdfToolPage() { return <FilesWorkspace />; }