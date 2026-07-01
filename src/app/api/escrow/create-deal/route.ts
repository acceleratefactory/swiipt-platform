import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { partnerId, title, description, totalAmountNgn, milestones } = await request.json();

  if (!partnerId || !title || !totalAmountNgn || !milestones?.length) {
    return NextResponse.json({ error: "partnerId, title, totalAmountNgn, and milestones required" }, { status: 400 });
  }

  // Verify partner exists and is active
  const { data: partner } = await supabase
    .from("platform_partners")
    .select("id, name, platform_fee_pct")
    .eq("id", partnerId)
    .eq("status", "active")
    .single();

  if (!partner) {
    return NextResponse.json({ error: "Partner not found or not active" }, { status: 404 });
  }

  const platformFeePct = partner.platform_fee_pct || 5;
  const platformFeeNgn = Math.round(totalAmountNgn * (platformFeePct / 100));
  const partnerPayoutNgn = totalAmountNgn - platformFeeNgn;

  // Create milestones with amounts and IDs
  const milestonesWithAmounts = milestones.map((m: { title: string; description: string; pctOfTotal: number }, idx: number) => ({
    id: `ms-${Date.now()}-${idx}`,
    title: m.title,
    description: m.description || "",
    pctOfTotal: m.pctOfTotal,
    amount_ngn: Math.round((m.pctOfTotal / 100) * totalAmountNgn),
    status: "pending",
    completed_at: null,
  }));

  // Create savings goal for the client (locked, custom category)
  const { data: goal, error: goalError } = await (supabase as any)
    .from("savings_goals")
    .insert({
      user_id: user.id,
      goal_name: title,
      target_amount: totalAmountNgn,
      current_balance: 0,
      goal_category: "custom",
      status: "active",
      is_locked: true,
      lock_period_months: 12,
    })
    .select()
    .single();

  if (goalError) {
    return NextResponse.json({ error: "Failed to create savings goal: " + goalError.message }, { status: 500 });
  }

  // Create escrow deal
  const { data: deal, error: dealError } = await (supabase as any)
    .from("escrow_deals")
    .insert({
      partner_id: partnerId,
      client_user_id: user.id,
      title,
      description: description || null,
      total_amount_ngn: totalAmountNgn,
      platform_fee_ngn: platformFeeNgn,
      partner_payout_ngn: partnerPayoutNgn,
      status: "active",
      milestones: milestonesWithAmounts,
      savings_goal_id: goal.id,
    })
    .select()
    .single();

  if (dealError) {
    // Cleanup: delete the goal we just created
    await (supabase as any).from("savings_goals").delete().eq("id", goal.id);
    return NextResponse.json({ error: "Failed to create deal: " + dealError.message }, { status: 500 });
  }

  return NextResponse.json({ dealId: deal.id, savingsGoalId: goal.id });
}
