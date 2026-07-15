import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCoverImage } from "@/lib/cover-image";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  if (!body.segment_slug || !body.title || !body.organisation || !body.description || !body.application_url) {
    return NextResponse.json({ error: "segment_slug, title, organisation, description, application_url required" }, { status: 400 });
  }

  const { data, error } = await (supabase as any)
    .from("opportunities")
    .insert({
      segment_slug: body.segment_slug,
      title: body.title,
      organisation: body.organisation,
      location_country: body.location_country || "Multiple",
      location_city: body.location_city || null,
      type: body.type || "job",
      description: body.description,
      requirements: body.requirements || null,
      salary_range: body.salary_range || null,
      funding_amount: body.funding_amount || null,
      deadline: body.deadline || null,
      application_url: body.application_url,
      is_featured: body.is_featured || false,
      related_service_slug: body.related_service_slug || null,
      related_goal_template_id: body.related_goal_template_id || null,
      source_url: body.source_url || null,
      source_name: body.source_name || null,
      ai_generated: false,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const cover = await getCoverImage(
    body.application_url,
    body.title,
    body.organisation,
    body.type || "job",
    body.location_country || "Global",
    body.source_url
  );

  if (cover.cover_image_url) {
    const mediaSource = cover.cover_source === "branded" || cover.cover_source === "none" ? "fallback" : "fetched";
    await (supabase as any)
      .from("opportunities")
      .update({
        cover_image_url: cover.cover_image_url,
        media_source: mediaSource,
        media_type: "image",
      })
      .eq("id", data.id);
  }

  return NextResponse.json({ success: true, id: data.id });
}
