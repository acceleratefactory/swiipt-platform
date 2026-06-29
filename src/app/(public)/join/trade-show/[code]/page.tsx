import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import JoinTradeShowGroup from "@/components/public/JoinTradeShowGroup";

export default async function TradeShowInvitePage({ params }: { params: { code: string } }) {
  const serviceClient = createServiceClient();

  const { data: group } = await (serviceClient as any)
    .from("trade_show_groups")
    .select("*, trade_shows(name, location_city, location_country, base_cost_solo_ngn, base_cost_group_ngn)")
    .eq("invite_code", params.code)
    .single();

  if (!group || !["forming", "saving"].includes(group.status)) notFound();

  const spotsLeft = group.target_group_size - group.current_member_count;
  const ts = group.trade_shows;
  const savingsPct = ts?.base_cost_group_ngn
    ? Math.round((1 - ts.base_cost_group_ngn / ts.base_cost_solo_ngn) * 100)
    : 0;

  return (
    <div style={{ minHeight: "100vh", background: "var(--off-white)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "2.5rem", maxWidth: "480px", width: "100%", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
            You have been invited to a trade show group
          </p>
          <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", lineHeight: 1.2 }}>
            {group.title}
          </h1>
          {ts && (
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              {ts.name} · {ts.location_city}, {ts.location_country}
            </p>
          )}
        </div>

        {ts && (
          <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Solo price</span>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                ₦{ts.base_cost_solo_ngn?.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--midnight)" }}>Group price</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)" }}>
                ₦{group.cost_per_person_ngn?.toLocaleString()}
              </span>
            </div>
            {savingsPct > 0 && (
              <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--teal)", textAlign: "right", marginTop: "0.25rem" }}>
                Save {savingsPct}% with group pricing
              </p>
            )}
          </div>
        )}

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Members joined</span>
            <span style={{ fontWeight: 700, color: "var(--midnight)" }}>{group.current_member_count} / {group.target_group_size}</span>
          </div>
          <div style={{ height: 8, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--teal)", borderRadius: 4, width: `${Math.round((group.current_member_count / group.target_group_size) * 100)}%` }} />
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining
          </p>
        </div>

        <JoinTradeShowGroup inviteCode={params.code} />
      </div>
    </div>
  );
}
