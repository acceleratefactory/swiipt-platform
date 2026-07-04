import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AffiliateTools from "@/components/dashboard/affiliate/AffiliateTools";

export default async function ToolsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: status } = await supabase
    .from("affiliate_status")
    .select("custom_affiliate_code")
    .eq("user_id", user.id)
    .single();

  return (
    <div>
      <a href="/dashboard/affiliate" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}>
        ← Back to affiliate hub
      </a>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Affiliate Tools
      </h1>
      <AffiliateTools status={status || {}} />
    </div>
  );
}
