"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

export default function NewPlaylistPage() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "public">("private");
  const [contributions, setContributions] = useState(false);
  const [message, setMessage] = useState("");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setMessage("");
    const response = await fetch("/api/playlists", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ title, description, visibility, contributions_enabled: contributions }) });
    const payload = await response.json();
    setMessage(response.ok ? "Playlist created. Add your first movie from search." : payload.error || "Unable to create playlist.");
  }

  return <main className="auth-shell"><div className="auth-panel playlist-form-panel"><Link className="wordmark" href="/">cine<span>circle</span></Link><p className="eyebrow">A new collection</p><h1>Give it a<br /><em>point of view.</em></h1><form className="auth-form" onSubmit={submit}><label htmlFor="playlist-title">Title<input id="playlist-title" required maxLength={120} value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Late night discoveries" /></label><label htmlFor="playlist-description">Description<textarea id="playlist-description" maxLength={1000} value={description} onChange={(event) => setDescription(event.target.value)} placeholder="A few words about the feeling..." /></label><label htmlFor="visibility">Visibility<select id="visibility" value={visibility} onChange={(event) => setVisibility(event.target.value as "private" | "public")}><option value="private">Private</option><option value="public">Public</option></select></label><label className="check-row"><input type="checkbox" checked={contributions} onChange={(event) => setContributions(event.target.checked)} /> Let invited contributors add movies</label><button className="button button-dark" type="submit">Create playlist</button></form>{message && <p className="auth-message" role="status">{message}</p>}<Link className="mode-toggle" href="/dashboard">Back to dashboard</Link></div></main>;
}