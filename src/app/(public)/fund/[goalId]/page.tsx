import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import DiasporaGiftForm from "./DiasporaGiftForm";

export const dynamic = "force-dynamic";

export default async function FundGoalPage({ params, searchParams }: { params: { goalId: string }; searchParams: { success?: string } }) {
  const serviceClient = createServiceClient();

  const { data: goal } = await (serviceClient as any)
    .from("savings_goals")
    .select("id, goal_name, target_amount, current_balance, user_id, status")
    .eq("id", params.goalId)
    .single();

  if (!goal || (goal.status !== "active" && goal.status !== "completed")) notFound();

  const { data: user } = await (serviceClient as any)
    .from("users")
    .select("full_name")
    .eq("id", goal.user_id)
    .single();

  if (!user) notFound();

  const progressPct = goal.target_amount > 0 ? Math.round((goal.current_balance / goal.target_amount) * 100) : 0;
  const firstName = (user.full_name || "Someone").split(" ")[0];
  const success = searchParams?.success === "true";

  return (
    <div style={{ minHeight: "100vh", background: "var(--off-white)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" }}>
      <div style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "2rem", maxWidth: "460px", width: "100%", boxShadow: "var(--shadow-lg)" }}>
        {success ? (
          <div style={{ textAlign: "center", padding: "1.5rem 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>🎉</div>
            <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem" }}>
              Gift sent successfully!
            </h1>
            <p style={{ fontSize: "0.875rem", color: "#6B7280", margin: "0 0 1.5rem 0" }}>
              {firstName} will receive your contribution shortly.
            </p>
            <a href={`/fund/${params.goalId}`} style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "underline" }}>
              Send another gift
            </a>
          </div>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "1.5rem" }}>
              <p style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.375rem" }}>
                🎁 Gift a goal
              </p>
              <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.25rem", fontWeight: 800, color: "var(--midnight)", margin: 0 }}>
                Support {firstName}&apos;s goal
              </h1>
            </div>

            <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1rem", marginBottom: "1.5rem" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.8125rem", marginBottom: "0.5rem" }}>
                <span style={{ color: "var(--midnight)", fontWeight: 600 }}>{goal.goal_name}</span>
                <span style={{ color: "#6B7280" }}>₦{goal.current_balance.toLocaleString()} / ₦{goal.target_amount.toLocaleString()}</span>
              </div>
              <div style={{ height: "8px", background: "#E5E7EB", borderRadius: "4px", overflow: "hidden" }}>
                <div style={{ height: "100%", width: `${Math.min(progressPct, 100)}%`, background: "var(--teal)", borderRadius: "4px", transition: "width 0.3s" }} />
              </div>
            </div>

            <DiasporaGiftForm goalId={params.goalId} goalUserId={goal.user_id} />
          </>
        )}
      </div>
    </div>
  );
}
