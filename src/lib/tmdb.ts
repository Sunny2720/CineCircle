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
  return { page: payload.page, total_pages: payload.total_pages, total_results: payload.total_results, results: z.array(tmdbMovieSchema).parse(payload.results) };
}