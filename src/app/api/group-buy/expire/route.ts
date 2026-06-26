import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceClient = createServiceClient();

  let expiredGroups = 0;
  let resetMembers = 0;

  // --- Expire open groups past their deadline ---
  const { data: expired } = await (serviceClient as any)
    .from("group_buys")
    .select("id, title, creator_id")
    .eq("status", "open")
    .lt("expires_at", new Date().toISOString());

  if (expired) {
    for (const group of expired) {
      await (serviceClient as any)
        .from("group_buys")
        .update({ status: "expired" })
        .eq("id", group.id);

      await (serviceClient as any).from("notifications").insert({
        user_id: group.creator_id,
        type: "group_buy_expired",
        title: "Your group expired",
        body: `Your group "${group.title}" did not fill before the deadline. No charges were made.`,
        action_url: "/dashboard/groups",
      });
    }
    expiredGroups = expired.length;
  }

  // --- Cleanup abandoned/expired pending_payment memberships ---
  const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const { data: staleMembers } = await (serviceClient as any)
    .from("group_buy_members")
    .select("id, order_id, booking_id, group_buy_id")
    .eq("status", "pending_payment")
    .or(`user_confirmed_at.is.null,user_confirmed_at.lt.${twentyFourHoursAgo}`);

  if (staleMembers) {
    for (const member of staleMembers) {
      if (member.order_id) {
        await (serviceClient as any)
          .from("service_orders")
          .update({ status: "cancelled" })
          .eq("id", member.order_id);
      }
      if (member.booking_id) {
        await (serviceClient as any)
          .from("holiday_bookings")
          .update({ status: "cancelled" })
          .eq("id", member.booking_id);
      }
      await (serviceClient as any)
        .from("group_buy_members")
        .update({
          status: "committed",
          order_id: null,
          booking_id: null,
          payment_reference: null,
          user_confirmed_at: null,
        })
        .eq("id", member.id);
    }
    resetMembers = staleMembers.length;
  }

  return NextResponse.json({ expired: expiredGroups, reset: resetMembers });
}
