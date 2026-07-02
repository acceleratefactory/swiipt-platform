import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { partnerId, status, notes, platformFeePct, isAvailable } = await request.json();
  if (!partnerId || !status) {
    return NextResponse.json({ error: "partnerId and status required" }, { status: 400 });
  }

  const validStatuses = ["pending", "active", "suspended", "rejected"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  // Fetch current partner for audit trail
  const { data: current } = await (supabase as any)
    .from("platform_partners")
    .select("status, platform_fee_pct")
    .eq("id", partnerId)
    .single();

  const updates: Record<string, unknown> = { status };

  if (status === "active") {
    updates.verified_by = user.id;
    updates.verified_at = new Date().toISOString();
  }

  if (platformFeePct !== undefined && platformFeePct >= 0 && platformFeePct <= 100) {
    updates.platform_fee_pct = platformFeePct;
  }

  if (isAvailable !== undefined) {
    updates.is_available = isAvailable;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("platform_partners")
    .update(updates)
    .eq("id", partnerId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Admin audit log
  const prevStr = platformFeePct !== undefined ? `status:${current?.status},fee:${current?.platform_fee_pct}%` : (current?.status || null);
  const newStr = platformFeePct !== undefined ? `status:${status},fee:${platformFeePct}%` : status;
  await (supabase as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action: "update_partner_status",
    target_type: "platform_partners",
    target_id: partnerId,
    previous_value: prevStr,
    new_value: newStr,
    notes: notes || (platformFeePct !== undefined ? `Fee updated to ${platformFeePct}%` : `Partner status changed to ${status}`),
  });

  return NextResponse.json({ success: true });
}
