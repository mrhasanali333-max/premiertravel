"use client";

import { useEffect, useState } from "react";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Loading } from "@/components/Loading";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";

type UsageData = { planName: string; counts: Record<string, number>; limits: Record<string, number>; date: string };

export function SettingsWorkspace() {
  const { user } = useAuth();
  const router = useRouter();
  const [usage, setUsage] = useState<UsageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!user) return;
      try {
        const token = await user.getIdToken();
        const response = await fetch("/api/usage", { headers: { authorization: `Bearer ${token}` } });
        const data = await response.json() as UsageData & { error?: string };
        if (!response.ok) throw new Error(data.error || "Usage information could not be loaded.");
        if (active) setUsage(data);
      } catch (reason) { if (active) setError(reason instanceof Error ? reason.message : "Usage information could not be loaded."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [user]);

  async function logout() { if (!auth) return; await signOut(auth); router.push("/"); }
  const categories = ["chat", "writing", "study", "image", "voice", "files", "agents"];

  return <WorkspaceShell><div className="workspace-top"><div><h1>Settings</h1><p>Account details, plan and workspace usage.</p></div></div>{loading ? <Loading label="Loading settings" /> : <div className="settings-grid"><section className="workspace-card settings-panel"><h2 className="section-title">Account</h2><div className="setting-row"><span>Name</span><strong>{user?.displayName || "NEXORA member"}</strong></div><div className="setting-row"><span>Email</span><strong>{user?.email || "Not available"}</strong></div><button className="button button-secondary" type="button" onClick={() => void logout()}><LogOut size={14} />Sign out</button></section><section className="workspace-card settings-panel"><h2 className="section-title">Plan and daily usage</h2><div className="setting-row"><span>Current plan</span><strong>{usage?.planName || "Free"}</strong></div>{categories.map((category) => <div className="setting-row" key={category}><span>{category[0].toUpperCase() + category.slice(1)}</span><strong>{usage?.counts[category] || 0} / {usage?.limits[category] || 0}</strong></div>)}<p className="muted-text">Pro limits are prepared, but subscriptions and plan upgrades are not enabled yet.</p></section>{error && <div className="settings-wide error-note" role="alert">{error}</div>}</div>}</WorkspaceShell>;
}