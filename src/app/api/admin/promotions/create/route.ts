import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createServiceClient();
  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { promotion_type, title, description, prize_label, prize_value_ngn, trigger_type, trigger_value, trigger_category, quantity_cap, starts_at, ends_at, wheelSlots } = await request.json();

  if (!title || !prize_label) {
    return NextResponse.json({ error: "Title and prize label are required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const status = starts_at && new Date(starts_at) > new Date() ? "scheduled" : "active";

  const { data, error } = await (adminSupabase as any).from("promotions").insert({
    title,
    description: description || null,
    promotion_type: promotion_type || "custom",
    prize_label,
    prize_value_ngn: prize_value_ngn || null,
    trigger_type: trigger_type || null,
    trigger_value: trigger_value || null,
    trigger_category: trigger_category || null,
    quantity_cap: quantity_cap || null,
    starts_at: starts_at || now,
    ends_at: ends_at || null,
    status,
    spin_config: wheelSlots ? { slots: wheelSlots } : null,
  }).select("id").single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true, id: data.id });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
