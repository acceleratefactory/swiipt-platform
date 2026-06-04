import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { referralCode } = await request.json();
  if (!referralCode) return NextResponse.json({ error: "Referral code required" }, { status: 400 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: referrer } = await (supabase as any)
    .from("users")
    .select("id, full_name")
    .eq("referral_code", referralCode)
    .single();

  if (!referrer) return NextResponse.json({ error: "Invalid referral code" }, { status: 404 });

  if (referrer.id === user.id) {
    return NextResponse.json({ error: "Cannot refer yourself" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("referrals")
    .select("id")
    .eq("referrer_id", referrer.id)
    .eq("referred_id", user.id)
    .single();

  if (existing) return NextResponse.json({ error: "Already referred by this user" }, { status: 409 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("referrals").insert({
    referrer_id: referrer.id,
    referred_id: user.id,
    commission_status: "pending",
  });

  const periodKey = new Date().toISOString().slice(0, 7);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).rpc("update_leaderboard_entry", {
    user_id_input: referrer.id,
    period_key_input: periodKey,
  });

  return NextResponse.json({ success: true, referrerName: referrer.full_name });
}
