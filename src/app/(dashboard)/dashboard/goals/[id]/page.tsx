import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import GoalDetailView from "@/components/dashboard/goals/GoalDetailView";

export default async function GoalDetailPage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goal } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("id", params.id)
    .eq("user_id", user.id)
    .single();

  if (!goal) notFound();

  const { data: deposits } = await supabase
    .from("deposits")
    .select("*")
    .eq("goal_id", params.id)
    .order("created_at", { ascending: false });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: milestoneRewards } = await (supabase as any)
    .from("milestone_rewards")
    .select("*")
    .eq("goal_id", params.id)
    .order("created_at", { ascending: true });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: gifts } = await (supabase as any)
    .from("goal_gifts")
    .select("*, giver:giver_id(full_name), recipient:recipient_id(full_name)")
    .or(`giver_id.eq.${user.id},recipient_id.eq.${user.id}`)
    .eq("giver_goal_id", params.id)
    .order("created_at", { ascending: false });

  const { data: profile } = await supabase
    .from("users")
    .select("preferred_currency, mobility_score")
    .eq("id", user.id)
    .single();

  return (
    <GoalDetailView
      goal={goal}
      deposits={deposits || []}
      milestoneRewards={milestoneRewards || []}
      gifts={gifts || []}
      userId={user.id}
      preferredCurrency={profile?.preferred_currency || "NGN"}
    />
  );
}
