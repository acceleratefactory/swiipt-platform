import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { inviteCode } = await request.json();
  if (!inviteCode) {
    return NextResponse.json({ error: "Missing inviteCode" }, { status: 400 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: group } = await (adminSupabase as any)
    .from("trade_show_groups")
    .select("*")
    .eq("invite_code", inviteCode)
    .single();

  if (!group) {
    return NextResponse.json({ error: "Group not found" }, { status: 404 });
  }

  if (group.status !== "forming" && group.status !== "saving") {
    return NextResponse.json({ error: "Group is no longer accepting members" }, { status: 400 });
  }

  if (group.current_member_count >= group.target_group_size) {
    return NextResponse.json({ error: "Group is full" }, { status: 400 });
  }

  const { data: existing } = await (adminSupabase as any)
    .from("trade_show_group_members")
    .select("id")
    .eq("group_id", group.id)
    .eq("user_id", user.id)
    .single();

  if (existing) {
    return NextResponse.json({ error: "Already a member of this group" }, { status: 400 });
  }

  const { data: savingsGoal, error: goalError } = await (adminSupabase as any)
    .from("savings_goals")
    .insert({
      user_id: user.id,
      goal_name: group.title,
      goal_category: "custom",
      target_amount: group.cost_per_person_ngn,
      currency: "NGN",
      is_locked: true,
      maturity_date: group.savings_deadline || null,
      status: "active",
    })
    .select()
    .single();

  if (goalError) {
    return NextResponse.json({ error: goalError.message }, { status: 500 });
  }

  const { error: memberError } = await (adminSupabase as any)
    .from("trade_show_group_members")
    .insert({
      group_id: group.id,
      user_id: user.id,
      role: "member",
      savings_goal_id: savingsGoal.id,
    });

  if (memberError) {
    await (adminSupabase as any).from("savings_goals").delete().eq("id", savingsGoal.id);
    return NextResponse.json({ error: memberError.message }, { status: 500 });
  }

  await (adminSupabase as any)
    .from("trade_show_groups")
    .update({ current_member_count: group.current_member_count + 1 })
    .eq("id", group.id);

  if (group.status === "forming") {
    await (adminSupabase as any)
      .from("trade_show_groups")
      .update({ status: "saving" })
      .eq("id", group.id);
  }

  return NextResponse.json({
    groupId: group.id,
    savingsGoalId: savingsGoal.id,
  });
}
