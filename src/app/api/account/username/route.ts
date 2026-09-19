import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const usernamePattern = /^[a-z0-9][a-z0-9-]{2,29}$/;

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get("username")?.trim().toLowerCase() ?? "";
  if (!usernamePattern.test(username)) return NextResponse.json({ available: false, message: "Use 3–30 lowercase letters, numbers, or hyphens." });
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return NextResponse.json({ error: "Sign in required." }, { status: 401 });
  const { data, error } = await supabase.from("profiles").select("id").eq("username", username).maybeSingle();
  if (error) return NextResponse.json({ error: error.message }, { status: 502 });
  return NextResponse.json({ available: !data || data.id === auth.user.id });
}
