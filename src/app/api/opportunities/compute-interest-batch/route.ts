import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const sixHoursAgo = new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString();

  const { data: users } = await adminSupabase
    .from("opportunity_signals")
    .select("user_id")
    .gte("created_at", sixHoursAgo)
    .order("created_at", { ascending: false });

  if (!users || users.length === 0) {
    return NextResponse.json({ ok: true, processed: 0 });
  }

  const userIdSet = new Set(users.map((u: any) => u.user_id));
  const uniqueUserIds = Array.from(userIdSet).slice(0, 100);

  const results: { userId: string; signalCount: number; modelConfidence: string | null }[] = [];

  for (const userId of uniqueUserIds) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/opportunities/compute-interest`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-internal-secret": process.env.INTERNAL_API_SECRET || "",
          },
          body: JSON.stringify({ userId }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        results.push({ userId, signalCount: data.signalCount || 0, modelConfidence: data.modelConfidence || null });
      }
    } catch {
      // skip failed users
    }
  }

  return NextResponse.json({ ok: true, processed: uniqueUserIds.length, results });
}
