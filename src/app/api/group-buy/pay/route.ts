import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { groupBuyId, travellers: rawTravellers } = await request.json();

  if (!groupBuyId) {
    return NextResponse.json({ error: "groupBuyId is required." }, { status: 400 });
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

  const totalPrice = groupBuy.group_price_ngn * travellers;
  const userPrefix = user.id.replace(/-/g, "").slice(0, 6).toUpperCase();
  const timestamp = Date.now().toString().slice(-6);

  if (groupBuy.item_type === "holiday_package") {
    const { data: pkg } = await (serviceClient as any)
      .from("holiday_packages")
      .select("title")
      .eq("id", groupBuy.holiday_package_id)
      .single();

    const ref = `SWP-HOL-${userPrefix}-${timestamp}`;

    const { data: booking, error: bookingError } = await (serviceClient as any)
      .from("holiday_bookings")
      .insert({
        user_id: user.id,
        package_id: groupBuy.holiday_package_id,
        reference: ref,
        travellers,
        currency: "NGN",
        total_price: totalPrice,
        status: "payment_pending",
      })
      .select("id")
      .single();

    if (bookingError) {
      return NextResponse.json({ error: "Failed to create booking." }, { status: 500 });
    }

    await (serviceClient as any)
      .from("group_buy_members")
      .update({
        status: "pending_payment",
        booking_id: booking.id,
      })
      .eq("id", membership.id);

    await (serviceClient as any).from("activity_log").insert({
      user_id: user.id,
      event_type: "group_buy_payment_initiated",
      event_data: { group_buy_id: groupBuyId, item_type: "holiday_package", booking_id: booking.id, total_price: totalPrice, travellers },
    });

    const { data: bankSettings } = await (serviceClient as any)
      .from("platform_settings")
      .select("key, value")
      .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

    const bankDetails = bankSettings?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

    return NextResponse.json({
      success: true,
      paymentType: "holiday_booking",
      bookingId: booking.id,
      reference: ref,
      totalPrice,
      currency: "NGN",
      travellers,
      packageName: pkg?.title || "",
      bankDetails,
    });
  }

  if (groupBuy.item_type === "service") {
    const { data: pkg } = await (serviceClient as any)
      .from("service_packages")
      .select("name, price_ngn")
      .eq("id", groupBuy.service_package_id)
      .single();

    const ref = `SWP-ORD-${userPrefix}-${timestamp}`;

    const { data: order, error: orderError } = await (serviceClient as any)
      .from("service_orders")
      .insert({
        user_id: user.id,
        package_id: groupBuy.service_package_id,
        payment_method: "direct_payment",
        payment_currency: "NGN",
        milestone_discount_pct: 0,
        original_price: pkg?.price_ngn || groupBuy.original_price_ngn,
        final_price: totalPrice,
        ngn_equivalent: totalPrice,
        status: "payment_pending",
      })
      .select("id")
      .single();

    if (orderError) {
      return NextResponse.json({ error: "Failed to create order." }, { status: 500 });
    }

    await (serviceClient as any)
      .from("group_buy_members")
      .update({
        status: "pending_payment",
        order_id: order.id,
      })
      .eq("id", membership.id);

    await (serviceClient as any).from("activity_log").insert({
      user_id: user.id,
      event_type: "group_buy_payment_initiated",
      event_data: { group_buy_id: groupBuyId, item_type: "service", order_id: order.id, total_price: totalPrice },
    });

    const { data: bankSettings } = await (serviceClient as any)
      .from("platform_settings")
      .select("key, value")
      .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

    const bankDetails = bankSettings?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

    return NextResponse.json({
      success: true,
      paymentType: "service_order",
      orderId: order.id,
      reference: ref,
      totalPrice,
      currency: "NGN",
      packageName: pkg?.name || "",
      bankDetails,
    });
  }

  return NextResponse.json({ error: "Invalid item type." }, { status: 400 });
}
