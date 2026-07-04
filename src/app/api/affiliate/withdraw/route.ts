import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { amount } = await request.json();
    if (!amount || amount < 1000) {
      return NextResponse.json({ error: "Minimum withdrawal is ₦1,000" }, { status: 400 });
    }

    const { data: statusRow } = await supabase
      .from("affiliate_status")
      .select("pending_earnings_ngn, tier")
      .eq("user_id", user.id)
      .single();

    if (!statusRow) {
      return NextResponse.json({ error: "Affiliate status not found" }, { status: 404 });
    }

    if (statusRow.pending_earnings_ngn < amount) {
      return NextResponse.json({ error: "Insufficient pending earnings" }, { status: 400 });
    }

    if (statusRow.tier === "starter") {
      return NextResponse.json({ error: "Withdrawals require Bronze tier or higher" }, { status: 403 });
    }

    const { data: withdrawal, error: insertError } = await supabase
      .from("affiliate_withdrawals")
      .insert({ user_id: user.id, amount_ngn: amount })
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    await supabase.from("activity_log").insert({
      user_id: user.id,
      event_type: "affiliate_withdrawal_requested",
      event_data: { amount_ngn: amount, tier: statusRow.tier, withdrawal_id: withdrawal.id },
    });

    // Admin broadcast notification (E-1)
    const { data: profile } = await supabase.from("users").select("full_name").eq("id", user.id).single();
    await supabase.from("notifications").insert({
      user_id: null,
      type: "affiliate_withdrawal_requested",
      title: "New withdrawal request",
      body: `₦${Number(amount).toLocaleString()} requested by ${profile?.full_name || user.id.slice(0, 8)}`,
      action_url: "/admin/affiliates/withdrawals",
      target_segment: null,
    });

    return NextResponse.json({ success: true, withdrawalId: withdrawal.id, amount });
  } catch (error) {
    console.error("Affiliate withdraw error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
