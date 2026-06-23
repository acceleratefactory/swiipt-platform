import { NextRequest, NextResponse } from "next/server";
/* eslint-disable @typescript-eslint/no-explicit-any */
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { packageId, travellers, currency } = await request.json();

  const { data: pkg } = await (serviceClient as any)
    .from("holiday_packages")
    .select("*")
    .eq("id", packageId)
    .single();

  if (!pkg || !pkg.is_active) return NextResponse.json({ error: "Package not found" }, { status: 404 });

  const currencyKey = `price_per_person_${currency.toLowerCase()}`;
  const pricePerPerson = (pkg as any)[currencyKey] || pkg.price_per_person_ngn;
  const totalPrice = pricePerPerson * (travellers || 1);

  const ref = `SWP-HOL-${user.id.replace(/-/g, "").slice(0, 6).toUpperCase()}-${Date.now().toString().slice(-6)}`;

  const { data: booking, error } = await (serviceClient as any)
    .from("holiday_bookings")
    .insert({
      user_id: user.id,
      package_id: packageId,
      reference: ref,
      travellers: travellers || 1,
      currency,
      total_price: totalPrice,
      status: "payment_pending",
    })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: "Failed to create booking" }, { status: 500 });

  const { data: bankSettings } = await (serviceClient as any)
    .from("platform_settings")
    .select("key, value")
    .in("key", ["bank_name", "bank_account_number", "bank_account_name"]);

  const bankDetails = bankSettings?.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {});

  await (serviceClient as any).from("activity_log").insert({
    user_id: user.id,
    event_type: "holiday_booking_initiated",
    event_data: { package_id: packageId, package_title: pkg.title, total_price: totalPrice, currency, reference: ref, travellers },
  });

  await (serviceClient as any).from("notifications").insert({
    user_id: null,
    type: "holiday_booking",
    title: "Holiday booking initiated",
    body: `${pkg.title} — ${currency} ${totalPrice.toLocaleString()} for ${travellers} traveller(s).`,
    action_url: "/admin/holidays",
    target_segment: null,
  });

  return NextResponse.json({ success: true, bookingId: booking.id, reference: ref, totalPrice, currency, bankDetails });
}
/* eslint-enable @typescript-eslint/no-explicit-any */
