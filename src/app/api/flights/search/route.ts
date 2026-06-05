import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { searchFlights, getOffers } from "@/lib/duffel";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { origin, destination, departureDate, returnDate, adults, children, infants, cabinClass } = await request.json();

  try {
    const offerRequest = await searchFlights({
      origin,
      destination,
      departureDate,
      returnDate,
      adults: adults || 1,
      children: children || 0,
      infants: infants || 0,
      cabinClass: cabinClass || "economy",
    });

    const offers = await getOffers(offerRequest.id);

    await supabase.from("activity_log").insert({
      user_id: user.id,
      event_type: "flight_searched",
      event_data: { origin, destination, departureDate, returnDate, adults },
    });

    return NextResponse.json({
      offerRequestId: offerRequest.id,
      offers: offers.map((offer: any) => ({
        id: offer.id,
        total_amount: offer.total_amount,
        total_currency: offer.total_currency,
        total_duration: offer.total_duration,
        slices: offer.slices.map((slice: any) => ({
          origin: slice.origin.iata_code,
          origin_name: slice.origin.name,
          destination: slice.destination.iata_code,
          destination_name: slice.destination.name,
          departure_at: slice.segments[0]?.departing_at,
          arrival_at: slice.segments[slice.segments.length - 1]?.arriving_at,
          duration: slice.duration,
          segments: slice.segments.map((seg: any) => ({
            airline: seg.operating_carrier?.name || seg.marketing_carrier?.name,
            airline_logo: seg.operating_carrier?.logo_symbol_url,
            flight_number: `${seg.marketing_carrier_flight_designator?.carrier_code}${seg.marketing_carrier_flight_designator?.flight_number}`,
            departure_at: seg.departing_at,
            arrival_at: seg.arriving_at,
            origin: seg.origin.iata_code,
            destination: seg.destination.iata_code,
          })),
          stops: slice.segments.length - 1,
        })),
        passengers: offer.passengers,
        conditions: {
          refundable_before_departure: offer.conditions?.refund_before_departure?.allowed || false,
          changeable: offer.conditions?.change_before_departure?.allowed || false,
        },
      })),
    });
  } catch (error: any) {
    console.error("Duffel search error:", error.message);
    return NextResponse.json({ error: error.message || "Search failed" }, { status: 500 });
  }
}
