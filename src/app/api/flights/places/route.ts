import { NextRequest, NextResponse } from "next/server";
import { searchPlaces } from "@/lib/duffel";

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q");
  if (!query || query.length < 2) return NextResponse.json({ places: [] });

  try {
    const places = await searchPlaces(query);
    return NextResponse.json({ places });
  } catch {
    return NextResponse.json({ places: [] });
  }
}
