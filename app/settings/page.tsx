"use client";

import { useEffect, useState } from "react";
import { doc, getDoc } from "firebase/firestore";
import { signOut } from "firebase/auth";
import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { WorkspaceShell } from "@/components/WorkspaceShell";
import { Loading } from "@/components/Loading";
import { useAuth } from "@/components/AuthProvider";
import { auth, db } from "@/lib/firebase";

export default function SettingsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [usage, setUsage] = useState({ dailyRequests: 0, monthlyRequests: 0, uploadedFiles: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      if (!db || !user) { setLoading(false); return; }
      try {
        const snapshot = await getDoc(doc(db, "usage", user.uid));
        const values = snapshot.data();
        if (active) setUsage({ dailyRequests: Number(values?.dailyRequests || 0), monthlyRequests: Number(values?.monthlyRequests || 0), uploadedFiles: Number(values?.uploadedFiles || 0) });
      } catch { if (active) setError("Usage information could not be loaded."); }
      finally { if (active) setLoading(false); }
    }
    void load();
    return () => { active = false; };
  }, [user]);

  async function logout() { if (!auth) return; await signOut(auth); router.push("/"); }

  return <WorkspaceShell><div className="workspace-top"><div><h1>Settings</h1><p>Account details and workspace usage.</p></div></div>{loading ? <Loading label="Loading settings" /> : <div className="settings-grid"><section className="workspace-card settings-panel"><h2 className="section-title">Account</h2><div className="setting-row"><span>Name</span><strong>{user?.displayName || "NEXORA member"}</strong></div><div className="setting-row"><span>Email</span><strong>{user?.email || "Not available"}</strong></div><button className="button button-secondary" type="button" onClick={() => void logout()}><LogOut size={14} />Sign out</button></section><section className="workspace-card settings-panel"><h2 className="section-title">Usage</h2><div className="setting-row"><span>Requests used today</span><strong>{usage.dailyRequests}</strong></div><div className="setting-row"><span>Requests this month</span><strong>{usage.monthlyRequests}</strong></div><div className="setting-row"><span>Files uploaded</span><strong>{usage.uploadedFiles}</strong></div><p className="muted-text">Usage counters are a foundation for future plans; subscriptions are not enabled.</p></section>{error && <div className="settings-wide error-note" role="alert">{error}</div>}</div>}</WorkspaceShell>;
}