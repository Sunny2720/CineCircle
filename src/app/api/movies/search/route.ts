import { NextRequest, NextResponse } from "next/server";
import { searchTmdb } from "@/lib/tmdb";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("query")?.trim() ?? "";
  const page = Number(request.nextUrl.searchParams.get("page") ?? "1");

  if (!query) return NextResponse.json({ results: [], page: 1, total_pages: 0, total_results: 0 });
  if (!process.env.TMDB_API_READ_ACCESS_TOKEN) return NextResponse.json({ error: "Movie search is not configured yet." }, { status: 503 });

  try {
    return NextResponse.json(await searchTmdb(query, Number.isInteger(page) && page > 0 ? page : 1));
  } catch {
    return NextResponse.json({ error: "Movie search is temporarily unavailable." }, { status: 502 });
  }
}