import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CreateOpportunityForm from "@/components/admin/opportunities/CreateOpportunityForm";
import PasteUrlForm from "@/components/admin/opportunities/PasteUrlForm";

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
      <div style={{ marginBottom: "2rem", padding: "1.25rem", background: "#f8fafc", borderRadius: "var(--radius-md)", border: "1px solid #e2e8f0" }}>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
          Quick-create from URL
        </h2>
        <PasteUrlForm />
      </div>
      <div>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
          Manual entry
        </h2>
        <CreateOpportunityForm />
      </div>
    </div>
  );
}
