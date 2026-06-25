import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  const { data: expired } = await (serviceClient as any)
    .from("group_buys")
    .select("id, title, creator_id")
    .eq("status", "open")
    .lt("expires_at", new Date().toISOString());

  if (!expired || expired.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  for (const group of expired) {
    await (serviceClient as any)
      .from("group_buys")
      .update({ status: "expired" })
      .eq("id", group.id);

    await (serviceClient as any).from("notifications").insert({
      user_id: group.creator_id,
      type: "group_buy_expired",
      title: "Your group expired",
      body: `Your group "${group.title}" did not fill before the deadline. No charges were made.`,
      action_url: "/dashboard/groups",
    });
  }

  return NextResponse.json({ expired: expired.length });
}
