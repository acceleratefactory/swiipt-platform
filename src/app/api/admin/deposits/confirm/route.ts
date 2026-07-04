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

  const { depositId, notes } = await request.json();

  if (!depositId) {
    return NextResponse.json({ error: "depositId required" }, { status: 400 });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: depositInfo } = await (supabase as any)
    .from("deposits")
    .select("id, user_id, goal_id")
    .eq("id", depositId)
    .single();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { error } = await (supabase as any).rpc("confirm_deposit", {
    deposit_id: depositId,
    admin_id: user.id,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire milestone achievement cards if goal milestones were unlocked
  if (depositInfo?.goal_id) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any)
      .from("savings_goals")
      .select("goal_name, milestone_25_unlocked, milestone_50_unlocked, milestone_75_unlocked, milestone_100_unlocked, current_balance, target_amount")
      .eq("id", depositInfo.goal_id)
      .single()
      .then(({ data: goal }: any) => {
        if (!goal) return;
        const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        const goalName = goal.goal_name || "your goal";
        const cards: Array<{ cardType: string; goalName: string }> = [];

        if (goal.milestone_25_unlocked) cards.push({ cardType: "milestone_25", goalName });
        if (goal.milestone_50_unlocked) cards.push({ cardType: "milestone_50", goalName });
        if (goal.milestone_75_unlocked) cards.push({ cardType: "milestone_75", goalName });
        if (goal.milestone_100_unlocked) cards.push({ cardType: "goal_funded", goalName });

        cards.forEach((c) => {
          fetch(`${url}/api/achievements/generate-card`, {
            method: "POST",
            headers: { "Content-Type": "application/json", "x-internal-secret": process.env.INTERNAL_API_SECRET || "" },
            body: JSON.stringify({
              userId: depositInfo.user_id,
              cardType: c.cardType,
              data: { goalName: c.goalName, subtitle: "Swiipt — Plan, fund, and execute your global move" },
            }),
          }).catch(() => {});
        });
      });
  }

  // Fire-and-forget financial profile recalculation
  supabase
    .from("deposits")
    .select("user_id")
    .eq("id", depositId)
    .single()
    .then(({ data: deposit }) => {
      if (deposit) {
        const url = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
        fetch(`${url}/api/financial-profile/recalculate`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: deposit.user_id }),
        }).catch(() => {});
      }
    });

  if (notes) {
    await supabase
      .from("deposits")
      .update({ notes })
      .eq("id", depositId);
  }

  return NextResponse.json({ success: true });
}
