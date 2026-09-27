"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithEmailAndPassword, signInWithPopup, updateProfile } from "firebase/auth";
import { useState, type FormEvent } from "react";
import { Globe } from "lucide-react";
import { auth, firebaseConfigured } from "@/lib/firebase";

export function AuthForm({ mode }: Readonly<{ mode: "login" | "signup" }>) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const isSignup = mode === "signup";

  function continueAfterAuth() {
    const requested = new URLSearchParams(window.location.search).get("next");
    router.push(requested?.startsWith("/") && !requested.startsWith("//") ? requested : "/dashboard");
  }

  function authError(reason: unknown) {
    const code = typeof reason === "object" && reason && "code" in reason ? String(reason.code) : "";
    const messages: Record<string, string> = {
      "auth/email-already-in-use": "An account already uses this email. Sign in instead.",
      "auth/invalid-credential": "Email or password is incorrect.",
      "auth/weak-password": "Choose a password with at least 6 characters.",
      "auth/popup-closed-by-user": "The Google sign-in window was closed before finishing.",
      "auth/too-many-requests": "Too many attempts. Wait a moment and try again.",
    };
    return messages[code] || "Authentication failed. Check your Firebase setup and try again.";
  }

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    if (!auth) { setError("Firebase is not configured yet. Add the public Firebase values to .env.local."); return; }
    if (password.length < 6) { setError("Password must contain at least 6 characters."); return; }
    setBusy(true);
    try {
      if (isSignup) {
        const credential = await createUserWithEmailAndPassword(auth, email, password);
        if (name.trim()) await updateProfile(credential.user, { displayName: name.trim() });
      } else {
        await signInWithEmailAndPassword(auth, email, password);
      }
      continueAfterAuth();
    } catch (reason) {
      setError(authError(reason));
    } finally {
      setBusy(false);
    }
  }

  async function googleSignIn() {
    if (!auth) { setError("Firebase is not configured yet. Add the public Firebase values to .env.local."); return; }
    setError("");
    setBusy(true);
    try {
      await signInWithPopup(auth, new GoogleAuthProvider());
      continueAfterAuth();
    } catch (reason) {
      setError(authError(reason));
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="auth-page">
      <section className="auth-panel reveal">
        <h1>{isSignup ? "Create your account" : "Welcome back"}</h1>
        <p>{isSignup ? "Make room for every task in one AI workspace." : "Sign in to continue to your workspace."}</p>
        <form onSubmit={submit}>
          {isSignup && <label className="form-field">Full name<input className="input" autoComplete="name" value={name} onChange={(event) => setName(event.target.value)} required /></label>}
          <label className="form-field">Email address<input className="input" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required /></label>
          <label className="form-field">Password<input className="input" type="password" autoComplete={isSignup ? "new-password" : "current-password"} minLength={6} value={password} onChange={(event) => setPassword(event.target.value)} required /></label>
          {error && <div className="error-note" role="alert">{error}</div>}
          {!firebaseConfigured && <div className="inline-note" style={{ margin: "14px 0" }}>Firebase setup is required before accounts can be created. See <strong>.env.local.example</strong>.</div>}
          <button className="button button-primary button-full" disabled={busy || !firebaseConfigured} style={{ marginTop: 8 }} type="submit">{busy ? "Please wait…" : isSignup ? "Create account" : "Sign in"}</button>
        </form>
        <div className="auth-divider">or continue with</div>
        <button className="button button-secondary button-full" disabled={busy || !firebaseConfigured} type="button" onClick={googleSignIn}><Globe size={16} /> Google</button>
        <div className="auth-foot">{isSignup ? "Already have an account? " : "New to NEXORA? "}<Link href={isSignup ? "/login" : "/signup"}>{isSignup ? "Sign in" : "Create an account"}</Link></div>
      </section>
    </main>
  );
}