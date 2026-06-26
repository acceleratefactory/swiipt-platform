import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { groupBuyId } = await request.json();
  if (!groupBuyId) {
    return NextResponse.json({ error: "groupBuyId is required." }, { status: 400 });
  }

  const { data: membership } = await (serviceClient as any)
    .from("group_buy_members")
    .select("id, status, order_id, booking_id")
    .eq("group_buy_id", groupBuyId)
    .eq("user_id", user.id)
    .single();

  if (!membership) {
    return NextResponse.json({ error: "Membership not found." }, { status: 404 });
  }
  if (membership.status !== "pending_payment") {
    return NextResponse.json({ error: "Payment already confirmed or not initiated." }, { status: 400 });
  }

  if (membership.order_id) {
    await (serviceClient as any)
      .from("service_orders")
      .update({ status: "payment_submitted" })
      .eq("id", membership.order_id);
  }

  if (membership.booking_id) {
    await (serviceClient as any)
      .from("holiday_bookings")
      .update({ status: "payment_submitted" })
      .eq("id", membership.booking_id);
  }

  await (serviceClient as any).from("notifications").insert({
    user_id: null,
    type: "group_buy_payment_submitted",
    title: "Group buy payment submitted",
    body: "A user has submitted payment for a group buy. Confirm in admin panel.",
    action_url: "/admin/groups",
    target_segment: null,
  });

  await (serviceClient as any).from("activity_log").insert({
    user_id: user.id,
    event_type: "group_buy_payment_confirmed_by_user",
    event_data: { group_buy_id: groupBuyId, membership_id: membership.id, order_id: membership.order_id, booking_id: membership.booking_id },
  });

  return NextResponse.json({ success: true, status: "payment_submitted" });
}
