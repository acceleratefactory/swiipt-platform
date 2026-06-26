import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { generateInviteCode, calculateGroupPrice, getExpiryDate } from "@/lib/group-buy-utils";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { itemType, itemId, targetSize, title } = await request.json();

  if (!itemType || !itemId || !targetSize || !title) {
    return NextResponse.json({ error: "Missing required fields." }, { status: 400 });
  }

  if (targetSize < 2 || targetSize > 10) {
    return NextResponse.json({ error: "Group size must be between 2 and 10." }, { status: 400 });
  }

  const { data: settings } = await (serviceClient as any)
    .from("platform_settings")
    .select("key, value")
    .in("key", ["group_buy_discounts", "group_buy_expiry_hours", "group_buy_payment_window_hours"]);

  const discountMap = JSON.parse(settings?.find((s: any) => s.key === "group_buy_discounts")?.value || "{}");
  const expiryHours = parseInt(settings?.find((s: any) => s.key === "group_buy_expiry_hours")?.value || "72");
  const paymentWindowHours = parseInt(settings?.find((s: any) => s.key === "group_buy_payment_window_hours")?.value || "168");
  const discountPct = discountMap[targetSize.toString()] || 10;

  let originalPrice = 0;
  if (itemType === "holiday_package") {
    const { data: pkg } = await (serviceClient as any)
      .from("holiday_packages")
      .select("price_per_person_ngn")
      .eq("id", itemId)
      .single();
    originalPrice = pkg?.price_per_person_ngn || 0;
  } else if (itemType === "service") {
    const { data: pkg } = await (serviceClient as any)
      .from("service_packages")
      .select("price_ngn")
      .eq("id", itemId)
      .single();
    originalPrice = pkg?.price_ngn || 0;
  }

  if (originalPrice === 0) {
    return NextResponse.json({ error: "Item not found or has no price." }, { status: 404 });
  }

  const groupPrice = calculateGroupPrice(originalPrice, discountPct);
  const inviteCode = generateInviteCode();
  const expiresAt = getExpiryDate(expiryHours).toISOString();
  const paymentDeadline = new Date(Date.now() + paymentWindowHours * 60 * 60 * 1000).toISOString();

  const { data: groupBuy, error: createError } = await (serviceClient as any)
    .from("group_buys")
    .insert({
      creator_id: user.id,
      item_type: itemType,
      holiday_package_id: itemType === "holiday_package" ? itemId : null,
      service_package_id: itemType === "service" ? itemId : null,
      original_price_ngn: originalPrice,
      group_price_ngn: groupPrice,
      group_discount_pct: discountPct,
      target_size: targetSize,
      current_size: 1,
      status: "open",
      expires_at: expiresAt,
      payment_deadline: paymentDeadline,
      invite_code: inviteCode,
      title,
    })
    .select()
    .single();

  if (createError) {
    return NextResponse.json({ error: "Failed to create group." }, { status: 500 });
  }

  await (serviceClient as any).from("users").upsert({
    id: user.id,
    email: user.email,
    full_name: user.user_metadata?.full_name || user.email,
    preferred_currency: "NGN",
  }, { onConflict: "id" });

  const { error: memberError } = await (serviceClient as any).from("group_buy_members").insert({
    group_buy_id: groupBuy.id,
    user_id: user.id,
    role: "creator",
    status: "committed",
  });

  if (memberError) {
    await (serviceClient as any).from("group_buys").delete().eq("id", groupBuy.id);
    return NextResponse.json({ error: "Failed to add you to the group." }, { status: 500 });
  }

  return NextResponse.json({
    groupBuyId: groupBuy.id,
    inviteCode,
    inviteUrl: `${process.env.NEXT_PUBLIC_APP_URL}/join/${inviteCode}`,
    groupPrice,
    discountPct,
    expiresAt,
  });
}
