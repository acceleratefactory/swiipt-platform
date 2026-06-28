import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const validTransitions: Record<string, string[]> = {
  payment_pending: ["payment_submitted", "cancelled"],
  payment_submitted: ["payment_confirmed", "cancelled"],
  payment_confirmed: ["documents_requested", "in_progress", "completed", "cancelled"],
  documents_requested: ["documents_received", "in_progress"],
  documents_received: ["in_progress"],
  in_progress: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const userNotifications: Record<string, { title: string; body: string }> = {
  payment_confirmed: { title: "Payment confirmed ✓", body: "Your holiday payment has been confirmed. We will begin processing your booking." },
  documents_requested: { title: "Documents needed", body: "Your case manager has requested documents for your holiday booking. Please upload them." },
  in_progress: { title: "Booking in progress", body: "Your holiday booking is being processed by our team." },
  completed: { title: "Holiday booking completed 🎉", body: "Your holiday booking is complete! Get ready for your trip." },
  cancelled: { title: "Booking cancelled", body: "Your holiday booking has been cancelled. Please contact support if you have questions." },
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (serviceClient as any)
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { bookingId, newStatus, caseManagerNotes, internalNotes } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: booking } = await (serviceClient as any)
    .from("holiday_bookings")
    .select("status, user_id, package_id, goal_id, total_price")
    .eq("id", bookingId)
    .single();

  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const allowed = validTransitions[booking.status] || [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({
      error: `Cannot transition from ${booking.status} to ${newStatus}`,
    }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { status: newStatus, updated_at: new Date().toISOString() };
  if (caseManagerNotes) updateData.case_manager_notes = caseManagerNotes;
  if (internalNotes) updateData.internal_notes = internalNotes;
  if (newStatus === "documents_requested") updateData.documents_requested_at = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any).from("holiday_bookings").update(updateData).eq("id", bookingId);

  // Sync group_buy_members if this booking is linked to a group buy
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: gbMember } = await (serviceClient as any)
    .from("group_buy_members")
    .select("id, group_buy_id")
    .eq("booking_id", bookingId)
    .maybeSingle();

  if (gbMember) {
    if (newStatus === "payment_confirmed") {
      await (serviceClient as any)
        .from("group_buy_members")
        .update({ status: "paid", paid_at: new Date().toISOString() })
        .eq("id", gbMember.id);

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data: allMembers } = await (serviceClient as any)
        .from("group_buy_members")
        .select("status")
        .eq("group_buy_id", gbMember.group_buy_id);

      if (allMembers?.every((m: any) => m.status === "paid")) {
        await (serviceClient as any)
          .from("group_buys")
          .update({ status: "completed", updated_at: new Date().toISOString() })
          .eq("id", gbMember.group_buy_id);
      }
    }

    if (newStatus === "cancelled") {
      await (serviceClient as any)
        .from("group_buy_members")
        .update({ status: "committed", booking_id: null, payment_reference: null, user_confirmed_at: null })
        .eq("id", gbMember.id);
    }
  }

  // Restore goal balance if a goal_redemption booking is cancelled
  if (booking.goal_id && newStatus === "cancelled") {
    const { data: goal } = await (serviceClient as any)
      .from("savings_goals")
      .select("current_balance, is_locked")
      .eq("id", booking.goal_id)
      .single();

    if (goal) {
      const amount = booking.total_price;
      await (serviceClient as any)
        .from("savings_goals")
        .update({ current_balance: goal.current_balance + amount })
        .eq("id", booking.goal_id);

      if (!goal.is_locked) {
        const { data: wallet } = await (serviceClient as any)
          .from("wallets")
          .select("balance_ngn")
          .eq("user_id", booking.user_id)
          .single();

        if (wallet) {
          await (serviceClient as any)
            .from("wallets")
            .update({ balance_ngn: wallet.balance_ngn + amount })
            .eq("user_id", booking.user_id);
        }
      }
    }
  }

  if (newStatus === "completed") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceClient as any).rpc("increment_mobility_score", {
      user_id_input: booking.user_id,
      points: 200,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pkg } = await (serviceClient as any)
    .from("holiday_packages")
    .select("title")
    .eq("id", booking.package_id)
    .single();

  const notification = userNotifications[newStatus];
  if (notification) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (serviceClient as any).from("notifications").insert({
      user_id: booking.user_id,
      type: `holiday_${newStatus}`,
      title: notification.title,
      body: `${pkg?.title || "Holiday"}: ${notification.body}`,
      action_url: "/admin/holidays",
      target_segment: null,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action_type: "holiday_booking_status_updated",
    target_user_id: booking.user_id,
    target_record_id: bookingId,
    target_table: "holiday_bookings",
    previous_value: JSON.stringify({ status: booking.status }),
    new_value: JSON.stringify({ status: newStatus }),
    note: caseManagerNotes || internalNotes || `Status updated to ${newStatus}`,
  });

  return NextResponse.json({ success: true });
}
