import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AdminLeaderboardView from "./AdminLeaderboardView";

export default async function AdminLeaderboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const periodKey = await (supabase as any).rpc("get_current_period_key");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [entriesRes, prizesRes] = await Promise.all([
    (supabase as any).from("leaderboard_entries").select("*, users(full_name, email)").eq("period_key", periodKey.data).order("rank").limit(20),
    (supabase as any).from("leaderboard_prizes").select("*").eq("is_active", true).eq("period_type", "monthly").order("rank_position"),
  ]);

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Leaderboard Management
      </h1>
      <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Period: {periodKey.data} · {entriesRes.data?.length || 0} entries
      </p>
      <AdminLeaderboardView entries={entriesRes.data || []} prizes={prizesRes.data || []} periodKey={periodKey.data} />
    </div>
  );
}
