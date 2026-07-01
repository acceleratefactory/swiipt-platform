import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const serviceClient = createServiceClient();

  const { goalId, goalUserId, amount, foreignCurrency, giverName, giverEmail, message } = await request.json();

  if (!goalId || !goalUserId || !amount || !foreignCurrency || !giverName) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  // Verify goal
  const { data: goal } = await (serviceClient as any)
    .from("savings_goals")
    .select("id, goal_name, user_id, status")
    .eq("id", goalId)
    .eq("user_id", goalUserId)
    .single();

  if (!goal || (goal.status !== "active" && goal.status !== "completed")) {
    return NextResponse.json({ error: "Goal not found or not active" }, { status: 404 });
  }

  // Get user's first name
  const { data: user } = await (serviceClient as any)
    .from("users")
    .select("full_name")
    .eq("id", goalUserId)
    .single();

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Get FX rate
  const { data: currency } = await (serviceClient as any)
    .from("currencies")
    .select("ngn_exchange_rate")
    .eq("code", foreignCurrency)
    .eq("is_active", true)
    .single();

  if (!currency || !currency.ngn_exchange_rate) {
    return NextResponse.json({ error: `FX rate not available for ${foreignCurrency}` }, { status: 400 });
  }

  const fxRate = currency.ngn_exchange_rate;
  const amountPaidForeign = foreignCurrency === "NGN" ? amount : Math.round(amount / fxRate);
  const platformFeePct = 0.015;
  const amountCreditedNgn = Math.round(amount * (1 - platformFeePct));
  const platformFeeNgn = amount - amountCreditedNgn;

  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  if (!stripeSecretKey) {
    return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);

  // Create diaspora_gifts record
  const { data: gift } = await (serviceClient as any)
    .from("diaspora_gifts")
    .insert({
      goal_id: goalId,
      recipient_user_id: goalUserId,
      giver_name: giverName,
      giver_email: giverEmail || null,
      amount_paid_foreign: amountPaidForeign,
      foreign_currency: foreignCurrency,
      fx_rate_used: fxRate,
      amount_credited_ngn: amountCreditedNgn,
      platform_fee_ngn: platformFeeNgn,
      gift_message: message || null,
      status: "pending",
    })
    .select()
    .single();

  if (!gift) {
    return NextResponse.json({ error: "Failed to create gift record" }, { status: 500 });
  }

  const origin = request.headers.get("origin") || process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const firstName = (user.full_name || "Someone").split(" ")[0];

  // Create Stripe Checkout session
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: [
      {
        price_data: {
          currency: foreignCurrency.toLowerCase(),
          product_data: {
            name: `Gift to ${firstName}'s goal`,
            description: message ? `"${message.slice(0, 200)}"` : undefined,
          },
          unit_amount: amountPaidForeign * 100,
        },
        quantity: 1,
      },
    ],
    mode: "payment",
    success_url: `${origin}/fund/${goalId}?success=true`,
    cancel_url: `${origin}/fund/${goalId}`,
    metadata: {
      diaspora_gift_id: gift.id,
      goal_id: goalId,
      recipient_user_id: goalUserId,
    },
  });

  // Save Stripe session ID
  await (serviceClient as any)
    .from("diaspora_gifts")
    .update({ stripe_session_id: session.id })
    .eq("id", gift.id);

  return NextResponse.json({ checkoutUrl: session.url });
}
