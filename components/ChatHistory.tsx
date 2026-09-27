"use client";

import { MessageSquarePlus, Trash2 } from "lucide-react";
import type { Conversation } from "@/types/chat";

export function ChatHistory({ conversations, selectedId, onSelect, onNew, onDelete }: Readonly<{
  conversations: Conversation[]; selectedId: string | null; onSelect: (item: Conversation) => void; onNew: () => void; onDelete: (item: Conversation) => void;
}>) {
  return <aside className="chat-history workspace-card">
    <button className="button button-primary button-full" type="button" onClick={onNew}><MessageSquarePlus size={15} />New conversation</button>
    <div className="side-label">Recent conversations</div>
    {conversations.length ? <div className="chat-history-list">{conversations.map((item) => <div className={`chat-history-item ${item.id === selectedId ? "active" : ""}`} key={item.id}><button type="button" onClick={() => onSelect(item)}>{item.title || "New conversation"}</button><button className="icon-button" type="button" aria-label={`Delete ${item.title}`} title="Delete conversation" onClick={() => onDelete(item)}><Trash2 size={14} /></button></div>)}</div> : <div className="empty-state">Your saved conversations will appear here.</div>}
  </aside>;
}