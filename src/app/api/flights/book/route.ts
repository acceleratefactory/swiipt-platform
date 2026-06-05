import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createOrder, getOffer } from "@/lib/duffel";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { offerId, passengers } = await request.json();

  try {
    const offer = await getOffer(offerId);

    const order = await createOrder({
      offerId,
      passengers,
      paymentType: "balance",
      currency: offer.total_currency,
      amount: offer.total_amount,
    });

    await supabase.from("activity_log").insert({
      user_id: user.id,
      event_type: "flight_booked",
      event_data: {
        duffel_order_id: order.id,
        booking_reference: order.booking_reference,
        total_amount: offer.total_amount,
        currency: offer.total_currency,
        origin: offer.slices[0]?.origin?.iata_code,
        destination: offer.slices[0]?.destination?.iata_code,
      },
    });

    await (supabase as any).from("notifications").insert({
      user_id: user.id,
      type: "flight_booked",
      title: "Flight booked ✓",
      body: `Your booking is confirmed. Reference: ${order.booking_reference}. Check your email for the e-ticket.`,
      action_url: "/dashboard/flights",
      target_segment: null,
    });

    return NextResponse.json({
      orderId: order.id,
      bookingReference: order.booking_reference,
      totalAmount: offer.total_amount,
      currency: offer.total_currency,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Booking failed" }, { status: 500 });
  }
}
