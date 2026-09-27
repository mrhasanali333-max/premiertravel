import { BookOpen, FileText, Files, History, MessageSquareText, PenLine, GraduationCap, LibraryBig, SearchCheck, ShieldCheck, Sparkles } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { PromptLauncher } from "@/components/PromptLauncher";
import { ToolCard } from "@/components/ToolCard";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "NEXORA AI | One AI. Every Task.",
  description: "NEXORA AI is an all-in-one AI workspace for chat, writing, study, PDF analysis and productivity.",
  alternates: { canonical: "/" },
};

const tools: { title: string; description: string; href: string; icon: LucideIcon }[] = [
  { title: "AI Chat", description: "Think through questions and ideas with a focused assistant.", href: "/chat", icon: MessageSquareText },
  { title: "AI Writing", description: "Draft, rewrite and refine work in your chosen voice.", href: "/tools/writing", icon: PenLine },
  { title: "AI Study", description: "Turn difficult topics into explanations and practice.", href: "/tools/study", icon: GraduationCap },
  { title: "AI PDF", description: "Upload a document and work with its contents.", href: "/tools/pdf", icon: Files },
];

const agents = ["Research Agent", "Content Agent", "Study Agent", "Business Agent"];
const features: { title: string; copy: string; icon: LucideIcon }[] = [
  { title: "AI Chat", copy: "Keep ideas and follow-up questions in one thread.", icon: MessageSquareText },
  { title: "Writing", copy: "Create useful first drafts and polish existing text.", icon: FileText },
  { title: "PDF Analysis", copy: "Keep files and document tasks together.", icon: Files },
  { title: "Study Tools", copy: "Explain concepts, make practice and plan study.", icon: BookOpen },
  { title: "Secure Workspace", copy: "Your data is isolated to your signed-in account.", icon: ShieldCheck },
  { title: "Conversation History", copy: "Return to saved chats and generated work.", icon: History },
];

export default function HomePage() {
  return (
    <div className="site-shell">
      <Navbar />
      <main>
        <section className="home-hero">
          <div className="hero-content reveal">
            <div className="eyebrow"><Sparkles size={14} /> A clearer way to get things done</div>
            <h1 className="hero-title">One AI.<br /><span>Every Task.</span></h1>
            <p className="hero-subtitle">Write, study, analyze files and get things done with one powerful AI workspace.</p>
            <PromptLauncher />
            <div className="popular-row"><span>Popular tools</span>{tools.map((tool) => <a className="popular-pill" href={tool.href} key={tool.href}><tool.icon size={14} />{tool.title.replace("AI ", "")}</a>)}</div>
          </div>
        </section>
        <section className="section" id="tools">
          <div className="section-inner">
            <div className="section-heading"><div><div className="eyebrow">One workspace, ready</div><h2>Choose a tool. Keep your flow.</h2></div><p>Focused tools for the work you already do, with your conversations and files kept close.</p></div>
            <div className="tool-grid">{tools.map((tool) => <ToolCard key={tool.href} {...tool} />)}</div>
          </div>
        </section>
        <section className="section feature-band" id="agents">
          <div className="section-inner">
            <div className="section-heading"><div><div className="eyebrow">Specialists in progress</div><h2>AI agents, when you need them.</h2></div><p>Purpose-built agents are on the roadmap. Your core workspace is available now.</p></div>
            <div className="agent-grid">{agents.map((agent) => <article className="agent-card" key={agent}><span className="tool-icon"><LibraryBig size={17} /></span><h3>{agent}</h3><p>Designed for a focused workflow.</p><span className="coming">Coming soon</span></article>)}</div>
          </div>
        </section>
        <section className="section">
          <div className="section-inner">
            <div className="section-heading"><div><div className="eyebrow">Made for everyday work</div><h2>Everything you need in one AI workspace</h2></div></div>
            <div className="feature-grid">{features.map(({ title, copy, icon: Icon }) => <article className="feature" key={title}><span className="tool-icon"><Icon size={17} /></span><div><h3>{title}</h3><p>{copy}</p></div></article>)}</div>
          </div>
        </section>
        <section className="section" style={{ paddingTop: 0 }}><div className="section-inner"><div className="workspace-card" style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 24, padding: "24px 27px" }}><div><h2 style={{ margin: 0, fontSize: 20 }}>Keep your work moving.</h2><p style={{ margin: "7px 0 0", color: "var(--muted)", fontSize: 13 }}>Start a workspace for your next task.</p></div><a className="button button-primary" href="/signup">Create free account <SearchCheck size={16} /></a></div></div></section>
      </main>
      <SiteFooter />
    </div>
  );
}