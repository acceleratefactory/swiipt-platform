import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import TradeShowsTable from "@/components/admin/trade-shows/TradeShowsTable";
import AdminTradeShowGroupsTable from "@/components/admin/trade-shows/AdminTradeShowGroupsTable";

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
      .select("id, user_id, status, amount_saved_ngn, savings_goals(target_amount)")
      .eq("group_id", g.id);

    const memberUserIds = Array.from(new Set((members || []).map((m: any) => m.user_id).filter(Boolean)));
    const { data: memberUsers } = memberUserIds.length
      ? await (adminSupabase as any).from("users").select("id, full_name, email").in("id", memberUserIds)
      : { data: [] };
    const memberUserMap = new Map((memberUsers || []).map((u: any) => [u.id, u]));

    const membersWithUsers = (members || []).map((m: any) => ({
      ...m,
      user: memberUserMap.get(m.user_id) || null,
    }));

    const totalSaved = membersWithUsers.reduce((sum: number, m: any) => sum + (m.amount_saved_ngn || 0), 0);
    const totalTarget = membersWithUsers.reduce((sum: number, m: any) => sum + (m.savings_goals?.target_amount || 0), 0);
    const fundingPct = totalTarget > 0 ? Math.round((totalSaved / totalTarget) * 100) : 0;
    const fundedCount = membersWithUsers.filter((m: any) => m.status === "funded").length;

    return {
      ...g,
      organizer: organizerMap.get(g.organizer_id) || null,
      memberCount: membersWithUsers.length,
      fundedCount,
      fundingPct,
      members: membersWithUsers,
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

      <AdminTradeShowGroupsTable groups={enrichedGroups} statusColors={statusColors} />
    </div>
  );
}
