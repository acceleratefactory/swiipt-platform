import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dealId, milestoneId } = await request.json();
  if (!dealId || !milestoneId) {
    return NextResponse.json({ error: "dealId and milestoneId required" }, { status: 400 });
  }

  // Fetch the deal
  const { data: deal } = await supabase
    .from("escrow_deals")
    .select("*")
    .eq("id", dealId)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  // Allow the client or any authenticated user to request milestone completion
  // Partner auth is handled via admin confirmation step
  if (user.id !== deal.client_user_id) {
    const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).maybeSingle();
    if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
      return NextResponse.json({ error: "Only the client or an admin can request milestone completion" }, { status: 403 });
    }
  }

  const milestones = (deal.milestones as unknown as Array<Record<string, unknown>>) || [];

  const milestoneIndex = milestones.findIndex((m) => m.id === milestoneId);
  if (milestoneIndex === -1) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  const milestone = milestones[milestoneIndex];
  if (milestone.status !== "pending") {
    return NextResponse.json({ error: "Milestone already completed, disputed, or pending admin confirmation" }, { status: 400 });
  }

  // Step 1: Partner marks complete → set to completed_pending_admin
  milestones[milestoneIndex] = {
    ...milestone,
    status: "completed_pending_admin",
    completed_at: null,
    requested_by: user.id,
    requested_at: new Date().toISOString(),
  };

  const { error: updateError } = await (supabase as any)
    .from("escrow_deals")
    .update({ milestones })
    .eq("id", dealId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Notify admins
  const { data: admins } = await (supabase as any)
    .from("user_roles")
    .select("user_id")
    .in("role", ["admin", "case_manager"]);

  const adminIds = (admins || []).map((a: { user_id: string }) => a.user_id).filter((v: string, i: number, a: string[]) => a.indexOf(v) === i);
  const adminNotifs = adminIds.map((adminId: string) => ({
    user_id: adminId,
    type: "milestone_completion_request",
    title: "Milestone completion requested",
    body: `A milestone in deal "${deal.title}" has been marked as complete and needs admin confirmation.`,
    action_url: `/admin/partners/${deal.partner_id}`,
    event_data: { dealId, milestoneId, milestoneTitle: milestone.title, partnerId: deal.partner_id },
  }));

  if (adminNotifs.length > 0) {
    await (supabase as any).from("notifications").insert(adminNotifs).catch(() => {});
  }

  return NextResponse.json({ success: true, status: "completed_pending_admin" });
}
