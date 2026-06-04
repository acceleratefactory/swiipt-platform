import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import HolidayDetailView from "@/components/dashboard/holidays/HolidayDetailView";

export default async function HolidayDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pkg } = await (supabase as any)
    .from("holiday_packages")
    .select("*")
    .eq("id", params.id)
    .eq("is_active", true)
    .single();

  if (!pkg) notFound();

  const { data: profile } = await supabase
    .from("users")
    .select("preferred_currency")
    .eq("id", user.id)
    .single();

  const { data: goals } = await supabase
    .from("savings_goals")
    .select("id, goal_name, current_balance, currency, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  return (
    <div>
      <a href="/dashboard/holidays" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
        ← Back to holidays
      </a>
      <HolidayDetailView
        pkg={pkg}
        preferredCurrency={profile?.preferred_currency || "NGN"}
        activeGoals={goals || []}
        userId={user.id}
      />
    </div>
  );
}
