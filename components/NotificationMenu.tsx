"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { collection, doc, getDocs, limit, query, updateDoc, where } from "firebase/firestore";
import { Bell, Check } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";

type Notice = { id: string; title: string; message?: string; href?: string; read?: boolean; createdAt?: unknown };

export function NotificationMenu() {
  const { user } = useAuth();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<Notice[]>([]);
  const [error, setError] = useState("");
  const root = useRef<HTMLDivElement>(null);
  const unread = items.filter((item) => !item.read).length;

  useEffect(() => {
    if (!user || !db) { setItems([]); return; }
    let active = true;
    async function load() {
      try {
        const snapshot = await getDocs(query(collection(db!, "notifications"), where("userId", "==", user!.uid), limit(12)));
        if (active) setItems(snapshot.docs.map((item) => ({ id: item.id, title: String(item.data().title || "Update"), message: typeof item.data().message === "string" ? item.data().message : "", href: typeof item.data().href === "string" ? item.data().href : undefined, read: item.data().read === true, createdAt: item.data().createdAt })).sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt)));
      } catch { if (active) setError("Notifications could not load."); }
    }
    void load();
    return () => { active = false; };
  }, [user]);

  function timestamp(value: unknown) {
    return value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function" ? value.toMillis() : 0;
  }

  useEffect(() => {
    function close(event: MouseEvent) { if (root.current && !root.current.contains(event.target as Node)) setOpen(false); }
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  async function markRead(item: Notice) {
    if (!db || !user || item.read) return;
    try { await updateDoc(doc(db, "notifications", item.id), { read: true, readAt: new Date() }); setItems((current) => current.map((notice) => notice.id === item.id ? { ...notice, read: true } : notice)); }
    catch { setError("This notification could not be marked read."); }
  }

  return <div className="notification-wrap" ref={root}><button className="icon-button notification-trigger" type="button" aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`} aria-expanded={open} onClick={() => setOpen(!open)}><Bell size={17} />{unread > 0 && <span className="notification-dot" />}</button>{open && <section className="notification-popover" aria-label="Notifications"><div className="notification-heading"><strong>Notifications</strong><span>{unread ? `${unread} new` : "All caught up"}</span></div>{error && <div className="error-note">{error}</div>}{items.length ? items.map((item) => { const content = <><span className={`notification-mark ${item.read ? "" : "unread"}`}>{item.read ? <Check size={13} /> : <Bell size={13} />}</span><span><strong>{item.title}</strong>{item.message && <small>{item.message}</small>}</span></>; return item.href ? <Link className="notification-item" href={item.href} key={item.id} onClick={() => { void markRead(item); setOpen(false); }}>{content}</Link> : <button className="notification-item" key={item.id} type="button" onClick={() => void markRead(item)}>{content}</button>; }) : <div className="empty-state">No notifications yet.</div>}</section>}</div>;
}