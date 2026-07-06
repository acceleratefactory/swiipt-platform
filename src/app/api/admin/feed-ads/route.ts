import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { data } = await (supabase as any)
    .from("feed_ads")
    .select("*")
    .order("created_at", { ascending: false });

  return NextResponse.json(data || []);
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  if (!body.headline || !body.cta_url) {
    return NextResponse.json({ error: "headline and cta_url are required" }, { status: 400 });
  }

  const { data, error } = await (supabase as any).from("feed_ads").insert({
    ad_type: body.ad_type || "internal",
    advertiser_name: body.advertiser_name || null,
    headline: body.headline,
    body: body.body || null,
    cover_image_url: body.cover_image_url || null,
    cta_label: body.cta_label || "Learn more",
    cta_url: body.cta_url,
    status: body.status || "draft",
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json(data);
}
