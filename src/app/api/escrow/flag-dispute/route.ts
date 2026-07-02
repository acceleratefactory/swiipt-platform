import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { dealId, reason } = await request.json();
  if (!dealId || !reason) {
    return NextResponse.json({ error: "dealId and reason required" }, { status: 400 });
  }

  const { data: deal } = await supabase
    .from("escrow_deals")
    .select("id, status, client_user_id, partner_id, title")
    .eq("id", dealId)
    .single();

  if (!deal) {
    return NextResponse.json({ error: "Deal not found" }, { status: 404 });
  }

  if (deal.status !== "active") {
    return NextResponse.json({ error: "Only active deals can be disputed" }, { status: 400 });
  }

  const { data: partner } = await supabase
    .from("platform_partners")
    .select("email")
    .eq("id", deal.partner_id)
    .single();

  // Only the client or the partner (matched by email) can flag
  const isClient = deal.client_user_id === user.id;
  const isPartner = partner?.email === user.email;
  if (!isClient && !isPartner) {
    return NextResponse.json({ error: "Not authorized to flag this deal" }, { status: 403 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any)
    .from("escrow_deals")
    .update({ status: "disputed" })
    .eq("id", dealId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Notify client and admins
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const notifications: any[] = [
    {
      user_id: deal.client_user_id,
      type: "escrow_dispute",
      title: "Dispute flagged",
      body: `Dispute flagged for "${deal.title}": ${reason}`,
      action_url: `/dashboard/groups`,
      event_data: { dealId, reason, flaggedBy: user.id },
    },
  ];

  // Notify admins (type=admin, target_segment='admin')
  notifications.push({
    user_id: null,
    type: "escrow_dispute",
    title: "Escrow dispute requires attention",
    body: `Deal "${deal.title}" flagged as disputed by ${isClient ? "client" : "partner"}: ${reason}`,
    action_url: `/admin/partners/${deal.partner_id}`,
    target_segment: "admin",
    event_data: { dealId, reason, flaggedBy: user.id, partnerId: deal.partner_id },
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any).from("notifications").insert(notifications).catch(() => {});

  return NextResponse.json({ success: true });
}
