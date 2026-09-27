"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { BookOpen, BriefcaseBusiness, Code2, Files, Image, Map, MessageSquareText, Mic2, PenLine, GraduationCap, Sparkles } from "lucide-react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Loading } from "@/components/Loading";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { tools } from "@/lib/tools";

type DashboardCounts = { requests: number; files: number; conversations: number; images: number; voice: number; agents: number; recent: { id: string; title: string; type: string; href: string }[]; favorites: string[] };
const quickTools = [
  { label: "AI Chat", href: "/chat", icon: MessageSquareText }, { label: "AI Writer", href: "/tools/writing", icon: PenLine },
  { label: "PDF AI", href: "/tools/pdf", icon: Files }, { label: "Study AI", href: "/tools/study", icon: GraduationCap },
  { label: "Generate Image", href: "/tools/image", icon: Image }, { label: "Transcribe Audio", href: "/tools/voice", icon: Mic2 },
  { label: "Business Assistant", href: "/tools/business", icon: BriefcaseBusiness }, { label: "Travel Planner", href: "/tools/travel", icon: Map },
  { label: "Coding Assistant", href: "/tools/coding", icon: Code2 }, { label: "AI Agents", href: "/agents", icon: Sparkles },
];

export function DashboardWorkspace() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts>({ requests: 0, files: 0, conversations: 0, images: 0, voice: 0, agents: 0, recent: [], favorites: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !db) return;
    async function load() {
      try {
        const [fileDocs, conversationDocs, historyDocs, profile, token] = await Promise.all([
          getDocs(query(collection(db!, "files"), where("userId", "==", user!.uid))),
          getDocs(query(collection(db!, "conversations"), where("userId", "==", user!.uid))),
          getDocs(query(collection(db!, "history"), where("userId", "==", user!.uid))),
          getDoc(doc(db!, "users", user!.uid)),
          user!.getIdToken(),
        ]);
        const usageResponse = await fetch("/api/usage", { headers: { authorization: `Bearer ${token}` } });
        const usage = usageResponse.ok ? await usageResponse.json() as { counts?: Record<string, number> } : { counts: {} };
        const recent = historyDocs.docs.map((item) => ({ id: item.id, title: String(item.data().title || item.data().type || "Saved activity"), type: String(item.data().type || "Activity"), href: item.data().type === "agent" ? "/agents" : item.data().type === "image" ? "/tools/image" : item.data().type === "voice" ? "/tools/voice" : "/history" })).slice(0, 6);
        const favorites = profile.data()?.favoriteTools;
        setCounts({ requests: Number(usage.counts?.chat || 0) + Number(usage.counts?.writing || 0) + Number(usage.counts?.study || 0), files: fileDocs.size, conversations: conversationDocs.size, images: Number(usage.counts?.image || 0), voice: Number(usage.counts?.voice || 0), agents: Number(usage.counts?.agents || 0), recent, favorites: Array.isArray(favorites) ? favorites.filter((item): item is string => typeof item === "string") : [] });
      } catch { setError("We couldn't load workspace stats. Check your Firestore setup and access rules."); }
      finally { setLoading(false); }
    }
    void load();
  }, [user]);

  const firstName = user?.displayName?.split(" ")[0] || "there";
  const favoriteTools = tools.filter((tool) => counts.favorites.includes(tool.id));

  return <WorkspaceShell><div className="workspace-top"><div><h1>Welcome back, {firstName}.</h1><p>Your workspace is ready for the next task.</p></div><Link className="button button-primary" href="/chat">New conversation</Link></div>
    {error && <div className="error-note" role="alert">{error}</div>}
    {loading ? <Loading label="Loading your workspace" /> : <>
      <div className="stat-grid phase-two-stats"><div className="workspace-card stat-card"><span>AI requests today</span><strong>{counts.requests}</strong></div><div className="workspace-card stat-card"><span>Files</span><strong>{counts.files}</strong></div><div className="workspace-card stat-card"><span>Image generations</span><strong>{counts.images}</strong></div><div className="workspace-card stat-card"><span>Voice requests</span><strong>{counts.voice}</strong></div><div className="workspace-card stat-card"><span>Agent runs</span><strong>{counts.agents}</strong></div></div>
      <section style={{ marginTop: 34 }}><div className="section-heading"><div><h2 style={{ fontSize: 17 }}>Quick actions</h2><p>One workspace for the next thing you need to do.</p></div><Link href="/tools" style={{ color: "var(--blue)", fontSize: 12 }}>Search tools</Link></div><div className="quick-grid">{quickTools.map(({ label, href, icon: Icon }) => <Link className="tool-card" href={href} key={href} style={{ minHeight: 114 }}><span className="tool-icon"><Icon size={17} /></span><h3 style={{ marginTop: 12 }}>{label}</h3></Link>)}</div></section>
      {favoriteTools.length > 0 && <section style={{ marginTop: 34 }}><div className="section-heading"><div><h2 style={{ fontSize: 17 }}>Saved tools</h2><p>Your favorites for quick access.</p></div></div><div className="favorite-links">{favoriteTools.map((tool) => <Link className="button button-secondary" href={tool.route} key={tool.id}>{tool.name}</Link>)}</div></section>}
      <section style={{ marginTop: 34 }}><div className="section-heading"><div><h2 style={{ fontSize: 17 }}>Recent work</h2><p>Chats, generated content and agent runs.</p></div><Link href="/history" style={{ color: "var(--blue)", fontSize: 12 }}>View history</Link></div><div className="workspace-card" style={{ padding: "5px 18px" }}>{counts.recent.length ? <div className="activity-list">{counts.recent.map((item) => <Link className="activity-row" href={item.href} key={item.id}><strong>{item.title}</strong><span>{item.type}</span></Link>)}</div> : <div className="empty-state"><strong>No activity yet</strong>Start a chat or create a draft and it will appear here.<BookOpen size={0} /></div>}</div></section>
    </>}
  </WorkspaceShell>;
}