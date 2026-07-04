import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateOpportunityForm from "@/components/admin/opportunities/CreateOpportunityForm";

export default async function NewOpportunityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  return (
    <div>
      <a href="/admin/opportunities" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
        ← Back to Opportunities
      </a>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Create Opportunity
      </h1>
      <CreateOpportunityForm />
    </div>
  );
}
