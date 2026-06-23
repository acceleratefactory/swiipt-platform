import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id, company_name, contact_name, contact_email, contact_phone, retainer_currency, retainer_amount, status, notes } = await request.json();

  if (!company_name || !contact_name || !contact_email) {
    return NextResponse.json({ error: "company_name, contact_name, and contact_email are required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sb = adminSupabase as any;
  let clientId = id;

  if (id) {
    // Update
    const { error } = await sb
      .from("corporate_clients")
      .update({ company_name, contact_name, contact_email, contact_phone, retainer_currency, retainer_amount, status, notes })
      .eq("id", id);

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  } else {
    // Insert
    const { data, error } = await sb
      .from("corporate_clients")
      .insert({ company_name, contact_name, contact_email, contact_phone, retainer_currency, retainer_amount, status, notes })
      .select("id")
      .single();

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });
    clientId = data.id;

    // Activity log for new client
    await sb.from("activity_log").insert({
      user_id: user.id,
      event_type: "corporate_client_created",
      event_data: { client_id: clientId, company_name },
    });
  }

  return NextResponse.json({ success: true, clientId });
}
