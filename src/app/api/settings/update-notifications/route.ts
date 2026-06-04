import { NextResponse } from "next/server";

export async function POST() {
  // MVP: no-op — notification preferences stored client-side in localStorage.
  // Sprint 12+ will persist to a user_preferences table.
  return NextResponse.json({ success: true });
}
