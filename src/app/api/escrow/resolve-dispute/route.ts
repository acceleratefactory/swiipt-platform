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

  const { dealId, resolution, notes } = await request.json();
  if (!dealId || !resolution || !["refunded", "active", "cancelled"].includes(resolution)) {
    return NextResponse.json({ error: "dealId and resolution (refunded/active/cancelled) required" }, { status: 400 });
  }

  const { data: deal } = await supabase
    .from("escrow_deals")
    .select("id, status, title, client_user_id, partner_id")
    .eq("id", dealId)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.status !== "disputed") {
    return NextResponse.json({ error: "Only disputed deals can be resolved" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("escrow_deals")
    .update({ status: resolution })
    .eq("id", dealId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify client
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("notifications").insert({
    user_id: deal.client_user_id,
    type: "dispute_resolved",
    title: "Dispute resolved",
    body: `Dispute for "${deal.title}" resolved: ${resolution}. ${notes ? `Notes: ${notes}` : ""}`,
    action_url: `/dashboard/find-agent/${deal.partner_id}`,
    event_data: { dealId, resolution, notes, resolvedBy: user.id },
  }).catch(() => {});

  // Admin audit log
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action: "resolve_dispute",
    target_type: "escrow_deals",
    target_id: dealId,
    previous_value: "disputed",
    new_value: resolution,
    notes: notes || `Dispute resolved: ${resolution}`,
  }).catch(() => {});

  return NextResponse.json({ success: true, resolution });
}
