import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

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

  const milestones = (deal.milestones as unknown as Array<Record<string, unknown>>) || [];

  const milestoneIndex = milestones.findIndex((m) => m.id === milestoneId);
  if (milestoneIndex === -1) {
    return NextResponse.json({ error: "Milestone not found" }, { status: 404 });
  }

  const milestone = milestones[milestoneIndex];
  if (milestone.status !== "completed_pending_admin") {
    return NextResponse.json({ error: "Milestone is not pending admin confirmation" }, { status: 400 });
  }

  // Confirm milestone — fully complete it
  milestones[milestoneIndex] = {
    ...milestone,
    status: "completed",
    completed_at: new Date().toISOString(),
    confirmed_by: user.id,
    confirmed_at: new Date().toISOString(),
  };

  const allCompleted = milestones.every((m) => m.status === "completed");

  const { error: updateError } = await (supabase as any)
    .from("escrow_deals")
    .update({
      milestones,
      status: allCompleted ? "completed" : "active",
      completed_at: allCompleted ? new Date().toISOString() : null,
    })
    .eq("id", dealId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Notifications (client only — partner has no auth.users link yet)
  const notifs = [
    {
      user_id: deal.client_user_id,
      type: "milestone_completed",
      title: "Milestone completed",
      body: `Milestone "${milestone.title}" has been confirmed complete by admin.`,
      action_url: `/dashboard/find-agent/${deal.partner_id}`,
      event_data: { dealId, milestoneId, milestoneTitle: milestone.title },
    },
  ];

  if (allCompleted) {
    notifs.push({
      user_id: deal.client_user_id,
      type: "deal_completed",
      title: "Escrow deal completed",
      body: `All milestones for "${deal.title}" are complete. Thank you for using Swiipt Escrow.`,
      action_url: `/dashboard/find-agent`,
      event_data: { dealId, milestoneId, milestoneTitle: milestone.title },
    });
  }

  await (supabase as any).from("notifications").insert(notifs).catch(() => {});

  return NextResponse.json({ success: true, allCompleted });
}
