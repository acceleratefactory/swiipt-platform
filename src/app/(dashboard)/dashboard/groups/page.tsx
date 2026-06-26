import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";

const statusColors: Record<string, string> = {
  open: "#0D9488",
  filled: "#2563EB",
  expired: "#6B7280",
  completed: "#059669",
  cancelled: "#EF4444",
};

const statusLabels: Record<string, string> = {
  open: "Active",
  filled: "Ready to pay",
  expired: "Expired",
  completed: "Completed",
  cancelled: "Cancelled",
};

const statusOrder: Record<string, number> = {
  open: 0,
  filled: 1,
  expired: 2,
  completed: 3,
  cancelled: 4,
};

export default async function GroupsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const serviceClient = createServiceClient();

  const { data: memberships } = await (serviceClient as any)
    .from("group_buy_members")
    .select("*, group_buys(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  const groups = (memberships || []).map((m: any) => ({
    membership: m,
    group: m.group_buys,
  }));

  groups.sort((a: any, b: any) => {
    const aOrder = statusOrder[a.group.status] ?? 99;
    const bOrder = statusOrder[b.group.status] ?? 99;
    return aOrder - bOrder;
  });

  return (
    <div>
      <style>{`.group-card:hover { box-shadow: var(--shadow-md) !important; }`}</style>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem" }}>
        My Groups
      </h1>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem", marginBottom: "1.5rem" }}>
        Groups you have created or joined for group-buy discounts.
      </p>

      {groups.length === 0 && (
        <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>You have not joined any groups yet.</p>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Browse holidays or services and look for the &quot;Create group&quot; option to save up to 30%.</p>
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {groups.map(({ membership, group }: any) => {
          const progressPct = Math.round((group.current_size / group.target_size) * 100);
          const spotsLeft = group.target_size - group.current_size;

          return (
            <a
              key={group.id}
              href={`/dashboard/groups/${group.id}`}
              style={{ textDecoration: "none", display: "block" }}
            >
              <div className="group-card" style={{
                background: "white",
                borderRadius: "var(--radius-lg)",
                border: "1px solid var(--border)",
                padding: "1.25rem",
                transition: "box-shadow 0.15s",
                cursor: "pointer",
              }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "0.75rem" }}>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
                      {group.title}
                    </h3>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      {group.item_type === "holiday_package" ? "🏖️ Holiday" : "🔧 Service"} · {membership.role === "creator" ? "Organizer" : "Member"}
                    </p>
                  </div>
                  <span style={{
                    padding: "3px 10px",
                    borderRadius: "20px",
                    fontSize: "0.7rem",
                    fontWeight: 700,
                    background: `${statusColors[group.status]}15`,
                    color: statusColors[group.status],
                    whiteSpace: "nowrap",
                  }}>
                    {statusLabels[group.status] || group.status}
                  </span>
                </div>

                <div style={{ marginBottom: "0.5rem" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
                    <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Members</span>
                    <span style={{ fontSize: "0.8125rem", fontWeight: 700, color: "var(--midnight)" }}>{group.current_size} / {group.target_size}</span>
                  </div>
                  <div style={{ height: 6, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden" }}>
                    <div style={{ height: "100%", background: "var(--teal)", borderRadius: 4, width: `${progressPct}%` }} />
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                    {group.status === "open" && `${spotsLeft} spot${spotsLeft !== 1 ? "s" : ""} remaining`}
                    {group.status === "filled" && "⏳ Awaiting payment"}
                    {group.status === "expired" && "⌛ Group expired"}
                    {group.status === "completed" && "✅ All paid"}
                  </span>
                  {group.status === "open" && (
                    <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Expires {new Date(group.expires_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            </a>
          );
        })}
      </div>
    </div>
  );
}
