"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { addDoc, collection, deleteDoc, doc, getDocs, orderBy, query, serverTimestamp, setDoc, where, writeBatch } from "firebase/firestore";
import { AlertCircle } from "lucide-react";
import { ChatBox } from "@/components/ChatBox";
import { ChatHistory } from "@/components/ChatHistory";
import { MessageBubble } from "@/components/MessageBubble";
import { TypingIndicator } from "@/components/TypingIndicator";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Loading } from "@/components/Loading";
import { auth, db } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import type { ChatMessage, Conversation } from "@/types/chat";

export function ChatClient({ initialPrompt, initialConversationId }: Readonly<{ initialPrompt: string; initialConversationId?: string }>) {
  const { user } = useAuth();
  const [input, setInput] = useState(initialPrompt);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, sending]);

  const refreshConversations = useCallback(async () => {
    if (!db || !user) return [];
    const result = await getDocs(query(collection(db, "conversations"), where("userId", "==", user.uid)));
    const rows = result.docs.map((item) => ({ id: item.id, title: String(item.data().title || "New conversation"), userId: user.uid, updatedAt: item.data().updatedAt }));
    rows.sort((left, right) => String(right.updatedAt || "").localeCompare(String(left.updatedAt || "")));
    setConversations(rows);
    return rows;
  }, [user]);

  const openConversation = useCallback(async (item: Conversation) => {
    if (!db) return;
    setError("");
    setConversationId(item.id);
    try {
      const result = await getDocs(query(collection(db, "conversations", item.id, "messages"), orderBy("createdAt", "asc")));
      const rows = result.docs.map((message) => ({ id: message.id, role: message.data().role as ChatMessage["role"], content: String(message.data().content || "") }));
      setMessages(rows);
    } catch { setError("This conversation could not be opened."); }
  }, []);

  useEffect(() => {
    let active = true;
    async function load() {
      if (!db || !user) { setLoadingHistory(false); return; }
      try {
        const rows = await refreshConversations();
        const requested = rows.find((item) => item.id === initialConversationId);
        if (requested) await openConversation(requested);
      }
      catch { if (active) setError("Conversation history could not load. Check your Firestore setup and rules."); }
      finally { if (active) setLoadingHistory(false); }
    }
    void load();
    return () => { active = false; };
  }, [initialConversationId, openConversation, refreshConversations, user]);

  function newConversation() { setConversationId(null); setMessages([]); setInput(""); setError(""); }

  async function persistMessage(id: string, role: ChatMessage["role"], content: string) {
    if (!db || !user) throw new Error("Firestore is not configured.");
    const reference = await addDoc(collection(db, "conversations", id, "messages"), { userId: user.uid, role, content, createdAt: serverTimestamp() });
    return reference.id;
  }

  async function send(value = input, regenerate = false) {
    const text = value.trim();
    if (!text || sending || !auth || !db || !user) return;
    setSending(true);
    setError("");
    let activeId = conversationId;
    const userMessage: ChatMessage | null = regenerate ? null : { id: crypto.randomUUID(), role: "user", content: text };
    const nextMessages = regenerate ? messages.slice(0, -1) : [...messages, userMessage!];
    setMessages(nextMessages);
    setInput("");
    try {
      if (!activeId) {
        const conversation = await addDoc(collection(db, "conversations"), { userId: user.uid, title: text.slice(0, 54), createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
        activeId = conversation.id;
        setConversationId(activeId);
      }
      if (regenerate && messages.at(-1)?.role === "assistant") {
        await deleteDoc(doc(db, "conversations", activeId, "messages", messages.at(-1)!.id));
      }
      if (userMessage) {
        const messageId = await persistMessage(activeId, "user", text);
        userMessage.id = messageId;
      }
      const token = await user.getIdToken();
      const response = await fetch("/api/chat", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ messages: nextMessages.map(({ role, content }) => ({ role, content })) }) });
      const payload = await response.json() as { response?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "The response could not be generated.");
      const assistantContent = payload.response || "";
      const assistantId = await persistMessage(activeId, "assistant", assistantContent);
      const assistant: ChatMessage = { id: assistantId, role: "assistant", content: assistantContent };
      setMessages((current) => [...current, assistant]);
      await setDoc(doc(db, "conversations", activeId), { userId: user.uid, title: String((nextMessages[0]?.content || text).slice(0, 54)), updatedAt: serverTimestamp() }, { merge: true });
      await setDoc(doc(db, "history", activeId), { id: activeId, userId: user.uid, type: "chat", title: String((nextMessages[0]?.content || text).slice(0, 54)), createdAt: serverTimestamp() }, { merge: true });
      await refreshConversations();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Your message could not be sent. Please try again.");
    } finally { setSending(false); }
  }

  async function deleteConversation(item: Conversation) {
    if (!db) return;
    const confirmed = window.confirm(`Delete “${item.title}” and its messages?`);
    if (!confirmed) return;
    try {
      const result = await getDocs(collection(db, "conversations", item.id, "messages"));
      const batch = writeBatch(db);
      result.docs.forEach((message) => batch.delete(message.ref));
      batch.delete(doc(db, "conversations", item.id));
      await batch.commit();
      await deleteDoc(doc(db, "history", item.id));
      setConversations((current) => current.filter((conversation) => conversation.id !== item.id));
      if (conversationId === item.id) newConversation();
    } catch { setError("Conversation could not be deleted. Check your Firestore rules."); }
  }

  const lastUser = [...messages].reverse().find((message) => message.role === "user");
  return <WorkspaceShell><div className="workspace-top chat-heading"><div><h1>AI Chat</h1><p>Ask a question, explore an idea or work through a task.</p></div></div>
    <div className="chat-layout">
      <ChatHistory conversations={conversations} selectedId={conversationId} onSelect={openConversation} onNew={newConversation} onDelete={deleteConversation} />
      <section className="chat-main workspace-card" aria-label="AI conversation">
        {loadingHistory ? <Loading label="Loading conversations" /> : messages.length === 0 ? <div className="chat-empty"><span className="tool-icon"><AlertCircle size={18} /></span><h2>What are we working on?</h2><p>Start with a question or describe the task you have in mind.</p><div className="suggestion-row"><button type="button" onClick={() => setInput("Help me plan a focused work session")}>Plan my day</button><button type="button" onClick={() => setInput("Explain a difficult concept in simple terms")}>Explain a concept</button></div></div> : <div className="messages-list">{messages.map((message, index) => <MessageBubble key={message.id} message={message} onRegenerate={message.role === "assistant" && index === messages.length - 1 && lastUser ? () => void send(lastUser.content, true) : undefined} />)}{sending && <TypingIndicator />}<div ref={bottomRef} /></div>}
        {error && <div className="chat-error" role="alert">{error}</div>}
        <div className="chat-composer"><ChatBox value={input} onChange={setInput} onSubmit={() => void send()} disabled={sending} /><p>AI responses can be inaccurate. Verify important details.</p></div>
      </section>
    </div>
  </WorkspaceShell>;
}