import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GoalTemplateLibrary from "@/components/dashboard/goals/GoalTemplateLibrary";

export default async function NewGoalPage({
  searchParams,
}: {
  searchParams: { template?: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: templates } = await (supabase as any)
    .from("goal_templates")
    .select("*")
    .eq("is_active", true)
    .order("sort_order");

  const selectedTemplate =
    (templates as any[])?.find((t: any) => t.id === searchParams.template) ?? null;

  return (
    <div style={{ maxWidth: "760px", margin: "0 auto" }}>
      <a
        href="/dashboard/goals"
        style={{
          color: "var(--text-muted)",
          fontSize: "0.875rem",
          textDecoration: "none",
          display: "flex",
          alignItems: "center",
          gap: "0.375rem",
          marginBottom: "1.5rem",
        }}
      >
        ← Back to goals
      </a>
      <GoalTemplateLibrary
        templates={templates ?? []}
        preSelected={selectedTemplate}
      />
    </div>
  );
}
