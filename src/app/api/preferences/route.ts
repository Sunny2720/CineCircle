import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { moviePreferenceSchema } from "@/lib/preferences";
import { catalogMovieInput, findOrCreateMovie } from "@/lib/catalog";

export async function PUT(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
  const body = await request.json();
  const parsed = moviePreferenceSchema.safeParse(body.preference);
  const movie = catalogMovieInput.safeParse(body.movie);
  if (!parsed.success || !movie.success) return NextResponse.json({ error: "Invalid movie preference." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  try {
    const movieId = await findOrCreateMovie(movie.data);
    const { data, error } = await supabase.from("user_movie_preferences").upsert({ user_id: auth.user.id, movie_id: movieId, ...parsed.data }).select().single();
    if (error) return NextResponse.json({ error: error.message }, { status: 502 });
    return NextResponse.json({ preference: data });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : "Could not save this movie." }, { status: 502 });
  }
}

export async function DELETE(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
  const movieId = request.nextUrl.searchParams.get("movie_id");
  if (!movieId) return NextResponse.json({ error: "movie_id is required." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { error } = await supabase.from("user_movie_preferences").delete().eq("user_id", auth.user.id).eq("movie_id", movieId);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ deleted: true });
}
