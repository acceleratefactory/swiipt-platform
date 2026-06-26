import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const groupBuyId = searchParams.get("groupBuyId");
  if (!groupBuyId) {
    return NextResponse.json({ error: "groupBuyId is required." }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { data: membership } = await (serviceClient as any)
    .from("group_buy_members")
    .select("id, status, user_confirmed_at, payment_reference, order_id, booking_id")
    .eq("group_buy_id", groupBuyId)
    .eq("user_id", user.id)
    .single();

  const isResumable = membership
    && membership.status === "pending_payment"
    && membership.user_confirmed_at === null;

  if (!isResumable) {
    return NextResponse.json({ hasPending: false });
  }

  let reference = membership.payment_reference;
  let totalPrice = 0;
  if (membership.booking_id) {
    const { data: booking } = await (serviceClient as any)
      .from("holiday_bookings")
      .select("total_price, reference")
      .eq("id", membership.booking_id)
      .single();
    if (booking) {
      totalPrice = booking.total_price;
      if (!reference) reference = booking.reference;
    }
  } else if (membership.order_id) {
    const { data: order } = await (serviceClient as any)
      .from("service_orders")
      .select("final_price")
      .eq("id", membership.order_id)
      .single();
    if (order) totalPrice = order.final_price;
  }

  const { data: bankSettings } = await (serviceClient as any)
    .from("platform_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

  const bankDetails = (bankSettings as any[])?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {}) || {};

  return NextResponse.json({
    hasPending: true,
    reference: reference || null,
    totalPrice,
    finalPrice: totalPrice,
    bankDetails,
    orderId: membership.order_id || null,
    bookingId: membership.booking_id || null,
    currency: "NGN",
    paymentMethod: "direct_payment",
  });
}
