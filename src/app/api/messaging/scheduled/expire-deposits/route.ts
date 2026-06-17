import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  // Only allow Vercel Cron Jobs or internal calls
  if (request.headers.get("x-vercel-cron") !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Find deposits that are pending, user has confirmed, and expires_at is in the past
  const { data: expiredDeposits } = await supabase
    .from("deposits")
    .select("id, user_id, amount, currency, payment_reference")
    .eq("status", "pending")
    .not("user_confirmed_at", "is", null)
    .not("expires_at", "is", null)
    .lt("expires_at", new Date().toISOString());

  if (!expiredDeposits || expiredDeposits.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  // Mark as expired
  for (const deposit of expiredDeposits) {
    await supabase
      .from("deposits")
      .update({ status: "expired" })
      .eq("id", deposit.id);

    // Notify the user
    await supabase.from("notifications").insert({
      user_id: deposit.user_id,
      type: "deposit_expired",
      title: "Payment not confirmed — deposit expired",
      body: `Your deposit of ${deposit.currency} ${deposit.amount.toLocaleString()} (ref: ${deposit.payment_reference}) was not confirmed within 24 hours. If you sent the money, contact support@swiipt.com with your reference.`,
      action_url: "/dashboard/goals",
    });
  }

  return NextResponse.json({ expired: expiredDeposits.length });
}
