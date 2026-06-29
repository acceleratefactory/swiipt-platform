import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { generateTradeShowInviteCode } from "@/lib/group-buy-utils";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { tradeShowId, title, description, targetGroupSize, savingsDeadline } = await request.json();

  if (!tradeShowId || !title || !targetGroupSize) {
    return NextResponse.json({ error: "Missing required fields: tradeShowId, title, targetGroupSize" }, { status: 400 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: tradeShow } = await (adminSupabase as any)
    .from("trade_shows")
    .select("base_cost_group_ngn")
    .eq("id", tradeShowId)
    .single();

  if (!tradeShow) {
    return NextResponse.json({ error: "Trade show not found" }, { status: 404 });
  }

  const costPerPerson = tradeShow.base_cost_group_ngn;
  const inviteCode = generateTradeShowInviteCode();

  const { data: group, error: groupError } = await (adminSupabase as any)
    .from("trade_show_groups")
    .insert({
      organizer_id: user.id,
      trade_show_id: tradeShowId,
      title,
      description: description || null,
      target_group_size: targetGroupSize,
      cost_per_person_ngn: costPerPerson,
      invite_code: inviteCode,
      savings_deadline: savingsDeadline || null,
    })
    .select()
    .single();

  if (groupError) {
    return NextResponse.json({ error: groupError.message }, { status: 500 });
  }

  const { data: savingsGoal, error: goalError } = await (adminSupabase as any)
    .from("savings_goals")
    .insert({
      user_id: user.id,
      goal_name: title,
      goal_category: "custom",
      target_amount: costPerPerson,
      currency: "NGN",
      is_locked: true,
      maturity_date: savingsDeadline || null,
      status: "active",
    })
    .select()
    .single();

  if (goalError) {
    await (adminSupabase as any).from("trade_show_groups").delete().eq("id", group.id);
    return NextResponse.json({ error: goalError.message }, { status: 500 });
  }

  const { error: memberError } = await (adminSupabase as any)
    .from("trade_show_group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: "organizer",
      savings_goal_id: savingsGoal.id,
    });

  if (memberError) {
    await (adminSupabase as any).from("savings_goals").delete().eq("id", savingsGoal.id);
    await (adminSupabase as any).from("trade_show_groups").delete().eq("id", group.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://swiipt.com";

  return NextResponse.json({
    groupId: group.id,
    inviteCode: group.invite_code,
    inviteUrl: `${APP_URL}/join/trade-show/${group.invite_code}`,
    savingsGoalId: savingsGoal.id,
  });
}
