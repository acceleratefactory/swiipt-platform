import { createServiceClient } from "@/lib/supabase/service";
import { notFound } from "next/navigation";
import JoinGroupSection from "@/components/public/JoinGroupSection";

export default async function GroupInvitePage({ params }: { params: { code: string } }) {
  const serviceClient = createServiceClient();

  const { data: group } = await (serviceClient as any)
    .from("group_buys")
    .select("*")
    .eq("invite_code", params.code)
    .single();

  if (!group || group.status !== "open") notFound();

  const spotsLeft = group.target_size - group.current_size;
  const timeLeft = new Date(group.expires_at).getTime() - Date.now();
  const hoursLeft = Math.max(0, Math.floor(timeLeft / (1000 * 60 * 60)));
  const progressPct = Math.round((group.current_size / group.target_size) * 100);

  return (
    <div style={{ minHeight: "100vh", background: "var(--off-white)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <div style={{ background: "white", borderRadius: "var(--radius-xl)", padding: "2.5rem", maxWidth: "480px", width: "100%", boxShadow: "var(--shadow-lg)" }}>
        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <p style={{ fontSize: "0.75rem", color: "var(--teal)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "0.5rem" }}>
            You have been invited to a group
          </p>
          <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.5rem", fontWeight: 800, color: "var(--midnight)", lineHeight: 1.2 }}>
            {group.title}
          </h1>
        </div>

        <div style={{ background: "var(--off-white)", borderRadius: "var(--radius-lg)", padding: "1.25rem", marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Solo price</span>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)", textDecoration: "line-through" }}>
              ₦{group.original_price_ngn?.toLocaleString()}
            </span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between" }}>
            <span style={{ fontSize: "1rem", fontWeight: 700, color: "var(--midnight)" }}>Group price</span>
            <span style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--teal)" }}>
              ₦{group.group_price_ngn?.toLocaleString()}
            </span>
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--teal)", fontWeight: 600, textAlign: "right", marginTop: "0.25rem" }}>
            {group.group_discount_pct}% group discount
          </p>
        </div>

        <div style={{ marginBottom: "1.5rem" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.5rem" }}>
            <span style={{ fontSize: "0.875rem", color: "var(--text-muted)" }}>Members joined</span>
            <span style={{ fontWeight: 700, color: "var(--midnight)" }}>{group.current_size} / {group.target_size}</span>
          </div>
          <div style={{ height: 8, background: "var(--gray-200)", borderRadius: 4, overflow: "hidden" }}>
            <div style={{ height: "100%", background: "var(--teal)", borderRadius: 4, width: `${progressPct}%`, transition: "width 0.3s" }} />
          </div>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginTop: "0.5rem" }}>
            {spotsLeft} spot{spotsLeft !== 1 ? "s" : ""} remaining · {hoursLeft}h left to join
          </p>
        </div>

        <JoinGroupSection inviteCode={params.code} />
      </div>
    </div>
  );
}
