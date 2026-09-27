"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Command, Search, X } from "lucide-react";
import { tools } from "@/lib/tools";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";

type SearchResult = { id: string; title: string; type: string; href: string };

export function GlobalSearch() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [term, setTerm] = useState("");
  const [items, setItems] = useState<SearchResult[]>([]);
  const [error, setError] = useState("");

  useEffect(() => {
    function keyboard(event: KeyboardEvent) {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") { event.preventDefault(); setOpen(true); }
      if (event.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", keyboard);
    return () => window.removeEventListener("keydown", keyboard);
  }, []);

  useEffect(() => {
    if (!open || !user || !db) { setItems([]); return; }
    let alive = true;
    async function load() {
      try {
        const [history, chats, files] = await Promise.all([
          getDocs(query(collection(db!, "history"), where("userId", "==", user!.uid))),
          getDocs(query(collection(db!, "conversations"), where("userId", "==", user!.uid))),
          getDocs(query(collection(db!, "files"), where("userId", "==", user!.uid))),
        ]);
        const results: SearchResult[] = [
          ...history.docs.map((item) => ({ id: `history-${item.id}`, title: String(item.data().title || "Saved work"), type: String(item.data().type || "History"), href: item.data().type === "image" ? "/tools/image" : item.data().type === "voice" ? "/tools/voice" : item.data().type === "agent" ? "/agents" : "/history" })),
          ...chats.docs.map((item) => ({ id: `chat-${item.id}`, title: String(item.data().title || "Conversation"), type: "Chat", href: `/chat?conversationId=${encodeURIComponent(item.id)}` })),
          ...files.docs.map((item) => ({ id: `file-${item.id}`, title: String(item.data().name || "File"), type: "File", href: "/files" })),
        ];
        if (alive) setItems(results);
      } catch { if (alive) setError("Private items could not be searched. Check Firestore rules."); }
    }
    void load();
    return () => { alive = false; };
  }, [open, user]);

  const results = useMemo(() => {
    const needle = term.trim().toLowerCase();
    const matchingTools = tools.filter((tool) => !needle || `${tool.name} ${tool.description} ${tool.category}`.toLowerCase().includes(needle)).slice(0, 5).map((tool) => ({ id: `tool-${tool.id}`, title: tool.name, type: tool.category, href: tool.route }));
    const matchingItems = items.filter((item) => needle && `${item.title} ${item.type}`.toLowerCase().includes(needle)).slice(0, 8);
    return [...matchingTools, ...matchingItems];
  }, [items, term]);

  return <><button className="global-search-trigger" type="button" onClick={() => setOpen(true)}><Search size={15} /><span>Search workspace</span><kbd><Command size={10} /> K</kbd></button>{open && <div className="search-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setOpen(false); }}><section className="global-search-modal workspace-card" role="dialog" aria-modal="true" aria-label="Search NEXORA AI"><div className="global-search-input"><Search size={17} /><input autoFocus aria-label="Search tools and workspace" placeholder="Search tools, conversations, files…" value={term} onChange={(event) => setTerm(event.target.value)} /><button className="icon-button" type="button" aria-label="Close search" onClick={() => setOpen(false)}><X size={15} /></button></div>{error && <p className="error-note">{error}</p>}<div className="search-results">{results.map((item) => <Link href={item.href} key={item.id} onClick={() => setOpen(false)}><span><strong>{item.title}</strong><small>{item.type}</small></span><span aria-hidden="true">↗</span></Link>)}{!results.length && <div className="empty-state"><strong>No matches</strong>Search a tool name, conversation or file.</div>}</div></section></div>}</>;
}