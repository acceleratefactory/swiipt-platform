import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

const VALID_FIELDS = ["pending_earnings_ngn", "total_earned_ngn", "withdrawn_earnings_ngn"];

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

    const userId = params.id;
    const { field, amount, reason } = await request.json();

    if (!field || !VALID_FIELDS.includes(field)) {
      return NextResponse.json({ error: "Invalid field. Must be one of: " + VALID_FIELDS.join(", ") }, { status: 400 });
    }
    if (typeof amount !== "number" || amount === 0) {
      return NextResponse.json({ error: "Amount must be a non-zero number" }, { status: 400 });
    }
    if (!reason || reason.trim().length < 10) {
      return NextResponse.json({ error: "Reason is required (min 10 characters)" }, { status: 400 });
    }

    const { data: current } = await (adminSupabase as any)
      .from("affiliate_status")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (!current) {
      return NextResponse.json({ error: "Affiliate not found" }, { status: 404 });
    }

    const previousValue = Number(current[field]) || 0;
    const newValue = previousValue + amount;

    if (newValue < 0) {
      return NextResponse.json({ error: "Resulting value cannot be negative" }, { status: 400 });
    }

    const { error: updateError } = await (adminSupabase as any)
      .from("affiliate_status")
      .update({ [field]: newValue })
      .eq("user_id", userId);

    if (updateError) return NextResponse.json({ error: updateError.message }, { status: 500 });

    await (adminSupabase as any).from("admin_audit_log").insert({
      admin_id: user.id,
      action: "affiliate_earnings_adjustment",
      target_user_id: userId,
      previous_value: previousValue,
      new_value: newValue,
      notes: `${field}: ${amount >= 0 ? "+" : ""}${amount} — ${reason}`,
    });

    await (adminSupabase as any).from("activity_log").insert({
      user_id: userId,
      event_type: "affiliate_manual_adjustment",
      event_data: { field, amount, reason, admin_id: user.id, previous_value: previousValue, new_value: newValue },
    });

    await (adminSupabase as any).from("notifications").insert({
      user_id: userId,
      type: "earnings_adjusted",
      title: "Earnings adjusted by admin",
      body: `${field.replace(/_/g, " ")}: ${amount >= 0 ? "+" : ""}₦${Math.abs(amount).toLocaleString()} — ${reason}`,
    });

    return NextResponse.json({
      success: true,
      field,
      previousValue,
      adjustment: amount,
      newValue,
    });
  } catch (error: any) {
    console.error("Admin adjust earnings error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
/* eslint-enable @typescript-eslint/no-explicit-any */
