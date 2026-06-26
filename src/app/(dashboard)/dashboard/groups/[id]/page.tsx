import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect, notFound } from "next/navigation";
import GroupDetailActions from "@/components/dashboard/groups/GroupDetailActions";

const statusLabels: Record<string, string> = {
  open: "Active — inviting members",
  filled: "Full — payment required",
  expired: "Expired",
  completed: "Completed — all paid",
  cancelled: "Cancelled",
};

export default async function GroupDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("users")
    .select("preferred_currency")
    .eq("id", user.id)
    .single();
  const preferredCurrency = profile?.preferred_currency || "NGN";

  const serviceClient = createServiceClient();

  const { data: group } = await (serviceClient as any)
    .from("group_buys")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!group) notFound();

  const { data: members } = await (serviceClient as any)
    .from("group_buy_members")
    .select("*, users(full_name)")
    .eq("group_buy_id", params.id)
    .order("joined_at", { ascending: true });

  const myMembership = (members || []).find((m: any) => m.user_id === user.id);
  if (!myMembership) notFound();

  const progressPct = Math.round((group.current_size / group.target_size) * 100);
  const spotsLeft = group.target_size - group.current_size;

  const itemLabel = group.item_type === "holiday_package" ? "Holiday package" : "Service";

  const { data: activeGoals } = await (serviceClient as any)
    .from("savings_goals")
    .select("id, goal_name, current_balance, currency, milestone_100_unlocked, status")
    .eq("user_id", user.id)
    .eq("status", "active");

  const { data: wallet } = await (serviceClient as any)
    .from("wallets")
    .select("total_credits_ngn")
    .eq("user_id", user.id)
    .single();
  const walletCredits = wallet?.total_credits_ngn || 0;

  return (
    <div style={{ maxWidth: "640px", margin: "0 auto" }}>
      <a href="/dashboard/groups" style={{ display: "inline-flex", alignItems: "center", gap: "0.375rem", fontSize: "0.8125rem", color: "var(--text-muted)", textDecoration: "none", marginBottom: "1.5rem" }}>
        ← Back to groups
      </a>

      <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", overflow: "hidden" }}>
        <div style={{ padding: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1rem" }}>
            <div>
              <p style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.25rem" }}>
                {itemLabel}
              </p>
              <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", lineHeight: 1.2 }}>
                {group.title}
              </h1>
            </div>
            <span style={{
              padding: "4px 12px",
              borderRadius: "20px",
              fontSize: "0.75rem",
              fontWeight: 700,
              background: group.status === "open" ? "var(--teal-pale)" : group.status === "filled" ? "#DBEAFE" : group.status === "completed" ? "#D1FAE5" : "#F3F4F6",
              color: group.status === "open" ? "var(--teal)" : group.status === "filled" ? "#2563EB" : group.status === "completed" ? "#059669" : "#6B7280",
              whiteSpace: "nowrap",
            }}>
              {statusLabels[group.status] || group.status}
            </span>
          </div>

          <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Solo price</span>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
                ₦{group.original_price_ngn?.toLocaleString()}
              </span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between" }}>
              <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--midnight)" }}>Group price per person</span>
              <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)" }}>
                ₦{group.group_price_ngn?.toLocaleString()}
              </span>
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textAlign: "right", marginTop: "0.25rem" }}>
              Save {group.group_discount_pct}% with this group
            </p>
          </div>

          <div style={{ marginBottom: "1.5rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.375rem" }}>
              <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Members joined</span>
              <span style={{ fontSize: "0.875rem", fontWeight: 700, color: "var(--midnight)" }}>{group.current_size} / {group.target_size}</span>
            </div>
            <div style={{ height: 8, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden", marginBottom: "0.375rem" }}>
              <div style={{ height: "100%", background: "var(--teal)", borderRadius: 4, width: `${progressPct}%`, transition: "width 0.3s" }} />
            </div>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
              {group.status === "open" && `${spotsLeft} more spot${spotsLeft !== 1 ? "s" : ""} needed to unlock the group price`}
              {group.status === "filled" && "Group is full! Complete your payment to lock in the discount."}
            </p>
          </div>

          <GroupDetailActions
            groupId={group.id}
            groupStatus={group.status}
            currentUserId={user.id}
            creatorId={group.creator_id}
            membershipRole={myMembership.role}
            membershipStatus={myMembership.status}
            userConfirmedAt={myMembership.user_confirmed_at || null}
            inviteCode={group.invite_code}
            inviteUrl={`${process.env.NEXT_PUBLIC_APP_URL}/join/${group.invite_code}`}
            groupTitle={group.title}
            expiresAt={group.expires_at}
            groupData={group}
            activeGoals={activeGoals || []}
            walletCredits={walletCredits}
            preferredCurrency={preferredCurrency}
          />

          <div>
            <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.75rem" }}>
              Members ({members?.length || 0})
            </h3>
            <div style={{ display: "grid", gap: "0.5rem" }}>
              {(members || []).map((member: any) => {
                const memberStatusLabels: Record<string, string> = {
                  committed: "Committed",
                  pending_payment: "Paying",
                  paid: "Paid ✓",
                  withdrawn: "Withdrawn",
                };
                const memberStatusColors: Record<string, string> = {
                  committed: "#6B7280",
                  pending_payment: "#B45309",
                  paid: "#059669",
                  withdrawn: "#EF4444",
                };
                const initials = member.users?.full_name?.charAt(0)?.toUpperCase() || "?";

                return (
                  <div key={member.id} style={{ display: "flex", alignItems: "center", gap: "0.75rem", padding: "0.75rem", background: "var(--off-white)", borderRadius: "var(--radius-md)" }}>
                    <div style={{ width: 36, height: 36, borderRadius: "50%", background: member.role === "creator" ? "var(--teal)" : "var(--midnight-muted)", display: "flex", alignItems: "center", justifyContent: "center", color: "white", fontWeight: 700, fontSize: "0.875rem", flexShrink: 0 }}>
                      {initials}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>
                        {member.users?.full_name || "Unknown"}
                        {member.role === "creator" && (
                          <span style={{ fontSize: "0.7rem", color: "var(--teal)", fontWeight: 700, marginLeft: "0.375rem" }}>Organizer</span>
                        )}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        Joined {new Date(member.joined_at).toLocaleDateString()}
                      </p>
                    </div>
                    <span style={{
                      padding: "2px 8px",
                      borderRadius: "20px",
                      fontSize: "0.65rem",
                      fontWeight: 700,
                      background: `${memberStatusColors[member.status] || "#6B7280"}15`,
                      color: memberStatusColors[member.status] || "#6B7280",
                    }}>
                      {memberStatusLabels[member.status] || member.status}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
