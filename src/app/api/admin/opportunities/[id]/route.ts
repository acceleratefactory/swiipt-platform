import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { getCoverImage } from "@/lib/cover-image";

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const updates: Record<string, any> = {};

  const allowedFields = [
    "segment_slug", "title", "organisation", "location_country", "location_city",
    "type", "description", "requirements", "salary_range", "funding_amount",
    "deadline", "application_url", "is_featured", "related_service_slug",
    "related_goal_template_id", "source_url", "source_name", "is_active",
  ];

  for (const field of allowedFields) {
    if (body[field] !== undefined) updates[field] = body[field];
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: "No fields to update" }, { status: 400 });
  }

  const { data: existingOpp } = await (supabase as any)
    .from("opportunities")
    .select("provenance, title, organisation, type, location_country, application_url, source_url")
    .eq("id", params.id)
    .single();

  const existingProv = existingOpp?.provenance || {};
  const editedBy = existingProv.edited_by || [];
  const editedAt = existingProv.edited_at || [];

  updates.provenance = {
    ...existingProv,
    edited_by: [...editedBy, user.id],
    edited_at: [...editedAt, new Date().toISOString()],
  };

  const { error } = await (supabase as any).from("opportunities").update(updates).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const urlChanged = body.application_url && body.application_url !== existingOpp?.application_url;
  const titleChanged = body.title && body.title !== existingOpp?.title;
  const shouldRegenerateCover = urlChanged || titleChanged;

  if (shouldRegenerateCover) {
    const finalTitle = body.title || existingOpp?.title;
    const finalOrg = body.organisation || existingOpp?.organisation;
    const finalType = body.type || existingOpp?.type;
    const finalCountry = body.location_country || existingOpp?.location_country;
    const finalUrl = body.application_url || existingOpp?.application_url;

    const cover = await getCoverImage(finalUrl, finalTitle, finalOrg, finalType, finalCountry, body.source_url || existingOpp?.source_url);

    if (cover.cover_image_url) {
      const mediaSource = cover.cover_source === "branded" || cover.cover_source === "none" ? "fallback" : "fetched";
      await (supabase as any)
        .from("opportunities")
        .update({
          cover_image_url: cover.cover_image_url,
          media_source: mediaSource,
          media_type: "image",
        })
        .eq("id", params.id);
    }
  }

  return NextResponse.json({ success: true });
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { error } = await (supabase as any).from("opportunities").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
