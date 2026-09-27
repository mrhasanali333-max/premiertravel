"use client";

import { useRouter } from "next/navigation";
import { ArrowUp, Paperclip, Mic } from "lucide-react";
import { useState, type FormEvent } from "react";
import { useAuth } from "@/components/AuthProvider";

export function PromptLauncher() {
  const [prompt, setPrompt] = useState("");
  const router = useRouter();
  const { user } = useAuth();

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const query = prompt.trim();
    if (!query) return;
    const destination = `/chat?prompt=${encodeURIComponent(query)}`;
    router.push(user ? destination : `/login?next=${encodeURIComponent(destination)}`);
  }

  return (
    <form className="prompt-box" onSubmit={submit}>
      <textarea aria-label="Describe what you want to do" maxLength={4000} placeholder="What do you want to do?" value={prompt} onChange={(event) => setPrompt(event.target.value)} />
      <div className="prompt-controls">
        <div className="prompt-tools">
          <button type="button" title="Attach a file in the workspace" aria-label="File attachment available in workspace"><Paperclip size={17} /></button>
          <button type="button" title="Voice input coming soon" aria-label="Voice input coming soon" disabled><Mic size={17} /></button>
        </div>
        <button className="button button-primary prompt-submit" disabled={!prompt.trim()} type="submit">Start with AI <ArrowUp size={15} /></button>
      </div>
    </form>
  );
}