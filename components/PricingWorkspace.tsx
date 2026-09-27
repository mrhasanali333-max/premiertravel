"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, Sparkles } from "lucide-react";
import { Navbar } from "@/components/Navbar";
import { SiteFooter } from "@/components/SiteFooter";
import { plans } from "@/lib/plans";

const comparisons = [
  ["AI Chat", "30 requests / day", "1,000 requests / day"],
  ["AI Writing", "15 requests / day", "500 requests / day"],
  ["PDF processing", "10 actions / day", "250 actions / day"],
  ["Image generation", "3 generations / day", "100 generations / day"],
  ["Voice tools", "10 requests / day", "300 requests / day"],
  ["AI Coding", "Included", "Included"],
  ["Business and Travel", "Included", "Included"],
  ["AI Agents", "3 runs / day", "100 runs / day"],
];

export function PricingWorkspace() {
  const [notice, setNotice] = useState(false);
  return <div className="site-shell"><Navbar /><main className="section"><div className="section-inner pricing-page"><div className="pricing-heading"><div className="eyebrow">Plans for focused work</div><h1>One workspace.<br /><span>Room to grow.</span></h1><p>Start with the free workspace. Pro plan limits are prepared centrally; payments are not active yet.</p></div>
    <div className="plan-grid">{([plans.free, plans.pro]).map((plan) => <article className={`plan-card ${plan.id === "pro" ? "pro" : ""}`} key={plan.id}><div className="plan-card-head"><span className="plan-badge">{plan.id === "pro" ? <Sparkles size={13} /> : null}{plan.name}</span><h2>{plan.id === "free" ? "A useful start" : "More room for every task"}</h2><p>{plan.id === "free" ? "Everything you need to try the NEXORA workspace." : "Higher daily limits across your AI workspace."}</p></div><div className="plan-limits"><div><span>Chat</span><strong>{plan.limits.chat} / day</strong></div><div><span>Writing</span><strong>{plan.limits.writing} / day</strong></div><div><span>Study</span><strong>{plan.limits.study} / day</strong></div><div><span>Image generations</span><strong>{plan.limits.image} / day</strong></div><div><span>Voice requests</span><strong>{plan.limits.voice} / day</strong></div><div><span>File actions</span><strong>{plan.limits.files} / day</strong></div><div><span>Agent runs</span><strong>{plan.limits.agents} / day</strong></div></div>{plan.id === "free" ? <Link className="button button-secondary button-full" href="/signup">Create a free account</Link> : <button className="button button-primary button-full" type="button" onClick={() => setNotice(true)}>Upgrade to Pro</button>}</article>)}</div>
    <section className="workspace-card comparison-panel"><h2>Compare workspace access</h2><div className="comparison-table"><div className="comparison-row heading"><span>Feature</span><span>{plans.free.name}</span><span>{plans.pro.name}</span></div>{comparisons.map(([label, free, pro]) => <div className="comparison-row" key={label}><span>{label}</span><span><Check size={14} />{free}</span><span><Check size={14} />{pro}</span></div>)}</div>{notice && <div className="inline-note" role="status">Payments coming soon. Your current plan remains Free.</div>}</section>
    </div></main><SiteFooter /></div>;
}