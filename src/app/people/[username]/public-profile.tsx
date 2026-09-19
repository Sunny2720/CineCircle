"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

type Person = { id: string; username: string; full_name: string | null; avatar_url: string | null };
type Payload = { profile: Person; authenticated: boolean; isSelf: boolean; following: boolean; counts: { followers: number; following: number }; followers: Person[]; followingPeople: Person[]; playlists: { id: string; title: string; description: string; slug: string }[] };

function PersonList({ people, empty }: { people: Person[]; empty: string }) {
  if (!people.length) return <p className="empty-copy">{empty}</p>;
  return <div className="profile-people-list">{people.map((person) => <Link href={`/people/${person.username}`} key={person.id}><span className="person-avatar">{person.avatar_url ? <img alt="" src={person.avatar_url} /> : (person.full_name || person.username).slice(0, 1).toUpperCase()}</span><span><strong>{person.full_name || person.username}</strong><small>@{person.username}</small></span></Link>)}</div>;
}

export default function PublicProfile({ username }: { username: string }) {
  const router = useRouter();
  const [data, setData] = useState<Payload | null>(null);
  const [message, setMessage] = useState("");
  const [changing, setChanging] = useState(false);
  useEffect(() => { fetch(`/api/people/${encodeURIComponent(username)}`).then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setData(payload); }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not load this profile.")); }, [username]);
  async function toggleFollow() {
    if (!data) return;
    if (!data.authenticated) { router.push(`/auth?next=${encodeURIComponent(`/people/${data.profile.username}`)}`); return; }
    const next = !data.following;
    setChanging(true); setMessage("");
    try { const response = await fetch("/api/follows", { method: next ? "POST" : "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: data.profile.id }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setData((current) => current ? { ...current, following: next, counts: { ...current.counts, followers: current.counts.followers + (next ? 1 : -1) } } : current); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not update follow status."); } finally { setChanging(false); }
  }
  async function shareProfile() {
    if (!data) return;
    const url = `${window.location.origin}/people/${data.profile.username}`;
    try {
      if (navigator.share) await navigator.share({ title: `${data.profile.full_name || data.profile.username} on CineCircle`, url });
      else { await navigator.clipboard.writeText(url); setMessage("Public profile link copied."); }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      setMessage("Could not share the profile link.");
    }
  }
  if (message && !data) return <section className="public-profile"><p className="eyebrow">Profile</p><h1>Not found.</h1><p className="auth-message">{message}</p><Link className="button button-dark" href="/dashboard">Back to your dashboard</Link></section>;
  if (!data) return <section className="public-profile"><p className="eyebrow">Profile</p><h1>Loading profile…</h1></section>;
  const name = data.profile.full_name || data.profile.username;
  return <section className="public-profile"><div className="profile-hero"><div className="profile-avatar">{data.profile.avatar_url ? <img alt="" src={data.profile.avatar_url} /> : name.slice(0, 1).toUpperCase()}</div><div><p className="eyebrow">Member profile</p><h1>{name}</h1><p className="profile-handle">@{data.profile.username}</p></div><div className="profile-actions"><button className="share-profile" onClick={shareProfile} type="button">Share profile</button>{!data.isSelf && <button className={data.following ? "follow-button is-following" : "follow-button"} disabled={changing} onClick={toggleFollow} type="button">{changing ? "Updating…" : data.following ? "Following" : "Follow"}</button>}</div></div>{message && <p className="auth-message" role="status">{message}</p>}<div className="profile-stats"><div><strong>{data.counts.followers}</strong><span>followers</span></div><div><strong>{data.counts.following}</strong><span>following</span></div><div><strong>{data.playlists.length}</strong><span>public playlists</span></div></div><div className="profile-content"><section><p className="eyebrow">Public playlists</p><h2>Shared for the circle.</h2>{data.playlists.length ? <div className="owned-playlist-grid">{data.playlists.map((playlist) => <article className="owned-playlist" key={playlist.id}><div><p className="visibility-dot public">Public playlist</p><h3>{playlist.title}</h3><p>{playlist.description || "A CineCircle playlist."}</p></div><Link className="arrow-link" href={`/playlists/${playlist.slug}`}>Open playlist <span>→</span></Link></article>)}</div> : <p className="empty-copy">No public playlists yet.</p>}</section><aside className="profile-relationships"><div><p className="eyebrow">Followers</p><h2>{data.counts.followers} people</h2><PersonList empty="No followers yet." people={data.followers} /></div><div><p className="eyebrow">Following</p><h2>{data.counts.following} people</h2><PersonList empty="Not following anyone yet." people={data.followingPeople} /></div></aside></div></section>;
}
