import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { feeDepositId } = await request.json();
  if (!feeDepositId) {
    return NextResponse.json({ error: "feeDepositId required" }, { status: 400 });
  }

  // Verify the fee deposit exists, is confirmed, and covers the fee
  const { data: feeDeposit } = await supabase
    .from("deposits")
    .select("id, status, amount")
    .eq("id", feeDepositId)
    .eq("user_id", user.id)
    .single();

  if (!feeDeposit || feeDeposit.status !== "confirmed") {
    return NextResponse.json({ error: "Fee deposit not confirmed" }, { status: 400 });
  }

  if (feeDeposit.amount < 10000) {
    return NextResponse.json({ error: "Deposit amount must be at least ₦10,000 for this certificate" }, { status: 400 });
  }

  // Fetch user's financial profile
  const { data: financialProfile } = await supabase
    .from("financial_profiles")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (!financialProfile) {
    return NextResponse.json({ error: "Financial profile not found. Complete your profile first." }, { status: 400 });
  }

  const { data: userProfile } = await supabase
    .from("users")
    .select("full_name, email, readiness_score")
    .eq("id", user.id)
    .single();

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  // Generate certificate number
  const { data: certNumber, error: seqError } = await adminSupabase.rpc("next_certificate_number", {
    cert_prefix: "SWP-TC",
  });

  if (seqError || !certNumber) {
    return NextResponse.json({ error: "Failed to generate certificate number" }, { status: 500 });
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const verificationUrl = `${appUrl}/verify/${certNumber}`;
  const expiresAt = new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString();

  // Format tenure as human-readable string
  const tenureDays = financialProfile.platform_tenure_days || 0;
  const tenureDisplay = tenureDays >= 365
    ? `${Math.floor(tenureDays / 365)} year${Math.floor(tenureDays / 365) > 1 ? "s" : ""} ${tenureDays % 365 > 0 ? `${tenureDays % 365} days` : ""}`
    : tenureDays >= 30
      ? `${Math.floor(tenureDays / 30)} month${Math.floor(tenureDays / 30) > 1 ? "s" : ""} ${tenureDays % 30 > 0 ? `${tenureDays % 30} days` : ""}`
      : `${tenureDays} days`;

  const dataSnapshot = {
    holder_name: userProfile?.full_name || "",
    holder_email: userProfile?.email || "",
    platform_tenure_days: tenureDisplay,
    deposit_consistency_score: financialProfile.deposit_consistency_score || 0,
    total_deposited_ngn: financialProfile.total_deposited_ngn || 0,
    services_completed: financialProfile.services_completed || 0,
    documents_verified_count: financialProfile.documents_verified_count || 0,
    trust_score: financialProfile.trust_score || 0,
    readiness_score: userProfile?.readiness_score || 0,
    total_goals_created: financialProfile.total_goals_created || 0,
    total_goals_completed: financialProfile.total_goals_completed || 0,
    average_monthly_deposit_ngn: financialProfile.average_monthly_deposit_ngn || 0,
    has_uk_company: financialProfile.has_uk_company || false,
  };

  const { data: certificate, error: insertError } = await adminSupabase
    .from("platform_certificates")
    .insert({
      user_id: user.id,
      certificate_type: "trust_certificate",
      certificate_number: certNumber,
      data_snapshot: dataSnapshot,
      verification_url: verificationUrl,
      is_valid: true,
      expires_at: expiresAt,
      fee_paid_ngn: 10000,
      fee_deposit_id: feeDepositId,
    })
    .select()
    .single();

  if (insertError) {
    return NextResponse.json({ error: insertError.message }, { status: 500 });
  }

  const { data: wallet } = await adminSupabase
    .from("wallets")
    .select("balance_ngn")
    .eq("user_id", user.id)
    .single();
  if (wallet) {
    await adminSupabase
      .from("wallets")
      .update({ balance_ngn: Math.max(0, wallet.balance_ngn - 10000) })
      .eq("user_id", user.id);
  }

  try {
    await adminSupabase.from("notifications").insert({
      user_id: user.id,
      type: "certificate_issued",
      title: "Trust Certificate Issued",
      body: `Your Trust Certificate (#${certNumber}) has been issued and is ready for download.`,
      action_url: "/dashboard/profile/certificates",
    });
  } catch {} // fire-and-forget

  return NextResponse.json({ certificate });
}
