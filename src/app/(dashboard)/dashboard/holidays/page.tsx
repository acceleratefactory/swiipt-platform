import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import HolidayGrid from "@/components/dashboard/holidays/HolidayGrid";

export default async function HolidaysPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const [packagesRes, profileRes, goalsRes] = await Promise.all([
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as any).from("holiday_packages").select("*").eq("is_active", true).order("is_featured", { ascending: false }),
    supabase.from("users").select("preferred_currency").eq("id", user.id).single(),
    supabase.from("savings_goals").select("id, goal_name, current_balance, currency, status").eq("user_id", user.id).eq("status", "active"),
  ]);

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
        Holiday Packages
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        All-inclusive deals. Save in advance or book directly.
      </p>
      <HolidayGrid
        packages={packagesRes.data || []}
        preferredCurrency={profileRes.data?.preferred_currency || "NGN"}
        activeGoals={goalsRes.data || []}
        userId={user.id}
      />
    </div>
  );
}
