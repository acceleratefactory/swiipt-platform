import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
/* eslint-disable @typescript-eslint/no-explicit-any */
import PlatformSettingsForm from "@/components/admin/settings/PlatformSettingsForm";

function groupSettings(settings: any[]) {
  const groups: Record<string, any[]> = {
    "Financial": [],
    "Welcome Reward": [],
    "Referral": [],
    "Mobility Score": [],
    "Streaks": [],
    "Milestones": [],
    "Bank Details": [],
  };

  const groupMap: Record<string, string> = {
    early_exit_penalty_pct: "Financial",
    min_deposit_ngn: "Financial",
    gift_max_pct_per_30days: "Financial",
    gift_min_milestone_pct: "Financial",
    welcome_visa_credit_ngn: "Welcome Reward",
    welcome_visa_lock_months: "Welcome Reward",
    welcome_visa_expiry_months: "Welcome Reward",
    welcome_visa_label: "Welcome Reward",
    hotel_base_fee_usd: "Welcome Reward",
    hotel_extra_night_fee_usd: "Welcome Reward",
    hotel_min_nights: "Welcome Reward",
    referral_commission_rate: "Referral",
    alumni_commission_rate: "Referral",
    leaderboard_min_referrals: "Referral",
    milestone_25_label: "Milestones",
    milestone_50_label: "Milestones",
    milestone_75_label: "Milestones",
    milestone_100_label: "Milestones",
    milestone_100_discount_pct: "Milestones",
    streak_30day_prize_label: "Streaks",
    streak_30day_prize_ngn: "Streaks",
    streak_90day_prize_label: "Streaks",
    streak_90day_prize_ngn: "Streaks",
    bank_name: "Bank Details",
    bank_account_number: "Bank Details",
    bank_account_name: "Bank Details",
    additional_bank_accounts: "Bank Details",
  };

  const scoreKeys = [
    "score_account_created", "score_first_deposit", "score_per_50k_locked",
    "score_milestone_25", "score_milestone_50", "score_milestone_75",
    "score_milestone_100", "score_streak_30day", "score_streak_90day",
    "score_first_referral", "score_per_5_referrals", "score_service_completed",
    "score_document_verified",
  ];
  scoreKeys.forEach(k => { groupMap[k] = "Mobility Score"; });

  settings.forEach(s => {
    const group = groupMap[s.key] || "Financial";
    if (groups[group]) groups[group].push(s);
  });

  return groups;
}

export default async function AdminSettingsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  const { data: settings } = await (supabase as any)
    .from("platform_settings")
    .select("*")
    .order("key");

  const { data: auditLog } = await (supabase as any)
    .from("admin_audit_log")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(10);

  const groupedSettings = groupSettings(settings || []);

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Platform Settings
      </h1>
      <PlatformSettingsForm groupedSettings={groupedSettings} auditLog={auditLog || []} />
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
