import type { Metadata } from "next";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolGrid } from "@/components/ToolGrid";

export const metadata: Metadata = { title: "AI Tools | NEXORA AI", description: "Explore writing, study, image, voice, business, travel and coding tools in the NEXORA AI workspace.", alternates: { canonical: "/tools" } };

export default function ToolsPage() {
  return <div className="site-shell"><Navbar /><main className="section"><div className="section-inner"><div className="section-heading"><div><div className="eyebrow">NEXORA toolkit</div><h1 style={{ margin: 0, fontSize: 32, letterSpacing: "-.05em" }}>AI tools for the work in front of you</h1></div><p>Search by task, browse a category, and favorite tools in your account.</p></div><ToolGrid /></div></main><SiteFooter /></div>;
}