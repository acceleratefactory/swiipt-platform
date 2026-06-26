import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { groupBuyId, travellers: rawTravellers, paymentMethod = "direct_payment", goalId } = await request.json();

  if (!groupBuyId) {
    return NextResponse.json({ error: "groupBuyId is required." }, { status: 400 });
  }

  if (paymentMethod === "goal_redemption" && !goalId) {
    return NextResponse.json({ error: "goalId is required for goal redemption." }, { status: 400 });
  }

  const { data: groupBuy } = await (serviceClient as any)
    .from("group_buys")
    .select("*")
    .eq("id", groupBuyId)
    .single();

  if (!groupBuy) {
    return NextResponse.json({ error: "Group not found." }, { status: 404 });
  }

  if (groupBuy.status !== "filled") {
    return NextResponse.json({ error: "Group is not yet filled. Wait for all members to join." }, { status: 400 });
  }

  if (new Date(groupBuy.payment_deadline) < new Date()) {
    return NextResponse.json({ error: "Payment deadline has passed." }, { status: 400 });
  }

  const { data: membership } = await (serviceClient as any)
    .from("group_buy_members")
    .select("*")
    .eq("group_buy_id", groupBuyId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "You are not a member of this group." }, { status: 404 });
  }

  if (membership.status !== "committed") {
    return NextResponse.json({ error: "Payment already initiated for this membership." }, { status: 400 });
  }

  const travellers = groupBuy.item_type === "holiday_package"
    ? Math.max(1, Math.min(rawTravellers || 1, 10))
    : 1;

  let totalPrice = groupBuy.group_price_ngn * travellers;
  const userPrefix = user.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);

  let milestoneDiscount = 0;
  if (paymentMethod === "goal_redemption") {
    const { data: goal } = await supabase
      .from("savings_goals")
      .select("milestone_100_unlocked, current_balance")
      .eq("id", goalId)
      .eq("user_id", user.id)
      .single();

    if (!goal) return NextResponse.json({ error: "Goal not found." }, { status: 404 });
    if (goal.current_balance < totalPrice) {
      return NextResponse.json({ error: "Insufficient goal balance." }, { status: 400 });
    }

    if (goal.milestone_100_unlocked) {
      const { data: discountSetting } = await (serviceClient as any)
        .from("platform_settings")
        .select("value")
        .eq("key", "milestone_100_discount_pct")
        .single();

      milestoneDiscount = Number(discountSetting?.value || 15) / 100;
      totalPrice = totalPrice * (1 - milestoneDiscount);
    }
  }

  let creditApplied = 0;
  if (paymentMethod === "direct_payment") {
    const { data: wallet } = await (serviceClient as any)
      .from("wallets")
      .select("total_credits_ngn")
      .eq("user_id", user.id)
      .single();

    if (wallet?.total_credits_ngn > 0) {
      creditApplied = Math.min(wallet.total_credits_ngn, totalPrice);
    }
  }

  if (groupBuy.item_type === "holiday_package") {
    const { data: pkg } = await (serviceClient as any)
      .from("holiday_packages")
      .select("title")
      .eq("id", groupBuy.holiday_package_id)
      .single();

    const ref = `SWP-HOL-${userPrefix}-${timestamp}`;

    const bookingStatus = paymentMethod === "goal_redemption" ? "confirmed" : "payment_pending";

    const { data: booking, error: bookingError } = await (serviceClient as any)
      .from("holiday_bookings")
      .insert({
        user_id: user.id,
        package_id: groupBuy.holiday_package_id,
        reference: ref,
        travellers,
        currency: "NGN",
        total_price: totalPrice,
        status: bookingStatus,
      })
      .select("id")
      .single();

    if (bookingError) {
      return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
    }

    if (paymentMethod === "goal_redemption") {
      await (serviceClient as any).rpc("deduct_goal_balance", {
        goal_id_input: goalId,
        amount_input: totalPrice,
      });
    }

    const membershipStatus = paymentMethod === "goal_redemption" ? "paid" : "pending_payment";
    const memberUpdate: any = { status: membershipStatus, booking_id: booking.id };
    if (paymentMethod === "goal_redemption") memberUpdate.paid_at = new Date().toISOString();
    await (serviceClient as any)
      .from("group_buy_members")
      .update(memberUpdate)
      .eq("id", membership.id);

    await (serviceClient as any).from("activity_log").insert({
      user_id: user.id,
      event_type: "group_buy_payment_initiated",
      event_data: {
        group_buy_id: groupBuyId,
        item_type: "holiday_package",
        payment_method: paymentMethod,
        booking_id: booking.id,
        total_price: totalPrice,
        credit_applied: creditApplied,
        milestone_discount_pct: milestoneDiscount * 100,
        travellers,
      },
    });

    const { data: bankSettings } = await (serviceClient as any)
      .from("platform_settings")
      .select("key, value")
      .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

    const bankDetails = bankSettings?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

    return NextResponse.json({
      success: true,
      paymentMethod,
      paymentType: "holiday_booking",
      bookingId: booking.id,
      reference: ref,
      totalPrice,
      finalPrice: totalPrice,
      originalPrice: groupBuy.original_price_ngn,
      creditApplied,
      currency: "NGN",
      travellers,
      packageName: pkg?.title || "",
      bankDetails: paymentMethod === "direct_payment" ? bankDetails : null,
    });
  }

  if (groupBuy.item_type === "service") {
    const { data: pkg } = await (serviceClient as any)
      .from("service_packages")
      .select("name, price_ngn")
      .eq("id", groupBuy.service_package_id)
      .single();

    const ref = `SWP-ORD-${userPrefix}-${timestamp}`;

    const orderStatus = paymentMethod === "goal_redemption" ? "payment_confirmed" : "initiated";

    const { data: order, error: orderError } = await (serviceClient as any)
      .from("service_orders")
      .insert({
        user_id: user.id,
        package_id: groupBuy.service_package_id,
        goal_id: paymentMethod === "goal_redemption" ? goalId : null,
        payment_method: paymentMethod,
        payment_currency: "NGN",
        milestone_discount_pct: milestoneDiscount * 100,
        original_price: pkg?.price_ngn || groupBuy.original_price_ngn,
        final_price: totalPrice,
        ngn_equivalent: totalPrice,
        status: orderStatus,
      })
      .select("id")
      .single();

    if (orderError) {
      return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
    }

    if (paymentMethod === "goal_redemption") {
      await (serviceClient as any).rpc("deduct_goal_balance", {
        goal_id_input: goalId,
        amount_input: totalPrice,
      });
    }

    let remainingToPay: number | null = null;
    if (paymentMethod === "direct_payment" && creditApplied > 0) {
      const { data: rpcResult } = await (serviceClient as any).rpc("apply_credit_to_order", {
        order_id_input: order.id,
        user_id_input: user.id,
        credit_amount_to_apply: creditApplied,
      });
      remainingToPay = rpcResult !== undefined && rpcResult !== null ? Number(rpcResult) : null;
      if (remainingToPay !== null && remainingToPay <= 0) {
        await (serviceClient as any)
          .from("service_orders")
          .update({ status: "payment_confirmed" })
          .eq("id", order.id);
      }
    }

    const membershipStatus = paymentMethod === "goal_redemption" ? "paid" : "pending_payment";
    const memberUpdate: any = { status: membershipStatus, order_id: order.id };
    if (paymentMethod === "goal_redemption") memberUpdate.paid_at = new Date().toISOString();
    await (serviceClient as any)
      .from("group_buy_members")
      .update(memberUpdate)
      .eq("id", membership.id);

    await (serviceClient as any).from("activity_log").insert({
      user_id: user.id,
      event_type: "group_buy_payment_initiated",
      event_data: {
        group_buy_id: groupBuyId,
        item_type: "service",
        payment_method: paymentMethod,
        order_id: order.id,
        total_price: totalPrice,
        credit_applied: creditApplied,
        milestone_discount_pct: milestoneDiscount * 100,
        travellers,
      },
    });

    const { data: bankSettings } = await (serviceClient as any)
      .from("platform_settings")
      .select("key, value")
      .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

    const bankDetails = bankSettings?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

    return NextResponse.json({
      success: true,
      paymentMethod,
      paymentType: "service_order",
      bookingId: null,
      orderId: order.id,
      reference: ref,
      totalPrice,
      finalPrice: remainingToPay !== null ? remainingToPay : totalPrice,
      originalPrice: groupBuy.original_price_ngn,
      creditApplied,
      currency: "NGN",
      travellers,
      packageName: pkg?.name || "",
      bankDetails: paymentMethod === "direct_payment" ? bankDetails : null,
    });
  }

  return NextResponse.json({ error: "Invalid item type." }, { status: 400 });
}
