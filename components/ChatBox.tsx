"use client";

import { ArrowUp } from "lucide-react";
import type { FormEvent, KeyboardEvent } from "react";

export function ChatBox({ value, onChange, onSubmit, disabled }: Readonly<{ value: string; onChange: (value: string) => void; onSubmit: () => void; disabled: boolean }>) {
  function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); onSubmit(); }
  function keyDown(event: KeyboardEvent<HTMLTextAreaElement>) {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); onSubmit(); }
  }
  return <form className="chat-input-box" onSubmit={submit}><textarea value={value} onChange={(event) => onChange(event.target.value)} onKeyDown={keyDown} placeholder="Message NEXORA AI…" aria-label="Message NEXORA AI" rows={2} disabled={disabled} /><div className="chat-input-bottom"><span>Enter to send · Shift + Enter for a new line</span><button className="button button-primary send-button" type="submit" disabled={disabled || !value.trim()} aria-label="Send message"><ArrowUp size={17} /></button></div></form>;
}