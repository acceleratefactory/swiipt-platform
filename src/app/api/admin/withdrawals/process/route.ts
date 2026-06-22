import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const adminSupabase = createServiceClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!role || role.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { withdrawalId, action } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: withdrawal } = await (supabase as any)
    .from("withdrawals")
    .select("*, savings_goals(goal_name, currency)")
    .eq("id", withdrawalId)
    .single();

  if (!withdrawal) return NextResponse.json({ error: "Not found" }, { status: 404 });

  if (action === "complete") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("withdrawals")
      .update({
        status: "completed",
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq("id", withdrawalId);

    if (withdrawal.goal_id) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error: updateError } = await (adminSupabase as any)
        .from("savings_goals")
        .update({
          current_balance: 0,
          status: withdrawal.is_early_exit ? "withdrawn" : "completed",
        })
        .eq("id", withdrawal.goal_id);
      if (updateError) {
        return NextResponse.json({ error: updateError.message }, { status: 500 });
      }
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any).rpc("recalculate_wallet_locked", {
      user_id_input: withdrawal.user_id,
    });

    await supabase.from("notifications").insert({
      user_id: withdrawal.user_id,
      type: "withdrawal_completed",
      title: "Withdrawal processed ✓",
      body: `Your withdrawal of ${withdrawal.currency} ${withdrawal.net_amount.toLocaleString()} has been sent to your bank account.`,
      action_url: "/dashboard/wallet",
      target_segment: null,
    });

  } else if (action === "reject") {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (supabase as any)
      .from("withdrawals")
      .update({
        status: "rejected",
        processed_at: new Date().toISOString(),
        processed_by: user.id,
      })
      .eq("id", withdrawalId);

    await supabase.from("notifications").insert({
      user_id: withdrawal.user_id,
      type: "withdrawal_rejected",
      title: "Withdrawal could not be processed",
      body: "Your withdrawal request could not be processed. Please contact support.",
      action_url: "/dashboard/wallet",
      target_segment: null,
    });
  }

  return NextResponse.json({ success: true });
}
