"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Person = { id: string; username: string; full_name: string | null; avatar_url: string | null; following: boolean };

export default function PeoplePanel() {
  const [people, setPeople] = useState<Person[]>([]);
  const [query, setQuery] = useState("");
  const [counts, setCounts] = useState({ followers: 0, following: 0 });
  const [message, setMessage] = useState("");

  async function loadPeople(search = "") {
    try { const response = await fetch(`/api/people?query=${encodeURIComponent(search)}`); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setPeople(payload.people); } catch (error) { setMessage(error instanceof Error ? error.message : "Could not load people."); }
  }
  useEffect(() => { fetch("/api/people").then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setPeople(payload.people); }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not load people.")); fetch("/api/follows").then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setCounts(payload); }).catch((error: unknown) => setMessage(error instanceof Error ? error.message : "Could not load your community.")); }, []);
  async function toggleFollow(person: Person) {
    const nextFollowing = !person.following;
    setPeople((current) => current.map((item) => item.id === person.id ? { ...item, following: nextFollowing } : item));
    try { const response = await fetch("/api/follows", { method: nextFollowing ? "POST" : "DELETE", headers: { "content-type": "application/json" }, body: JSON.stringify({ userId: person.id }) }); const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setCounts((current) => ({ ...current, following: current.following + (nextFollowing ? 1 : -1) })); } catch (error) { setPeople((current) => current.map((item) => item.id === person.id ? { ...item, following: person.following } : item)); setMessage(error instanceof Error ? error.message : "Could not update follow status."); }
  }
  return <section className="people-panel"><div className="people-heading"><div><p className="eyebrow">Your circle</p><h2>People, not algorithms.</h2></div><div className="follow-counts"><span><strong>{counts.followers}</strong> followers</span><span><strong>{counts.following}</strong> following</span></div></div><div className="people-search"><label className="sr-only" htmlFor="people-search">Find people</label><input id="people-search" onChange={(event) => { setQuery(event.target.value); loadPeople(event.target.value); }} placeholder="Find people by name or username" value={query} /></div>{message && <p className="auth-message" role="status">{message}</p>}{people.length ? <div className="people-grid">{people.map((person) => <article className="person-card" key={person.id}><div className="person-avatar" aria-hidden="true">{person.avatar_url ? <img alt="" src={person.avatar_url} /> : (person.full_name || person.username).slice(0, 1).toUpperCase()}</div><div><h3><Link href={`/people/${person.username}`}>{person.full_name || person.username}</Link></h3><p>@{person.username}</p></div><button className={person.following ? "follow-button is-following" : "follow-button"} onClick={() => toggleFollow(person)} type="button">{person.following ? "Following" : "Follow"}</button></article>)}</div> : <p className="empty-copy">No other CineCircle members yet. Invite someone to start your circle.</p>}</section>;
}
