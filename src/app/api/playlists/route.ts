import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const playlistInput = z.object({
  title: z.string().trim().min(1).max(120),
  description: z.string().trim().max(1000).default(""),
  visibility: z.enum(["private", "public"]).default("private"),
  contributions_enabled: z.boolean().default(false),
});

export async function GET() {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ playlists: [], configured: false });
  const supabase = await createClient();
  const { data: user } = await supabase.auth.getUser();
  const { data, error } = await supabase.from("playlists").select("*").order("updated_at", { ascending: false });
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ playlists: data ?? [], user: user.user?.id ?? null, configured: true });
}

export async function POST(request: NextRequest) {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "Database is not configured yet." }, { status: 503 });
  const parsed = playlistInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: "Invalid playlist details." }, { status: 400 });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const slug = `${parsed.data.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${crypto.randomUUID().slice(0, 8)}`;
  const { data, error } = await supabase.from("playlists").insert({ ...parsed.data, owner_id: auth.user.id, slug }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ playlist: data }, { status: 201 });
}