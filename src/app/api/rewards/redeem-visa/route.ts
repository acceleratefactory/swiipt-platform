import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { rewardId, nights: rawNights } = await request.json();

  // Verify reward exists and belongs to user
  const { data: reward } = await supabase
    .from("milestone_rewards")
    .select("*")
    .eq("id", rewardId)
    .eq("user_id", user.id)
    .eq("milestone_type", "welcome_gift")
    .eq("redeemed", false)
    .single();

  if (!reward) {
    return NextResponse.json({ error: "Reward not found or already redeemed." }, { status: 404 });
  }

  // Check if user already has a pending visa redemption
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existing } = await (supabase as any)
    .from("visa_redemptions")
    .select("id, status")
    .eq("user_id", user.id)
    .eq("reward_id", rewardId)
    .not("status", "eq", "cancelled")
    .maybeSingle();

  if (existing) {
    return NextResponse.json({
      redemptionId: existing.id,
      status: existing.status,
      alreadyStarted: true,
    });
  }

  // Fetch hotel booking settings from platform_settings
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hotelSettings } = await (supabase as any)
    .from("platform_settings")
    .select("key, value")
    .in("key", ["hotel_base_fee_usd", "hotel_extra_night_fee_usd", "hotel_min_nights"]);

  const hotelConfig: Record<string, number> = {};
  (hotelSettings || []).forEach((s: any) => { hotelConfig[s.key] = Number(s.value); });

  const baseFeeUsd = hotelConfig.hotel_base_fee_usd || 150;
  const extraNightFeeUsd = hotelConfig.hotel_extra_night_fee_usd || 50;
  const minNights = hotelConfig.hotel_min_nights || 3;

  const nights = Math.max(minNights, Math.floor(Number(rawNights) || minNights));
  const extraNights = Math.max(0, nights - minNights);
  const extraFeeUsd = extraNights * extraNightFeeUsd;
  const totalUsd = baseFeeUsd + extraFeeUsd;

  // Get current USD → NGN rate from currencies table
  const { data: usdRate } = await supabase
    .from("currencies")
    .select("ngn_exchange_rate")
    .eq("code", "USD")
    .single();

  const usdToNgn = usdRate?.ngn_exchange_rate || 1600;
  const totalNgn = Math.ceil(totalUsd * usdToNgn);

  // Create visa redemption record with dynamic pricing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: redemption, error } = await (supabase as any)
    .from("visa_redemptions")
    .insert({
      user_id: user.id,
      reward_id: rewardId,
      booking_fee_usd: totalUsd,
      booking_fee_ngn: totalNgn,
      status: "pending_payment",
      nights,
      total_fee_usd: totalUsd,
      base_fee_usd: baseFeeUsd,
      extra_fee_usd: extraFeeUsd,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: "Failed to initiate redemption." }, { status: 500 });
  }

  // Get bank details for payment
  const { data: bankSettings } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

  const bankDetails = bankSettings?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

  // Generate payment reference
  const reference = `SWP-VISA-${user.id.replace(/-/g, "").slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  // Create a deposit record for the total fee
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("deposits").insert({
    user_id: user.id,
    goal_id: null,
    amount: totalNgn,
    currency: "NGN",
    ngn_equivalent: totalNgn,
    payment_reference: reference,
    status: "pending",
    expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
  });

  return NextResponse.json({
    redemptionId: redemption.id,
    totalUsd,
    totalNgn,
    baseFeeUsd,
    extraFeeUsd,
    nights,
    bookingFeeUsd: totalUsd,
    bookingFeeNgn: totalNgn,
    reference,
    bankDetails,
    status: "pending_payment",
  });
}
