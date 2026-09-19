import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const query = request.nextUrl.searchParams.get("query")?.trim().toLowerCase() ?? "";
  let profiles = supabase.from("profiles").select("id, username, full_name, avatar_url").neq("id", auth.user.id).order("username").limit(12);
  if (query) profiles = profiles.or(`username.ilike.%${query}%,full_name.ilike.%${query}%`);
  const [{ data, error }, { data: follows, error: followError }] = await Promise.all([
    profiles,
    supabase.from("user_follows").select("following_id").eq("follower_id", auth.user.id),
  ]);
  if (error || followError) return NextResponse.json({ error: error?.message || followError?.message }, { status: 502 });
  const followed = new Set((follows ?? []).map((follow) => follow.following_id));
  return NextResponse.json({ people: (data ?? []).map((profile) => ({ ...profile, following: followed.has(profile.id) })) });
}
