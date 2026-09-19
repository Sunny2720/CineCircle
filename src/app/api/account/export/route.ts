import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const [profile, playlists, preferences] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, created_at").eq("id", auth.user.id).maybeSingle(),
    supabase.from("playlists").select("title, description, visibility, slug, created_at, updated_at").eq("owner_id", auth.user.id).order("created_at"),
    supabase.from("user_movie_preferences").select("movie_id, liked, viewed, rating, updated_at").eq("user_id", auth.user.id).order("updated_at", { ascending: false }),
  ]);
  const failure = [profile, playlists, preferences].find((result) => result.error)?.error;
  if (failure) return NextResponse.json({ error: failure.message }, { status: 502 });
  const filename = `cinecircle-export-${new Date().toISOString().slice(0, 10)}.json`;
  return new NextResponse(JSON.stringify({ exported_at: new Date().toISOString(), account: { email: auth.user.email, profile: profile.data }, playlists: playlists.data ?? [], preferences: preferences.data ?? [] }, null, 2), { headers: { "content-type": "application/json", "content-disposition": `attachment; filename="${filename}"`, "cache-control": "no-store" } });
}
