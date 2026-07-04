import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AffiliateHub from "@/components/dashboard/affiliate/AffiliateHub";

export default async function AffiliatePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: status } = await supabase
    .from("affiliate_status")
    .select("*")
    .eq("user_id", user.id)
    .single();

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
        Earn with Swiipt
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Refer friends and earn up to 12% commission on every service order.
      </p>
      <AffiliateHub status={status || {}} />
    </div>
  );
}
