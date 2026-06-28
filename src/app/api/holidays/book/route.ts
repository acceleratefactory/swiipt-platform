import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { packageId, travellers, currency, goalId, paymentMethod } = await request.json();

  const { data: pkg } = await (serviceClient as any)
    .from("holiday_packages")
    .select("*")
    .eq("id", packageId)
    .single();

  if (!pkg || !pkg.is_active) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const currencyKey = `price_per_person_${currency.toLowerCase()}`;
  const pricePerPerson = (pkg as any)[currencyKey] || pkg.price_per_person_ngn;
  let totalPrice = pricePerPerson * (travellers || 1);

  let milestoneDiscount = 0;
  let creditApplied = 0;

  if (paymentMethod === "goal_redemption" && goalId) {
    const { data: goal } = await supabase
      .from("savings_goals")
      .select("milestone_100_unlocked, current_balance, currency")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();

    if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });

    if (goal.milestone_100_unlocked) {
      const { data: discountSetting } = await (supabase as any)
        .from("platform_settings")
        .select("value")
        .eq("key", "milestone_100_discount_pct")
        .single();

      milestoneDiscount = Number(discountSetting?.value || 15) / 100;
      totalPrice = totalPrice * (1 - milestoneDiscount);
    }

    if (goal.current_balance < totalPrice) {
      return NextResponse.json({ error: "Insufficient goal balance" }, { status: 400 });
    }

    // Apply credit from wallet
    const { data: wallet } = await supabase
      .from("wallets")
      .select("total_credits_ngn")
      .eq("user_id", user.id)
      .single();

    if (wallet && wallet.total_credits_ngn > 0 && totalPrice > 0) {
      const creditToUse = Math.min(wallet.total_credits_ngn, totalPrice);
      creditApplied = creditToUse;
      totalPrice -= creditToUse;

      await (supabase as any)
        .from("wallets")
        .update({ total_credits_ngn: wallet.total_credits_ngn - creditToUse })
        .eq("user_id", user.id);
    }
  }

  const ref = `SWP-HOL-${user.id.replace(/-/g, "").slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const isGoalRedemption = paymentMethod === "goal_redemption";

  const { data: booking, error } = await (serviceClient as any)
    .from("holiday_bookings")
    .insert({
      user_id: user.id,
      package_id: packageId,
      reference: ref,
      travellers: travellers || 1,
      currency,
      total_price: totalPrice,
      status: isGoalRedemption ? "payment_confirmed" : "payment_pending",
      goal_id: goalId || null,
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });

  if (isGoalRedemption && goalId && totalPrice > 0) {
    await (supabase as any).rpc("deduct_goal_balance", {
      goal_id_input: goalId,
      amount_input: totalPrice,
    });

    await supabase.from("notifications").insert({
      user_id: user.id,
      type: "goal_redemption",
      title: "Goal used for holiday payment",
      body: `${pkg.title} — ${currency} ${Number(totalPrice).toLocaleString()} deducted from your goal.`,
      action_url: `/dashboard/goals/${goalId}`,
      target_segment: null,
    });
  }

  let bankDetails = null;
  if (!isGoalRedemption) {
    const { data: bankSettings } = await (serviceClient as any)
      .from("platform_settings")
      .select("key, value")
      .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

    bankDetails = bankSettings?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});
  }

  await (serviceClient as any).from("activity_log").insert({
    user_id: user.id,
    event_type: isGoalRedemption ? "holiday_booking_paid" : "holiday_booking_initiated",
    event_data: {
      package_id: packageId,
      package_title: pkg.title,
      total_price: totalPrice,
      currency,
      reference: ref,
      travellers,
      payment_method: paymentMethod || "direct_payment",
      credit_applied: creditApplied,
    },
  });

  await (serviceClient as any).from("notifications").insert({
    user_id: null,
    type: "holiday_booking",
    title: isGoalRedemption ? "Holiday booking paid" : "Holiday booking initiated",
    body: `${pkg.title} — ${currency} ${totalPrice.toLocaleString()} for ${travellers} traveller(s).${creditApplied > 0 ? ` Credit applied: ₦${creditApplied}.` : ""}`,
    action_url: "/admin/holidays",
    target_segment: null,
  });

  return NextResponse.json({
    success: true,
    bookingId: booking.id,
    reference: ref,
    totalPrice,
    currency,
    bankDetails,
    creditApplied,
    status: isGoalRedemption ? "payment_confirmed" : "payment_pending",
  });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
