import { BookOpen, FileText, Files, MessageSquareText, PenLine, GraduationCap } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { ToolCard } from "@/components/ToolCard";

const tools: { title: string; description: string; href: string; icon: LucideIcon }[] = [
  { title: "AI Chat", description: "Ask questions, explore ideas and save conversations.", href: "/chat", icon: MessageSquareText },
  { title: "Article Writer", description: "Build a clear, structured article draft.", href: "/tools/writing", icon: FileText },
  { title: "Email Writer", description: "Write concise, audience-aware emails.", href: "/tools/writing", icon: PenLine },
  { title: "PDF Analysis", description: "Store documents and analyze their contents.", href: "/tools/pdf", icon: Files },
  { title: "Homework Helper", description: "Work through a question one step at a time.", href: "/tools/study", icon: GraduationCap },
  { title: "MCQ Generator", description: "Build practice questions from a topic.", href: "/tools/study", icon: BookOpen },
];

export default function ToolsPage() {
  return <div className="site-shell"><Navbar /><main className="section"><div className="section-inner"><div className="section-heading"><div><div className="eyebrow">NEXORA toolkit</div><h1 style={{ margin: 0, fontSize: 32, letterSpacing: "-.05em" }}>AI tools for the work in front of you</h1></div><p>Choose a focused workspace. Sign in to save work and continue later.</p></div><div className="tool-grid">{tools.map((tool) => <ToolCard key={tool.title} {...tool} />)}</div></div></main><SiteFooter /></div>;
}