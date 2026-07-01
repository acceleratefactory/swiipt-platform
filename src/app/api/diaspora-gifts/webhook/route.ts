import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import Stripe from "stripe";

export async function POST(request: NextRequest) {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!stripeSecretKey || !webhookSecret) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 500 });
  }

  const stripe = new Stripe(stripeSecretKey);
  const rawBody = await request.text();
  const signature = request.headers.get("stripe-signature");

  if (!signature) {
    return NextResponse.json({ error: "No signature" }, { status: 400 });
  }

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
  }

  if (event.type !== "checkout.session.completed") {
    return NextResponse.json({ received: true });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const giftId = session.metadata?.diaspora_gift_id;
  const goalId = session.metadata?.goal_id;
  const recipientUserId = session.metadata?.recipient_user_id;
  const paymentIntentId = session.payment_intent as string;

  if (!giftId || !goalId || !recipientUserId) {
    return NextResponse.json({ error: "Missing metadata" }, { status: 400 });
  }

  const serviceClient = createServiceClient();

  // Find the gift record
  const { data: gift } = await (serviceClient as any)
    .from("diaspora_gifts")
    .select("*")
    .eq("id", giftId)
    .single();

  if (!gift) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }

  if (gift.status !== "pending") {
    return NextResponse.json({ received: true });
  }

  // Increment goal balance atomically
  await (serviceClient as any).rpc("increment_goal_balance", {
    goal_id_input: goalId,
    amount_input: (gift as any).amount_credited_ngn,
  });

  // Check and unlock milestones
  const { data: updatedGoal } = await (serviceClient as any)
    .from("savings_goals")
    .select("current_balance, target_amount")
    .eq("id", goalId)
    .single();

  if (updatedGoal && updatedGoal.target_amount > 0) {
    const pct = (updatedGoal.current_balance / updatedGoal.target_amount) * 100;
    await (serviceClient as any).rpc("check_and_unlock_milestones_rpc", {
      goal_id_input: goalId,
      user_id_input: recipientUserId,
      current_pct: pct,
    }).catch(() => {});
  }

  // Recalculate wallet locked
  await (serviceClient as any).rpc("recalculate_wallet_locked", {
    user_id_input: recipientUserId,
  }).catch(() => {});

  // Mark gift as completed
  await (serviceClient as any)
    .from("diaspora_gifts")
    .update({
      status: "completed",
      stripe_payment_intent_id: paymentIntentId,
      completed_at: new Date().toISOString(),
    })
    .eq("id", giftId);

  // Activity log
  await (serviceClient as any).from("activity_log").insert({
    user_id: recipientUserId,
    event_type: "diaspora_gift_received",
    event_data: {
      gift_id: giftId,
      goal_id: goalId,
      giver_name: (gift as any).giver_name,
      amount_credited_ngn: (gift as any).amount_credited_ngn,
    },
  });

  // Notification to recipient
  const giverName = (gift as any).giver_name;
  const giftMessage = (gift as any).gift_message;
  const amountCredited = (gift as any).amount_credited_ngn;

  await (serviceClient as any).from("notifications").insert({
    user_id: recipientUserId,
    type: "diaspora_gift_received",
    title: `🎁 ${giverName} sent you a gift!`,
    body: `${amountCredited.toLocaleString()} NGN added to your goal.${giftMessage ? ` "${giftMessage}"` : ""}`,
    action_url: `/dashboard/goals/${goalId}`,
    target_segment: null,
  });

  return NextResponse.json({ received: true });
}
