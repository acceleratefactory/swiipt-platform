import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data: ad } = await (supabase as any).from("feed_ads").select("status").eq("id", params.id).single();
  if (!ad) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const nextStatus = ad.status === "active" ? "paused" : "active";

  const { error } = await (supabase as any)
    .from("feed_ads")
    .update({ status: nextStatus })
    .eq("id", params.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ success: true, status: nextStatus });
}
