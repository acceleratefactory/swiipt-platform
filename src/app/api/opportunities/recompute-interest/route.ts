import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Authenticated wrapper around the internal compute-interest endpoint.
// compute-interest requires the INTERNAL_API_SECRET, which the browser
// cannot hold, so this server route verifies the user session and forwards
// the request internally with the secret. Used for per-session recompute
// (Fix 1 item 6) in addition to the 6h cron.

export async function POST(_request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();
  if (error || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const base = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  try {
    const res = await fetch(`${base}/api/opportunities/compute-interest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
      },
      body: JSON.stringify({ userId: user.id }),
    });
    const json = await res.json().catch(() => ({ ok: true }));
    return NextResponse.json(json);
  } catch {
    return NextResponse.json({ ok: true });
  }
}
