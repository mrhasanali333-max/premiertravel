"use client";

import { useState } from "react";
import { Check, Copy, Save, Sparkles, Trash2 } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { WritingOptions, WritingTool } from "@/types/tools";

const tools: { id: WritingTool; label: string }[] = [
  { id: "article", label: "Article Writer" }, { id: "blog", label: "Blog Writer" }, { id: "email", label: "Email Writer" }, { id: "cv", label: "CV Writer" }, { id: "cover-letter", label: "Cover Letter" }, { id: "rewriter", label: "Rewriter" }, { id: "grammar", label: "Grammar Checker" }, { id: "translator", label: "Translator" }, { id: "summarizer", label: "Summarizer" },
];

export function WritingWorkspace() {
  const { user } = useAuth();
  const [tool, setTool] = useState<WritingTool>("article");
  const [input, setInput] = useState("");
  const [tone, setTone] = useState("Professional");
  const [length, setLength] = useState("Medium");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!input.trim() || busy || !user) return;
    setError(""); setBusy(true); setSaved(false);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/writing", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ input: input.trim(), options: { tool, tone: tone.toLowerCase(), length: length.toLowerCase(), language } satisfies WritingOptions }) });
      const payload = await response.json() as { result?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Writing could not be generated.");
      setResult(payload.result || "");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Writing could not be generated."); }
    finally { setBusy(false); }
  }

  async function copy() {
    try { await navigator.clipboard.writeText(result); setCopied(true); window.setTimeout(() => setCopied(false), 1500); }
    catch { setError("Clipboard access was blocked by the browser."); }
  }

  async function save() {
    if (!db || !user || !result) return;
    try {
      await addDoc(collection(db, "history"), { userId: user.uid, type: "writing", title: `${tools.find((item) => item.id === tool)?.label || "Writing"} result`, content: result, createdAt: serverTimestamp() });
      setSaved(true);
    } catch { setError("The result could not be saved. Check your Firestore rules."); }
  }

  function clear() { setInput(""); setResult(""); setError(""); setSaved(false); }

  return <WorkspaceShell><div className="workspace-top"><div><h1>AI Writing</h1><p>Draft and refine text with a few clear options.</p></div></div>
    <div className="writing-layout">
      <aside className="workspace-card writing-tools"><div className="side-label">Choose a tool</div><div className="tool-select">{tools.map((item) => <button className={tool === item.id ? "active" : ""} key={item.id} onClick={() => setTool(item.id)} type="button">{item.label}</button>)}</div></aside>
      <section className="page-stack">
        <div className="workspace-card writing-input-panel"><h2 className="section-title">Your brief</h2><label className="form-field" htmlFor="writing-input">Add instructions or paste text<textarea className="textarea" id="writing-input" maxLength={15000} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Describe what you need, or paste a draft to improve…" /></label><div className="writing-options"><label className="form-field">Tone<select className="select" value={tone} onChange={(event) => setTone(event.target.value)}><option>Professional</option><option>Friendly</option><option>Confident</option><option>Academic</option><option>Concise</option></select></label><label className="form-field">Length<select className="select" value={length} onChange={(event) => setLength(event.target.value)}><option>Short</option><option>Medium</option><option>Long</option></select></label><label className="form-field">Language<select className="select" value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>Spanish</option><option>French</option><option>German</option><option>Arabic</option><option>Urdu</option></select></label></div>{error && <ErrorMessage message={error} />}<div className="writing-actions"><button className="button button-secondary" type="button" onClick={clear}><Trash2 size={15} />Clear</button><button className="button button-primary" type="button" onClick={() => void generate()} disabled={busy || !input.trim()}>{busy ? <span className="spinner" /> : <Sparkles size={15} />}{busy ? "Generating…" : "Generate"}</button></div></div>
        <div className="workspace-card writing-result"><div className="result-header"><h2 className="section-title">Result</h2>{result && <div className="result-tools"><button className="button button-quiet" type="button" onClick={() => void copy()}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button><button className="button button-quiet" type="button" onClick={() => void generate()} disabled={busy}>{busy ? "Working…" : "Regenerate"}</button><button className="button button-quiet" type="button" onClick={() => void save()} disabled={saved}>{saved ? <Check size={14} /> : <Save size={14} />}{saved ? "Saved" : "Save"}</button></div>}</div><div className="result-box">{busy ? <div className="empty-state"><span className="spinner" /></div> : result || <div className="empty-state"><strong>Your result will appear here</strong>Choose a tool, add a brief and generate a draft.</div>}</div></div>
      </section>
    </div>
  </WorkspaceShell>;
}