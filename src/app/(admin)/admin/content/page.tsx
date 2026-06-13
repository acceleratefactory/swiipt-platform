import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminContentHubPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [{ count: totalGuides }, { count: publishedGuides }, { count: configCount }, { count: activePathways }] = await Promise.all([
    (supabase as any).from("resource_guides").select("*", { count: "exact", head: true }),
    (supabase as any).from("resource_guides").select("*", { count: "exact", head: true }).eq("published", true),
    (supabase as any).from("calculator_configs").select("*", { count: "exact", head: true }),
    (supabase as any).from("eligibility_pathways").select("*", { count: "exact", head: true }).eq("is_active", true),
  ]);

  const cardStyle: React.CSSProperties = {
    background: "white",
    border: "1px solid var(--border)",
    borderRadius: "var(--radius-lg)",
    padding: "1.5rem",
    display: "flex",
    flexDirection: "column",
  };

  return (
    <div>
      <div style={{ marginBottom: "2rem" }}>
        <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.5rem" }}>
          Content Management
        </h1>
        <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
          Manage all public-facing content from one place. Changes appear immediately on the landing page and resource pages.
        </p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))", gap: "1.25rem" }}>
        <a href="/admin/content/guides" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={cardStyle}>
            <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
              Resource Guides
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              {publishedGuides ?? 0} published / {totalGuides ?? 0} total
            </p>
            <p style={{ marginTop: "auto", color: "var(--teal)", fontWeight: 600, fontSize: "0.875rem" }}>
              Manage guides →
            </p>
          </div>
        </a>

        <a href="/admin/content/calculator" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={cardStyle}>
            <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
              Cost Calculator
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              {configCount ?? 0} pricing configs
            </p>
            <p style={{ marginTop: "auto", color: "var(--teal)", fontWeight: 600, fontSize: "0.875rem" }}>
              Edit pricing →
            </p>
          </div>
        </a>

        <a href="/admin/content/eligibility" style={{ textDecoration: "none", color: "inherit" }}>
          <div style={cardStyle}>
            <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1rem", fontWeight: 700, color: "var(--midnight)", marginBottom: "0.25rem" }}>
              Eligibility Checker
            </h2>
            <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)", marginBottom: "1rem" }}>
              {activePathways ?? 0} active pathways
            </p>
            <p style={{ marginTop: "auto", color: "var(--teal)", fontWeight: 600, fontSize: "0.875rem" }}>
              Edit pathways →
            </p>
          </div>
        </a>
      </div>
    </div>
  );
}
