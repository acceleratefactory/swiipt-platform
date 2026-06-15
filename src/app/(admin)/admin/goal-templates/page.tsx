import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GoalTemplatesList from "@/components/admin/goal-templates/GoalTemplatesList";

export default async function AdminGoalTemplatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: templates } = await (supabase as any)
    .from("goal_templates")
    .select("*")
    .order("sort_order");

  return (
    <div>
      <GoalTemplatesList templates={templates || []} />
    </div>
  );
}
