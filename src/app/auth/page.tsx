"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/browser";

export default function AuthPage() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    setMessage("");
    const supabase = createClient();
    const requestedNext = new URLSearchParams(window.location.search).get("next");
    const next = requestedNext?.startsWith("/") && !requestedNext.startsWith("//") ? requestedNext : "/dashboard";
    const { error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(next)}` } });
    if (error) {
      setMessage(error.message);
      setLoading(false);
    }
  }

  return <main className="auth-shell"><div className="auth-panel"><Link className="wordmark" href="/">cine<span>circle</span></Link><p className="eyebrow">Your movie people</p><h1>Find your<br /><em>circle.</em></h1><p className="auth-copy">One secure sign-in gets you a private space for your movies, playlists, and taste profile.</p><button className="sso-button" disabled={loading} onClick={signInWithGoogle} type="button"><span aria-hidden="true" className="google-mark">G</span>{loading ? "Opening Google…" : "Continue with Google"}</button><p className="auth-disclaimer">By continuing, you agree to use CineCircle for personal, non-commercial movie discovery.</p>{message && <p className="auth-message" role="status">{message}</p>}<Link className="mode-toggle" href="/">Back to discover</Link></div></main>;
}
