import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (serviceClient as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { bookingId } = await request.json();
  if (!bookingId) return NextResponse.json({ error: "Booking ID required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const db = serviceClient as any;

  const { data: booking } = await db
    .from("holiday_bookings")
    .select("reference, user_id, total_price, status")
    .eq("id", bookingId)
    .single();
  if (!booking) return NextResponse.json({ error: "Booking not found" }, { status: 404 });

  const { count: gbLinkCount } = await db
    .from("group_buy_members")
    .select("id", { count: "exact", head: true })
    .eq("booking_id", bookingId);
  if (gbLinkCount && gbLinkCount > 0) {
    return NextResponse.json({
      error: `Cannot delete — this booking is linked to a group buy. Cancel it from the Groups page first.`,
    }, { status: 409 });
  }

  // Remove orphaned document requests (holiday docs use order_id = booking id)
  const { error: docsError } = await db
    .from("document_requests")
    .delete()
    .eq("order_id", bookingId);
  if (docsError) return NextResponse.json({ error: docsError.message }, { status: 500 });

  const { error } = await db.from("holiday_bookings").delete().eq("id", bookingId);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  await db.from("admin_audit_log").insert({
    admin_id: user.id,
    action_type: "holiday_booking_deleted",
    target_user_id: booking.user_id,
    target_record_id: bookingId,
    target_table: "holiday_bookings",
    previous_value: JSON.stringify({ reference: booking.reference, total_price: booking.total_price, status: booking.status }),
    new_value: null,
    note: `Deleted holiday booking "${booking.reference}"`,
  });

  return NextResponse.json({ success: true });
}
