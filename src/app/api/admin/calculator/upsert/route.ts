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
      .from("calculator_configs")
      .update({
        destination: body.destination,
        service_type: body.service_type,
        family_size: body.family_size,
        service_fee_ngn: Number(body.service_fee_ngn),
        government_fee_ngn: Number(body.government_fee_ngn),
        document_prep_ngn: Number(body.document_prep_ngn),
        travel_estimate_ngn: Number(body.travel_estimate_ngn),
        first_month_setup_ngn: Number(body.first_month_setup_ngn),
        processing_weeks_min: Number(body.processing_weeks_min),
        processing_weeks_max: Number(body.processing_weeks_max),
        success_rate: Number(body.success_rate),
        is_active: body.is_active,
        updated_at: new Date().toISOString(),
      })
      .eq("id", body.id)
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  } else {
    const { data, error } = await supabaseAny
      .from("calculator_configs")
      .insert({
        destination: body.destination,
        service_type: body.service_type,
        family_size: body.family_size,
        service_fee_ngn: Number(body.service_fee_ngn),
        government_fee_ngn: Number(body.government_fee_ngn),
        document_prep_ngn: Number(body.document_prep_ngn),
        travel_estimate_ngn: Number(body.travel_estimate_ngn),
        first_month_setup_ngn: Number(body.first_month_setup_ngn),
        processing_weeks_min: Number(body.processing_weeks_min),
        processing_weeks_max: Number(body.processing_weeks_max),
        success_rate: Number(body.success_rate),
      })
      .select()
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    return NextResponse.json({ data });
  }
}
