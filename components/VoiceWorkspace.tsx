"use client";

import { useRef, useState } from "react";
import { Check, Copy, Download, Mic, Square, Volume2 } from "lucide-react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useAuth } from "@/components/AuthProvider";

export function VoiceWorkspace() {
  const { user } = useAuth();
  const audioInput = useRef<HTMLInputElement>(null);
  const recorder = useRef<MediaRecorder | null>(null);
  const chunks = useRef<Blob[]>([]);
  const [mode, setMode] = useState<"transcribe" | "speech">("transcribe");
  const [file, setFile] = useState<File | null>(null);
  const [recording, setRecording] = useState(false);
  const [text, setText] = useState("");
  const [voice, setVoice] = useState("alloy");
  const [speed, setSpeed] = useState("1");
  const [language, setLanguage] = useState("English");
  const [audioTask, setAudioTask] = useState("transcribe");
  const [transcript, setTranscript] = useState("");
  const [analysis, setAnalysis] = useState("");
  const [audioUrl, setAudioUrl] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);

  async function startRecording() {
    if (!navigator.mediaDevices?.getUserMedia || !window.MediaRecorder) { setError("Audio recording is not supported in this browser. Upload an audio file instead."); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const media = new MediaRecorder(stream);
      chunks.current = [];
      media.ondataavailable = (event) => { if (event.data.size) chunks.current.push(event.data); };
      media.onstop = () => { const blob = new Blob(chunks.current, { type: media.mimeType || "audio/webm" }); setFile(new File([blob], "recording.webm", { type: blob.type })); stream.getTracks().forEach((track) => track.stop()); };
      recorder.current = media; media.start(); setRecording(true); setError("");
    } catch { setError("Microphone permission was denied or the recording device is unavailable."); }
  }

  function stopRecording() { recorder.current?.stop(); setRecording(false); }

  async function transcribe() {
    if (!user || !file || busy) return;
    setBusy(true); setError(""); setTranscript("");
    try {
      const token = await user.getIdToken(); const form = new FormData(); form.append("file", file); form.append("language", language.toLowerCase()); form.append("task", audioTask);
      const response = await fetch("/api/voice/transcribe", { method: "POST", headers: { authorization: `Bearer ${token}` }, body: form });
      const payload = await response.json() as { transcript?: string; analysis?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "Transcription failed.");
      setTranscript(payload.transcript || "");
      setAnalysis(payload.analysis || "");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Transcription failed."); }
    finally { setBusy(false); }
  }

  async function speak() {
    if (!user || !text.trim() || busy) return;
    setBusy(true); setError(""); setAudioUrl("");
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/voice/speech", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ text: text.trim(), voice, speed: Number(speed) }) });
      if (!response.ok) { const payload = await response.json() as { error?: string }; throw new Error(payload.error || "Speech generation failed."); }
      setAudioUrl(URL.createObjectURL(await response.blob()));
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Speech generation failed."); }
    finally { setBusy(false); }
  }

  async function copy() { try { await navigator.clipboard.writeText(transcript); setCopied(true); window.setTimeout(() => setCopied(false), 1400); } catch { setError("Clipboard access is unavailable in this browser."); } }

  return <WorkspaceShell><div className="workspace-top"><div><h1>AI Voice</h1><p>Transcribe audio or create speech with a configured voice provider.</p></div></div>
    <div className="image-tabs" role="tablist" aria-label="Voice tools"><button role="tab" aria-selected={mode === "transcribe"} className={mode === "transcribe" ? "active" : ""} type="button" onClick={() => setMode("transcribe")}>Speech to text</button><button role="tab" aria-selected={mode === "speech"} className={mode === "speech" ? "active" : ""} type="button" onClick={() => setMode("speech")}>Text to speech</button></div>
    <div className="voice-layout"><section className="workspace-card voice-controls">{mode === "transcribe" ? <>
      <h2 className="section-title">Speech to text</h2><button className={`image-upload ${file ? "has-file" : ""}`} type="button" onClick={() => audioInput.current?.click()}><Mic size={20} /><strong>{file?.name || "Choose an audio file"}</strong><span>MP3, M4A, WAV, WebM or OGG · up to 25 MB</span></button><input ref={audioInput} hidden type="file" accept="audio/*,.mp3,.m4a,.wav,.webm,.ogg" onChange={(event) => setFile(event.target.files?.[0] || null)} /><div className="recording-controls"><button className="button button-secondary" type="button" onClick={() => recording ? stopRecording() : void startRecording()}>{recording ? <Square size={14} /> : <Mic size={14} />}{recording ? "Stop recording" : "Record audio"}</button>{recording && <span className="recording-indicator">Recording…</span>}</div><label className="form-field">Task<select className="select" value={audioTask} onChange={(event) => setAudioTask(event.target.value)}><option value="transcribe">Transcription</option><option value="meeting">Meeting notes and action items</option><option value="summarize">Audio summary and keywords</option></select></label><label className="form-field">Audio language<select className="select" value={language} onChange={(event) => setLanguage(event.target.value)}><option>English</option><option>Spanish</option><option>French</option><option>German</option><option>Urdu</option><option>Arabic</option></select></label><button className="button button-primary" type="button" disabled={!file || busy || recording} onClick={() => void transcribe()}>{busy ? <span className="spinner" /> : <Mic size={14} />}{busy ? "Transcribing…" : "Transcribe"}</button>
    </> : <><h2 className="section-title">Create speech</h2><label className="form-field">Text<textarea className="textarea" maxLength={5000} value={text} onChange={(event) => setText(event.target.value)} placeholder="Type or paste text to speak…" /></label><div className="writing-options"><label className="form-field">Voice<select className="select" value={voice} onChange={(event) => setVoice(event.target.value)}><option value="alloy">Alloy</option><option value="echo">Echo</option><option value="fable">Fable</option><option value="onyx">Onyx</option><option value="nova">Nova</option><option value="shimmer">Shimmer</option></select></label><label className="form-field">Speed<select className="select" value={speed} onChange={(event) => setSpeed(event.target.value)}><option value="0.75">0.75x</option><option value="1">1x</option><option value="1.25">1.25x</option><option value="1.5">1.5x</option><option value="2">2x</option></select></label></div><button className="button button-primary" type="button" disabled={!text.trim() || busy} onClick={() => void speak()}>{busy ? <span className="spinner" /> : <Volume2 size={14} />}{busy ? "Generating…" : "Generate speech"}</button></>}
      {error && <div style={{ marginTop: 14 }}><ErrorMessage message={error} /></div>}
    </section><section className="workspace-card voice-result"><div className="result-header"><h2 className="section-title">{mode === "transcribe" ? "Transcript" : "Audio output"}</h2>{transcript && mode === "transcribe" && <div className="result-tools"><button className="button button-quiet" type="button" onClick={() => void copy()}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button><a className="button button-quiet" href={`data:text/plain;charset=utf-8,${encodeURIComponent(transcript)}`} download="nexora-transcript.txt"><Download size={14} />Download</a></div>}</div>{busy ? <div className="empty-state"><span className="spinner" /></div> : transcript && mode === "transcribe" ? <><div className="result-box">{transcript}</div>{analysis && <div className="result-box voice-analysis"><strong>Summary and action items</strong>{analysis}</div>}</> : audioUrl && mode === "speech" ? <div className="audio-output"><audio controls src={audioUrl}>Your browser does not support audio playback.</audio><a className="button button-secondary" href={audioUrl} download="nexora-speech.mp3"><Download size={14} />Download audio</a></div> : <div className="empty-state"><span className="tool-icon"><Volume2 size={18} /></span><strong>{mode === "transcribe" ? "Transcript appears here" : "Audio appears here"}</strong>Provider setup is required before audio can be processed.</div>}</section></div>
  </WorkspaceShell>;
}