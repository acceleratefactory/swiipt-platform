import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { goalId, bankName, accountNumber, accountName } = await request.json();

  const { data: goal, error: goalError } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .single();

  if (goalError || !goal) {
    return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  }

  const isEarlyExit = goal.is_locked && goal.maturity_date && new Date(goal.maturity_date) > new Date();
  const penaltyRate = isEarlyExit ? goal.early_exit_penalty_rate : 0;
  const penaltyAmount = goal.current_balance * penaltyRate;
  const netAmount = goal.current_balance - penaltyAmount;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).from("withdrawals").insert({
    user_id: user.id,
    goal_id: goalId,
    currency: goal.currency,
    gross_amount: goal.current_balance,
    penalty_rate: penaltyRate,
    penalty_amount: penaltyAmount,
    net_amount: netAmount,
    is_early_exit: isEarlyExit,
    bank_name: bankName,
    account_number: accountNumber,
    account_name: accountName,
  });

  if (error) {
    return NextResponse.json({ error: "Failed to create withdrawal request" }, { status: 500 });
  }

  await supabase.from("notifications").insert({
    user_id: null,
    type: "withdrawal_requested",
    title: "Withdrawal requested",
    body: `${goal.currency} ${goal.current_balance.toLocaleString()} withdrawal requested by user.`,
    action_url: "/admin/withdrawals",
    target_segment: null,
  });

  await supabase.from("activity_log").insert({
    user_id: user.id,
    event_type: "withdrawal_requested",
    event_data: { goal_id: goalId, gross_amount: goal.current_balance, net_amount: netAmount, is_early_exit: isEarlyExit },
  });

  return NextResponse.json({ success: true, netAmount, penaltyAmount, isEarlyExit });
}
