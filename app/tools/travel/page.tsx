import type { Metadata } from "next";
import { SpecialtyWorkspace } from "@/components/SpecialtyWorkspace";

export const metadata: Metadata = { title: "AI Travel Planner | NEXORA AI", description: "Plan itineraries, trip budgets and packing lists with NEXORA AI.", robots: { index: false, follow: false } };
export default function TravelPage() { return <SpecialtyWorkspace category="travel" />; }