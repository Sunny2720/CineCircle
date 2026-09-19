"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

type Playlist = { id: string; title: string; description: string; visibility: "private" | "public"; slug: string; updated_at: string };
type SavedMovie = { movies: { title: string; release_year: number | null; poster_path: string | null } | null };
type Dashboard = { counts: { liked: number; watched: number; rated: number }; playlists: Playlist[]; likedMovies: SavedMovie[]; watchedMovies: SavedMovie[] };

export default function DashboardData() {
  const [data, setData] = useState<Dashboard | null>(null);
  const [error, setError] = useState("");
  useEffect(() => { fetch("/api/account/dashboard").then(async (response) => { const payload = await response.json(); if (!response.ok) throw new Error(payload.error); setData(payload); }).catch((reason: unknown) => setError(reason instanceof Error ? reason.message : "Could not load your collection.")); }, []);
  const cards = [{ label: "Liked", value: data?.counts.liked ?? "—", hint: "Movies that feel like you" }, { label: "Watched", value: data?.counts.watched ?? "—", hint: "Your viewing history" }, { label: "Rated", value: data?.counts.rated ?? "—", hint: "Half-star opinions" }];
  const movieList = (title: string, movies: SavedMovie[]) => <section className="saved-movies"><p className="eyebrow">Your private list</p><h2>{title}</h2>{movies.length ? <div className="saved-movie-grid">{movies.map((item, index) => item.movies && <article className="saved-movie" key={`${item.movies.title}-${index}`}><strong>{item.movies.title}</strong><span>{item.movies.release_year ?? "Year unknown"}</span></article>)}</div> : <p className="empty-copy">Nothing here yet—find a movie and save it from Discover.</p>}</section>;
  return <><section className="preference-grid" aria-live="polite">{cards.map((card) => <article className="preference-card" key={card.label}><p>{card.label}</p><strong>{card.value}</strong><span>{card.hint}</span></article>)}</section>{movieList("Movies you liked.", data?.likedMovies ?? [])}{movieList("Movies you watched.", data?.watchedMovies ?? [])}<section className="my-playlists"><div className="my-playlists-heading"><div><p className="eyebrow">Your playlists</p><h2>{data?.playlists.length ? "Your collections." : "A blank page is a good place to start."}</h2></div><Link className="button button-coral" href="/playlists/new">New playlist <span>→</span></Link></div>{error && <p className="auth-message" role="status">{error}</p>}{data?.playlists.length ? <div className="owned-playlist-grid">{data.playlists.map((playlist) => <article className="owned-playlist" key={playlist.id}><div><span className={`visibility-dot ${playlist.visibility}`}>{playlist.visibility}</span><h3>{playlist.title}</h3><p>{playlist.description || "No description yet."}</p></div><span className="updated-label">Updated {new Date(playlist.updated_at).toLocaleDateString()}</span></article>)}</div> : <p className="empty-copy">Create a playlist around a mood, a memory, or the people you want to watch with.</p>}</section></>;
}
