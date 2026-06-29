import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import TradeShowsTable from "@/components/admin/trade-shows/TradeShowsTable";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminTradeShowsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await (adminSupabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  const { data: shows } = await (adminSupabase as any)
    .from("trade_shows")
    .select("*")
    .order("event_date_start", { ascending: true });

  const { data: groups } = await (adminSupabase as any)
    .from("trade_show_groups")
    .select("*, trade_shows(name)")
    .order("created_at", { ascending: false });

  const organizerIds = Array.from(new Set((groups || []).map((g: any) => g.organizer_id).filter(Boolean)));
  const { data: organizers } = organizerIds.length
    ? await (adminSupabase as any).from("users").select("id, full_name, email").in("id", organizerIds)
    : { data: [] };
  const organizerMap = new Map((organizers || []).map((u: any) => [u.id, u]));

  const enrichedGroups = await Promise.all((groups || []).map(async (g: any) => {
    const { data: members } = await (adminSupabase as any)
      .from("trade_show_group_members")
      .select("id, status, amount_saved_ngn, savings_goals(target_amount)")
      .eq("group_id", g.id);

    const totalSaved = (members || []).reduce((sum: number, m: any) => sum + (m.amount_saved_ngn || 0), 0);
    const totalTarget = (members || []).reduce((sum: number, m: any) => sum + (m.savings_goals?.target_amount || 0), 0);
    const fundingPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    const fundedCount = (members || []).filter((m: any) => m.status === "funded").length;

    return {
      ...g,
      organizer: organizerMap.get(g.organizer_id) || null,
      memberCount: (members || []).length,
      fundedCount,
      fundingPct,
    };
  }));

  const statusColors: Record<string, string> = {
    forming: "#6B7280",
    saving: "#0D9488",
    funded: "#059669",
    booking: "#2563EB",
    confirmed: "#059669",
    completed: "#059669",
    cancelled: "#EF4444",
  };

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Trade Shows
      </h1>

      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.75rem" }}>
        <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)' }}>
          Trade Show Catalog
        </h2>
        <a
          href="/admin/trade-shows/new"
          style={{
            padding: "0.5rem 1rem",
            background: "var(--teal)",
            color: "var(--midnight)",
            fontWeight: 700,
            fontSize: "0.8125rem",
            borderRadius: "var(--radius-sm)",
            textDecoration: "none",
          }}
        >
          + Add Trade Show
        </a>
      </div>
      <div style={{ marginBottom: "2rem" }}>
        <TradeShowsTable shows={shows || []} />
      </div>

      <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
        Active Groups
      </h2>
      <div style={{ background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.8125rem" }}>
          <thead>
            <tr style={{ background: "var(--off-white)", textAlign: "left" }}>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Title</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Trade Show</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Organizer</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Members</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Funding</th>
              <th style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--text-muted)" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {(enrichedGroups || []).map((g: any) => (
              <tr key={g.id} style={{ borderTop: "1px solid var(--border)" }}>
                <td style={{ padding: "0.75rem 1rem", fontWeight: 600, color: "var(--midnight)" }}>{g.title}</td>
                <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)" }}>
                  {g.trade_shows?.name || "—"}
                </td>
                <td style={{ padding: "0.75rem 1rem", color: "var(--text-secondary)" }}>
                  {g.organizer?.full_name || "Unknown"}<br />
                  <span style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>{g.organizer?.email}</span>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  {g.fundedCount}/{g.memberCount}
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                    <div style={{ width: 60, height: 6, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden" }}>
                      <div style={{
                        height: "100%",
                        background: g.fundingPct >= 100 ? "#059669" : "var(--teal)",
                        borderRadius: 4,
                        width: `${g.fundingPct}%`,
                      }} />
                    </div>
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>{g.fundingPct}%</span>
                  </div>
                </td>
                <td style={{ padding: "0.75rem 1rem" }}>
                  <span style={{
                    padding: "2px 8px",
                    borderRadius: "10px",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    background: `${(statusColors[g.status] || "#6B7280")}15`,
                    color: statusColors[g.status] || "#6B7280",
                  }}>
                    {g.status}
                  </span>
                </td>
              </tr>
            ))}
            {(!groups || groups.length === 0) && (
              <tr>
                <td colSpan={6} style={{ padding: "2rem", textAlign: "center", color: "var(--text-muted)" }}>
                  No trade show groups yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
