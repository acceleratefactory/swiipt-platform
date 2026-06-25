import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const serviceClient = createServiceClient();

  const { inviteCode } = await request.json();

  if (!inviteCode) {
    return NextResponse.json({ error: "Invite code is required." }, { status: 400 });
  }

  const { data: groupBuy } = await (serviceClient as any)
    .from("group_buys")
    .select("*")
    .eq("invite_code", inviteCode)
    .eq("status", "open")
    .single();

  if (!groupBuy) {
    return NextResponse.json({ error: "Group not found or no longer accepting members." }, { status: 404 });
  }

  if (new Date(groupBuy.expires_at) < new Date()) {
    await (serviceClient as any).from("group_buys").update({ status: "expired" }).eq("id", groupBuy.id);
    return NextResponse.json({ error: "This group has expired." }, { status: 400 });
  }

  if (groupBuy.current_size >= groupBuy.target_size) {
    return NextResponse.json({ error: "This group is already full." }, { status: 400 });
  }

  const { data: existing } = await (serviceClient as any)
    .from("group_buy_members")
    .select("id")
    .eq("group_buy_id", groupBuy.id)
    .eq("user_id", user.id)
    .maybeSingle();

  if (existing) {
    return NextResponse.json({ error: "You are already in this group." }, { status: 400 });
  }

  await (serviceClient as any).from("group_buy_members").insert({
    group_buy_id: groupBuy.id,
    user_id: user.id,
    role: "member",
    status: "committed",
  });

  const newSize = groupBuy.current_size + 1;
  const isFull = newSize >= groupBuy.target_size;

  let paymentDeadline = null;
  if (isFull) {
    const { data: settings } = await (serviceClient as any)
      .from("platform_settings")
      .select("value")
      .eq("key", "group_buy_payment_window_hours")
      .single();
    const windowHours = settings ? parseInt(settings.value, 10) : 168;
    paymentDeadline = new Date(Date.now() + windowHours * 3600000).toISOString();
  }

  await (serviceClient as any).from("group_buys").update({
    current_size: newSize,
    status: isFull ? "filled" : "open",
    filled_at: isFull ? new Date().toISOString() : null,
    payment_deadline: paymentDeadline,
  }).eq("id", groupBuy.id);

  if (isFull) {
    const { data: members } = await (serviceClient as any)
      .from("group_buy_members")
      .select("user_id")
      .eq("group_buy_id", groupBuy.id);

    const notifications = (members || []).map((m: any) => ({
      user_id: m.user_id,
      type: "group_buy_filled",
      title: "Your group is full — time to pay!",
      body: `Your group "${groupBuy.title}" is now full. Complete your payment to lock in the ${groupBuy.group_discount_pct}% group discount.`,
      action_url: `/dashboard/groups/${groupBuy.id}`,
    }));

    await (serviceClient as any).from("notifications").insert(notifications);
  } else {
    await (serviceClient as any).from("notifications").insert({
      user_id: groupBuy.creator_id,
      type: "group_buy_member_joined",
      title: "Someone joined your group",
      body: `Your group "${groupBuy.title}" now has ${newSize}/${groupBuy.target_size} members.`,
      action_url: `/dashboard/groups/${groupBuy.id}`,
    });
  }

  return NextResponse.json({
    groupBuyId: groupBuy.id,
    currentSize: newSize,
    isFull,
    groupPrice: groupBuy.group_price_ngn,
    discountPct: groupBuy.group_discount_pct,
  });
}
