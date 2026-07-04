import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AffiliateDetail from "@/components/admin/affiliates/AffiliateDetail";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminAffiliateDetailPage({ params }: { params: { userId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase.from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const userId = params.userId;

  const [affiliateStatusRes, referralsRes, moduleProgressRes, earningsTimelineRes, withdrawalsRes] = await Promise.all([
    (adminSupabase as any).from("affiliate_status").select("*").eq("user_id", userId).single(),
    (adminSupabase as any).from("referrals").select("*, referred:referred_id(full_name, email, created_at), service_orders!inner(id, total_amount, status, created_at, package_id, service_packages(name))").eq("referrer_id", userId).order("created_at", { ascending: false }),
    (adminSupabase as any).from("affiliate_module_progress").select("*, affiliate_modules!inner(id, title, content_type, order_in_course, points_on_completion)").eq("user_id", userId).order("module_id", { ascending: true }),
    (adminSupabase as any).from("activity_log").select("*").eq("user_id", userId).in("event_type", ["affiliate_commission", "affiliate_manual_adjustment", "affiliate_withdrawal_approved", "affiliate_withdrawal_rejected"]).order("created_at", { ascending: false }).limit(50),
    (adminSupabase as any).from("affiliate_withdrawals").select("*").eq("user_id", userId).order("requested_at", { ascending: false }),
  ]);

  // Fetch user profile separately for identity info
  const { data: profile } = await (adminSupabase as any).from("users").select("id, email, full_name, phone, created_at, country_of_residence, mobility_score, readiness_score, referral_code, referred_by").eq("id", userId).single();

  // Fetch sub-affiliates if tier is gold/platinum
  let subAffiliates: any[] = [];
  if (affiliateStatusRes.data && ["gold", "platinum"].includes(affiliateStatusRes.data.tier)) {
    const { data: subs } = await (adminSupabase as any)
      .from("users")
      .select("id, full_name, email, created_at, referral_code")
      .eq("referred_by", profile?.referral_code || "");

    if (subs && subs.length > 0) {
      const subIds = subs.map((s: any) => s.id);
      const { data: subStatuses } = await (adminSupabase as any)
        .from("affiliate_status")
        .select("*")
        .in("user_id", subIds);

      const { data: subReferrals } = await (adminSupabase as any)
        .from("referrals")
        .select("referrer_id, commission_status")
        .in("referrer_id", subIds);

      const subReferralMap = new Map<string, { total: number; converted: number }>();
      for (const r of subReferrals || []) {
        const entry = subReferralMap.get(r.referrer_id) || { total: 0, converted: 0 };
        entry.total++;
        if (r.commission_status === "paid") entry.converted++;
        subReferralMap.set(r.referrer_id, entry);
      }

      const statusMap = new Map((subStatuses || []).map((s: any) => [s.user_id, s]));

      subAffiliates = subs.map((s: any) => ({
        ...s,
        affiliate_status: statusMap.get(s.id) || null,
        referralStats: subReferralMap.get(s.id) || { total: 0, converted: 0 },
      }));
    }
  }

  // Fetch all modules for university tab (to show ones not started)
  const { data: allModules } = await (adminSupabase as any)
    .from("affiliate_modules")
    .select("id, title, content_type, order_in_course, points_on_completion")
    .order("order_in_course", { ascending: true });

  return (
    <AffiliateDetail
      profile={profile || null}
      affiliateStatus={affiliateStatusRes.data || null}
      referrals={referralsRes.data || []}
      moduleProgress={moduleProgressRes.data || []}
      allModules={allModules || []}
      earningsTimeline={earningsTimelineRes.data || []}
      withdrawals={withdrawalsRes.data || []}
      subAffiliates={subAffiliates}
    />
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
