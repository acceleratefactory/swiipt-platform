import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TradeShowGroupDetailPage({ params }: { params: { groupId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: group } = await (adminSupabase as any)
    .from("trade_show_groups")
    .select("*, trade_shows(*)")
    .eq("id", params.groupId)
    .single();

  if (!group) notFound();

  const { data: members } = await (adminSupabase as any)
    .from("trade_show_group_members")
    .select("*, savings_goals(goal_name, target_amount, current_balance)")
    .eq("group_id", params.groupId)
    .order("joined_at", { ascending: true });

  const memberIds = Array.from(new Set((members || []).map((m: any) => m.user_id).filter(Boolean)));

  const { data: memberUsers } = memberIds.length
    ? await (adminSupabase as any).from("users").select("id, full_name, email").in("id", memberIds)
    : { data: [] };

  const userMap = new Map((memberUsers || []).map((u: any) => [u.id, { full_name: u.full_name, email: u.email }]));

  const ts = group.trade_shows;
  const savingsPct = ts?.base_cost_group_ngn
    ? Math.round((1 - ts.base_cost_group_ngn / ts.base_cost_solo_ngn) * 100)
    : 0;

  let totalSaved = 0;
  let totalTarget = 0;
  const enrichedMembers = (members || []).map((m: any) => {
    const goal = m.savings_goals;
    const saved = goal?.current_balance || 0;
    const target = goal?.target_amount || 0;
    totalSaved += saved;
    totalTarget += target;
    return {
      ...m,
      user: userMap.get(m.user_id) || null,
      progressPct: target > 0 ? Math.min(100, Math.round((saved / target) * 100)) : 0,
    };
  });

  const overallPct = totalTarget > 0 ? Math.min(100, Math.round((totalSaved / totalTarget) * 100)) : 0;

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL || "https://swiipt.com";
  const inviteUrl = `${APP_URL}/join/trade-show/${group.invite_code}`;

  const myMembership = enrichedMembers.find((m: any) => m.user_id === user.id);
  const myGoal = myMembership?.savings_goals;

  return (
    <div>
      <a href={`/dashboard/trade-shows/${group.trade_show_id}`} style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>
        ← Back to trade show
      </a>

      <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.25rem" }}>
          {group.title}
        </h1>
        {ts && (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
            {ts.name} · {ts.location_city}, {ts.location_country}
          </p>
        )}

        <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1.25rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Overall group funding</span>
            <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--midnight)" }}>{overallPct}%</span>
          </div>
          <div style={{ height: 8, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden", marginBottom: "0.75rem" }}>
            <div style={{ height: "100%", background: "var(--teal)", borderRadius: 4, width: `${overallPct}%`, transition: "width 0.3s" }} />
          </div>

          <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap" }}>
            <div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Members</p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--midnight)" }}>
                {group.current_member_count} / {group.target_group_size}
              </p>
            </div>
            <div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Cost per person</p>
              <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--teal)" }}>
                ₦{group.cost_per_person_ngn.toLocaleString()}
              </p>
            </div>
            {savingsPct > 0 && (
              <div>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Savings vs solo</p>
                <p style={{ fontSize: "1rem", fontWeight: 700, color: "var(--teal)" }}>{savingsPct}%</p>
              </div>
            )}
            {group.savings_deadline && (
              <div>
                <p style={{ fontSize: "0.7rem", color: "var(--text-muted)" }}>Savings deadline</p>
                <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>
                  {new Date(group.savings_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </p>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginBottom: "1.25rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: "0.375rem" }}>Invite link</p>
          <div style={{ display: "flex", gap: "0.5rem" }}>
            <input
              readOnly
              value={inviteUrl}
              style={{
                flex: 1, padding: "0.5rem 0.75rem",
                border: "1px solid var(--border)", borderRadius: "var(--radius-sm)",
                fontSize: "0.8125rem", color: "var(--text-muted)",
                background: "var(--off-white)",
              }}
            />
            <button
              onClick={() => navigator.clipboard.writeText(inviteUrl)}
              style={{
                padding: "0.5rem 1rem",
                background: "var(--teal)", color: "var(--midnight)",
                fontWeight: 700, fontSize: "0.8125rem",
                border: "none", borderRadius: "var(--radius-sm)",
                cursor: "pointer",
              }}
            >
              Copy
            </button>
          </div>
        </div>

        {myGoal && (
          <div style={{ background: "rgba(0,200,150,0.08)", borderRadius: "var(--radius-lg)", padding: "1rem", marginBottom: "1rem" }}>
            <p style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)", marginBottom: "0.5rem" }}>
              My savings goal
            </p>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                ₦{(myGoal.current_balance || 0).toLocaleString()} / ₦{myGoal.target_amount.toLocaleString()}
              </span>
              <span style={{ fontSize: "0.75rem", fontWeight: 700, color: myMembership?.status === "funded" ? "var(--teal)" : "var(--midnight)" }}>
                {myMembership?.status === "funded" ? "✅ Funded" : `${Math.round(((myGoal.current_balance || 0) / myGoal.target_amount) * 100)}%`}
              </span>
            </div>
            <div style={{ height: 6, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden", marginBottom: "0.75rem" }}>
              <div style={{
                height: "100%",
                background: myMembership?.status === "funded" ? "var(--teal)" : "#0D9488",
                borderRadius: 4,
                width: `${Math.min(100, Math.round(((myGoal.current_balance || 0) / myGoal.target_amount) * 100))}%`,
              }} />
            </div>
            {myMembership?.status !== "funded" && (
              <a
                href={`/dashboard/goals/${myGoal.id}`}
                style={{
                  display: "inline-block",
                  padding: "0.5rem 1rem",
                  background: "var(--teal)",
                  color: "var(--midnight)",
                  fontWeight: 700,
                  fontSize: "0.8125rem",
                  borderRadius: "var(--radius-sm)",
                  textDecoration: "none",
                }}
              >
                Start saving my share →
              </a>
            )}
          </div>
        )}

        {!myMembership && (
          <div style={{ textAlign: "center", padding: "1rem", background: "var(--off-white)", borderRadius: "var(--radius-lg)" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.75rem" }}>
              Join this group to start saving toward your share.
            </p>
            <button
              onClick={async () => {
                const res = await fetch("/api/trade-shows/join-group", {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({ inviteCode: group.invite_code }),
                });
                if (res.ok) {
                  const data = await res.json();
                  window.location.href = `/dashboard/trade-shows/groups/${data.groupId}`;
                }
              }}
              style={{
                padding: "0.625rem 1.5rem",
                background: "var(--teal)",
                color: "var(--midnight)",
                fontWeight: 700,
                fontSize: "0.875rem",
                border: "none",
                borderRadius: "var(--radius-sm)",
                cursor: "pointer",
              }}
            >
              Join this group
            </button>
          </div>
        )}
      </div>

      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.75rem" }}>
        Members ({enrichedMembers.length})
      </h2>
      <div style={{ display: "grid", gap: "0.75rem" }}>
        {enrichedMembers.map((m: any) => (
          <div key={m.id} style={{
            background: "white",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--border)",
            padding: "1rem",
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "0.5rem" }}>
              <div>
                <span style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>
                  {m.user?.full_name || "Unknown"}
                </span>
                {m.role === "organizer" && (
                  <span style={{
                    marginLeft: "0.5rem",
                    padding: "1px 6px",
                    borderRadius: "10px",
                    fontSize: "0.65rem",
                    fontWeight: 700,
                    background: "rgba(13,148,136,0.12)",
                    color: "#0D9488",
                  }}>
                    Organizer
                  </span>
                )}
              </div>
              <span style={{
                padding: "2px 8px",
                borderRadius: "10px",
                fontSize: "0.65rem",
                fontWeight: 700,
                background: m.status === "funded" ? "rgba(5,150,105,0.12)" : "rgba(107,114,128,0.12)",
                color: m.status === "funded" ? "#059669" : "#6B7280",
              }}>
                {m.status === "funded" ? "Funded" : "Saving"}
              </span>
            </div>
            <div style={{ height: 4, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden" }}>
              <div style={{
                height: "100%",
                background: m.status === "funded" ? "#059669" : "var(--teal)",
                borderRadius: 4,
                width: `${m.progressPct}%`,
                transition: "width 0.3s",
              }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
