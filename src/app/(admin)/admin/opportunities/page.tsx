import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OpportunitiesList from "@/components/admin/opportunities/OpportunitiesList";

export default async function OpportunitiesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const { data: opportunities } = await (supabase as any)
    .from("opportunities")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.25rem' }}>
            Opportunities
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {opportunities?.length || 0} opportunity{opportunities?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <a href="/admin/opportunities/new" style={{ padding: '0.625rem 1.25rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          + Create Opportunity
        </a>
      </div>
      <OpportunitiesList opportunities={opportunities || []} />
    </div>
  );
}
