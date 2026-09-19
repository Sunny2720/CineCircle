import { NextRequest, NextResponse } from "next/server";
import { catalogMovieInput, findOrCreateMovie } from "@/lib/catalog";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, context: RouteContext<"/api/playlists/[id]/movies">) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
  const { id: playlistId } = await context.params;
  const movie = catalogMovieInput.safeParse(await request.json());
  if (!movie.success) return NextResponse.json({ error: "Invalid movie details." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });

  try {
    const movieId = await findOrCreateMovie(movie.data);
    const { data: existing } = await supabase.from("playlist_movies").select("movie_id").eq("playlist_id", playlistId).eq("movie_id", movieId).maybeSingle();
    if (existing) return NextResponse.json({ error: "This movie is already in that playlist." }, { status: 409 });
    const { data: latest } = await supabase.from("playlist_movies").select("position").eq("playlist_id", playlistId).order("position", { ascending: false }).limit(1).maybeSingle();
    const { error } = await supabase.from("playlist_movies").insert({ playlist_id: playlistId, movie_id: movieId, added_by: auth.user.id, position: (latest?.position ?? -1) + 1 });
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    return NextResponse.json({ added: true }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not add this movie." }, { status: 502 });
  }
}
