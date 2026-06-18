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

  // ── 1. Expire deposits where user clicked "I Have Sent" but 24h passed ──
  const { data: expiredDeposits } = await supabase
    .from("deposits")
    .select("id, user_id, amount, currency, payment_reference")
    .eq("status", "pending")
    .not("user_confirmed_at", "is", null)
    .not("expires_at", "is", null)
    .lt("expires_at", new Date().toISOString());

  let expiredCount = 0;
  for (const deposit of expiredDeposits || []) {
    await supabase
      .from("deposits")
      .update({ status: "expired" })
      .eq("id", deposit.id);

    await supabase.from("notifications").insert({
      user_id: deposit.user_id,
      type: "deposit_expired",
      title: "Payment not confirmed \u2014 deposit expired",
      body: `Your deposit of ${deposit.currency} ${deposit.amount.toLocaleString()} (ref: ${deposit.payment_reference}) was not confirmed within 24 hours. If you sent the money, contact support@swiipt.com with your reference.`,
      action_url: "/dashboard/goals",
    });
    expiredCount++;
  }

  // ── 2. Clean up abandoned deposits (user never clicked "I Have Sent", older than 48h) ──
  const fortyEightHoursAgo = new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString();
  const { data: abandonedDeposits } = await supabase
    .from("deposits")
    .select("id, user_id, amount, currency, payment_reference")
    .eq("status", "pending")
    .is("user_confirmed_at", null)
    .is("expires_at", null)
    .lt("created_at", fortyEightHoursAgo);

  let abandonedCount = 0;
  for (const deposit of abandonedDeposits || []) {
    await supabase
      .from("deposits")
      .update({ status: "abandoned" })
      .eq("id", deposit.id);

    // No notification for abandoned deposits \u2014 user never confirmed intent to pay
    abandonedCount++;
  }

  return NextResponse.json({
    expired: expiredCount,
    abandoned: abandonedCount,
  });
}
