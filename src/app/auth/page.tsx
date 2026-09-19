"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function AuthPage() {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const result = mode === "sign-in"
      ? await supabase.auth.signInWithPassword({ email, password })
      : await supabase.auth.signUp({ email, password });
    setLoading(false);
    setMessage(result.error?.message ?? (mode === "sign-up" ? "Check your inbox to confirm your account." : "Signed in. Your dashboard is ready next."));
  }

  return <main className="auth-shell"><div className="auth-panel"><Link className="wordmark" href="/">cine<span>circle</span></Link><p className="eyebrow">Your movie people</p><h1>{mode === "sign-in" ? "Welcome back." : "Find your circle."}</h1><p className="auth-copy">Save the movies that matter, and make choosing what is next feel easy.</p><form className="auth-form" onSubmit={submit}><label htmlFor="email">Email<input id="email" type="email" required value={email} onChange={(event) => setEmail(event.target.value)} /></label><label htmlFor="password">Password<input id="password" type="password" minLength={8} required value={password} onChange={(event) => setPassword(event.target.value)} /></label><button className="button button-dark" disabled={loading} type="submit">{loading ? "Working..." : mode === "sign-in" ? "Sign in" : "Create account"}</button></form>{message && <p className="auth-message" role="status">{message}</p>}<button className="mode-toggle" type="button" onClick={() => setMode(mode === "sign-in" ? "sign-up" : "sign-in")}>{mode === "sign-in" ? "Need an account? Create one" : "Already have an account? Sign in"}</button></div></main>;
}