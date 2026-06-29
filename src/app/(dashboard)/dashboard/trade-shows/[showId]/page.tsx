import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import CreateTradeShowGroupModal from "@/components/dashboard/trade-shows/CreateTradeShowGroupModal";
import QuickJoinGroupButton from "@/components/dashboard/trade-shows/QuickJoinGroupButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TradeShowDetailPage({ params }: { params: { showId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: show } = await (adminSupabase as any)
    .from("trade_shows")
    .select("*")
    .eq("id", params.showId)
    .single();

  if (!show) notFound();

  const { data: groups } = await (adminSupabase as any)
    .from("trade_show_groups")
    .select("*")
    .eq("trade_show_id", params.showId)
    .in("status", ["forming", "saving"])
    .order("created_at", { ascending: true });

  const organizerIds = Array.from(new Set((groups || []).map((g: any) => g.organizer_id).filter(Boolean)));
  const { data: organizers } = organizerIds.length
    ? await (adminSupabase as any).from("users").select("id, full_name").in("id", organizerIds)
    : { data: [] };
  const organizerMap = new Map((organizers || []).map((u: any) => [u.id, u.full_name]));

  const groupIds = (groups || []).map((g: any) => g.id);
  let isMemberOfShow = false;
  if (groupIds.length > 0) {
    const { data: userGroups } = await (adminSupabase as any)
      .from("trade_show_group_members")
      .select("id")
      .eq("user_id", user.id)
      .in("group_id", groupIds);
    isMemberOfShow = (userGroups || []).length > 0;
  }

  const { data: settings } = await (adminSupabase as any)
    .from("platform_settings")
    .select("value")
    .eq("key", "trade_show_discounts")
    .single();

  const discountTiers: Record<string, number> = settings?.value ? JSON.parse(settings.value) : {};
  const tierKeys = Object.keys(discountTiers).map(Number).sort((a, b) => a - b);
  const maxTierDiscount = tierKeys.length > 0 ? discountTiers[tierKeys[tierKeys.length - 1].toString()] : 0;
  const showTierInfo = tierKeys.length > 0 && show.base_cost_solo_ngn > 0;

  const firstGroup = (groups || [])[0];

  const savingsPct = show.base_cost_group_ngn
    ? Math.round((1 - show.base_cost_group_ngn / show.base_cost_solo_ngn) * 100)
    : 0;

  return (
    <div>
      <a href="/dashboard/trade-shows" style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textDecoration: "none", display: "inline-block", marginBottom: "1rem" }}>
        ← Back to Trade Shows
      </a>

      <div style={{ background: "white", borderRadius: "var(--radius-xl)", border: "1px solid var(--border)", padding: "1.5rem", marginBottom: "1.5rem" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem" }}>
          {show.name}
        </h1>
        <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
          {show.location_city}, {show.location_country}{show.venue ? ` · ${show.venue}` : ""}
        </p>

        <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", marginBottom: "1rem" }}>
          <div>
            <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.125rem" }}>Dates</p>
            <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>
              {new Date(show.event_date_start).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              {" — "}
              {new Date(show.event_date_end).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </p>
          </div>
          {show.registration_deadline && (
            <div>
              <p style={{ fontSize: "0.7rem", color: "var(--text-muted)", marginBottom: "0.125rem" }}>Registration deadline</p>
              <p style={{ fontSize: "0.875rem", fontWeight: 600, color: "var(--midnight)" }}>
                {new Date(show.registration_deadline).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
              </p>
            </div>
          )}
        </div>

        {show.description && (
          <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", lineHeight: 1.6, marginBottom: "1rem" }}>
            {show.description}
          </p>
        )}

        <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1rem" }}>
          <h3 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.75rem" }}>
            Cost breakdown (per person)
          </h3>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Solo price</span>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
              ₦{show.base_cost_solo_ngn.toLocaleString()}
            </span>
          </div>
          {show.base_cost_group_ngn && (
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.25rem" }}>
              <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "var(--midnight)" }}>Group price</span>
              <span style={{ fontSize: "1rem", fontWeight: 800, color: "var(--teal)" }}>
                ₦{show.base_cost_group_ngn.toLocaleString()}
              </span>
            </div>
          )}
          {savingsPct > 0 && (
            <p style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--teal)", textAlign: "right" }}>
              {showTierInfo && maxTierDiscount > savingsPct
                ? `Save ${savingsPct}–${maxTierDiscount}% with group pricing`
                : `Save ${savingsPct}% with ${show.min_group_size}+ members`}
            </p>
          )}
          {show.invitation_letter_fee_ngn > 0 && (
            <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
              + ₦{show.invitation_letter_fee_ngn.toLocaleString()} invitation letter fee
            </p>
          )}
        </div>
      </div>

      <div style={{ marginBottom: "1.5rem" }}>
        <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.125rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.75rem" }}>
          Open groups for this show
        </h2>

        {groups && groups.length > 0 && !isMemberOfShow && firstGroup && (
          <div style={{ marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <QuickJoinGroupButton groupId={firstGroup.id} inviteCode={firstGroup.invite_code} />
            <span style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
              or browse groups below to find the best fit
            </span>
          </div>
        )}

        {(!groups || groups.length === 0) && (
          <div style={{ padding: "2rem", textAlign: "center", background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
            <p style={{ fontSize: "0.875rem", color: "var(--text-muted)", marginBottom: "0.5rem" }}>No open groups yet.</p>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>Be the first to create a group and invite others to join.</p>
          </div>
        )}

        <div style={{ display: "grid", gap: "0.75rem" }}>
          {(groups || []).map((g: any) => {
            const spotsLeft = g.target_group_size - g.current_member_count;
            return (
              <a
                key={g.id}
                href={`/dashboard/trade-shows/groups/${g.id}`}
                style={{ textDecoration: "none", display: "block" }}
              >
                <div style={{
                  background: "white",
                  borderRadius: "var(--radius-lg)",
                  border: "1px solid var(--border)",
                  padding: "1rem",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}>
                  <div>
                    <p style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "0.9375rem", fontWeight: 700, color: "var(--midnight)" }}>
                      {g.title}
                    </p>
                    <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                      Organized by {organizerMap.get(g.organizer_id) || "Unknown"} · {g.current_member_count}/{g.target_group_size} members · {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} left
                    </p>
                  </div>
                  <span style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600 }}>
                    Join →
                  </span>
                </div>
              </a>
            );
          })}
        </div>
      </div>

      <CreateTradeShowGroupModal
        showId={show.id}
        showName={show.name}
        minGroupSize={show.min_group_size}
        maxGroupSize={show.max_group_size}
        costPerPerson={show.base_cost_group_ngn}
      />
    </div>
  );
}
