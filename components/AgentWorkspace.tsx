"use client";

import { useEffect, useState } from "react";
import { collection, getDocs, query, where } from "firebase/firestore";
import { Bot, Check, Clock3, Sparkles } from "lucide-react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { ErrorMessage } from "@/components/ErrorMessage";
import { Loading } from "@/components/Loading";
import { useAuth } from "@/components/AuthProvider";
import { db } from "@/lib/firebase";
import { agents, type AgentId } from "@/lib/agents";

type RunResult = { name: string; status: "complete"; result: string };
type SavedRun = { id: string; agentId: string; status: string; input: string; createdAt?: { toDate?: () => Date } };

export function AgentWorkspace() {
  const { user } = useAuth();
  const [agentId, setAgentId] = useState<AgentId>("content");
  const [input, setInput] = useState("");
  const [results, setResults] = useState<RunResult[]>([]);
  const [runs, setRuns] = useState<SavedRun[]>([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  async function loadRuns() {
    if (!user || !db) return;
    try {
      const snapshot = await getDocs(query(collection(db, "agentRuns"), where("userId", "==", user.uid)));
      setRuns(snapshot.docs.map((item) => ({ ...item.data(), id: item.id }) as SavedRun).sort((a, b) => String(b.createdAt || "").localeCompare(String(a.createdAt || ""))).slice(0, 10));
    } catch { setError("Agent history could not be loaded. Check Firestore rules."); }
    finally { setLoading(false); }
  }

  useEffect(() => { const task = window.setTimeout(() => void loadRuns(), 0); return () => window.clearTimeout(task); }, [user]);

  async function runAgent() {
    if (!user || !input.trim() || busy) return;
    setBusy(true); setError(""); setResults([]);
    try {
      const token = await user.getIdToken();
      const response = await fetch("/api/agents/run", { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ agentId, input: input.trim() }) });
      const payload = await response.json() as { tasks?: RunResult[]; error?: string };
      if (!response.ok) throw new Error(payload.error || "The agent run could not be completed.");
      setResults(payload.tasks || []);
      await loadRuns();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "The agent run could not be completed."); }
    finally { setBusy(false); }
  }

  const selectedAgent = agents.find((agent) => agent.id === agentId)!;

  return <WorkspaceShell><div className="workspace-top"><div><h1>AI Agents</h1><p>Controlled multi-step workflows. Each task is explicit; no autonomous code execution.</p></div></div>
    <div className="agent-workspace"><section className="page-stack"><div className="agent-selector">{agents.map((agent) => <button className={`agent-option ${agentId === agent.id ? "active" : ""}`} type="button" key={agent.id} onClick={() => { setAgentId(agent.id); setResults([]); }}><span className="tool-icon"><Bot size={17} /></span><strong>{agent.name}</strong><span>{agent.description}</span></button>)}</div>
      <div className="workspace-card agent-run-form"><div className="eyebrow">{selectedAgent.name}</div><h2>{selectedAgent.description}</h2><div className="agent-task-list">{selectedAgent.tasks.map((task, index) => <span key={task}><span>{index + 1}</span>{task}</span>)}</div><label className="form-field" htmlFor="agent-input">Your request<textarea className="textarea" id="agent-input" maxLength={8000} value={input} onChange={(event) => setInput(event.target.value)} placeholder="Describe the outcome you want…" /></label>{error && <ErrorMessage message={error} />}<button className="button button-primary" type="button" disabled={busy || !input.trim()} onClick={() => void runAgent()}>{busy ? <><span className="spinner" />Working through tasks…</> : <><Sparkles size={14} />Run agent</>}</button><p className="muted-text">Agent steps run sequentially with a bounded task list. They do not browse, send messages, execute code, or make purchases.</p></div></section>
      {busy && <div className="workspace-card agent-progress" aria-live="polite"><span className="spinner" />Running the configured workflow. Results are saved when each step completes.</div>}
      {results.length > 0 && <section className="page-stack">{results.map((item, index) => <article className="workspace-card agent-result" key={`${index}-${item.name}`}><div className="agent-result-head"><span className="tool-icon"><Check size={15} /></span><h2>{item.name}</h2><span className="activity-type">Complete</span></div><div className="result-box">{item.result}</div></article>)}</section>}
      <section><div className="section-heading"><div><h2 style={{ fontSize: 16 }}>Recent agent runs</h2><p>Runs belong to your account.</p></div></div>{loading ? <Loading label="Loading agent runs" /> : runs.length ? <div className="history-list">{runs.map((run) => <article className="workspace-card history-row" key={run.id}><span className="tool-icon"><Clock3 size={15} /></span><div className="history-info"><strong>{agents.find((agent) => agent.id === run.agentId)?.name || "Agent"}</strong><span>{run.input.slice(0, 90)}</span></div><span className={`run-status ${run.status}`}>{run.status}</span></article>)}</div> : <div className="workspace-card empty-state"><strong>No agent runs yet</strong>Choose an agent and describe the outcome you need.</div>}</section>
    </div>
  </WorkspaceShell>;
}