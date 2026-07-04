import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import DashboardShell from "@/components/dashboard/shell/DashboardShell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("id, full_name, preferred_currency, mobility_score, readiness_score")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/onboarding");

  const { data: wallet } = await supabase
    .from("wallets")
    .select("*")
    .eq("user_id", user.id)
    .single();

  const { count: unreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_read", false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { count: opportunityCount } = await (supabase as any)
    .from("user_opportunity_feed")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .eq("is_dismissed", false);

  return (
    <DashboardShell
      profile={profile}
      wallet={wallet}
      unreadNotificationCount={unreadCount || 0}
      opportunityCount={opportunityCount || 0}
      readinessScore={profile.readiness_score || 0}
    >
      {children}
    </DashboardShell>
  );
}
