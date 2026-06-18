import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { redemptionId, reference: providedReference } = await request.json();
  if (!redemptionId) {
    return NextResponse.json({ error: "Missing redemptionId." }, { status: 400 });
  }

  const reference = providedReference || `SWP-VISA-${user.id.replace(/-/g, "").slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: redemption, error: fetchError } = await (supabase as any)
    .from("visa_redemptions")
    .select("id, status, total_fee_usd, booking_fee_ngn, booking_fee_usd")
    .eq("id", redemptionId)
    .eq("user_id", user.id)
    .single();

  if (fetchError || !redemption) {
    return NextResponse.json({ error: "Redemption not found." }, { status: 404 });
  }

  if (redemption.status !== "pending_payment") {
    return NextResponse.json({ error: "Redemption is not in pending payment state." }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deposit, error: depositError } = await (supabase as any)
    .from("deposits")
    .insert({
      user_id: user.id,
      goal_id: null,
      amount: redemption.booking_fee_ngn,
      currency: "NGN",
      ngn_equivalent: redemption.booking_fee_ngn,
      payment_reference: reference,
      status: "pending",
      user_confirmed_at: new Date().toISOString(),
      expires_at: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    })
    .select()
    .single();

  if (depositError) {
    console.error("Deposit creation error:", depositError);
    return NextResponse.json({ error: "Failed to create deposit.", details: depositError.message || depositError }, { status: 500 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error: updateError } = await (supabase as any)
    .from("visa_redemptions")
    .update({ booking_fee_deposit_id: deposit.id, deposit_id: deposit.id })
    .eq("id", redemptionId);

  if (updateError) {
    console.error("Failed to link deposit to redemption:", updateError);
  }

  return NextResponse.json({
    depositId: deposit.id,
    reference,
    status: "pending_payment",
  });
}
