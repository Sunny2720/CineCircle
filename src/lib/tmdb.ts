import { z } from "zod";

const tmdbMovieSchema = z.object({
  id: z.number(),
  title: z.string(),
  overview: z.string().default(""),
  release_date: z.string().default(""),
  poster_path: z.string().nullable().default(null),
  backdrop_path: z.string().nullable().default(null),
  genre_ids: z.array(z.number()).default([]),
  vote_average: z.number().default(0),
});

export type CatalogMovie = z.infer<typeof tmdbMovieSchema>;

const tmdbMovieDetailSchema = tmdbMovieSchema.extend({
  genres: z.array(z.object({ id: z.number(), name: z.string() })).default([]),
  runtime: z.number().nullable().default(null), tagline: z.string().default(""), status: z.string().default(""), original_language: z.string().default(""), vote_count: z.number().int().nonnegative().default(0), budget: z.number().nonnegative().default(0), revenue: z.number().nonnegative().default(0), homepage: z.string().nullable().default(null), imdb_id: z.string().nullable().default(null),
  videos: z.object({ results: z.array(z.object({ key: z.string(), site: z.string(), type: z.string(), official: z.boolean().default(false) })).default([]) }).default({ results: [] }),
});
export type CatalogMovieDetail = z.infer<typeof tmdbMovieDetailSchema>;

export function tmdbImage(path: string | null, size = "w500") {
  return path ? `https://image.tmdb.org/t/p/${size}${path}` : null;
}

export async function searchTmdb(query: string, page = 1) {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) return { page: 1, total_pages: 0, total_results: 0, results: [] };

  const response = await fetch(`https://api.themoviedb.org/3/search/movie?query=${encodeURIComponent(query)}&page=${page}&include_adult=false`, {
    headers: { Authorization: `Bearer ${token}`, accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) throw new Error(`TMDB request failed: ${response.status}`);
  const payload = await response.json();
  return {
    page: z.number().int().positive().parse(payload.page),
    total_pages: z.number().int().nonnegative().parse(payload.total_pages),
    total_results: z.number().int().nonnegative().parse(payload.total_results),
    results: z.array(tmdbMovieSchema).parse(payload.results),
  };
}

export async function getTmdbMovie(id: number) {
  const token = process.env.TMDB_API_READ_ACCESS_TOKEN;
  if (!token) throw new Error("Movie details are not configured.");
  const response = await fetch(`https://api.themoviedb.org/3/movie/${id}?language=en-US&append_to_response=videos`, { headers: { Authorization: `Bearer ${token}`, accept: "application/json" }, next: { revalidate: 3600 } });
  if (!response.ok) throw new Error(response.status === 404 ? "Movie not found." : "Movie details are temporarily unavailable.");
  return tmdbMovieDetailSchema.parse(await response.json());
}

export function tmdbTrailerUrl(movie: CatalogMovieDetail) {
  const trailer = movie.videos.results.find((video) => video.site === "YouTube" && video.type === "Trailer" && video.official)
    ?? movie.videos.results.find((video) => video.site === "YouTube" && video.type === "Trailer");
  return trailer ? `https://www.youtube.com/watch?v=${encodeURIComponent(trailer.key)}` : null;
}
