"use client";

import { useState } from "react";
import { Check, Copy, Sparkles, Trash2 } from "lucide-react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { ErrorMessage } from "@/components/ErrorMessage";
import { useAuth } from "@/components/AuthProvider";

type Category = "business" | "travel" | "coding";
type Field = { id: string; label: string; placeholder: string; multiline?: boolean };
const definitions: Record<Category, { title: string; subtitle: string; tasks: { id: string; label: string; fields: Field[] }[] }> = {
  business: {
    title: "AI Business", subtitle: "Build useful business plans, marketing and product copy.", tasks: [
      { id: "idea", label: "Business idea", fields: [{ id: "industry", label: "Industry", placeholder: "For example, sustainable fashion" }, { id: "budget", label: "Startup budget", placeholder: "Amount and currency" }, { id: "country", label: "Country", placeholder: "Target country" }, { id: "skills", label: "Skills and resources", placeholder: "What can you bring?", multiline: true }, { id: "audience", label: "Target audience", placeholder: "Who do you want to serve?" }] },
      { id: "marketing", label: "Marketing plan", fields: [{ id: "business", label: "Business", placeholder: "Describe the business" }, { id: "audience", label: "Target audience", placeholder: "Who is the customer?" }, { id: "budget", label: "Marketing budget", placeholder: "Budget and period" }, { id: "location", label: "Location", placeholder: "Market location" }] },
      { id: "social", label: "Social posts", fields: [{ id: "business", label: "Business or offer", placeholder: "What are you promoting?" }, { id: "audience", label: "Audience", placeholder: "Who should this reach?" }, { id: "tone", label: "Tone and campaign", placeholder: "Voice, goal, key details", multiline: true }] },
      { id: "product", label: "Product copy", fields: [{ id: "product", label: "Product name", placeholder: "Product name" }, { id: "features", label: "Features", placeholder: "Key features and benefits", multiline: true }, { id: "audience", label: "Target audience", placeholder: "Who is this for?" }, { id: "tone", label: "Tone", placeholder: "For example, warm and confident" }] },
      { id: "ad", label: "Ad copy", fields: [{ id: "product", label: "Offer", placeholder: "What are you advertising?" }, { id: "audience", label: "Audience", placeholder: "Who is it for?" }, { id: "platform", label: "Platform and CTA", placeholder: "Platform, action, constraints" }] },
      { id: "names", label: "Business names", fields: [{ id: "industry", label: "Industry", placeholder: "Industry" }, { id: "style", label: "Naming style", placeholder: "Modern, playful, premium…" }, { id: "keywords", label: "Keywords", placeholder: "Words and themes to include" }] },
    ],
  },
  travel: {
    title: "AI Travel", subtitle: "Plan a trip with clear assumptions, budget ranges and practical details.", tasks: [
      { id: "itinerary", label: "Trip planner", fields: [{ id: "destination", label: "Destination", placeholder: "City or region" }, { id: "departure", label: "Departure location", placeholder: "Where are you starting?" }, { id: "dates", label: "Travel dates and duration", placeholder: "Dates or number of days" }, { id: "travelers", label: "Travelers and budget", placeholder: "People, currency, total budget" }, { id: "interests", label: "Interests", placeholder: "Food, nature, history…", multiline: true }] },
      { id: "budget", label: "Budget planner", fields: [{ id: "destination", label: "Destination and duration", placeholder: "Where and how long?" }, { id: "travelers", label: "Travelers", placeholder: "Number and needs" }, { id: "budget", label: "Budget and currency", placeholder: "Known total or range" }, { id: "preferences", label: "Accommodation and activities", placeholder: "Preferences and assumptions" }] },
      { id: "packing", label: "Packing list", fields: [{ id: "destination", label: "Destination", placeholder: "Destination" }, { id: "duration", label: "Trip duration", placeholder: "Number of days" }, { id: "tripType", label: "Trip type", placeholder: "Business, outdoors, family…" }, { id: "weather", label: "Weather info (optional)", placeholder: "Provide forecast if known; no live weather lookup" }] },
    ],
  },
  coding: {
    title: "AI Coding", subtitle: "Generate, explain and debug code as text. Code is never executed here.", tasks: [
      { id: "generate", label: "Code generator", fields: [{ id: "language", label: "Language or framework", placeholder: "HTML, CSS, JavaScript, TypeScript, Python, SQL, React, Next.js" }, { id: "requirements", label: "What should the code do?", placeholder: "Describe behavior, inputs and constraints", multiline: true }] },
      { id: "explain", label: "Code explainer", fields: [{ id: "language", label: "Language", placeholder: "Language or framework" }, { id: "code", label: "Code", placeholder: "Paste code to explain", multiline: true }] },
      { id: "debug", label: "Bug fixer", fields: [{ id: "language", label: "Language", placeholder: "Language or framework" }, { id: "code", label: "Code", placeholder: "Paste the relevant code", multiline: true }, { id: "error", label: "Error message", placeholder: "Paste the full relevant error", multiline: true }] },
      { id: "sql", label: "SQL generator", fields: [{ id: "schema", label: "Tables and columns", placeholder: "Describe available schema", multiline: true }, { id: "request", label: "Question in plain language", placeholder: "What should the query return?", multiline: true }] },
      { id: "html", label: "HTML generator", fields: [{ id: "requirements", label: "Describe the page", placeholder: "Structure, content, styling, accessibility requirements", multiline: true }] },
    ],
  },
};

