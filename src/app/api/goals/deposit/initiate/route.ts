import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generatePaymentReference(userId: string): string {
  const userPrefix = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `SWP-${userPrefix}-${timestamp}`;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { goalId, amount, currency } = await request.json();

  if (!amount || amount < 1000) {
    return NextResponse.json({ error: "Minimum deposit is 1,000" }, { status: 400 });
  }

  // Check for existing pending deposits for this goal that were never confirmed
  const { data: existingDeposit } = await supabase
    .from("deposits")
    .select("id, amount, currency, ngn_equivalent, payment_reference, status, user_confirmed_at, created_at")
    .eq("user_id", user.id)
    .eq("goal_id", goalId)
    .eq("status", "pending")
    .is("user_confirmed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (existingDeposit) {
    const { data: settings } = await supabase
      .from("platform_settings")
      .select("key, value")
      .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

    const bankDetails = (settings as any[])?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}) || {};

    return NextResponse.json({
      depositId: existingDeposit.id,
      reference: existingDeposit.payment_reference,
      amount: existingDeposit.amount,
      currency: existingDeposit.currency,
      bankDetails,
      resumed: true,
    });
  }

  let ngnEquivalent = amount;
  if (currency !== "NGN") {
    const { data: currencyData } = await supabase
      .from("currencies")
      .select("ngn_exchange_rate")
      .eq("code", currency)
      .single();
    if (currencyData) {
      ngnEquivalent = amount * currencyData.ngn_exchange_rate;
    }
  }

  const reference = generatePaymentReference(user.id);

  const { data: deposit, error } = await supabase
    .from("deposits")
    .insert({
      user_id: user.id,
      goal_id: goalId || null,
      amount,
      currency,
      ngn_equivalent: ngnEquivalent,
      payment_reference: reference,
      status: "pending",
      expires_at: null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 });
  }

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

  const bankDetails = (settings as any[])?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}) || {};

  return NextResponse.json({
    depositId: deposit.id,
    reference,
    amount,
    currency,
    bankDetails,
    resumed: false,
  });
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const goalId = searchParams.get("goalId");

  if (!goalId) {
    return NextResponse.json({ error: "goalId is required" }, { status: 400 });
  }

  const { data: existingDeposit } = await supabase
    .from("deposits")
    .select("id, amount, currency, payment_reference, status, user_confirmed_at, created_at")
    .eq("user_id", user.id)
    .eq("goal_id", goalId)
    .eq("status", "pending")
    .is("user_confirmed_at", null)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!existingDeposit) {
    return NextResponse.json({ hasPending: false });
  }

  const { data: settings } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

  const bankDetails = (settings as any[])?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}) || {};

  return NextResponse.json({
    hasPending: true,
    depositId: existingDeposit.id,
    reference: existingDeposit.payment_reference,
    amount: existingDeposit.amount,
    currency: existingDeposit.currency,
    bankDetails,
  });
}
