import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { groupBuyId } = await request.json();
  if (!groupBuyId) {
    return NextResponse.json({ error: "groupBuyId is required." }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  const { data: membership } = await (serviceClient as any)
    .from("group_buy_members")
    .select("id, status, user_confirmed_at, order_id, booking_id")
    .eq("group_buy_id", groupBuyId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Membership not found." }, { status: 404 });
  }

  if (membership.status !== "pending_payment") {
    return NextResponse.json({ error: "No pending payment to cancel." }, { status: 400 });
  }

  if (membership.user_confirmed_at !== null) {
    return NextResponse.json({ error: "Cannot cancel — payment already confirmed. Contact support." }, { status: 400 });
  }

  if (membership.booking_id) {
    await (serviceClient as any)
      .from("holiday_bookings")
      .update({ status: "cancelled" })
      .eq("id", membership.booking_id);
  }

  if (membership.order_id) {
    await (serviceClient as any)
      .from("service_orders")
      .update({ status: "cancelled" })
      .eq("id", membership.order_id);
  }

  await (serviceClient as any)
    .from("group_buy_members")
    .update({
      status: "committed",
      order_id: null,
      booking_id: null,
      payment_reference: null,
    })
    .eq("id", membership.id);

  await (serviceClient as any).from("activity_log").insert({
    user_id: user.id,
    event_type: "group_buy_payment_cancelled",
    event_data: {
      group_buy_id: groupBuyId,
      cancelled_booking_id: membership.booking_id || null,
      cancelled_order_id: membership.order_id || null,
    },
  });

  return NextResponse.json({ success: true });
}
