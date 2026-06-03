import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!role || (role.role !== "admin" && role.role !== "case_manager")) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { depositId, reason } = await request.json();

  const { data: deposit } = await supabase
    .from("deposits")
    .select("user_id, amount, currency, goal_id")
    .eq("id", depositId)
    .single();

  if (!deposit) return NextResponse.json({ error: "Deposit not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (supabase as any)
    .from("deposits")
    .update({
      status: "rejected",
      admin_confirmed_at: new Date().toISOString(),
      confirmed_by: user.id,
      notes: reason || "Payment not received",
    })
    .eq("id", depositId);

  await supabase.from("notifications").insert({
    user_id: deposit.user_id,
    type: "deposit_rejected",
    title: "Deposit could not be confirmed",
    body: `Your ${deposit.currency} ${deposit.amount.toLocaleString()} deposit could not be matched. Reason: ${reason || "Payment not received"}. Please contact support if you believe this is an error.`,
    action_url: "/dashboard/goals",
    target_segment: null,
  });

  return NextResponse.json({ success: true });
}
