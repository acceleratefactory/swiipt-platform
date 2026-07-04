import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EarningsDashboard from "@/components/dashboard/affiliate/EarningsDashboard";

export default async function EarningsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [statusRes, referralsRes, withdrawalsRes] = await Promise.all([
    supabase.from("affiliate_status").select("*").eq("user_id", user.id).single(),
    supabase.from("referrals").select("*").eq("referrer_id", user.id).order("created_at", { ascending: false }),
    supabase.from("affiliate_withdrawals").select("*").eq("user_id", user.id).order("requested_at", { ascending: false }),
  ]);

  return (
    <div>
      <a href="/dashboard/affiliate" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}>
        ← Back to affiliate hub
      </a>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Earnings
      </h1>
      <EarningsDashboard status={statusRes.data || {}} referrals={referralsRes.data || []} withdrawals={withdrawalsRes.data || []} />
    </div>
  );
}
