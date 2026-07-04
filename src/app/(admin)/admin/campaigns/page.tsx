import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CampaignsList from "@/components/admin/campaigns/CampaignsList";

export default async function CampaignsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: campaigns } = await (supabase as any)
    .from("viral_campaigns")
    .select("*")
    .order("created_at", { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.25rem' }}>
            Campaigns
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {campaigns?.length || 0} campaign{campaigns?.length !== 1 ? 's' : ''}
          </p>
        </div>
        <a href="/admin/campaigns/new" style={{ padding: '0.625rem 1.25rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          + Create New Campaign
        </a>
      </div>

      <CampaignsList campaigns={campaigns || []} />
    </div>
  );
}
