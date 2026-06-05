import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id, category, destination, name, short_description, full_description, price_ngn, price_usd, price_aed, price_qar, price_gbp, price_cad, price_eur, processing_weeks_min, processing_weeks_max, is_active, is_featured, badge_text, sort_order } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  if (id) {
    const { data, error } = await supabaseAny
      .from("service_packages")
      .update({ category, destination, name, short_description, full_description, price_ngn, price_usd, price_aed, price_qar, price_gbp, price_cad, price_eur, processing_weeks_min, processing_weeks_max, is_active, is_featured, badge_text, sort_order })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } else {
    const { data, error } = await supabaseAny
      .from("service_packages")
      .insert({ category, destination, name, short_description, full_description, price_ngn, price_usd, price_aed, price_qar, price_gbp, price_cad, price_eur, processing_weeks_min, processing_weeks_max, is_active, is_featured, badge_text, sort_order })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }
}
