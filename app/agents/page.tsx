import { Brain, BriefcaseBusiness, FileText, Search } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";

const agents = [{ name: "Research Agent", detail: "Gather, compare and organize information.", icon: Search }, { name: "Content Agent", detail: "Plan and shape consistent content.", icon: FileText }, { name: "Study Agent", detail: "Turn material into guided study sessions.", icon: Brain }, { name: "Business Agent", detail: "Support repeatable day-to-day workflows.", icon: BriefcaseBusiness }];

export default function AgentsPage() {
  return <div className="site-shell"><Navbar /><main className="section"><div className="section-inner"><div className="section-heading"><div><div className="eyebrow">Coming soon</div><h1 style={{ margin: 0, fontSize: 32, letterSpacing: "-.05em" }}>Purpose-built AI agents</h1></div><p>Specialized agents are planned for deeper, multi-step workflows. The core tools are available in the workspace.</p></div><div className="agent-grid">{agents.map(({ name, detail, icon: Icon }) => <article className="agent-card" key={name}><span className="tool-icon"><Icon size={17} /></span><h3 style={{ marginTop: 17 }}>{name}</h3><p>{detail}</p><span className="coming">Coming soon</span></article>)}</div></div></main><SiteFooter /></div>;
}