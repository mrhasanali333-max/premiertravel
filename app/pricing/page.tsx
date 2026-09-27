import type { Metadata } from "next";
import { PricingWorkspace } from "@/components/PricingWorkspace";

export const metadata: Metadata = { title: "Pricing | NEXORA AI", description: "Compare Free and Pro daily usage limits for the NEXORA AI workspace.", alternates: { canonical: "/pricing" } };
export default function PricingPage() { return <PricingWorkspace />; }