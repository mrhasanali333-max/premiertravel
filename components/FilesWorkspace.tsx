"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Check, FileUp, Languages, MessageCircleQuestion, Sparkles, Search, ListFilter } from "lucide-react";
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
  { id: "quiz", label: "Generate quiz", icon: Check },
  { id: "key-points", label: "Key points", icon: FileUp },
  { id: "notes", label: "Generate notes", icon: FileUp },
  { id: "analyze", label: "Analyze document", icon: Sparkles },
  { id: "csv-patterns", label: "Analyze CSV", icon: ListFilter },
  { id: "rewrite", label: "Rewrite text", icon: FileUp },
  { id: "translate", label: "Translate", icon: Languages },
];
const acceptedTypes: Record<string, string> = { ".pdf": "application/pdf", ".txt": "text/plain", ".csv": "text/csv", ".docx": "application/vnd.openxmlformats-officedocument.wordprocessingml.document", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg", ".webp": "image/webp" };

export function FilesWorkspace() {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [files, setFiles] = useState<UserFile[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [action, setAction] = useState<DocumentAction>("summarize");
  const [prompt, setPrompt] = useState("");
  const [result, setResult] = useState("");
  const [fileConversation, setFileConversation] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState("");
  const [dragging, setDragging] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("newest");

  const refresh = useCallback(async () => {
    if (!db || !user) return;
    try {
      const snapshot = await getDocs(query(collection(db, "files"), where("userId", "==", user.uid)));
      const rows = snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as UserFile);
      const timestamp = (value: unknown) => value && typeof value === "object" && "toMillis" in value && typeof value.toMillis === "function" ? value.toMillis() : 0;
      rows.sort((left, right) => timestamp(right.createdAt) - timestamp(left.createdAt));
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
    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    if (acceptedTypes[extension] !== file.type) { setError("Choose a PDF, TXT, CSV, DOCX, PNG, JPEG or WebP file."); return; }
    if (file.size > 20 * 1024 * 1024) { setError("Files must be under 20 MB."); return; }
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

  async function renameFile(file: UserFile) {
    if (!user) return;
    const currentBase = file.name.includes(".") ? file.name.slice(0, file.name.lastIndexOf(".")) : file.name;
    const nextName = window.prompt("Rename file", currentBase);
    if (!nextName || nextName.trim() === currentBase) return;
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/files/${file.id}`, { method: "PATCH", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ name: nextName.trim() }) });
      const payload = await response.json() as { name?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "File could not be renamed.");
      setFiles((current) => current.map((item) => item.id === file.id ? { ...item, name: payload.name || item.name } : item));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "File could not be renamed."); }
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
      if (selectedId === file.id) { setSelectedId(""); setResult(""); setFileConversation([]); }
    } catch (reason) { setError(reason instanceof Error ? reason.message : "File could not be deleted."); }
    finally { setDeleting(""); }
  }

  async function analyze() {
    if (!user || !selectedId || busy) return;
    setBusy(true); setError(""); setResult("");
    const question = prompt.trim();
    try {
      const token = await user.getIdToken();
      const conversationContext = action === "ask" && fileConversation.length ? `Conversation so far:\n${fileConversation.map((turn) => `${turn.role}: ${turn.content}`).join("\n\n")}\n\n` : "";
      const response = await fetch("/api/files/analyze", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ fileId: selectedId, action, prompt: `${conversationContext}${question}` }) });
      const payload = await response.json() as { result?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Document analysis failed.");
      setResult(payload.result || "");
      if (action === "ask") setFileConversation((current) => [...current, { role: "user", content: question }, { role: "assistant", content: payload.result || "" }]);
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Document analysis failed."); }
    finally { setBusy(false); }
  }

  const visibleFiles = files.filter((file) => file.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => sort === "name" ? a.name.localeCompare(b.name) : sort === "oldest" ? String(a.createdAt || "").localeCompare(String(b.createdAt || "")) : String(b.createdAt || "").localeCompare(String(a.createdAt || "")));

  return <WorkspaceShell><div className="workspace-top"><div><h1>Files workspace</h1><p>Upload, organize and analyze files that belong to your account.</p></div></div>
    {error && <div style={{ marginBottom: 16 }}><ErrorMessage message={error} /></div>}
    <div className="files-layout"><section className="page-stack">
      <div className={`upload-zone ${dragging ? "dragging" : ""}`} onDragOver={(event) => { event.preventDefault(); setDragging(true); }} onDragLeave={() => setDragging(false)} onDrop={(event) => { event.preventDefault(); setDragging(false); const file = event.dataTransfer.files[0]; if (file) upload(file); }}>
        <span className="tool-icon"><FileUp size={19} /></span><h2>Drop a file here</h2><p>PDF, TXT, CSV, DOCX, PNG, JPEG or WebP · up to 20 MB</p><button className="button button-secondary" type="button" onClick={() => inputRef.current?.click()} disabled={uploading}>{uploading ? `Uploading ${progress}%` : "Choose file"}</button><input ref={inputRef} type="file" accept="application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document,image/png,image/jpeg,image/webp,.pdf,.txt,.csv,.docx" hidden onChange={(event) => { const file = event.target.files?.[0]; if (file) upload(file); event.currentTarget.value = ""; }} />{uploading && <div className="progress-track"><span style={{ width: `${progress}%` }} /></div>}
      </div>
      <div><div className="files-heading"><h2 className="section-title">Your files</h2><span>{visibleFiles.length} / {files.length}</span></div><div className="file-toolbar"><label className="tool-search"><Search size={15} /><input aria-label="Search files" placeholder="Search files" value={search} onChange={(event) => setSearch(event.target.value)} /></label><select className="select" aria-label="Sort files" value={sort} onChange={(event) => setSort(event.target.value)}><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="name">Name</option></select></div>{loading ? <Loading label="Loading files" /> : visibleFiles.length ? <div className="file-list">{visibleFiles.map((file) => <div className={file.id === selectedId ? "selected-file" : ""} key={file.id} onClick={() => { setSelectedId(file.id); setResult(""); }}><FileCard file={file} deleting={deleting === file.id} onDelete={removeFile} onRename={renameFile} /></div>)}</div> : <div className="workspace-card empty-state"><strong>{search ? "No matching files" : "No files yet"}</strong>{search ? "Try another file name." : "Upload a document or image to begin."}</div>}</div>
    </section>
    <section className="workspace-card file-analysis"><h2 className="section-title">Analyze a document</h2>{files.length ? <>
      <label className="form-field">Selected file<select className="select" value={selectedId} onChange={(event) => { setSelectedId(event.target.value); setResult(""); setFileConversation([]); }}>{files.map((file) => <option key={file.id} value={file.id}>{file.name}</option>)}</select></label>
      <div className="analysis-actions">{actions.map(({ id, label, icon: Icon }) => <button className={`analysis-action ${action === id ? "active" : ""}`} key={id} type="button" onClick={() => setAction(id)}><Icon size={15} />{label}</button>)}</div>
      {(action === "ask" || action === "translate" || action === "rewrite") && <label className="form-field">{action === "ask" ? "Your question" : action === "rewrite" ? "Rewrite instructions" : "Translate into"}<input className="input" value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder={action === "ask" ? "Ask a question about this file…" : action === "rewrite" ? "Tone, audience or format" : "For example, Urdu"} /></label>}
      <button className="button button-primary button-full" type="button" disabled={busy || !selectedId} onClick={() => void analyze()}>{busy ? <><span className="spinner" />Working…</> : "Run analysis"}</button>
      {action === "ask" && fileConversation.length > 0 ? <div className="file-chat-thread" aria-live="polite">{fileConversation.map((turn, index) => <article className={`file-chat-turn ${turn.role}`} key={`${index}-${turn.role}`}><strong>{turn.role === "user" ? "You" : "NEXORA AI"}</strong><p>{turn.content}</p></article>)}{busy && <Loading label="Searching the selected file" />}</div> : <div className="file-result">{busy ? <Loading label="Analyzing document" /> : result || <p className="muted-text">Text and CSV files are processed locally. PDF, DOCX and image analysis require a configured extraction provider; a missing provider returns an error without showing a false result.</p>}</div>}
    </> : <div className="empty-state"><strong>Upload a file to begin</strong>Analysis actions will appear after a file is uploaded.</div>}</section></div>
  </WorkspaceShell>;
}