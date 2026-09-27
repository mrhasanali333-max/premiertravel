import type { Metadata } from "next";
import { Suspense } from "react";
import { ImageWorkspace } from "@/components/ImageWorkspace";
import { Loading } from "@/components/Loading";

export const metadata: Metadata = { title: "AI Image Generator | NEXORA AI", description: "Generate and process images with the configured NEXORA AI image provider.", robots: { index: false, follow: false } };
export default async function ImagePage({ searchParams }: { searchParams: Promise<{ historyId?: string }> }) {
	const { historyId } = await searchParams;
	return <Suspense fallback={<Loading label="Opening image workspace" />}><ImageWorkspace historyId={historyId} /></Suspense>;
}