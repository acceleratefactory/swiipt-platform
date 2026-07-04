import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { goalId, feeDepositId } = await request.json();
  if (!goalId || !feeDepositId) {
    return NextResponse.json({ error: "goalId and feeDepositId required" }, { status: 400 });
  }

  // Verify goal belongs to user and has sufficient balance
  const { data: goal } = await supabase
    .from("savings_goals")
    .select("id, goal_name, current_balance, target_amount, destination, created_at")
    .eq("id", goalId)
    .eq("user_id", user.id)
    .eq("status", "active")
    .single();

  if (!goal) {
    return NextResponse.json({ error: "Goal not found or not active" }, { status: 404 });
  }

  if (goal.current_balance < 50000) {
    return NextResponse.json({ error: "Goal balance must be at least ₦50,000" }, { status: 400 });
  }

  // Verify the fee deposit exists, is confirmed, and covers the fee
  const { data: feeDeposit } = await supabase
    .from("deposits")
    .select("id, status, amount, goal_id")
    .eq("id", feeDepositId)
    .eq("user_id", user.id)
    .single();

  if (!feeDeposit || feeDeposit.status !== "confirmed") {
    return NextResponse.json({ error: "Fee deposit not confirmed" }, { status: 400 });
  }

  if (feeDeposit.amount < 15000) {
    return NextResponse.json({ error: "Deposit amount must be at least ₦15,000 for this certificate" }, { status: 400 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Generate certificate number
  const { data: certNumber, error: seqError } = await adminSupabase.rpc("next_certificate_number", {
    cert_prefix: "SWP-POF",
  });

  if (seqError || !certNumber) {
    return NextResponse.json({ error: "Failed to generate certificate number" }, { status: 500 });
  }

  // Calculate deposit history (90 days) for this goal
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: depositHistory } = await supabase
    .from("deposits")
    .select("amount, created_at, ngn_equivalent")
    .eq("goal_id", goalId)
    .eq("status", "confirmed")
    .gte("created_at", ninetyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(30);

  const totalDeposits90d = (depositHistory || []).reduce((sum, d) => sum + (d.amount || 0), 0);

  // Calculate true 28-day minimum balance via balance trajectory
  const twentyEightDaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000);
  const depositsLast28d = (depositHistory || [])
    .filter(d => new Date(d.created_at) >= twentyEightDaysAgo)
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

  const totalNewDeposits28d = depositsLast28d.reduce((sum, d) => sum + (d.amount || 0), 0);

  let runningBalance = goal.current_balance;
  let min28DayBalance = runningBalance;
  for (const dep of depositsLast28d) {
    runningBalance -= (dep.amount || 0);
    if (runningBalance < min28DayBalance) min28DayBalance = runningBalance;
  }
  min28DayBalance = Math.max(0, min28DayBalance);

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, email")
    .eq("id", user.id)
    .single();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationUrl = `${appUrl}/verify/${certNumber}`;
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();

  const dataSnapshot = {
    holder_name: profile?.full_name || "",
    holder_email: profile?.email || "",
    goal_name: goal.goal_name,
    goal_destination: goal.destination,
    current_balance_ngn: goal.current_balance,
    target_amount_ngn: goal.target_amount,
    twenty_eight_day_min_balance_ngn: min28DayBalance,
    total_new_deposits_28d: totalNewDeposits28d,
    total_deposits_90d: totalDeposits90d,
    goal_created_at: goal.created_at,
    deposit_history_90_days: depositHistory || [],
  };

  // Deduct certificate fee from the deposit's goal, not the certificate goal
  const { error: deductionError } = await adminSupabase.rpc("deduct_goal_balance", {
    goal_id_input: feeDeposit.goal_id,
    amount_input: 15000,
  });

  if (deductionError) {
    return NextResponse.json({ error: `Failed to deduct fee: ${deductionError.message}` }, { status: 500 });
  }

  const { data: certificate, error: insertError } = await adminSupabase
    .from("platform_certificates")
    .insert({
      user_id: user.id,
      certificate_type: "proof_of_funds",
      certificate_number: certNumber,
      goal_id: goal.id,
      data_snapshot: dataSnapshot,
      verification_url: verificationUrl,
      is_valid: true,
      expires_at: expiresAt,
      fee_paid_ngn: 15000,
      fee_deposit_id: feeDepositId,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  try {
    await adminSupabase.from("notifications").insert({
      user_id: user.id,
      type: "certificate_issued",
      title: "Proof of Funds Certificate Issued",
      body: `Your Proof of Funds Certificate (#${certNumber}) has been issued and is ready for download.`,
      action_url: "/dashboard/profile/certificates",
    });
  } catch {} // fire-and-forget

  fetch(`${appUrl}/api/achievements/generate-card`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": process.env.INTERNAL_API_SECRET || "" },
    body: JSON.stringify({
      userId: user.id,
      cardType: "certificate_issued",
      data: { certificateType: "Proof of Funds", certificateNumber: certNumber, subtitle: "Swiipt — Plan, fund, and execute your global move" },
    }),
  }).catch(() => {});

  return NextResponse.json({ certificate });
}
