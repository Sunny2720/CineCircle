import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

export const catalogMovieInput = z.object({
  tmdb_id: z.number().int().positive(),
  title: z.string().trim().min(1).max(500),
  overview: z.string().max(10000).default(""),
  release_date: z.string().max(20).default(""),
  poster_path: z.string().nullable().default(null),
  backdrop_path: z.string().nullable().default(null),
  genre_ids: z.array(z.number().int()).default([]),
});

export type CatalogMovieInput = z.infer<typeof catalogMovieInput>;

export async function findOrCreateMovie(movie: CatalogMovieInput) {
  const supabase = await createClient();
  const providerId = String(movie.tmdb_id);
  const { data: reference, error: referenceError } = await supabase
    .from("movie_provider_references")
    .select("movie_id")
    .eq("provider", "tmdb")
    .eq("provider_movie_id", providerId)
    .maybeSingle();
  if (referenceError) throw new Error(referenceError.message);
  if (reference) return reference.movie_id;

  const releaseYear = /^\d{4}/.test(movie.release_date) ? Number(movie.release_date.slice(0, 4)) : null;
  const { data: created, error: movieError } = await supabase.from("movies").insert({
    title: movie.title, overview: movie.overview, release_year: releaseYear,
    poster_path: movie.poster_path, backdrop_path: movie.backdrop_path,
  }).select("id").single();
  if (movieError) throw new Error(movieError.message);

  const { error: createReferenceError } = await supabase.from("movie_provider_references").insert({
    movie_id: created.id, provider: "tmdb", provider_movie_id: providerId,
  });
  if (createReferenceError) throw new Error(createReferenceError.message);
  return created.id;
}
