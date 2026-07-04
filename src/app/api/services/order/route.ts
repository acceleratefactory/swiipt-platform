import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

function generateOrderReference(userId: string): string {
  const prefix = userId.replace(/-/g, "").slice(0, 6).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);
  return `SWP-ORD-${prefix}-${timestamp}`;
}

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { packageId, paymentMethod, goalId, currency } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny: any = supabase;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pkg } = await supabaseAny
    .from("service_packages")
    .select("*")
    .eq("id", packageId)
    .eq("is_active", true)
    .single();

  if (!pkg) return NextResponse.json({ error: "Service not found" }, { status: 404 });

  const currencyKey = `price_${currency.toLowerCase()}`;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const originalPrice = (pkg as any)[currencyKey] || pkg.price_ngn;
  const ngn_equivalent = currency !== "NGN" ? pkg.price_ngn : originalPrice;

  let milestoneDiscount = 0;
  let finalPrice = originalPrice;

  if (paymentMethod === "goal_redemption" && goalId) {
    const { data: goal } = await supabase
      .from("savings_goals")
      .select("milestone_100_unlocked, current_balance")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();

    if (goal?.milestone_100_unlocked) {
      const { data: discountSetting } = await supabaseAny
        .from("platform_settings")
        .select("value")
        .eq("key", "milestone_100_discount_pct")
        .single();

      milestoneDiscount = Number(discountSetting?.value || 15) / 100;
      finalPrice = originalPrice * (1 - milestoneDiscount);
    }

    const { data: goal2 } = await supabase
      .from("savings_goals")
      .select("current_balance")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();

    if (!goal2 || goal2.current_balance < finalPrice) {
      return NextResponse.json({ error: "Insufficient goal balance" }, { status: 400 });
    }
  }

  const orderReference = generateOrderReference(user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order, error } = await supabaseAny
    .from("service_orders")
    .insert({
      user_id: user.id,
      goal_id: goalId || null,
      package_id: packageId,
      payment_method: paymentMethod,
      payment_currency: currency,
      milestone_discount_pct: milestoneDiscount * 100,
      original_price: originalPrice,
      final_price: finalPrice,
      ngn_equivalent,
      status: paymentMethod === "goal_redemption" ? "payment_confirmed" : "payment_pending",
    })
    .select()
    .single();

  if (error) return NextResponse.json({ error: "Failed to create order" }, { status: 500 });

  let bankDetails = null;
  if (paymentMethod === "direct_payment") {
    const { data: settings } = await supabaseAny
      .from("platform_settings")
      .select("key, value")
      .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    bankDetails = settings?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
  }

  let creditApplied = 0;
  const { data: wallet } = await supabase
    .from("wallets")
    .select("total_credits_ngn")
    .eq("user_id", user.id)
    .single();

  if (wallet && wallet.total_credits_ngn > 0 && finalPrice > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: remainingToPay } = await (supabase as any).rpc("apply_credit_to_order", {
      order_id_input: order.id,
      user_id_input: user.id,
      credit_amount_to_apply: wallet.total_credits_ngn,
    });
    creditApplied = Math.min(wallet.total_credits_ngn, finalPrice);
    if (remainingToPay !== undefined && remainingToPay !== null) {
      finalPrice = Number(remainingToPay);
    }
    if (finalPrice <= 0) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      await (supabase as any).from("service_orders").update({ status: "payment_confirmed" }).eq("id", order.id);
      order.status = "payment_confirmed";
    }
  }

  if (paymentMethod === "goal_redemption" && goalId && finalPrice > 0) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("deduct_goal_balance", {
      goal_id_input: goalId,
      amount_input: finalPrice,
    });

    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "goal_redemption",
      title: "Goal used for service payment",
      body: `${pkg.name} — ${currency} ${Number(finalPrice).toLocaleString()} deducted from your goal.`,
      action_url: `/dashboard/goals/${goalId}`,
      target_segment: null,
    });
  }

  await supabase.from("notifications").insert({
    user_id: null,
    type: "new_order",
    title: "New service order",
    body: `${pkg.name} ordered. Payment method: ${paymentMethod}.${creditApplied > 0 ? ` Credit applied: ₦${creditApplied}.` : ""}`,
    action_url: "/admin/orders",
    target_segment: null,
  });

  await supabase.from("activity_log").insert({
    user_id: user.id,
    event_type: "service_ordered",
    event_data: { package_id: packageId, package_name: pkg.name, payment_method: paymentMethod, credit_applied: creditApplied },
  });

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  fetch(`${appUrl}/api/readiness/recalculate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  }).catch(() => {});

  fetch(`${appUrl}/api/achievements/generate-card`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-internal-secret": process.env.INTERNAL_API_SECRET || "" },
    body: JSON.stringify({
      userId: user.id,
      cardType: "service_ordered",
      data: { serviceName: pkg.name, subtitle: "Swiipt — Plan, fund, and execute your global move" },
    }),
  }).catch(() => {});

  return NextResponse.json({
    orderId: order.id,
    orderReference,
    finalPrice,
    originalPrice,
    creditApplied,
    currency,
    paymentMethod,
    bankDetails,
    status: order.status,
  });
}
