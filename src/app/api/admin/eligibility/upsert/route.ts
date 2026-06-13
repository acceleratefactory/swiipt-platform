import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  if (body.id) {
    const { data, error } = await supabaseAny
      .from("eligibility_pathways")
      .update({
        pathway_name: body.pathway_name,
        destination: body.destination,
        match_type: body.match_type,
        processing_weeks: body.processing_weeks,
        starting_price_ngn: Number(body.starting_price_ngn),
        description: body.description,
        requires_destination: body.requires_destination || [],
        requires_employment: body.requires_employment || [],
        requires_passport: body.requires_passport || [],
        requires_income: body.requires_income || [],
        excludes_timeline: body.excludes_timeline || [],
        priority_order: Number(body.priority_order),
        is_active: body.is_active ?? true,
        updated_by: user.id,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } else {
    const { data, error } = await supabaseAny
      .from("eligibility_pathways")
      .insert({
        pathway_name: body.pathway_name,
        destination: body.destination,
        match_type: body.match_type,
        processing_weeks: body.processing_weeks,
        starting_price_ngn: Number(body.starting_price_ngn),
        description: body.description,
        requires_destination: body.requires_destination || [],
        requires_employment: body.requires_employment || [],
        requires_passport: body.requires_passport || [],
        requires_income: body.requires_income || [],
        excludes_timeline: body.excludes_timeline || [],
        priority_order: Number(body.priority_order),
        is_active: body.is_active ?? true,
        updated_by: user.id,
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }
}
