"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { collection, deleteDoc, doc, getDocs, query, updateDoc, where, writeBatch } from "firebase/firestore";
import { FileText, Files, MessageSquareText, Pencil, Search, Trash2, X } from "lucide-react";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Loading } from "@/components/Loading";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";

type HistoryItem = { id: string; source: "history" | "conversation" | "file"; type: string; title: string; content?: string; date: number };

export function HistoryWorkspace() {
  const { user } = useAuth();
  const router = useRouter();
  const [items, setItems] = useState<HistoryItem[]>([]);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState("All");
  const [selected, setSelected] = useState<HistoryItem | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    async function load() {
      if (!db || !user) { setLoading(false); return; }
      try {
        const [history, conversations, files] = await Promise.all([
          getDocs(query(collection(db, "history"), where("userId", "==", user.uid))),
          getDocs(query(collection(db, "conversations"), where("userId", "==", user.uid))),
          getDocs(query(collection(db, "files"), where("userId", "==", user.uid))),
        ]);
        const dateValue = (value: unknown) => value && typeof value === "object" && "toDate" in value && typeof value.toDate === "function" ? value.toDate().getTime() : 0;
        const rows: HistoryItem[] = [
          ...history.docs.map((item) => ({ id: item.id, source: "history" as const, type: String(item.data().type || "Activity"), title: String(item.data().title || "Saved activity"), content: typeof item.data().content === "string" ? item.data().content : undefined, date: dateValue(item.data().createdAt) })),
          ...conversations.docs.map((item) => ({ id: item.id, source: "conversation" as const, type: "Chat", title: String(item.data().title || "Conversation"), date: dateValue(item.data().updatedAt) })),
          ...files.docs.map((item) => ({ id: item.id, source: "file" as const, type: "File", title: String(item.data().name || "File"), date: dateValue(item.data().createdAt) })),
        ];
        const unique = new Map<string, HistoryItem>();
        rows.forEach((item) => unique.set(`${item.source}:${item.id}`, item));
        if (alive) setItems([...unique.values()].sort((a, b) => b.date - a.date));
      } catch { if (alive) setError("History could not be loaded. Check Firestore configuration and access rules."); }
      finally { if (alive) setLoading(false); }
    }
    void load();
    return () => { alive = false; };
  }, [user]);

  const tabs = ["All", "Chats", "Writing", "Images", "Voice", "Files", "Agents"];
  const filtered = useMemo(() => items.filter((item) => {
    const kind = item.source === "conversation" ? "chats" : item.source === "file" ? "files" : item.type.toLowerCase();
    return (tab === "All" || kind === tab.toLowerCase()) && `${item.title} ${item.type}`.toLowerCase().includes(search.toLowerCase());
  }), [items, search, tab]);

  async function rename(item: HistoryItem) {
    if (!db) return;
    const title = window.prompt("Rename item", item.title);
    if (!title?.trim() || title.trim() === item.title) return;
    try {
      if (item.source === "file" && user) {
        const token = await user.getIdToken();
        const response = await fetch(`/api/files/${item.id}`, { method: "PATCH", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ name: title.trim() }) });
        const payload = await response.json() as { name?: string; error?: string };
        if (!response.ok) throw new Error(payload.error || "File could not be renamed.");
        setItems((current) => current.map((entry) => entry.id === item.id && entry.source === item.source ? { ...entry, title: payload.name || title.trim() } : entry));
        return;
      }
      await updateDoc(doc(db, item.source === "conversation" ? "conversations" : "history", item.id), { title: title.trim() });
      setItems((current) => current.map((entry) => entry.id === item.id && entry.source === item.source ? { ...entry, title: title.trim() } : entry));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "This item could not be renamed."); }
  }

  async function remove(item: HistoryItem) {
    if (!db || !user || !window.confirm(`Delete “${item.title}”?`)) return;
    setError("");
    try {
      if (item.source === "file") {
        const token = await user.getIdToken();
        const response = await fetch(`/api/files/${item.id}`, { method: "DELETE", headers: { authorization: `Bearer ${token}` } });
        const result = await response.json() as { error?: string };
        if (!response.ok) throw new Error(result.error || "File could not be deleted.");
      } else if (item.source === "conversation") {
        const messages = await getDocs(collection(db, "conversations", item.id, "messages"));
        const batch = writeBatch(db);
        messages.docs.forEach((message) => batch.delete(message.ref));
        batch.delete(doc(db, "conversations", item.id));
        await batch.commit();
        await deleteDoc(doc(db, "history", item.id)).catch(() => undefined);
      } else {
        await deleteDoc(doc(db, "history", item.id));
      }
      setItems((current) => current.filter((entry) => !(entry.id === item.id && entry.source === item.source)));
      if (selected?.id === item.id && selected.source === item.source) setSelected(null);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "This item could not be deleted."); }
  }

  const iconFor = (item: HistoryItem) => item.source === "file" ? Files : item.type === "chat" || item.source === "conversation" ? MessageSquareText : FileText;

  return <WorkspaceShell><div className="workspace-top"><div><h1>History</h1><p>Find conversations, writing results, PDF activity and study work.</p></div><label className="history-search"><Search size={15} /><input aria-label="Search history" placeholder="Search history" value={search} onChange={(event) => setSearch(event.target.value)} /></label></div>
    {error && <div style={{ marginBottom: 14 }}><ErrorMessage message={error} /></div>}
    <div className="history-tabs" role="tablist" aria-label="Filter history">{tabs.map((item) => <button className={tab === item ? "active" : ""} role="tab" aria-selected={tab === item} type="button" key={item} onClick={() => setTab(item)}>{item}</button>)}</div>
    {loading ? <Loading label="Loading history" /> : filtered.length ? <div className="history-list">{filtered.map((item) => { const Icon = iconFor(item); const openImage = item.type === "image"; return <article className="workspace-card history-row" key={`${item.source}:${item.id}`}><span className="tool-icon"><Icon size={16} /></span><div className="history-info"><strong>{item.title}</strong><span>{item.type} · {item.date ? new Date(item.date).toLocaleDateString() : "Saved activity"}</span></div><div className="history-actions">{item.source === "conversation" ? <button className="button button-quiet" type="button" onClick={() => router.push(`/chat?conversationId=${encodeURIComponent(item.id)}`)}>Open</button> : item.source === "file" ? <Link className="button button-quiet" href="/files">Open</Link> : item.content ? <button className="button button-quiet" type="button" onClick={() => setSelected(item)}>Open</button> : openImage ? <Link className="button button-quiet" href={`/tools/image?historyId=${encodeURIComponent(item.id)}`}>Open</Link> : item.type === "agent" ? <Link className="button button-quiet" href="/agents">Open</Link> : <span className="activity-type">Saved</span>}<button className="icon-button" type="button" title="Rename" aria-label={`Rename ${item.title}`} onClick={() => void rename(item)}><Pencil size={14} /></button><button className="icon-button" type="button" title="Delete" aria-label={`Delete ${item.title}`} onClick={() => void remove(item)}><Trash2 size={14} /></button></div></article>; })}</div> : <div className="workspace-card empty-state"><strong>{search ? "No matching activity" : "Your history is empty"}</strong>{search ? "Try a different search." : "Saved conversations and tool activity will appear here."}</div>}
    {selected && <div className="modal-backdrop" role="presentation" onClick={(event) => { if (event.target === event.currentTarget) setSelected(null); }}><section className="history-modal workspace-card" role="dialog" aria-modal="true" aria-label={selected.title}><div className="result-header"><div><h2 className="section-title">{selected.title}</h2><span className="activity-type">{selected.type}</span></div><button className="icon-button" type="button" aria-label="Close result" onClick={() => setSelected(null)}><X size={16} /></button></div><div className="result-box">{selected.content}</div></section></div>}
  </WorkspaceShell>;
}