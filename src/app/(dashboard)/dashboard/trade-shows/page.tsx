import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import TradeShowCard from "@/components/dashboard/trade-shows/TradeShowCard";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function TradeShowsPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: shows } = await (adminSupabase as any)
    .from("trade_shows")
    .select("*")
    .eq("is_active", true)
    .order("event_date_start", { ascending: true });

  const { data: memberships } = await (adminSupabase as any)
    .from("trade_show_group_members")
    .select("*, trade_show_groups(*)")
    .eq("user_id", user.id)
    .order("joined_at", { ascending: false });

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.5rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
        Trade Shows
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Join or create a group to save on trade show attendance. When all members fully fund their share, Swiipt processes the group booking at negotiated rates.
      </p>

      {memberships && memberships.length > 0 && (
        <div style={{ marginBottom: "2rem" }}>
          <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
            My Trade Show Groups
          </h2>
          <div style={{ display: "grid", gap: "0.75rem" }}>
            {memberships.map((m: any) => {
              const group = m.trade_show_groups;
              if (!group) return null;
              return (
                <a
                  key={group.id}
                  href={`/dashboard/trade-shows/groups/${group.id}`}
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
                        {group.title}
                      </p>
                      <p style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                        {group.current_member_count} / {group.target_group_size} members · {group.status}
                      </p>
                    </div>
                    <span style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600 }}>
                      View →
                    </span>
                  </div>
                </a>
              );
            })}
          </div>
        </div>
      )}

      <h2 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.125rem', fontWeight: 700, color: 'var(--midnight)', marginBottom: '0.75rem' }}>
        Upcoming Trade Shows
      </h2>

      {(!shows || shows.length === 0) && (
        <div style={{ padding: "3rem", textAlign: "center", background: "white", borderRadius: "var(--radius-lg)", border: "1px solid var(--border)" }}>
          <p style={{ fontSize: "0.9375rem", color: "var(--text-muted)" }}>No trade shows available right now. Check back soon.</p>
        </div>
      )}

      <div style={{ display: "grid", gap: "1rem" }}>
        {(shows || []).map((show: any) => (
          <TradeShowCard key={show.id} show={show} />
        ))}
      </div>
    </div>
  );
}
