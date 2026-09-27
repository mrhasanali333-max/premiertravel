"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "firebase/auth";
import { useAuth } from "@/components/AuthProvider";
import { auth } from "@/lib/firebase";
import { NotificationMenu } from "@/components/NotificationMenu";

const links = [
  ["Home", "/"],
  ["AI Tools", "/tools"],
  ["AI Agents", "/agents"],
  ["Files", "/files"],
  ["History", "/history"],
  ["Pricing", "/pricing"],
];

export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="NEXORA AI home">
      <span className="brand-mark"><Sparkles size={17} strokeWidth={2.3} /></span>
      <span className="brand-name">NEXORA AI</span>
    </Link>
  );
}

export function Navbar() {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const router = useRouter();

  async function logout() {
    if (auth) await signOut(auth);
    setOpen(false);
    router.push("/");
  }

  return (
    <header className="topbar">
      <Brand />
      <nav className="top-links" aria-label="Main navigation">
        {links.map(([label, href]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}>{label}</Link>)}
      </nav>
      <div className="top-actions">
        {user ? <><NotificationMenu /><Link className="nav-avatar" href="/dashboard" aria-label="Open dashboard">{(user.displayName || user.email || "N").slice(0, 1).toUpperCase()}</Link><Link className="button button-secondary nav-dashboard" href="/dashboard">Dashboard</Link><button className="button button-primary nav-signout" type="button" onClick={() => void logout()}>Sign out</button></> : <>
          <Link className="button button-quiet" href="/login">Sign in</Link>
          <Link className="button button-primary" href="/signup">Sign up</Link>
        </>}
        <button className="icon-button mobile-menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && <nav className="mobile-nav" aria-label="Mobile navigation">{[["Home", "/"], ["Tools", "/tools"], ["Agents", "/agents"], ["Files", "/files"], ["History", "/history"], ["Pricing", "/pricing"]].map(([label, href]) => <Link href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}{user ? <><Link href="/dashboard" onClick={() => setOpen(false)}>Profile and dashboard</Link><button type="button" onClick={() => void logout()}>Sign out</button></> : <Link href="/login" onClick={() => setOpen(false)}>Sign in</Link>}</nav>}
    </header>
  );
}