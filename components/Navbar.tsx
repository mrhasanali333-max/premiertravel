"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X, Sparkles } from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";

const links = [
  ["Home", "/"],
  ["AI Tools", "/tools"],
  ["AI Agents", "/agents"],
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

  return (
    <header className="topbar">
      <Brand />
      <nav className="top-links" aria-label="Main navigation">
        {links.map(([label, href]) => <Link className={pathname === href ? "active" : ""} href={href} key={href}>{label}</Link>)}
      </nav>
      <div className="top-actions">
        {user ? <Link className="button button-primary" href="/dashboard">Open workspace</Link> : <>
          <Link className="button button-quiet" href="/login">Sign in</Link>
          <Link className="button button-primary" href="/signup">Sign up</Link>
        </>}
        <button className="icon-button mobile-menu-button" type="button" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen(!open)}>
          {open ? <X size={18} /> : <Menu size={18} />}
        </button>
      </div>
      {open && <nav className="mobile-nav" aria-label="Mobile navigation">{links.map(([label, href]) => <Link href={href} key={href} onClick={() => setOpen(false)}>{label}</Link>)}<Link href={user ? "/dashboard" : "/login"} onClick={() => setOpen(false)}>{user ? "Open workspace" : "Sign in"}</Link></nav>}
    </header>
  );
}