import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const followInput = z.object({ userId: z.string().uuid() });

async function currentUser() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  return { supabase, userId: auth.user.id };
}

export async function GET() {
  const result = await currentUser();
  if ("error" in result) return result.error;
  const [followers, following] = await Promise.all([
    result.supabase.from("user_follows").select("follower_id", { count: "exact", head: true }).eq("following_id", result.userId),
    result.supabase.from("user_follows").select("following_id", { count: "exact", head: true }).eq("follower_id", result.userId),
  ]);
  const failure = followers.error || following.error;
  if (failure) return NextResponse.json({ error: failure.message }, { status: 502 });
  return NextResponse.json({ followers: followers.count ?? 0, following: following.count ?? 0 });
}

export async function POST(request: NextRequest) {
  const parsed = followInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  const result = await currentUser();
  if ("error" in result) return result.error;
  if (parsed.data.userId === result.userId) return NextResponse.json({ error: "You cannot follow yourself." }, { status: 400 });
  const { error } = await result.supabase.from("user_follows").upsert({ follower_id: result.userId, following_id: parsed.data.userId }, { onConflict: "follower_id,following_id", ignoreDuplicates: true });
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ following: true }, { status: 201 });
}

export async function DELETE(request: NextRequest) {
  const parsed = followInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid user." }, { status: 400 });
  const result = await currentUser();
  if ("error" in result) return result.error;
  const { error } = await result.supabase.from("user_follows").delete().eq("follower_id", result.userId).eq("following_id", parsed.data.userId);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ following: false });
}
