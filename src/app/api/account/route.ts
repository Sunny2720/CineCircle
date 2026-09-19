import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

const profileInput = z.object({ username: z.string().trim().toLowerCase().regex(/^[a-z0-9][a-z0-9-]{2,29}$/, "Use 3–30 lowercase letters, numbers, or hyphens.") });

async function currentAccount() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user?.email) return { error: NextResponse.json({ error: "Sign in required." }, { status: 401 }) };
  const { data: profile, error } = await supabase.from("profiles").select("username, full_name, avatar_url").eq("id", auth.user.id).maybeSingle();
  if (error) return { error: NextResponse.json({ error: error.message }, { status: 502 }) };
  const avatarUrl = auth.user.user_metadata.picture || auth.user.user_metadata.avatar_url || profile?.avatar_url || "";
  if (avatarUrl && avatarUrl !== profile?.avatar_url) await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("id", auth.user.id);
  return { supabase, user: auth.user, account: { email: auth.user.email, username: profile?.username || "", fullName: auth.user.user_metadata.full_name || auth.user.user_metadata.name || profile?.full_name || "", avatarUrl } };
}

export async function GET() { const result = await currentAccount(); if ("error" in result) return result.error; return NextResponse.json({ account: result.account }); }

export async function PATCH(request: NextRequest) {
  const parsed = profileInput.safeParse(await request.json());
  if (!parsed.success) return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Enter valid profile details." }, { status: 400 });
  const result = await currentAccount();
  if ("error" in result) return result.error;
  const { data, error } = await result.supabase.from("profiles").upsert({ id: result.user.id, username: parsed.data.username }).select("username, full_name, avatar_url").single();
  if (error) return NextResponse.json({ error: error.code === "23505" ? "That username is already taken." : error.message }, { status: 502 });
  return NextResponse.json({ account: { email: result.account.email, username: data.username, fullName: result.account.fullName || data.full_name, avatarUrl: result.account.avatarUrl || data.avatar_url || "" } });
}

export async function DELETE() {
  const result = await currentAccount();
  if ("error" in result) return result.error;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey || !process.env.NEXT_PUBLIC_SUPABASE_URL) return NextResponse.json({ error: "Account deletion is not configured yet." }, { status: 503 });
  const admin = createAdminClient(process.env.NEXT_PUBLIC_SUPABASE_URL, serviceRoleKey, { auth: { autoRefreshToken: false, persistSession: false } });
  const { error } = await admin.auth.admin.deleteUser(result.user.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ deleted: true });
}
