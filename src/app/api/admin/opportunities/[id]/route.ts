import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

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

  // Fetch existing provenance to append edit tracking
  const { data: existingOpp } = await (supabase as any)
    .from("opportunities")
    .select("provenance")
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
