"use client";

import { FormEvent, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";

const starterPlaylists = [
  { title: "Rainy night cinema", owner: "Maya Chen", count: 18, color: "rose" },
  { title: "The road less traveled", owner: "Jon Bell", count: 12, color: "blue" },
  { title: "Sunday with the family", owner: "Priya Shah", count: 24, color: "gold" },
];

type MovieResult = {
  id: number;
  title: string;
  overview: string;
  release_date: string;
  poster_path: string | null;
  vote_average: number;
};

type MoviePreference = { liked?: boolean; viewed?: boolean; rating?: number | null };
type Viewer = { username: string; fullName: string };
type MovieSearchResponse = {
  page: number;
  total_pages: number;
  total_results: number;
  results: MovieResult[];
};
type PlaylistOption = { id: string; title: string };

export default function Home() {
  const [query, setQuery] = useState("");
  const [searched, setSearched] = useState(false);
  const [results, setResults] = useState<MovieResult[]>([]);
  const [submittedQuery, setSubmittedQuery] = useState("");
  const [searchPage, setSearchPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalResults, setTotalResults] = useState(0);
  const [preferences, setPreferences] = useState<Record<number, MoviePreference>>({});
  const [preferenceMessage, setPreferenceMessage] = useState("");
  const [searchError, setSearchError] = useState("");
  const [searching, setSearching] = useState(false);
  const [viewer, setViewer] = useState<Viewer | null | undefined>(undefined);
  const [playlists, setPlaylists] = useState<PlaylistOption[]>([]);

  useEffect(() => {
    fetch("/api/account").then(async (response) => {
      if (response.status === 401) return setViewer(null);
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setViewer(payload.account);
    }).catch(() => setViewer(null));
  }, []);

  useEffect(() => {
    if (!viewer) return;
    fetch("/api/playlists").then(async (response) => {
      const payload = await response.json();
      if (response.ok) setPlaylists(payload.playlists ?? []);
    }).catch(() => undefined);
  }, [viewer]);

  useEffect(() => {
    const cards = Array.from(document.querySelectorAll<HTMLElement>(".result-card"));
    const handlers = cards.map((card, index) => {
      const openMovie = () => {
        const movie = results[index];
        if (movie) window.location.assign(`/movies/${movie.id}`);
      };
      const handler = (event: MouseEvent) => {
        if ((event.target as HTMLElement).closest("button, select, option, label")) return;
        openMovie();
      };
      const keyHandler = (event: KeyboardEvent) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openMovie(); } };
      card.tabIndex = 0;
      card.setAttribute("role", "link");
      card.setAttribute("aria-label", `View details for ${results[index]?.title ?? "movie"}`);
      card.addEventListener("click", handler);
      card.addEventListener("keydown", keyHandler);
      return () => { card.removeEventListener("click", handler); card.removeEventListener("keydown", keyHandler); card.removeAttribute("role"); card.removeAttribute("aria-label"); card.removeAttribute("tabindex"); };
    });
    return () => handlers.forEach((remove) => remove());
  }, [results]);

  async function searchMovies(value: string, page: number, append = false) {
    setSearchError("");
    setSearching(true);
    try {
      const response = await fetch(`/api/movies/search?query=${encodeURIComponent(value)}&page=${page}`);
      const payload = await response.json() as MovieSearchResponse & { error?: string };
      if (!response.ok) throw new Error(payload.error);
      setResults((current) => append ? [...current, ...payload.results] : payload.results);
      setSearchPage(payload.page);
      setTotalPages(payload.total_pages);
      setTotalResults(payload.total_results);
    } catch (error) {
      setSearchError(error instanceof Error ? error.message : "Search is unavailable.");
    } finally {
      setSearching(false);
    }
  }

  async function submitSearch(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = query.trim();
    setSearched(value.length > 0);
    setSubmittedQuery(value);
    setResults([]);
    setSearchPage(1);
    setTotalPages(0);
    setTotalResults(0);
    if (!value) return;
    await searchMovies(value, 1);
  }

  async function updatePreference(movieId: number, update: MoviePreference) {
    const next = { ...preferences[movieId], ...update };
    setPreferences((current) => ({ ...current, [movieId]: next }));
    setPreferenceMessage("");
    try {
      const movie = results.find((result) => result.id === movieId);
      if (!movie) throw new Error("Movie details are unavailable.");
      const response = await fetch("/api/preferences", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          preference: next,
          movie: {
            tmdb_id: movie.id,
            title: movie.title,
            overview: movie.overview,
            release_date: movie.release_date,
            poster_path: movie.poster_path,
            backdrop_path: null,
            genre_ids: [],
          },
        }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setPreferences((current) => ({ ...current, [movieId]: payload.preference }));
      setPreferenceMessage("Your private taste profile was updated.");
    } catch (error) {
      setPreferences((current) => ({ ...current, [movieId]: preferences[movieId] ?? {} }));
      setPreferenceMessage(error instanceof Error ? error.message : "Could not save that preference.");
    }
  }

  async function addToPlaylist(movie: MovieResult, playlistId: string) {
    if (!playlistId) return;
    setPreferenceMessage("");
    try {
      const response = await fetch(`/api/playlists/${playlistId}/movies`, {
        method: "POST", headers: { "content-type": "application/json" },
        body: JSON.stringify({ tmdb_id: movie.id, title: movie.title, overview: movie.overview, release_date: movie.release_date, poster_path: movie.poster_path, backdrop_path: null, genre_ids: [] }),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error);
      setPreferenceMessage(`Added ${movie.title} to your playlist.`);
    } catch (error) {
      setPreferenceMessage(error instanceof Error ? error.message : "Could not add this movie.");
    }
  }

  return (
    <main className="site-shell">
      <nav className="topbar">
        <Link className="wordmark" href="/">cine<span>circle</span></Link>
        <div className="nav-links"><a href="#discover">Discover</a><a className="nav-how" href="#how-it-works">How it works</a>{viewer ? <><span className="viewer-label">@{viewer.username}</span><Link className="button button-dark" href="/dashboard">Your dashboard</Link></> : viewer === null ? <><Link className="text-button" href="/auth">Sign in</Link><Link className="button button-dark" href="/auth">Create an account</Link></> : null}</div>
      </nav>

      <section className="hero" id="discover">
        <div className="hero-copy"><p className="eyebrow">A better way to choose together</p><h1>Good movies are better <em>shared.</em></h1><p className="hero-description">Build thoughtful playlists, trade recommendations with your people, and always know what to watch next.</p><form className="search-bar" onSubmit={submitSearch}><span className="search-icon" aria-hidden="true">/</span><label className="sr-only" htmlFor="movie-search">Search public playlists and movies</label><input id="movie-search" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search movies or public playlists" /><button className="button button-coral" type="submit">Search</button></form>{searched && <p className="search-note">{searching ? "Searching the movie catalog..." : searchError || "Search complete."}</p>}</div>
        <div className="hero-collage" aria-label="Featured movie collection"><div className="poster poster-one"><span>In the mood<br /><strong>for wonder</strong></span></div><div className="poster poster-two"><span>new<br /><strong>classics</strong></span></div><div className="poster poster-three"><span>late night<br /><strong>stories</strong></span></div><div className="collage-note">Curated by<br /><strong>your circle</strong></div></div>
      </section>

      {searched && <section className="results-section" aria-live="polite"><div className="results-heading"><div><p className="eyebrow">Movie catalog</p><h2>Find the feeling.</h2></div>{!searching && !searchError && <p>{totalResults} {totalResults === 1 ? "match" : "matches"} for <strong>“{submittedQuery}”</strong></p>}</div>{searchError ? <p className="search-empty" role="alert">{searchError}</p> : results.length > 0 ? <><div className="results-grid">{results.map((movie) => { const preference = preferences[movie.id] ?? {}; return <article className="result-card" key={movie.id}><div className="result-art">{movie.poster_path ? <Image src={`https://image.tmdb.org/t/p/w342${movie.poster_path}`} alt={`${movie.title} poster`} fill sizes="(max-width: 800px) 105px, 132px" /> : <span>No poster<br />available</span>}<span className="tmdb-badge">TMDB</span></div><div className="result-content"><div className="result-title-row"><h3>{movie.title}</h3><span>{movie.vote_average ? movie.vote_average.toFixed(1) : "—"} ★</span></div><p className="result-year">{movie.release_date?.slice(0, 4) || "Release year unknown"}</p><p className="result-overview">{movie.overview || "A title from the CineCircle movie catalog."}</p>{viewer && (playlists.length ? <label className="add-to-playlist">Add to playlist<select defaultValue="" onChange={(event) => { addToPlaylist(movie, event.target.value); event.currentTarget.value = ""; }}><option disabled value="">Choose a playlist</option>{playlists.map((playlist) => <option key={playlist.id} value={playlist.id}>{playlist.title}</option>)}</select></label> : <Link className="add-to-playlist-link" href="/playlists/new">Create a playlist to add this movie</Link>)}<div className="movie-actions"><button aria-pressed={preference.liked === true} className={preference.liked ? "movie-action is-active" : "movie-action"} onClick={() => updatePreference(movie.id, { liked: !preference.liked })} type="button"><span aria-hidden="true">♥</span> Like</button><button aria-pressed={preference.viewed === true} className={preference.viewed ? "movie-action is-active" : "movie-action"} onClick={() => updatePreference(movie.id, { viewed: !preference.viewed, rating: !preference.viewed ? preference.rating : null })} type="button"><span aria-hidden="true">✓</span> Watched</button></div></div></article>; })}</div>{searchPage < totalPages && <button className="button button-outline load-more" disabled={searching} onClick={() => searchMovies(submittedQuery, searchPage + 1, true)} type="button">{searching ? "Loading movies…" : "Load more movies"}</button>}</> : !searching && <p className="search-empty">No movies matched “{submittedQuery}”. Try another title.</p>}{preferenceMessage && <p className="preference-message" role="status">{preferenceMessage}</p>}<p className="tmdb-attribution">Movie data and artwork supplied by TMDB. Preference actions are private to your account.</p></section>}

      <section className="section-band" id="how-it-works"><div className="section-heading"><div><p className="eyebrow">From the community</p><h2>Find your next favorite.</h2></div><a className="arrow-link" href="#playlists">View all playlists <span>↗</span></a></div><div className="playlist-grid" id="playlists">{starterPlaylists.map((playlist) => <article className="playlist-card" key={playlist.title}><div className={`playlist-art ${playlist.color}`}><span>CC</span><strong>{playlist.title}</strong></div><div className="playlist-meta"><div><h3>{playlist.title}</h3><p>by {playlist.owner}</p></div><span>{playlist.count} films</span></div></article>)}</div></section>

      <section className="feature-strip"><div><p className="eyebrow">Make it yours</p><h2>Your taste has a point of view.</h2></div><p>Like what speaks to you. Mark what you have seen. Rate it in half-stars. CineCircle learns your rhythm without making your private taste public.</p><Link className="button button-outline" href={viewer ? "/dashboard" : "/auth"}>{viewer ? "Continue your collection" : "Start your collection"} <span>→</span></Link></section>

      <footer><Link className="wordmark" href="/">cine<span>circle</span></Link><p>Movie nights, made personal.</p><p className="footer-note">Uses TMDB and the TMDB APIs but is not endorsed or certified by TMDB.</p></footer>
    </main>
  );
}
