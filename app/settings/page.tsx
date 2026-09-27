import type { Metadata } from "next";
import { SettingsWorkspace } from "@/components/SettingsWorkspace";

export const metadata: Metadata = { title: "Settings | NEXORA AI", robots: { index: false, follow: false } };
export default function SettingsPage() { return <SettingsWorkspace />; }