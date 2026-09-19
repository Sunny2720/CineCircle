"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";

const starterPlaylists = [
  { title: "Rainy night cinema", owner: "Maya Chen", count: 18, color: "rose" },
  { title: "The road less traveled", owner: "Jon Bell", count: 12, color: "blue" },
  { title: "Sunday with the family", owner: "Priya Shah", count: 24, color: "gold" },
];

export default function Home() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<Array<{ id: number; title: string; release_date: string }>>([]);
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    setSearched(value.length > 0);
    setSearchError("");
    setResults([]);
    if (!value) return;
    setSearching(true);
    try {
      const response = await fetch(`/api/movies/search?query=${encodeURIComponent(value)}`);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setResults(payload.results);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search is unavailable.");
    } finally {
      setSearching(false);
    }
  }

  return (
    <main className="site-shell">
      <nav className="topbar">
        <Link className="wordmark" href="/">cine<span>circle</span></Link>
        <div className="nav-links"><a href="#discover">Discover</a><a href="#how-it-works">How it works</a><Link className="text-button" href="/auth">Sign in</Link><Link className="button button-dark" href="/auth">Create an account</Link></div>
      </nav>

      <section className="hero" id="discover">
        <div className="hero-copy"><p className="eyebrow">A better way to choose together</p><h1>Good movies are better <em>shared.</em></h1><p className="hero-description">Build thoughtful playlists, trade recommendations with your people, and always know what to watch next.</p><form className="search-bar" onSubmit={submitSearch}><span className="search-icon" aria-hidden="true">/</span><label className="sr-only" htmlFor="movie-search">Search public playlists and movies</label><input id="movie-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movies or public playlists" /><button className="button button-coral" type="submit">Search</button></form>{searched && <p className="search-note">{searching ? "Searching the movie catalog..." : searchError || "Search complete."}</p>}</div>
        <div className="hero-collage" aria-label="Featured movie collection"><div className="poster poster-one"><span>In the mood<br /><strong>for wonder</strong></span></div><div className="poster poster-two"><span>new<br /><strong>classics</strong></span></div><div className="poster poster-three"><span>late night<br /><strong>stories</strong></span></div><div className="collage-note">Curated by<br /><strong>your circle</strong></div></div>
      </section>

      {results.length > 0 && <section className="results-section"><p className="eyebrow">Movie catalog</p><h2>Search results</h2><div className="results-grid">{results.slice(0, 6).map((movie) => <article className="result-card" key={movie.id}><div className="result-art"><span>TMDB</span></div><div><h3>{movie.title}</h3><p>{movie.release_date?.slice(0, 4) || "Release year unknown"}</p><button className="button button-dark" type="button">Add to a playlist</button></div></article>)}</div></section>}

      <section className="section-band" id="how-it-works"><div className="section-heading"><div><p className="eyebrow">From the community</p><h2>Find your next favorite.</h2></div><a className="arrow-link" href="#playlists">View all playlists <span>↗</span></a></div><div className="playlist-grid" id="playlists">{starterPlaylists.map((playlist) => <article className="playlist-card" key={playlist.title}><div className={`playlist-art ${playlist.color}`}><span>CC</span><strong>{playlist.title}</strong></div><div className="playlist-meta"><div><h3>{playlist.title}</h3><p>by {playlist.owner}</p></div><span>{playlist.count} films</span></div></article>)}</div></section>

      <section className="feature-strip"><div><p className="eyebrow">Make it yours</p><h2>Your taste has a point of view.</h2></div><p>Like what speaks to you. Mark what you have seen. Rate it in half-stars. CineCircle learns your rhythm without making your private taste public.</p><Link className="button button-outline" href="/dashboard">Start your collection <span>→</span></Link></section>

      <footer><Link className="wordmark" href="/">cine<span>circle</span></Link><p>Movie nights, made personal.</p><p className="footer-note">Uses TMDB and the TMDB APIs but is not endorsed or certified by TMDB.</p></footer>
    </main>
  );
}
