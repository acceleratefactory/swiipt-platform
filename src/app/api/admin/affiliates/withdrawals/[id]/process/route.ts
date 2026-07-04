import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const adminSupabase = createServiceClient();
    const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
    if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

    const withdrawalId = params.id;
    const { action, note } = await request.json();

    if (!action || !["approve", "reject"].includes(action)) {
      return NextResponse.json({ error: "Action must be 'approve' or 'reject'" }, { status: 400 });
    }

    const { data: withdrawal, error: fetchError } = await (adminSupabase as any)
      .from("affiliate_withdrawals")
      .select("*")
      .eq("id", withdrawalId)
      .single();

    if (fetchError || !withdrawal) {
      return NextResponse.json({ error: "Withdrawal request not found" }, { status: 404 });
    }

    if (withdrawal.status !== "pending") {
      return NextResponse.json({ error: "Withdrawal already processed" }, { status: 400 });
    }

    const now = new Date().toISOString();

    if (action === "approve") {
      const { data: statusRow } = await (adminSupabase as any)
        .from("affiliate_status")
        .select("pending_earnings_ngn, withdrawn_earnings_ngn")
        .eq("user_id", withdrawal.user_id)
        .single();

      if (!statusRow) {
        return NextResponse.json({ error: "Affiliate status not found" }, { status: 404 });
      }

      const pendingEarnings = Number(statusRow.pending_earnings_ngn) || 0;
      const withdrawnEarnings = Number(statusRow.withdrawn_earnings_ngn) || 0;
      const amount = Number(withdrawal.amount_ngn);

      if (pendingEarnings < amount) {
        return NextResponse.json({ error: "Insufficient pending earnings" }, { status: 400 });
      }

      await (adminSupabase as any)
        .from("affiliate_status")
        .update({
          pending_earnings_ngn: pendingEarnings - amount,
          withdrawn_earnings_ngn: withdrawnEarnings + amount,
        })
        .eq("user_id", withdrawal.user_id);

      await (adminSupabase as any)
        .from("affiliate_withdrawals")
        .update({ status: "approved", admin_id: user.id, processed_at: now })
        .eq("id", withdrawalId);

      await (adminSupabase as any).from("activity_log").insert({
        user_id: withdrawal.user_id,
        event_type: "affiliate_withdrawal_approved",
        event_data: { amount_ngn: amount, withdrawal_id: withdrawalId, admin_id: user.id },
      });

      await (adminSupabase as any).from("notifications").insert({
        user_id: withdrawal.user_id,
        type: "withdrawal_approved",
        title: "Withdrawal approved",
        body: `Your withdrawal of ₦${amount.toLocaleString()} has been approved.`,
      });
    } else {
      await (adminSupabase as any)
        .from("affiliate_withdrawals")
        .update({ status: "rejected", admin_id: user.id, admin_note: note || null, processed_at: now })
        .eq("id", withdrawalId);

      await (adminSupabase as any).from("activity_log").insert({
        user_id: withdrawal.user_id,
        event_type: "affiliate_withdrawal_rejected",
        event_data: { amount_ngn: Number(withdrawal.amount_ngn), withdrawal_id: withdrawalId, admin_id: user.id, reason: note },
      });

      await (adminSupabase as any).from("notifications").insert({
        user_id: withdrawal.user_id,
        type: "withdrawal_rejected",
        title: "Withdrawal rejected",
        body: `Your withdrawal of ₦${Number(withdrawal.amount_ngn).toLocaleString()} was rejected.${note ? ` Reason: ${note}` : ""}`,
      });
    }

    await (adminSupabase as any).from("admin_audit_log").insert({
      admin_id: user.id,
      action: `affiliate_withdrawal_${action}`,
      target_user_id: withdrawal.user_id,
      previous_value: withdrawal.status,
      new_value: action === "approve" ? "approved" : "rejected",
      notes: `Amount: ₦${Number(withdrawal.amount_ngn).toLocaleString()}${note ? ` — ${note}` : ""}`,
    });

    return NextResponse.json({ success: true, action, withdrawalId });
  } catch (error: any) {
    console.error("Admin process withdrawal error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
