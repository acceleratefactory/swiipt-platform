import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rewardId, goalId } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: reward } = await (supabase as any)
    .from("milestone_rewards")
    .select("*")
    .eq("id", rewardId)
    .eq("user_id", user.id)
    .eq("redeemed", false)
    .single();

  if (!reward) return NextResponse.json({ error: "Reward not found or already redeemed" }, { status: 404 });

  const creditValues: Record<string, number> = {
    welcome_gift: 25000,
    streak_30day: 5000,
    streak_90day: 25000,
    "25_percent": 15000,
    "50_percent": 20000,
    "75_percent": 30000,
    "100_percent": 0,
  };

  let creditAmount = creditValues[reward.milestone_type] || 10000;
  if (reward.milestone_type === "welcome_gift") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: setting } = await (supabase as any)
      .from("platform_settings")
      .select("value")
      .eq("key", "welcome_visa_credit_ngn")
      .single();
    creditAmount = Number(setting?.value || 25000);
  }

  let targetGoalId = goalId;

  if (!targetGoalId) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: lockSetting } = await (supabase as any)
      .from("platform_settings")
      .select("value")
      .eq("key", "welcome_visa_lock_months")
      .single();

    const lockMonths = Number(lockSetting?.value || 6);
    const maturityDate = new Date();
    maturityDate.setMonth(maturityDate.getMonth() + lockMonths);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: newGoal } = await (supabase as any)
      .from("savings_goals")
      .insert({
        user_id: user.id,
        goal_name: `${reward.reward_label} — Credit`,
        goal_category: "general_travel",
        currency: "NGN",
        target_amount: creditAmount,
        current_balance: creditAmount,
        is_locked: true,
        lock_period_months: lockMonths,
        start_date: new Date().toISOString().split("T")[0],
        maturity_date: maturityDate.toISOString().split("T")[0],
        early_exit_penalty_rate: 0.03,
      })
      .select()
      .single();

    targetGoalId = newGoal?.id;
  } else {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("increment_goal_balance", {
      goal_id_input: goalId,
      amount_input: creditAmount,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("milestone_rewards")
    .update({ redeemed: true, redeemed_at: new Date().toISOString() })
    .eq("id", rewardId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc("recalculate_wallet_locked", { user_id_input: user.id });

  await supabase.from("notifications").insert({
    user_id: user.id,
    type: "reward_converted",
    title: "Reward converted to credit ✓",
    body: `₦${creditAmount.toLocaleString()} locked travel credit added to your goal.`,
    action_url: `/dashboard/goals/${targetGoalId}`,
    target_segment: null,
  });

  await supabase.from("activity_log").insert({
    user_id: user.id,
    event_type: "reward_converted_to_credit",
    event_data: { reward_id: rewardId, credit_amount: creditAmount, goal_id: targetGoalId },
  });

  return NextResponse.json({ success: true, creditAmount, goalId: targetGoalId });
}
