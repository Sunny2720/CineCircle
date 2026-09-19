import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

type Profile = { id: string; username: string; full_name: string | null; avatar_url: string | null };

export async function GET(_: NextRequest, { params }: { params: Promise<{ username: string }> }) {
  const { username } = await params;
  const supabase = await createClient();
  const { data: profile, error } = await supabase.from("profiles").select("id, username, full_name, avatar_url").eq("username", username.toLowerCase()).maybeSingle<Profile>();
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  if (!profile) return NextResponse.json({ error: "Profile not found." }, { status: 404 });

  const { data: auth } = await supabase.auth.getUser();
  const [followersResult, followingResult, playlistsResult, viewerFollowResult] = await Promise.all([
    supabase.from("user_follows").select("follower_id").eq("following_id", profile.id),
    supabase.from("user_follows").select("following_id").eq("follower_id", profile.id),
    supabase.from("playlists").select("id, title, description, slug, updated_at").eq("owner_id", profile.id).eq("visibility", "public").order("updated_at", { ascending: false }).limit(12),
    auth.user ? supabase.from("user_follows").select("following_id").eq("follower_id", auth.user.id).eq("following_id", profile.id).maybeSingle() : Promise.resolve({ data: null, error: null }),
  ]);
  const failure = followersResult.error || followingResult.error || playlistsResult.error || viewerFollowResult.error;
  if (failure) return NextResponse.json({ error: failure.message }, { status: 502 });

  const followerIds = (followersResult.data ?? []).map((item) => item.follower_id);
  const followingIds = (followingResult.data ?? []).map((item) => item.following_id);
  const ids = [...new Set([...followerIds, ...followingIds])];
  const { data: people, error: peopleError } = ids.length
    ? await supabase.from("profiles").select("id, username, full_name, avatar_url").in("id", ids)
    : { data: [], error: null };
  if (peopleError) return NextResponse.json({ error: peopleError.message }, { status: 502 });
  const peopleById = new Map((people ?? []).map((person) => [person.id, person]));

  return NextResponse.json({
    profile,
    authenticated: Boolean(auth.user),
    isSelf: auth.user?.id === profile.id,
    following: Boolean(viewerFollowResult.data),
    counts: { followers: followerIds.length, following: followingIds.length },
    followers: followerIds.map((id) => peopleById.get(id)).filter(Boolean),
    followingPeople: followingIds.map((id) => peopleById.get(id)).filter(Boolean),
    playlists: playlistsResult.data ?? [],
  });
}
