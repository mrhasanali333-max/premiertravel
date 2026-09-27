"use client";

import { Check, Copy, Sparkles } from "lucide-react";
import { useState } from "react";
import type { ChatMessage } from "@/types/chat";

export function MessageBubble({ message, onRegenerate }: Readonly<{ message: ChatMessage; onRegenerate?: () => void }>) {
  const [copied, setCopied] = useState(false);
  const assistant = message.role === "assistant";

  async function copy() {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch { setCopied(false); }
  }

  return <article className="message-row" data-role={message.role}>
    <span className={`message-avatar ${assistant ? "assistant" : "user"}`}>{assistant ? <Sparkles size={15} /> : "You"}</span>
    <div className="message-content"><div className="message-label">{assistant ? "NEXORA AI" : "You"}</div><div className="message-text">{message.content}</div>
      {assistant && <div className="message-actions"><button className="button button-quiet" type="button" onClick={copy} aria-label="Copy response">{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button>{onRegenerate && <button className="button button-quiet" type="button" onClick={onRegenerate}>Regenerate</button>}</div>}
    </div>
  </article>;
}