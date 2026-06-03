import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function DashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("full_name, referral_code, mobility_score")
    .eq("id", user.id)
    .single();

  const { data: goals } = await supabase
    .from("savings_goals")
    .select("*")
    .eq("user_id", user.id)
    .eq("status", "active");

  return (
    <div style={{ minHeight: "100vh", background: "var(--off-white)", fontFamily: "Plus Jakarta Sans, sans-serif" }}>
      <div style={{ background: "var(--midnight)", padding: "1rem 2rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontWeight: 800, fontSize: "1.25rem", color: "white" }}>Swiipt</span>
        <span style={{ color: "var(--gray-300)", fontSize: "0.875rem" }}>Welcome, {profile?.full_name?.split(" ")[0]} 👋</span>
      </div>

      <div style={{ maxWidth: "1280px", margin: "0 auto", padding: "2rem" }}>
        <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "2rem", marginBottom: "1rem" }}>
          <h2 style={{ fontFamily: "Cabinet Grotesk, sans-serif", color: "var(--midnight)", marginBottom: "0.5rem" }}>
            Dashboard — Sprint 4
          </h2>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
            Full dashboard UI builds in Sprint 4. Auth and onboarding are complete.
          </p>
          <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginTop: "0.5rem" }}>
            Mobility score: {profile?.mobility_score} · Goals active: {goals?.length || 0}
          </p>
        </div>
      </div>
    </div>
  );
}
