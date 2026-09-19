import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  const [playlists, liked, watched, rated, likedMovies, watchedMovies] = await Promise.all([
    supabase.from("playlists").select("id, title, description, visibility, slug, updated_at").eq("owner_id", auth.user.id).order("updated_at", { ascending: false }).limit(6),
    supabase.from("user_movie_preferences").select("movie_id", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("liked", true),
    supabase.from("user_movie_preferences").select("movie_id", { count: "exact", head: true }).eq("user_id", auth.user.id).eq("viewed", true),
    supabase.from("user_movie_preferences").select("movie_id", { count: "exact", head: true }).eq("user_id", auth.user.id).not("rating", "is", null),
    supabase.from("user_movie_preferences").select("updated_at, movies(title, release_year, poster_path)").eq("user_id", auth.user.id).eq("liked", true).order("updated_at", { ascending: false }).limit(12),
    supabase.from("user_movie_preferences").select("updated_at, movies(title, release_year, poster_path)").eq("user_id", auth.user.id).eq("viewed", true).order("updated_at", { ascending: false }).limit(12),
  ]);
  const failure = [playlists, liked, watched, rated, likedMovies, watchedMovies].find((result) => result.error)?.error;
  if (failure) return NextResponse.json({ error: failure.message }, { status: 502 });
  return NextResponse.json({ playlists: playlists.data ?? [], counts: { liked: liked.count ?? 0, watched: watched.count ?? 0, rated: rated.count ?? 0 }, likedMovies: likedMovies.data ?? [], watchedMovies: watchedMovies.data ?? [] });
}
