import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { currencyId, code, ngn_exchange_rate, is_active } = await request.json();

  // Fetch current record for audit log
  const { data: current } = await supabase
    .from("currencies")
    .select("*")
    .eq("id", currencyId)
    .single();

  if (!current) return NextResponse.json({ error: "Currency not found" }, { status: 404 });

  // Validations
  if (is_active !== undefined && typeof is_active !== "boolean") {
    return NextResponse.json({ error: "is_active must be a boolean" }, { status: 400 });
  }

  if (ngn_exchange_rate !== undefined) {
    const rate = Number(ngn_exchange_rate);
    if (rate <= 0) {
      return NextResponse.json({ error: "Rate must be greater than 0" }, { status: 400 });
    }
    if (code === "NGN" && rate !== 1) {
      return NextResponse.json({ error: "NGN rate must always be 1" }, { status: 400 });
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: Record<string, any> = { last_updated_by: user.id };
  if (ngn_exchange_rate !== undefined) updateData.ngn_exchange_rate = Number(ngn_exchange_rate);
  if (is_active !== undefined) updateData.is_active = is_active;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("currencies")
    .update(updateData)
    .eq("id", currencyId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action: "update_currency_rate",
    target_table: "currencies",
    target_record_id: code,
    target_user_id: null,
    previous_value: JSON.stringify({ ngn_exchange_rate: current.ngn_exchange_rate, is_active: current.is_active }),
    new_value: JSON.stringify(updateData),
  });

  return NextResponse.json({ success: true });
}
