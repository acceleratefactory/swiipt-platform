import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const validTransitions: Record<string, string[]> = {
  initiated: ["payment_pending", "cancelled"],
  payment_pending: ["payment_submitted", "payment_confirmed", "cancelled"],
  payment_submitted: ["payment_confirmed", "cancelled"],
  payment_confirmed: ["documents_requested", "in_progress"],
  documents_requested: ["documents_received"],
  documents_received: ["in_progress"],
  in_progress: ["awaiting_approval", "documents_requested"],
  awaiting_approval: ["approved", "in_progress"],
  approved: ["completed"],
};

const userNotifications: Record<string, { title: string; body: string }> = {
  payment_confirmed: { title: "Payment confirmed ✓", body: "Your payment has been confirmed. We will begin processing your application." },
  documents_requested: { title: "Documents needed", body: "Your case manager has requested documents. Please upload them to keep your application on track." },
  in_progress: { title: "Application in progress", body: "Your application is being processed by our team." },
  awaiting_approval: { title: "Awaiting final approval", body: "Your application has been submitted and is awaiting approval from the relevant authority." },
  approved: { title: "Application approved! ✓", body: "Congratulations! Your application has been approved. Final steps are being completed." },
  completed: { title: "Application completed 🎉", body: "Your application is complete. Welcome to the next chapter of your journey!" },
  cancelled: { title: "Application cancelled", body: "Your application has been cancelled. Please contact support if you have questions." },
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (adminSupabase as any)
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { orderId, newStatus, caseManagerNotes, internalNotes } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: order } = await (adminSupabase as any)
    .from("service_orders")
    .select("status, user_id, package_id")
    .eq("id", orderId)
    .single();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const allowed = validTransitions[order.status] || [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({
      error: `Cannot transition from ${order.status} to ${newStatus}`,
    }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const updateData: any = { status: newStatus };
  if (caseManagerNotes) updateData.case_manager_notes = caseManagerNotes;
  if (internalNotes) updateData.internal_notes = internalNotes;
  if (newStatus === "documents_requested") updateData.documents_requested_at = new Date().toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase as any).from("service_orders").update(updateData).eq("id", orderId);

  if (newStatus === "completed") {
    await supabase.rpc("increment_mobility_score", {
      user_id_input: order.user_id,
      points: 200,
    });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (adminSupabase as any).from("users").update({ alumni_status: true }).eq("id", order.user_id);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pkg } = await (adminSupabase as any)
    .from("service_packages")
    .select("name")
    .eq("id", order.package_id)
    .single();

  const notification = userNotifications[newStatus];
  if (notification) {
    await supabase.from("notifications").insert({
      user_id: order.user_id,
      type: `order_${newStatus}`,
      title: notification.title,
      body: `${pkg?.name || "Service"}: ${notification.body}`,
      action_url: `/dashboard/services/${order.package_id}`,
      target_segment: null,
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action_type: "order_status_updated",
    target_user_id: order.user_id,
    target_record_id: orderId,
    target_table: "service_orders",
    previous_value: JSON.stringify({ status: order.status }),
    new_value: JSON.stringify({ status: newStatus }),
    note: caseManagerNotes || internalNotes || `Status updated to ${newStatus}`,
  });

  return NextResponse.json({ success: true });
}
