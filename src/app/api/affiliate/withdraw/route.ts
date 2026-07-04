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

    await supabase
      .from("affiliate_status")
      .update({ pending_earnings_ngn: statusRow.pending_earnings_ngn - amount })
      .eq("user_id", user.id);

    await supabase.from("activity_log").insert({
      user_id: user.id,
      event_type: "affiliate_withdrawal_requested",
      event_data: { amount_ngn: amount, tier: statusRow.tier },
    });

    return NextResponse.json({ success: true, amount });
  } catch (error) {
    console.error("Affiliate withdraw error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
