import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { orderId } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("service_orders")
    .update({ status: "payment_pending" })
    .eq("id", orderId)
    .eq("user_id", user.id);

  await supabase.from("notifications").insert({
    user_id: null,
    type: "order_payment_submitted",
    title: "Order payment submitted",
    body: "A user has submitted payment for a service order. Confirm in admin panel.",
    action_url: "/admin/orders",
    target_segment: null,
  });

  return NextResponse.json({ success: true });
}
