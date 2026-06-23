import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const body = await request.json();
  const { id, title, destination, description, duration_nights, price_per_person_ngn, price_per_person_usd, price_per_person_aed, price_per_person_qar, price_per_person_gbp, price_per_person_cad, price_per_person_eur, original_price_ngn, slots_available, inclusions, is_active, is_featured } = body;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = adminSupabase as any;

  if (id) {
    const { data, error } = await db
      .from("holiday_packages")
      .update({ title, destination, description, duration_nights, price_per_person_ngn, price_per_person_usd, price_per_person_aed, price_per_person_qar, price_per_person_gbp, price_per_person_cad, price_per_person_eur, original_price_ngn, slots_available, inclusions, is_active, is_featured })
      .eq("id", id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } else {
    const { data, error } = await db
      .from("holiday_packages")
      .insert({ title, destination, description, duration_nights, price_per_person_ngn, price_per_person_usd, price_per_person_aed, price_per_person_qar, price_per_person_gbp, price_per_person_cad, price_per_person_eur, original_price_ngn, slots_available, inclusions, is_active, is_featured })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }
}
