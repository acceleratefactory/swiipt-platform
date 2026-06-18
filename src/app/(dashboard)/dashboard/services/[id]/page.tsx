import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ServiceDetailView from "@/components/dashboard/services/ServiceDetailView";

export default async function ServiceDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pkg } = await (supabase as any)
    .from("service_packages")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!pkg) notFound();

  const { data: profile } = await supabase
    .from("users")
    .select("preferred_currency")
    .eq("id", user.id)
    .single();

  const { data: goals } = await supabase
    .from("savings_goals")
    .select("id, goal_name, current_balance, currency, milestone_100_unlocked, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data: wallet } = await supabase
    .from("wallets")
    .select("total_credits_ngn")
    .eq("user_id", user.id)
    .maybeSingle();

  const walletCredits = (wallet as unknown as { total_credits_ngn: number } | null)?.total_credits_ngn || 0;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: existingOrder } = await (supabase as any)
    .from("service_orders")
    .select("id, status, created_at, case_manager_notes")
    .eq("user_id", user.id)
    .eq("package_id", params.id)
    .not("status", "in", '("cancelled")')
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  return (
    <ServiceDetailView
      pkg={pkg}
      preferredCurrency={profile?.preferred_currency || "NGN"}
      activeGoals={goals || []}
      existingOrder={existingOrder}
      userId={user.id}
      walletCredits={walletCredits}
    />
  );
}
