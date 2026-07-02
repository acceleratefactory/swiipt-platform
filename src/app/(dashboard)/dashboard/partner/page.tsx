import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AgentDashboard from "@/components/dashboard/partner/AgentDashboard";

export const dynamic = "force-dynamic";

export default async function PartnerDashboardPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  if (!user.email) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)" }}>
          Partner Dashboard
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "1rem" }}>
          No email address found on your account. Please update your profile first.
        </p>
      </div>
    );
  }

  const { data: partner } = await supabase
    .from("platform_partners")
    .select("*")
    .eq("email", user.email)
    .single();

  if (!partner) {
    return (
      <div style={{ padding: "3rem", textAlign: "center" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)" }}>
          Partner Dashboard
        </h1>
        <p style={{ fontSize: "0.875rem", color: "#6B7280", marginTop: "1rem" }}>
          You are not registered as a partner. <a href="/partners/apply" style={{ color: "var(--teal)", fontWeight: 600 }}>Apply here</a>.
        </p>
      </div>
    );
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: deals } = await (supabase as any)
    .from("escrow_deals")
    .select("*")
    .eq("partner_id", partner.id)
    .order("created_at", { ascending: false });

  const stats = {
    totalVolume: (deals || []).reduce((sum: number, d: { total_amount_ngn: number }) => sum + d.total_amount_ngn, 0),
    activeDeals: (deals || []).filter((d: { status: string }) => d.status === "active").length,
    completedDeals: (deals || []).filter((d: { status: string }) => d.status === "completed").length,
  };

  return (
    <AgentDashboard
      partner={partner as unknown as Record<string, unknown>}
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      deals={deals as any[]}
      stats={stats}
    />
  );
}
