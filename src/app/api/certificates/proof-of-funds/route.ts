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

  // Verify the fee deposit exists and is confirmed
  const { data: feeDeposit } = await supabase
    .from("deposits")
    .select("id, status")
    .eq("id", feeDepositId)
    .eq("user_id", user.id)
    .single();

  if (!feeDeposit || feeDeposit.status !== "confirmed") {
    return NextResponse.json({ error: "Fee deposit not confirmed" }, { status: 400 });
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

  // Calculate 28-day minimum balance
  const twentyEightDaysAgo = new Date(Date.now() - 28 * 24 * 60 * 60 * 1000).toISOString();
  const { data: recentDeposits } = await supabase
    .from("deposits")
    .select("amount, created_at")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .gte("created_at", twentyEightDaysAgo)
    .order("created_at", { ascending: false });

  const totalRecentDeposits = (recentDeposits || []).reduce((sum, d) => sum + (d.amount || 0), 0);
  const daysWithData = recentDeposits?.length || 0;
  const min28DayBalance = daysWithData > 0 ? Math.round(totalRecentDeposits / Math.max(daysWithData, 1)) : 0;

  // Calculate deposit history (90 days)
  const ninetyDaysAgo = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
  const { data: depositHistory } = await supabase
    .from("deposits")
    .select("amount, created_at, ngn_equivalent")
    .eq("user_id", user.id)
    .eq("status", "confirmed")
    .gte("created_at", ninetyDaysAgo)
    .order("created_at", { ascending: false })
    .limit(30);

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
    goal_created_at: goal.created_at,
    deposit_history_90_days: depositHistory || [],
  };

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

  return NextResponse.json({ certificate });
}
