import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const adminSupabase = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { leaderboardEntryId, periodKey } = await request.json();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: entry } = await (adminSupabase as any)
    .from("leaderboard_entries")
    .select("*, users(full_name, email)")
    .eq("id", leaderboardEntryId)
    .single();

  if (!entry) return NextResponse.json({ error: "Leaderboard entry not found" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: prize } = await (adminSupabase as any)
    .from("leaderboard_prizes")
    .select("*")
    .eq("rank_position", entry.rank)
    .eq("period_type", periodKey === "all" ? "all_time" : "monthly")
    .eq("is_active", true)
    .single();

  if (!prize) return NextResponse.json({ error: "No prize configured for this rank" }, { status: 404 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase as any).from("leaderboard_entries").update({ prize_awarded: true }).eq("id", leaderboardEntryId);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase as any).from("milestone_rewards").insert({
    goal_id: null,
    user_id: entry.user_id,
    milestone_type: "leaderboard_winner",
    reward_type: "free_service",
    reward_label: prize.prize_label,
    reward_value_description: prize.prize_description || "Leaderboard prize — redeem or convert to credit.",
    expires_at: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString(),
  });

  await supabase.from("notifications").insert({
    user_id: entry.user_id,
    type: "leaderboard_prize_awarded",
    title: `🏆 You won ${prize.prize_label}!`,
    body: "Congratulations! Check your rewards tab to redeem or convert your prize.",
    action_url: "/dashboard/rewards",
    target_segment: null,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (adminSupabase as any).from("admin_audit_log").insert({
    admin_id: user.id,
    action_type: "leaderboard_prize_awarded",
    target_user_id: entry.user_id,
    target_record_id: leaderboardEntryId,
    target_table: "leaderboard_entries",
    previous_value: null,
    new_value: JSON.stringify({ prize_label: prize.prize_label }),
    note: `Awarded ${prize.prize_label} to ${entry.users?.full_name || entry.user_id} for rank #${entry.rank}`,
  });

  return NextResponse.json({ success: true, prizeLabel: prize.prize_label, userName: entry.users?.full_name });
}
