"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { collection, doc, getDoc, getDocs, query, where } from "firebase/firestore";
import { BookOpen, Files, MessageSquareText, PenLine, GraduationCap } from "lucide-react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Loading } from "@/components/Loading";
import { db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";

type DashboardCounts = { requests: number; files: number; conversations: number; recent: { id: string; title: string; type: string }[] };
const quickTools = [
  { label: "AI Chat", href: "/chat", icon: MessageSquareText },
  { label: "AI Writer", href: "/tools/writing", icon: PenLine },
  { label: "PDF AI", href: "/tools/pdf", icon: Files },
  { label: "Study AI", href: "/tools/study", icon: GraduationCap },
];

export default function DashboardPage() {
  const { user } = useAuth();
  const [counts, setCounts] = useState<DashboardCounts>({ requests: 0, files: 0, conversations: 0, recent: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!user || !db) return;
    async function load() {
      try {
        const [fileDocs, conversationDocs, historyDocs, usageDocs] = await Promise.all([
          getDocs(query(collection(db!, "files"), where("userId", "==", user!.uid))),
          getDocs(query(collection(db!, "conversations"), where("userId", "==", user!.uid))),
          getDocs(query(collection(db!, "history"), where("userId", "==", user!.uid))),
          getDoc(doc(db!, "usage", user!.uid)),
        ]);
        const usage = usageDocs.data();
        const recent = historyDocs.docs.map((item) => ({ id: item.id, title: String(item.data().title || item.data().type || "Saved activity"), type: String(item.data().type || "Activity") })).slice(0, 5);
        setCounts({ requests: Number(usage?.dailyRequests || 0), files: fileDocs.size, conversations: conversationDocs.size, recent });
      } catch {
        setError("We couldn't load workspace stats. Check your Firestore setup and access rules.");
      } finally { setLoading(false); }
    }
    void load();
  }, [user]);

  const firstName = user?.displayName?.split(" ")[0] || "there";

  return <WorkspaceShell><div className="workspace-top"><div><h1>Welcome back, {firstName}.</h1><p>Your workspace is ready for the next task.</p></div><Link className="button button-primary" href="/chat">New conversation</Link></div>
    {error && <div className="error-note" role="alert">{error}</div>}
    {loading ? <Loading label="Loading your workspace" /> : <>
      <div className="stat-grid"><div className="workspace-card stat-card"><span>Requests used today</span><strong>{counts.requests}</strong></div><div className="workspace-card stat-card"><span>Files</span><strong>{counts.files}</strong></div><div className="workspace-card stat-card"><span>Saved conversations</span><strong>{counts.conversations}</strong></div></div>
      <section style={{ marginTop: 34 }}><div className="section-heading"><div><h2 style={{ fontSize: 17 }}>Quick tools</h2><p>Pick up a task in one step.</p></div><Link href="/tools" style={{ color: "var(--blue)", fontSize: 12 }}>All tools</Link></div><div className="quick-grid">{quickTools.map(({ label, href, icon: Icon }) => <Link className="tool-card" href={href} key={href} style={{ minHeight: 114 }}><span className="tool-icon"><Icon size={17} /></span><h3 style={{ marginTop: 12 }}>{label}</h3></Link>)}</div></section>
      <section style={{ marginTop: 34 }}><div className="section-heading"><div><h2 style={{ fontSize: 17 }}>Recent activity</h2><p>Your latest saved work.</p></div><Link href="/history" style={{ color: "var(--blue)", fontSize: 12 }}>View history</Link></div><div className="workspace-card" style={{ padding: "5px 18px" }}>{counts.recent.length ? <div className="activity-list">{counts.recent.map((item) => <Link className="activity-row" href="/history" key={item.id}><strong>{item.title}</strong><span>{item.type}</span></Link>)}</div> : <div className="empty-state"><strong>No activity yet</strong>Start a chat or create a writing draft and it will appear here.<BookOpen size={0} /></div>}</div></section>
    </>}
  </WorkspaceShell>;
}