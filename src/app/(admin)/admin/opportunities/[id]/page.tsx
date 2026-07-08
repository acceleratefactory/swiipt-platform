import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import EditOpportunityForm from "@/components/admin/opportunities/EditOpportunityForm";
import ProvenanceViewer from "@/components/admin/opportunities/ProvenanceViewer";

export default async function EditOpportunityPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const { data: opportunity } = await (supabase as any)
    .from("opportunities")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!opportunity) notFound();

  return (
    <div>
      <a href="/admin/opportunities" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
        ← Back to Opportunities
      </a>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Edit Opportunity
      </h1>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: '1.5rem', alignItems: 'start' }}>
        <EditOpportunityForm opportunity={opportunity} />
        <ProvenanceViewer
          provenance={opportunity.provenance}
          sourceName={opportunity.source_name}
          sourceUrl={opportunity.source_url}
        />
      </div>
    </div>
  );
}
