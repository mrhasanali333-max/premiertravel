"use client";

import { useRef, useState } from "react";
import { useEffect } from "react";
import { doc, getDoc } from "firebase/firestore";
import { Check, Copy, Download, ImagePlus, Sparkles, Trash2, Upload } from "lucide-react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";

type ImageAction = "generate" | "describe" | "remove-background" | "enhance";

export function ImageWorkspace({ historyId }: Readonly<{ historyId?: string }>) {
  const { user } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const [action, setAction] = useState<ImageAction>("generate");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("Editorial");
  const [ratio, setRatio] = useState("square");
  const [quality, setQuality] = useState("standard");
  const [count, setCount] = useState("1");
  const [file, setFile] = useState<File | null>(null);
  const [images, setImages] = useState<string[]>([]);
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let active = true;
    const objectUrls: string[] = [];
    async function loadHistory() {
      if (!historyId || !user || !db) return;
      try {
        const snapshot = await getDoc(doc(db, "history", historyId));
        if (!snapshot.exists() || snapshot.data().userId !== user.uid) throw new Error("Saved image entry was not found.");
        const data = snapshot.data();
        const images = Array.isArray(data.images) ? data.images.filter((image): image is string => typeof image === "string") : [];
        const ids = Array.isArray(data.imageIds) ? data.imageIds.filter((id): id is string => typeof id === "string") : [];
        const token = await user.getIdToken();
        const stored = await Promise.all(ids.map(async (id) => {
          const response = await fetch(`/api/image/${encodeURIComponent(id)}`, { headers: { authorization: `Bearer ${token}` } });
          if (!response.ok) return "";
          const url = URL.createObjectURL(await response.blob());
          objectUrls.push(url);
          return url;
        }));
        if (active) { setPrompt(String(data.prompt || "")); setDescription(String(data.resultPrompt || "")); setImages([...images, ...stored.filter(Boolean)]); }
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Saved images could not be loaded."); }
    }
    void loadHistory();
    return () => { active = false; objectUrls.forEach((url) => URL.revokeObjectURL(url)); };
  }, [historyId, user]);

  async function submit() {
    if (!user || busy) return;
    if (action === "generate" && !prompt.trim()) { setError("Describe the image you want to create."); return; }
    if (action !== "generate" && !file) { setError("Choose an image to continue."); return; }
    setBusy(true); setError(""); setImages([]); setDescription("");
    try {
      const token = await user.getIdToken();
      const form = new FormData(); form.append("action", action); form.append("prompt", prompt); form.append("style", style); form.append("aspectRatio", ratio); form.append("quality", quality); form.append("count", count);
      if (file) form.append("file", file);
      const response = await fetch("/api/image", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
      const payload = await response.json() as { images?: string[]; image?: string; prompt?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "The image task could not be completed.");
      setImages(payload.images || (payload.image ? [payload.image] : []));
      setDescription(payload.prompt || "");
      if (action === "describe" && payload.prompt) setPrompt(payload.prompt);
      if (!payload.images?.length && !payload.image && !payload.prompt) throw new Error("The image service returned no usable result.");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The image task could not be completed."); }
    finally { setBusy(false); }
  }

  async function copyPrompt() { try { await navigator.clipboard.writeText(prompt); setCopied(true); window.setTimeout(() => setCopied(false), 1400); } catch { setError("Clipboard access is unavailable in this browser."); } }
  function clear() { setPrompt(""); setFile(null); setImages([]); setDescription(""); setError(""); }

  return <WorkspaceShell><div className="workspace-top"><div><h1>AI Image</h1><p>Create images or process an upload with a configured image provider.</p></div></div>
    <div className="image-tabs" role="tablist" aria-label="Image tools">{([["generate", "Text to image"], ["describe", "Image to prompt"], ["remove-background", "Remove background"], ["enhance", "Enhance"]] as [ImageAction, string][]).map(([id, label]) => <button role="tab" aria-selected={action === id} className={action === id ? "active" : ""} key={id} type="button" onClick={() => { setAction(id); setError(""); setImages([]); }}>{label}</button>)}</div>
    <div className="image-workspace"><section className="workspace-card image-controls">
      {action === "generate" ? <>
        <label className="form-field" htmlFor="image-prompt">What do you want to create?<textarea className="textarea" id="image-prompt" maxLength={4000} value={prompt} onChange={(event) => setPrompt(event.target.value)} placeholder="A quiet modern reading room filled with morning light…" /></label>
        <div className="writing-options"><label className="form-field">Style<select className="select" value={style} onChange={(event) => setStyle(event.target.value)}><option>Editorial</option><option>Photorealistic</option><option>Illustration</option><option>Watercolor</option><option>3D render</option><option>Minimal</option></select></label><label className="form-field">Aspect ratio<select className="select" value={ratio} onChange={(event) => setRatio(event.target.value)}><option value="square">Square</option><option value="portrait">Portrait</option><option value="landscape">Landscape</option></select></label><label className="form-field">Quality<select className="select" value={quality} onChange={(event) => setQuality(event.target.value)}><option value="standard">Standard</option><option value="high">High</option></select></label><label className="form-field">Images<select className="select" value={count} onChange={(event) => setCount(event.target.value)}><option value="1">1 image</option><option value="2">2 images</option><option value="3">3 images</option><option value="4">4 images</option></select></label></div>
      </> : <>
        <button className={`image-upload ${file ? "has-file" : ""}`} type="button" onClick={() => inputRef.current?.click()}><Upload size={20} /><strong>{file?.name || "Choose an image"}</strong><span>PNG, JPEG or WebP · up to 10 MB</span></button><input ref={inputRef} hidden type="file" accept="image/png,image/jpeg,image/webp" onChange={(event) => setFile(event.target.files?.[0] || null)} />
        <p className="inline-note">Processing is performed by your configured image provider. Uploaded images are not stored by this feature.</p>
        {action !== "describe" && <label className="form-field">Instructions (optional)<textarea className="textarea" value={prompt} maxLength={1000} onChange={(event) => setPrompt(event.target.value)} placeholder={action === "enhance" ? "Describe the enhancement" : "Describe the desired transparent result"} /></label>}
      </>}
      {error && <ErrorMessage message={error} />}<div className="writing-actions"><button className="button button-secondary" type="button" onClick={clear}><Trash2 size={14} />Clear</button><button className="button button-primary" type="button" disabled={busy || (action === "generate" ? !prompt.trim() : !file)} onClick={() => void submit()}>{busy ? <span className="spinner" /> : <Sparkles size={14} />}{busy ? "Processing…" : action === "generate" ? "Generate" : action === "describe" ? "Describe image" : action === "enhance" ? "Enhance image" : "Remove background"}</button></div>
    </section>
    <section className="workspace-card image-gallery"><div className="result-header"><h2 className="section-title">{images.length ? "Your images" : "Gallery"}</h2>{prompt && <button className="button button-quiet" type="button" onClick={() => void copyPrompt()}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy prompt"}</button>}</div>
      {busy ? <div className="empty-state"><span className="spinner" /><p>Waiting for the image provider…</p></div> : images.length ? <div className="image-grid">{images.map((src, index) => <figure className="generated-image" key={`${index}-${src.slice(0, 40)}`}><a href={src} target="_blank" rel="noreferrer" aria-label={`Preview image ${index + 1}`}><img src={src} alt={`Generated result ${index + 1}`} /></a><figcaption><span>Image {index + 1}</span><a className="icon-button" href={src} download={`nexora-image-${index + 1}.png`} aria-label="Download image"><Download size={15} /></a></figcaption></figure>)}</div> : description ? <div className="result-box">{description}</div> : <div className="empty-state"><span className="tool-icon"><ImagePlus size={18} /></span><strong>Results appear here</strong>Generated images and successful image processing are saved to your history.</div>}
    </section></div>
  </WorkspaceShell>;
}