export function SpecialtyWorkspace({ category }: Readonly<{ category: Category }>) {
  const { user } = useAuth();
  const definition = definitions[category];
  const [task, setTask] = useState(definition.tasks[0].id);
  const [values, setValues] = useState<Record<string, string>>({});
  const [result, setResult] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);
  const current = definition.tasks.find((item) => item.id === task)!;

  function changeTask(next: string) { setTask(next); setResult(""); setError(""); }

  async function run() {
    const input = current.fields.map((field) => `${field.label}: ${values[field.id] || "Not specified"}`).join("\n");
    if (!user || !current.fields.some((field) => values[field.id]?.trim()) || busy) return;
    setBusy(true); setError(""); setResult("");
    try {
      const token = await user.getIdToken();
      const response = await fetch(`/api/${category}`, { method: "POST", headers: { authorization: `Bearer ${token}`, "content-type": "application/json" }, body: JSON.stringify({ task, input, options: values }) });
      const payload = await response.json() as { result?: string; error?: string };
      if (!response.ok) throw new Error(payload.error || "This request could not be completed.");
      setResult(payload.result || "");
    } catch (reason) { setError(reason instanceof Error ? reason.message : "This request could not be completed."); }
    finally { setBusy(false); }
  }

  async function copy() { try { await navigator.clipboard.writeText(result); setCopied(true); window.setTimeout(() => setCopied(false), 1500); } catch { setError("Clipboard access is unavailable in this browser."); } }

  return <WorkspaceShell><div className="workspace-top"><div><h1>{definition.title}</h1><p>{definition.subtitle}</p></div></div>
    <div className="specialty-layout"><section className="workspace-card specialty-form"><label className="form-field">Choose a workflow<select className="select" value={task} onChange={(event) => changeTask(event.target.value)}>{definition.tasks.map((item) => <option key={item.id} value={item.id}>{item.label}</option>)}</select></label>
      {current.fields.map((field) => <label className="form-field" key={field.id}>{field.label}{field.multiline ? <textarea className="textarea specialty-textarea" maxLength={5000} value={values[field.id] || ""} onChange={(event) => setValues((currentValues) => ({ ...currentValues, [field.id]: event.target.value }))} placeholder={field.placeholder} /> : <input className="input" maxLength={1000} value={values[field.id] || ""} onChange={(event) => setValues((currentValues) => ({ ...currentValues, [field.id]: event.target.value }))} placeholder={field.placeholder} />}</label>)}
      {category === "travel" && <p className="inline-note">Estimates are planning guidance, not live flight, hotel, exchange-rate or weather data.</p>}{category === "coding" && <p className="inline-note">Code is returned as text only. NEXORA does not execute user code or SQL.</p>}{error && <ErrorMessage message={error} />}<div className="writing-actions"><button className="button button-secondary" type="button" onClick={() => { setValues({}); setResult(""); setError(""); }}><Trash2 size={14} />Clear</button><button className="button button-primary" type="button" disabled={busy || !current.fields.some((field) => values[field.id]?.trim())} onClick={() => void run()}>{busy ? <span className="spinner" /> : <Sparkles size={14} />}{busy ? "Working…" : "Generate"}</button></div>
    </section><section className="workspace-card specialty-result"><div className="result-header"><h2 className="section-title">Result</h2>{result && <button className="button button-quiet" type="button" onClick={() => void copy()}>{copied ? <Check size={14} /> : <Copy size={14} />}{copied ? "Copied" : "Copy"}</button>}</div><div className="result-box">{busy ? <div className="empty-state"><span className="spinner" /></div> : result || <div className="empty-state"><strong>{current.label}</strong>Complete the details to get started.</div>}</div></section></div>
  </WorkspaceShell>;
}