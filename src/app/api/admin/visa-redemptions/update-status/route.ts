import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const ALLOWED_TRANSITIONS: Record<string, string[]> = {
  pending_payment: ["payment_confirmed", "cancelled"],
  payment_confirmed: ["processing", "cancelled"],
  documents_uploaded: ["processing", "cancelled"],
  processing: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};

const NOTIFICATION_MESSAGES: Record<string, { title: string; body: string }> = {
  payment_confirmed: {
    title: "Payment confirmed ✓",
    body: "Your visa payment has been confirmed. You can now upload your passport documents.",
  },
  processing: {
    title: "Visa application processing",
    body: "Your Qatar Tourist Visa is being processed by our team. We'll notify you when it's ready.",
  },
  completed: {
    title: "Visa completed ✓",
    body: "Your Qatar Tourist Visa has been approved. Check your dashboard to download.",
  },
  cancelled: {
    title: "Visa application cancelled",
    body: "Your visa application has been cancelled.",
  },
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { redemptionId, newStatus, notes } = await request.json();
  if (!redemptionId || !newStatus) {
    return NextResponse.json({ error: "redemptionId and newStatus required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  // Fetch current redemption with user info
  const { data: redemption, error: fetchError } = await supabaseAny
    .from("visa_redemptions")
    .select("*, users(full_name, email)")
    .eq("id", redemptionId)
    .single();

  if (fetchError || !redemption) {
    return NextResponse.json({ error: "Redemption not found" }, { status: 404 });
  }

  // Validate transition
  const allowed = ALLOWED_TRANSITIONS[redemption.status] || [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json({
      error: `Cannot transition from "${redemption.status}" to "${newStatus}". Allowed: ${allowed.join(", ") || "none (terminal)"}`,
    }, { status: 400 });
  }

  // If confirming payment, confirm the linked deposit FIRST
  // (before updating redemption status, so a failure rolls back cleanly)
  if (newStatus === "payment_confirmed") {
    const depositId = redemption.booking_fee_deposit_id || redemption.deposit_id;
    if (!depositId) {
      return NextResponse.json({
        error: "Cannot confirm payment: no linked deposit found for this redemption.",
      }, { status: 400 });
    }
    const { error: rpcError } = await supabaseAny.rpc("confirm_deposit", {
      deposit_id_param: depositId,
      admin_id: user.id,
    });
    if (rpcError) {
      return NextResponse.json({
        error: `Failed to confirm linked deposit: ${rpcError.message}`,
      }, { status: 500 });
    }
  }

  // Update status (only reached if deposit confirmation succeeded or was not needed)
  const { error: updateError } = await supabaseAny
    .from("visa_redemptions")
    .update({ status: newStatus, updated_at: new Date().toISOString() })
    .eq("id", redemptionId);

  if (updateError) {
    return NextResponse.json({ error: updateError.message }, { status: 500 });
  }

  // Send user notification
  const msg = NOTIFICATION_MESSAGES[newStatus];
  if (msg) {
    const notificationBody = newStatus === "cancelled" && notes ? `${msg.body} Reason: ${notes}` : msg.body;
    await supabaseAny
      .from("notifications")
      .insert({
        user_id: redemption.user_id,
        type: "visa_status_update",
        title: msg.title,
        body: notificationBody,
        action_url: "/dashboard/rewards",
      });
  }

  // Activity log
  await supabaseAny
    .from("activity_log")
    .insert({
      user_id: redemption.user_id,
      event_type: "visa_status_updated",
      event_data: {
        redemption_id: redemptionId,
        from_status: redemption.status,
        to_status: newStatus,
        updated_by: user.id,
        notes: notes || null,
      },
    });

  return NextResponse.json({ success: true, redemptionId, newStatus });
}
