import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createServiceClient();
  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id, name, location_city, location_country, venue, event_date_start, event_date_end, registration_deadline, category, base_cost_solo_ngn, base_cost_group_ngn, min_group_size, max_group_size, description, invitation_letter_fee_ngn, image_url, is_active } = body;

  const db = adminSupabase as any;

  if (id) {
    const { data, error } = await db
      .from("trade_shows")
      .update({ name, location_city, location_country, venue, event_date_start, event_date_end, registration_deadline, category, base_cost_solo_ngn, base_cost_group_ngn, min_group_size, max_group_size, description, invitation_letter_fee_ngn, image_url, is_active })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } else {
    const { data, error } = await db
      .from("trade_shows")
      .insert({ name, location_city, location_country, venue, event_date_start, event_date_end, registration_deadline, category, base_cost_solo_ngn, base_cost_group_ngn, min_group_size, max_group_size, description, invitation_letter_fee_ngn, image_url, is_active })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }
}
