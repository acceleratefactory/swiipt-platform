import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { giverGoalId, recipientEmail, recipientGoalId, amount, message } = await request.json();

  const { data: giverGoal } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("id", giverGoalId)
    .eq("user_id", user.id)
    .single();

  if (!giverGoal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

  if (!giverGoal.milestone_25_unlocked) {
    return NextResponse.json({ error: "You must reach the 25% milestone before gifting" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: setting } = await (supabase as any)
    .from("platform_settings")
    .select("value")
    .eq("key", "gift_max_pct_per_30days")
    .single();

  const maxPct = Number(setting?.value || 30) / 100;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: recentGifts } = await (supabase as any)
    .from("goal_gifts")
    .select("amount")
    .eq("giver_id", user.id)
    .eq("giver_goal_id", giverGoalId)
    .gte("created_at", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());

  const totalGiftedLast30 = recentGifts?.reduce((sum: number, g: any) => sum + g.amount, 0) || 0;
  const maxAllowed = giverGoal.current_balance * maxPct;

  if (totalGiftedLast30 + amount > maxAllowed) {
    return NextResponse.json({
      error: `Maximum gift this month: ${giverGoal.currency} ${Math.floor(maxAllowed - totalGiftedLast30).toLocaleString()}`,
    }, { status: 400 });
  }

  const { data: recipientUser } = await supabase
    .from("users")
    .select("id, full_name")
    .eq("email", recipientEmail)
    .single();

  if (!recipientUser) {
    return NextResponse.json({ error: "Recipient not found. They must be a registered Swiipt user." }, { status: 404 });
  }

  const { data: recipientGoal } = await supabase
    .from("savings_goals")
    .select("id, goal_name, currency")
    .eq("id", recipientGoalId)
    .eq("user_id", recipientUser.id)
    .eq("status", "active")
    .single();

  if (!recipientGoal) {
    return NextResponse.json({ error: "Recipient goal not found" }, { status: 404 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("savings_goals")
    .update({ current_balance: giverGoal.current_balance - amount })
    .eq("id", giverGoalId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc("increment_goal_balance", {
    goal_id_input: recipientGoalId,
    amount_input: amount,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: gift } = await (supabase as any)
    .from("goal_gifts")
    .insert({
      giver_id: user.id,
      giver_goal_id: giverGoalId,
      recipient_id: recipientUser.id,
      recipient_goal_id: recipientGoalId,
      amount,
      currency: giverGoal.currency,
      ngn_equivalent: amount,
      message: message || null,
    })
    .select()
    .single();

  const { data: giverProfile } = await supabase
    .from("users")
    .select("full_name")
    .eq("id", user.id)
    .single();

  await supabase.from("notifications").insert({
    user_id: recipientUser.id,
    type: "gift_received",
    title: `🎁 ${giverProfile?.full_name} gifted you ${giverGoal.currency} ${amount.toLocaleString()}!`,
    body: `Added to your "${recipientGoal.goal_name}" goal.${message ? ` "${message}"` : ""}`,
    action_url: `/dashboard/goals/${recipientGoalId}`,
    target_segment: null,
  });

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "gift_sent",
    title: "Gift sent ✓",
    body: `${giverGoal.currency} ${amount.toLocaleString()} sent to ${recipientUser.full_name}'s goal.`,
    action_url: `/dashboard/goals/${giverGoalId}`,
    target_segment: null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc("recalculate_wallet_locked", { user_id_input: user.id });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc("recalculate_wallet_locked", { user_id_input: recipientUser.id });

  const { data: updatedRecipientGoal } = await supabase
    .from("savings_goals")
    .select("current_balance, target_amount")
    .eq("id", recipientGoalId)
    .single();

  if (updatedRecipientGoal) {
    const pct = (updatedRecipientGoal.current_balance / updatedRecipientGoal.target_amount) * 100;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("check_and_unlock_milestones_rpc", {
      goal_id_input: recipientGoalId,
      user_id_input: recipientUser.id,
      current_pct: pct,
    });
  }

  await supabase.from("activity_log").insert({
    user_id: user.id,
    event_type: "gift_sent",
    event_data: { amount, recipient_id: recipientUser.id, goal_id: giverGoalId },
  });

  return NextResponse.json({ success: true, giftId: gift.id, recipientName: recipientUser.full_name });
}
