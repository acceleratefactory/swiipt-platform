import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateGoalForm from "@/components/dashboard/goals/CreateGoalForm";

export default async function NewGoalPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
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
      <h1
        style={{
          fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif",
          fontSize: "1.5rem",
          fontWeight: 800,
          color: "var(--midnight)",
          marginBottom: "1.5rem",
        }}
      >
        Create a new goal
      </h1>
      <CreateGoalForm submitLabel="Create Goal" />
    </div>
  );
}
