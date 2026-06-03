import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GoalsList from "@/components/dashboard/goals/GoalsList";

export default async function GoalsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: goals } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return <GoalsList initialGoals={goals || []} userId={user.id} />;
}
