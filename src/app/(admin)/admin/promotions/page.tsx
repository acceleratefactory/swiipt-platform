import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import PromotionsList from "@/components/admin/promotions/PromotionsList";

export default async function PromotionsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: promotions } = await (supabase as any)
    .from("promotions")
    .select("*, promotion_awards(count)")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.25rem' }}>
            Promotions
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {promotions?.length || 0} promotion{promotions?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <a href="/admin/promotions/new" style={{ padding: '0.625rem 1.25rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          + Create New Promotion
        </a>
      </div>

      <PromotionsList promotions={promotions || []} />
    </div>
  );
}
