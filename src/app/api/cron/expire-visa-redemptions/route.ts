import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { sendVisaReminderEmail } from "@/lib/resend";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-vercel-cron") !== "1") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const supabaseAny = supabase as any;

  const now = new Date().toISOString();
  let softSent = 0;
  let finalSent = 0;
  let expired = 0;

  // ── 1. Soft reminders: pending > 2h, no reminder sent yet ──
  const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: softCandidates } = await supabaseAny
    .from("visa_redemptions")
    .select("id, user_id, payment_reference, users(email, full_name)")
    .eq("status", "pending_payment")
    .is("reminder_sent_at", null)
    .lt("created_at", twoHoursAgo);

  for (const r of (softCandidates || []) as any[]) {
    const user = r.users;
    if (!user?.email) continue;

    try {
      await sendVisaReminderEmail(user.email, user.full_name || "there", r.payment_reference || "", "soft");
    } catch {
      // email failed, continue
    }

    await supabaseAny
      .from("visa_redemptions")
      .update({ reminder_sent_at: now })
      .eq("id", r.id);

    softSent++;
  }

  // ── 2. Final reminders: reminder sent, within 4h of expiry, no final reminder yet ──
  const fourHoursFromNow = new Date(Date.now() + 4 * 60 * 60 * 1000).toISOString();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: finalCandidates } = await supabaseAny
    .from("visa_redemptions")
    .select("id, user_id, payment_reference, users(email, full_name)")
    .eq("status", "pending_payment")
    .not("reminder_sent_at", "is", null)
    .is("final_reminder_sent_at", null)
    .not("expires_at", "is", null)
    .lt("expires_at", fourHoursFromNow);

  for (const r of (finalCandidates || []) as any[]) {
    const user = r.users;
    if (!user?.email) continue;

    try {
      await sendVisaReminderEmail(user.email, user.full_name || "there", r.payment_reference || "", "final");
    } catch {
      // email failed, continue
    }

    await supabaseAny
      .from("visa_redemptions")
      .update({ final_reminder_sent_at: now })
      .eq("id", r.id);

    finalSent++;
  }

  // ── 3. Cancel expired redemptions ──
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: expiredRedemptions } = await supabaseAny
    .from("visa_redemptions")
    .select("id, user_id, reward_id, nights, total_fee_usd, booking_fee_ngn, payment_reference")
    .eq("status", "pending_payment")
    .not("expires_at", "is", null)
    .lt("expires_at", now);

  if (expiredRedemptions && expiredRedemptions.length > 0) {
    const ids = expiredRedemptions.map((r: any) => r.id);

    await supabaseAny
      .from("visa_redemptions")
      .update({ status: "cancelled", abandoned_at: now })
      .in("id", ids);

    for (const redemption of expiredRedemptions) {
      await supabase.from("activity_log").insert({
        user_id: redemption.user_id,
        action: "visa_redemption_abandoned",
        details: {
          redemption_id: redemption.id,
          reward_id: redemption.reward_id,
          nights: redemption.nights,
          fee_usd: redemption.total_fee_usd,
          fee_ngn: redemption.booking_fee_ngn,
          reference: redemption.payment_reference,
        },
      });

      // Reset reward redeemed flag so user can re-initiate
      await supabaseAny
        .from("milestone_rewards")
        .update({ redeemed: false, redeemed_at: null })
        .eq("id", redemption.reward_id)
        .eq("redeemed", true);
    }

    expired = expiredRedemptions.length;
  }

  return NextResponse.json({ softSent, finalSent, expired });
}
