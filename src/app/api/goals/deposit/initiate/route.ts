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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deposit, error } = await (supabase as any)
    .from("deposits")
    .insert({
      user_id: user.id,
      goal_id: goalId || null,
      amount,
      currency,
      ngn_equivalent: ngnEquivalent,
      payment_reference: reference,
      status: "pending",
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to create deposit" }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: settings } = await (supabase as any)
    .from("platform_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const bankDetails = (settings as any[])?.reduce((acc, s) => ({ ...acc, [s.key]: s.value }), {}) || {};

  return NextResponse.json({
    depositId: deposit.id,
    reference,
    amount,
    currency,
    bankDetails,
  });
}
