import type { Metadata } from "next";
import { FilesWorkspace } from "@/components/FilesWorkspace";

export const metadata: Metadata = { title: "Private File Workspace | NEXORA AI", description: "Manage and analyze your private files in NEXORA AI.", robots: { index: false, follow: false } };
export default function FilesPage() { return <FilesWorkspace />; }