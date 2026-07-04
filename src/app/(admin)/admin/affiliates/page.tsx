import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AffiliatesList from "@/components/admin/affiliates/AffiliatesList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminAffiliatesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase.from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const { data: rawAffiliates, count: total } = await (adminSupabase as any)
    .from("affiliate_status")
    .select("*, users!inner(id, email, full_name, created_at)", { count: "exact" })
    .order("updated_at", { ascending: false })
    .range(0, 49);

  const userIds = (rawAffiliates || []).map((a: any) => a.user_id);
  const { data: referrals } = userIds.length
    ? await (adminSupabase as any).from("referrals").select("referrer_id, commission_status").in("referrer_id", userIds)
    : { data: [] };

  const referralCountMap = new Map<string, { total: number; converted: number }>();
  for (const r of referrals || []) {
    const entry = referralCountMap.get(r.referrer_id) || { total: 0, converted: 0 };
    entry.total++;
    if (r.commission_status === "paid") entry.converted++;
    referralCountMap.set(r.referrer_id, entry);
  }

  const affiliates = (rawAffiliates || []).map((a: any) => ({
    ...a,
    users: a.users || null,
    referralStats: referralCountMap.get(a.user_id) || { total: 0, converted: 0 },
  }));

  const tiers = ["starter", "bronze", "silver", "gold", "platinum"];
  const tierBreakdown: Record<string, number> = {};
  let totalPendingEarnings = 0;
  let totalWithdrawn = 0;
  for (const a of affiliates) {
    tiers.forEach((t) => { tierBreakdown[t] = (tierBreakdown[t] || 0) + (a.tier === t ? 1 : 0); });
    totalPendingEarnings += Number(a.pending_earnings_ngn) || 0;
    totalWithdrawn += Number(a.withdrawn_earnings_ngn) || 0;
  }

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        Affiliates
      </h1>
      <AffiliatesList
        affiliates={affiliates}
        totalCount={total || 0}
        tierBreakdown={tierBreakdown}
        totalPendingEarnings={totalPendingEarnings}
        totalWithdrawn={totalWithdrawn}
      />
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
