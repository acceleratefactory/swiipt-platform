import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

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

  const { data: expiredRedemptions } = await supabaseAny
    .from("visa_redemptions")
    .select("id, user_id, reward_id, nights, total_fee_usd, booking_fee_ngn, payment_reference")
    .eq("status", "pending_payment")
    .not("expires_at", "is", null)
    .lt("expires_at", new Date().toISOString());

  if (!expiredRedemptions || expiredRedemptions.length === 0) {
    return NextResponse.json({ expired: 0 });
  }

  const ids = expiredRedemptions.map((r: any) => r.id);

  await supabaseAny
    .from("visa_redemptions")
    .update({ status: "cancelled", abandoned_at: new Date().toISOString() })
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
  }

  return NextResponse.json({ expired: expiredRedemptions.length });
}
