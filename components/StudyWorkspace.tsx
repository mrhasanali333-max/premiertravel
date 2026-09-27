"use client";

import { useState } from "react";
import { BookOpenCheck, Check, Copy, Sparkles } from "lucide-react";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { ErrorMessage } from "@/components/ErrorMessage";
import type { StudyTool } from "@/types/tools";

const studyTools: { id: StudyTool; label: string }[] = [{ id: "homework", label: "Homework Helper" }, { id: "notes", label: "Notes Summarizer" }, { id: "mcq", label: "MCQ Generator" }, { id: "quiz", label: "Quiz Generator" }, { id: "planner", label: "Study Planner" }, { id: "explain", label: "Question Explanation" }];

export function StudyWorkspace() {
  const { user } = useAuth();
  const [tool, setTool] = useState<StudyTool>("homework");
  const [input, setInput] = useState("");
  const [count, setCount] = useState("5");
  const [difficulty, setDifficulty] = useState("Medium");
  const [language, setLanguage] = useState("English");
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  async function generate() {
    if (!input.trim() || !user || busy) return;
    setBusy(true); setError(""); setResult("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/study", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ tool, input, count: Number(count), difficulty, language }) });
      const payload = await response.json() as { result?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Study help could not be generated.");
      setResult(payload.result || "");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Study help could not be generated."); }
    finally { setBusy(false); }
  }

  async function save() {
    if (!db || !user || !result) return;
    try { await addDoc(collection(db, "history"), { userId: user.uid, type: "study", title: `${studyTools.find((item) => item.id === tool)?.label}: ${input.slice(0, 54)}`, content: result, createdAt: serverTimestamp() }); }
    catch { setError("The result could not be saved. Check your Firestore rules."); }
  }

  async function copy() { try { await navigator.clipboard.writeText(result); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { setError("Clipboard access was blocked by the browser."); } }

  return <WorkspaceShell><div className="workspace-top"><div><h1>AI Study</h1><p>Understand a topic and practice it at your own pace.</p></div></div>
    <div className="writing-layout"><aside className="workspace-card writing-tools"><div className="side-label">Study tools</div><div className="tool-select">{studyTools.map((item) => <button className={tool === item.id ? "active" : ""} key={item.id} onClick={() => setTool(item.id)} type="button">{item.label}</button>)}</div></aside>
      <section className="page-stack"><div className="workspace-card writing-input-panel"><h2 className="section-title">{studyTools.find((item) => item.id === tool)?.label}</h2><label className="form-field" htmlFor="study-input">{tool === "mcq" || tool === "quiz" ? "Topic" : "Question or material"}<textarea className="textarea" id="study-input" maxLength={12000} placeholder={tool === "homework" ? "Enter your question…" : "Add a topic, question or notes…"} value={input} onChange={(event) => setInput(event.target.value)} /></label><div className="writing-options"><label className="form-field">Number of questions<input className="input" type="number" min={1} max={20} value={count} onChange={(event) => setCount(event.target.value)} disabled={tool !== "mcq" && tool !== "quiz"} /></label><label className="form-field">Difficulty<select className="select" value={difficulty} onChange={(event) => setDifficulty(event.target.value)}><option>Easy</option><option>Medium</option><option>Hard</option></select></label><label className="form-field">Language<select className="select" value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>Spanish</option><option>French</option><option>German</option><option>Arabic</option><option>Urdu</option></select></label></div><p className="inline-note">PDF and image attachments are available in the Files workspace.</p>{error && <ErrorMessage message={error} />}<button className="button button-primary" type="button" onClick={() => void generate()} disabled={busy || !input.trim()} style={{ marginTop: 16 }}>{busy ? <span className="spinner" /> : <BookOpenCheck size={15} />}{busy ? "Working…" : tool === "homework" ? "Explain" : "Generate"}</button></div>
        <div className="workspace-card writing-result"><div className="result-header"><h2 className="section-title">Study result</h2>{result && <div className="result-tools"><button className="button button-quiet" type="button" onClick={() => void copy()}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button><button className="button button-quiet" type="button" onClick={() => void save()}><Sparkles size={14} />Save</button></div>}</div><div className="result-box">{busy ? <div className="empty-state"><span className="spinner" /></div> : result || <div className="empty-state"><strong>Your explanation will appear here</strong>Ask a question or add a topic to begin.</div>}</div></div>
      </section>
    </div>
  </WorkspaceShell>;
}