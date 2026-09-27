"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { BookOpen, BriefcaseBusiness, Code2, FileText, Files, Image, LayoutDashboard, LogOut, Map, MessageSquare, Mic2, Settings, Clock3, WandSparkles, CreditCard } from "lucide-react";
import { signOut } from "firebase/auth";
import type { LucideIcon } from "lucide-react";
import { useEffect } from "react";
import { auth, firebaseConfigured } from "@/lib/firebase";
import { useAuth } from "@/components/AuthProvider";
import { Brand } from "@/components/Navbar";
import { GlobalSearch } from "@/components/GlobalSearch";
import { NotificationMenu } from "@/components/NotificationMenu";

const nav: { label: string; href: string; icon: LucideIcon }[] = [
  { label: "Home", href: "/dashboard", icon: LayoutDashboard },
  { label: "AI Chat", href: "/chat", icon: MessageSquare },
  { label: "All AI tools", href: "/tools", icon: WandSparkles },
  { label: "Writing", href: "/tools/writing", icon: FileText },
  { label: "PDF workspace", href: "/files", icon: Files },
  { label: "Study", href: "/tools/study", icon: BookOpen },
  { label: "Image", href: "/tools/image", icon: Image },
  { label: "Voice", href: "/tools/voice", icon: Mic2 },
  { label: "Business", href: "/tools/business", icon: BriefcaseBusiness },
  { label: "Travel", href: "/tools/travel", icon: Map },
  { label: "Coding", href: "/tools/coding", icon: Code2 },
  { label: "Agents", href: "/agents", icon: WandSparkles },
  { label: "History", href: "/history", icon: Clock3 },
  { label: "Pricing", href: "/pricing", icon: CreditCard },
  { label: "Settings", href: "/settings", icon: Settings },
];

export function WorkspaceShell({ children }: Readonly<{ children: React.ReactNode }>) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!loading && firebaseConfigured && !user) router.replace("/login");
  }, [loading, router, user]);

  if (loading) return <div className="auth-page"><div className="spinner" aria-label="Loading account" /></div>;
  if (!firebaseConfigured) return <div className="auth-page"><div className="auth-panel"><h1>Connect Firebase</h1><p>The workspace needs Firebase Authentication and Firestore before private data can be loaded.</p><div className="inline-note">Add the NEXT_PUBLIC_FIREBASE_* values from <strong>.env.local.example</strong>, then restart the development server.</div><Link className="button button-primary button-full" href="/login" style={{ marginTop: 18 }}>Go to sign in</Link></div></div>;
  if (!user) return <div className="auth-page"><div className="spinner" aria-label="Redirecting to sign in" /></div>;

  const initials = (user.displayName || user.email || "N").slice(0, 1).toUpperCase();
  const isActive = (href: string) => href === "/dashboard" ? pathname === href : pathname.startsWith(href);

  async function handleLogout() {
    if (!auth) return;
    await signOut(auth);
    router.push("/");
  }

  return (
    <div className="workspace">
      <aside className="sidebar">
        <Brand />
        <div className="side-label">Workspace</div>
        <nav aria-label="Workspace navigation">
          {nav.slice(0, 11).map(({ label, href, icon: Icon }) => <Link className={`side-link ${isActive(href) ? "active" : ""}`} href={href} key={href}><Icon size={16} /><span>{label}</span></Link>)}
          <div className="side-label">Library</div>
          {nav.slice(11).map(({ label, href, icon: Icon }) => <Link className={`side-link ${isActive(href) ? "active" : ""}`} href={href} key={href}><Icon size={16} /><span>{label}</span></Link>)}
        </nav>
        <div className="side-bottom">
          <div className="profile-row"><span className="avatar">{initials}</span><div className="profile-text"><strong>{user.displayName || "NEXORA member"}</strong><span>{user.email}</span></div><button className="icon-button" type="button" title="Sign out" aria-label="Sign out" onClick={handleLogout}><LogOut size={15} /></button></div>
        </div>
      </aside>
      <main className="workspace-main"><div className="workspace-utility"><GlobalSearch /><NotificationMenu /></div>{children}</main>
      <nav className="mobile-bottom" aria-label="Mobile workspace navigation">
        {[nav[0], nav[2], nav[11], nav[4], nav[12]].map(({ label, href, icon: Icon }) => <Link className={isActive(href) ? "active" : ""} href={href} key={href}><Icon size={17} /><span>{label === "PDF workspace" ? "Files" : label === "All AI tools" ? "Tools" : label}</span></Link>)}
      </nav>
    </div>
  );
}