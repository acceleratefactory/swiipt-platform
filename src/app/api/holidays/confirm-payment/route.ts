import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { bookingId } = await request.json();
  if (!bookingId) return NextResponse.json({ error: "bookingId required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any)
    .from("holiday_bookings")
    .update({ status: "payment_submitted" })
    .eq("id", bookingId)
    .eq("user_id", user.id);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (serviceClient as any).from("notifications").insert({
    user_id: null,
    type: "holiday_payment_submitted",
    title: "Holiday payment submitted",
    body: "A user has submitted payment for a holiday booking. Confirm in admin panel.",
    action_url: "/admin/holidays",
    target_segment: null,
  });

  return NextResponse.json({ success: true });
}
