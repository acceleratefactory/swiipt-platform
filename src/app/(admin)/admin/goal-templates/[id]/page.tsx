import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import GoalTemplateEditor from "@/components/admin/goal-templates/GoalTemplateEditor";

export default async function EditGoalTemplatePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: template } = await (supabase as any)
    .from("goal_templates")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!template) notFound();

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Edit Goal Template
      </h1>
      <GoalTemplateEditor template={template} />
    </div>
  );
}
