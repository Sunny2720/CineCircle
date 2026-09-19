import Image from "next/image";
import Link from "next/link";
import { getTmdbMovie, tmdbImage, tmdbTrailerUrl } from "@/lib/tmdb";

const money = (value: number) => value ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value) : "Not reported";

export default async function MovieDetailsPage({ params }: PageProps<"/movies/[id]">) {
  const { id } = await params;
  const movieId = Number(id);
  if (!Number.isInteger(movieId) || movieId < 1) return <main className="movie-detail-shell"><p>Movie not found.</p></main>;
  try {
    const movie = await getTmdbMovie(movieId);
    const backdrop = tmdbImage(movie.backdrop_path, "w1280");
    const poster = tmdbImage(movie.poster_path, "w500");
    const trailerUrl = tmdbTrailerUrl(movie);
    return <main className="movie-detail-shell"><nav className="topbar"><Link className="wordmark" href="/">cine<span>circle</span></Link><Link className="text-button" href="/">← Back to search</Link></nav><section className="movie-detail-hero" style={backdrop ? { backgroundImage: `linear-gradient(90deg, #17231ff2 25%, #17231f9e 55%, #17231f4d), url(${backdrop})` } : undefined}><div className="movie-detail-poster">{poster ? <Image alt={`${movie.title} poster`} fill priority sizes="(max-width: 800px) 180px, 280px" src={poster} /> : <span>No poster available</span>}</div><div className="movie-detail-copy"><p className="eyebrow">TMDB movie details</p><h1>{movie.title}</h1>{movie.tagline && <p className="movie-tagline">{movie.tagline}</p>}<div className="movie-meta"><span>{movie.release_date?.slice(0, 4) || "Year unknown"}</span><span>{movie.runtime ? `${movie.runtime} min` : "Runtime unknown"}</span><span>{movie.vote_average ? `${movie.vote_average.toFixed(1)} ★ (${movie.vote_count.toLocaleString()})` : "Not rated"}</span></div><div className="genre-list">{movie.genres.map((genre) => <span key={genre.id}>{genre.name}</span>)}</div>{trailerUrl && <a className="button button-coral trailer-link" href={trailerUrl} rel="noreferrer" target="_blank">▶ Watch trailer on YouTube</a>}</div></section><section className="movie-detail-content"><article><p className="eyebrow">Plot</p><h2>What it’s about.</h2><p className="movie-plot">{movie.overview || "No plot summary is available for this movie."}</p></article><aside className="movie-facts"><p className="eyebrow">Details</p><dl><div><dt>Original language</dt><dd>{movie.original_language?.toUpperCase() || "Unknown"}</dd></div><div><dt>Status</dt><dd>{movie.status || "Unknown"}</dd></div><div><dt>Budget</dt><dd>{money(movie.budget)}</dd></div><div><dt>Revenue</dt><dd>{money(movie.revenue)}</dd></div><div><dt>IMDb</dt><dd>{movie.imdb_id ? <a href={`https://www.imdb.com/title/${movie.imdb_id}/`} rel="noreferrer" target="_blank">View on IMDb ↗</a> : "Not available"}</dd></div><div><dt>Official site</dt><dd>{movie.homepage ? <a href={movie.homepage} rel="noreferrer" target="_blank">Visit website ↗</a> : "Not available"}</dd></div></dl></aside></section><p className="tmdb-attribution movie-detail-attribution">Movie data and artwork supplied by TMDB. This product uses the TMDB API but is not endorsed or certified by TMDB.</p></main>;
  } catch (error) {
    return <main className="movie-detail-shell"><nav className="topbar"><Link className="wordmark" href="/">cine<span>circle</span></Link></nav><section className="movie-detail-error"><h1>We couldn’t load that movie.</h1><p>{error instanceof Error ? error.message : "Please try again."}</p><Link className="button button-dark" href="/">Back to search</Link></section></main>;
  }
}
