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
  const baseFeeNgn = Math.ceil(baseFeeUsd * usdToNgn);
  const extraFeeNgn = Math.ceil(extraFeeUsd * usdToNgn);

  // Generate payment reference
  const reference = `SWP-VISA-${user.id.replace(/-/g, "").slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

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
      payment_reference: reference,
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (error) {
    console.error("Visa redemption insert error:", error);
    return NextResponse.json({ error: "Failed to initiate redemption.", details: error.message || error }, { status: 500 });
  }

  // Get bank details for payment
  const { data: bankSettings } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

  const bankDetails = bankSettings?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

  return NextResponse.json({
    redemptionId: redemption.id,
    totalUsd,
    totalNgn,
    baseFeeUsd,
    baseFeeNgn,
    extraFeeUsd,
    extraFeeNgn,
    nights,
    minNights,
    bookingFeeUsd: totalUsd,
    bookingFeeNgn: totalNgn,
    reference,
    bankDetails,
    status: "pending_payment",
  });
}

export async function GET(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(request.url);
  const redemptionId = searchParams.get("redemptionId");
  if (!redemptionId) {
    return NextResponse.json({ error: "Missing redemptionId." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: redemption, error: fetchError } = await (supabase as any)
    .from("visa_redemptions")
    .select("*")
    .eq("id", redemptionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !redemption) {
    return NextResponse.json({ error: "Redemption not found." }, { status: 404 });
  }

  // Get current USD → NGN rate
  const { data: usdRate } = await supabase
    .from("currencies")
    .select("ngn_exchange_rate")
    .eq("code", "USD")
    .single();

  const usdToNgn = usdRate?.ngn_exchange_rate || 1600;
  const totalNgn = Math.ceil((redemption.total_fee_usd || redemption.booking_fee_usd) * usdToNgn);
  const baseFeeNgn = Math.ceil((redemption.base_fee_usd || 150) * usdToNgn);
  const extraFeeNgn = Math.ceil((redemption.extra_fee_usd || 0) * usdToNgn);

  // Fetch bank details
  const { data: bankSettings } = await supabase
    .from("platform_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

  const bankDetails = bankSettings?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

  // Fetch minNights
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: hotelSettings } = await (supabase as any)
    .from("platform_settings")
    .select("key, value")
    .in("key", ["hotel_min_nights"]);

  const hotelConfig: Record<string, number> = {};
  (hotelSettings || []).forEach((s: any) => { hotelConfig[s.key] = Number(s.value); });
  const minNights = hotelConfig.hotel_min_nights || 3;

  return NextResponse.json({
    redemptionId: redemption.id,
    totalUsd: redemption.total_fee_usd || redemption.booking_fee_usd,
    totalNgn,
    baseFeeUsd: redemption.base_fee_usd || 150,
    baseFeeNgn,
    extraFeeUsd: redemption.extra_fee_usd || 0,
    extraFeeNgn,
    nights: redemption.nights || 3,
    minNights,
    bookingFeeUsd: redemption.booking_fee_usd,
    bookingFeeNgn: redemption.booking_fee_ngn,
    reference: redemption.payment_reference,
    bankDetails,
    status: redemption.status,
  });
}
