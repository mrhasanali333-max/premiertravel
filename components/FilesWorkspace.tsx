"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Check, FileUp, Languages, MessageCircleQuestion, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";
import { ErrorMessage } from "@/components/ErrorMessage";
import { FileCard } from "@/components/FileCard";
import { Loading } from "@/components/Loading";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { db } from "@/lib/firebase";
import type { DocumentAction, UserFile } from "@/types/files";

const actions: { id: DocumentAction; label: string; icon: typeof Sparkles }[] = [
  { id: "summarize", label: "Summarize", icon: FileUp },
  { id: "ask", label: "Ask questions", icon: MessageCircleQuestion },
  { id: "explain", label: "Explain", icon: Sparkles },
  { id: "mcqs", label: "Generate MCQs", icon: Check },
  { id: "translate", label: "Translate", icon: Languages },
];

export function FilesWorkspace() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UserFile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [action, setAction] = useState<DocumentAction>("summarize");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");

  const refresh = useCallback(async () => {
    if (!db || !user) return;
    try {
      const snapshot = await getDocs(query(collection(db, "files"), where("userId", "==", user.uid)));
      const rows = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as UserFile);
      rows.sort((left, right) => String(right.createdAt || "").localeCompare(String(left.createdAt || "")));
      setFiles(rows);
      setSelectedId((current) => current || rows[0]?.id || "");
    } catch { setError("Files could not load. Check Firestore configuration and access rules."); }
    finally { setLoading(false); }
  }, [user]);

  useEffect(() => {
    const task = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(task);
  }, [refresh]);

  function upload(file: File) {
    if (!user || uploading) return;
    if (file.type !== "application/pdf" || !file.name.toLowerCase().endsWith(".pdf")) { setError("Choose a PDF file."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("PDF files must be under 20 MB."); return; }
    setError(""); setUploading(true); setProgress(0);
    void user.getIdToken().then((token) => new Promise<void>((resolve, reject) => {
      const request = new XMLHttpRequest();
      request.open("POST", "/api/files/upload");
      request.setRequestHeader("authorization", `Bearer ${token}`);
      request.upload.onprogress = (event) => { if (event.lengthComputable) setProgress(Math.round(event.loaded / event.total * 100)); };
      request.onload = () => {
        const payload = JSON.parse(request.responseText || "{}") as { file?: { id?: string }; error?: string };
        if (request.status < 200 || request.status >= 300) { reject(new Error(payload.error || "Upload failed.")); return; }
        if (payload.file?.id) setSelectedId(payload.file.id);
        resolve();
      };
      request.onerror = () => reject(new Error("Network error while uploading the file."));
      const form = new FormData(); form.append("file", file); request.send(form);
    })).then(() => refresh()).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Upload failed.")).finally(() => setUploading(false));
  }

  async function removeFile(file: UserFile) {
    if (!user || !window.confirm(`Delete ${file.name}?`)) return;
    setDeleting(file.id); setError("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/files/${file.id}`, { method: "DELETE", headers: { authorization: `Bearer ${token}` } });
      const payload = await response.json() as { error?: string };
      if (!response.ok) throw new Error(payload.error || "File could not be deleted.");
      setFiles((current) => current.filter((item) => item.id !== file.id));
      if (selectedId === file.id) { setSelectedId(""); setResult(""); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "File could not be deleted."); }
    finally { setDeleting(""); }
  }

  async function analyze() {
    if (!user || !selectedId || busy) return;
    setBusy(true); setError(""); setResult("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/files/analyze", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ fileId: selectedId, action, prompt }) });
      const payload = await response.json() as { result?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Document analysis failed.");
      setResult(payload.result || "");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Document analysis failed."); }
    finally { setBusy(false); }
  }

  return <WorkspaceShell><div className="workspace-top"><div><h1>PDF workspace</h1><p>Upload a PDF, then choose what you need from it.</p></div></div>
    {error && <div style={{ marginBottom: 16 }}><ErrorMessage message={error} /></div>}
    <div className="files-layout"><section className="page-stack">
      <div className={`upload-zone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) upload(file); }}>
        <span className="tool-icon"><FileUp size={19} /></span><h2>Drop a PDF here</h2><p>PDF only · up to 20 MB</p><button className="button button-secondary" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? `Uploading ${progress}%` : "Choose file"}</button><input ref={inputRef} type="file" accept="application/pdf,.pdf" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file); event.currentTarget.value = ""; }} />{uploading && <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>}
      </div>
      <div><div className="files-heading"><h2 className="section-title">Your files</h2><span>{files.length} {files.length === 1 ? "file" : "files"}</span></div>{loading ? <Loading label="Loading files" /> : files.length ? <div className="file-list">{files.map((file) => <div className={file.id === selectedId ? "selected-file" : ""} key={file.id} onClick={() => { setSelectedId(file.id); setResult(""); }}><FileCard file={file} deleting={deleting === file.id} onDelete={removeFile} /></div>)}</div> : <div className="workspace-card empty-state"><strong>No documents uploaded</strong>Your PDFs stay private to your account.</div>}</div>
    </section>
    <section className="workspace-card file-analysis"><h2 className="section-title">Analyze a document</h2>{files.length ? <>
      <label className="form-field">Selected PDF<select className="select" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setResult(""); }}>{files.map((file) => <option key={file.id} value={file.id}>{file.name}</option>)}</select></label>
      <div className="analysis-actions">{actions.map(({ id, label, icon: Icon }) => <button className={`analysis-action ${action === id ? "active" : ""}`} key={id} type="button" onClick={() => setAction(id)}><Icon size={15} />{label}</button>)}</div>
      {(action === "ask" || action === "translate") && <label className="form-field">{action === "ask" ? "Your question" : "Translate into"}<input className="input" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={action === "ask" ? "Ask a question about this PDF…" : "For example, Urdu"} /></label>}
      <button className="button button-primary button-full" type="button" disabled={busy || !selectedId} onClick={() => void analyze()}>{busy ? <><span className="spinner" />Working…</> : "Run analysis"}</button>
      <div className="file-result">{busy ? <Loading label="Analyzing document" /> : result || <p className="muted-text">The result will appear here. Document analysis requires a configured PDF extraction service.</p>}</div>
    </> : <div className="empty-state"><strong>Upload a PDF to begin</strong>Analysis actions will appear after a file is uploaded.</div>}</section></div>
  </WorkspaceShell>;
}