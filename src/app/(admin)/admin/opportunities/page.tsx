import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import OpportunitiesList from "@/components/admin/opportunities/OpportunitiesList";

const PAGE_SIZE = 50;

export default async function OpportunitiesPage({ searchParams }: { searchParams: { page?: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const requestedPage = parseInt(searchParams.page || "1", 10);
  const page = Number.isFinite(requestedPage) && requestedPage > 0 ? requestedPage : 1;
  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  const { data: opportunities, count } = await (supabase as any)
    .from("opportunities")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  const { data: degradedSources } = await (supabase as any)
    .from("opportunity_sources")
    .select("name")
    .eq("is_degraded", true);

  const degradedNames = new Set<string>((degradedSources || []).map((s: any) => s.name));

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 1), totalPages);
  if (page !== safePage) redirect(`/admin/opportunities?page=${safePage}`);

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.25rem' }}>
            Opportunities
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {totalCount} opportunity{totalCount !== 1 ? 's' : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <a href="/admin/opportunities/queue" style={{ padding: '0.625rem 1.25rem', background: 'transparent', color: 'var(--midnight)', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)', textDecoration: 'none' }}>
            Review Queue
          </a>
          <a href="/admin/opportunities/new" style={{ padding: '0.625rem 1.25rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
            + Create Opportunity
          </a>
        </div>
      </div>
      <OpportunitiesList
        opportunities={opportunities || []}
        degradedSources={degradedNames}
        page={safePage}
        totalPages={totalPages}
        totalCount={totalCount}
      />
    </div>
  );
}
