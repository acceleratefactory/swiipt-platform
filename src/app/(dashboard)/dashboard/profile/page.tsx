import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GlobalProfile from "@/components/dashboard/profile/GlobalProfile";

export const dynamic = "force-dynamic";

export default async function ProfilePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [profileRes, financialRes, goalsRes, ordersRes, vaultRes, certsRes] = await Promise.all([
    supabase.from("users").select("*").eq("id", user.id).single(),
    supabase.from("financial_profiles").select("*").eq("user_id", user.id).maybeSingle(),
    supabase.from("savings_goals").select("id, goal_name, current_balance, target_amount, destination, status").eq("user_id", user.id).eq("status", "active").order("created_at", { ascending: false }),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("service_orders").select("*, service_packages(id, name, category, destination)").eq("user_id", user.id).order("created_at", { ascending: false }).limit(5),
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("activity_log").select("event_data, created_at").eq("user_id", user.id).eq("event_type", "vault_document_uploaded").order("created_at", { ascending: false }).limit(10),
    supabase.from("platform_certificates").select("certificate_type, certificate_number, issued_at, expires_at, is_valid").eq("user_id", user.id).order("issued_at", { ascending: false }),
  ]);

  if (!profileRes.data) redirect("/onboarding");
  const profile = profileRes.data as unknown as {
    id: string; email: string; full_name: string; phone: string | null;
    country_of_residence: string | null; preferred_currency: string;
    created_at: string; mobility_score: number; alumni_status: boolean;
    readiness_score: number; readiness_destination: string | null;
    global_profile_complete: boolean; trust_score: number;
    income_estimate_usd_monthly: number | null;
    skills: string[] | null; languages: string[] | null; linkedin_url: string | null;
  };

  let financialProfile = financialRes.data as unknown as {
    id: string; total_deposited_ngn: number; total_goals_created: number;
    total_goals_completed: number; average_monthly_deposit_ngn: number;
    deposit_consistency_score: number; longest_streak_weeks: number;
    primary_destination: string | null; secondary_destination: string | null;
    estimated_move_timeline: string | null; relocation_intent_score: number;
    has_uk_company: boolean; has_us_llc: boolean; has_uae_company: boolean;
    is_sme_owner: boolean; identity_verified: boolean;
    documents_verified_count: number; services_completed: number;
    platform_tenure_days: number; trust_score: number;
    last_calculated: string;
  } | null;

  const needsRecalculation = !financialProfile?.last_calculated ||
    new Date(financialProfile.last_calculated) < new Date(Date.now() - 24 * 60 * 60 * 1000);

  if (needsRecalculation) {
    try {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
      await fetch(`${appUrl}/api/financial-profile/recalculate`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id }),
      });
      const { data: refreshed } = await supabase
        .from("financial_profiles")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();
      if (refreshed) financialProfile = refreshed as unknown as typeof financialProfile;
    } catch {
      // Silently fail — stale data is better than no data
    }
  }

  const goals = (goalsRes.data || []) as unknown as Array<{
    id: string; goal_name: string; current_balance: number;
    target_amount: number; destination: string | null; status: string;
  }>;

  const serviceOrders = (ordersRes.data || []) as unknown as Array<{
    id: string; status: string; created_at: string;
    service_packages: { id: string; name: string; category: string; destination: string } | null;
  }>;

  const vaultDocuments = (vaultRes.data || []) as unknown as Array<{
    event_data: Record<string, string>; created_at: string;
  }>;

  const certificates = (certsRes.data || []) as unknown as Array<{
    certificate_type: string; certificate_number: string;
    issued_at: string; expires_at: string; is_valid: boolean;
  }>;

  return (
    <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
      <GlobalProfile
        profile={profile}
        financialProfile={financialProfile}
        goals={goals}
        serviceOrders={serviceOrders}
        vaultDocuments={vaultDocuments}
        certificates={certificates}
      />
    </div>
  );
}
