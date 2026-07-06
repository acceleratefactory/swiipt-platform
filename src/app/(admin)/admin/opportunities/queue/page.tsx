import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import OpportunityQueueList from "@/components/admin/opportunities/OpportunityQueueList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function OpportunityQueuePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase
    .from("user_roles")
    .select("role")
    .eq("user_id", user.id)
    .single();

  if (!role || role.role !== "admin") redirect("/dashboard");

  const { data: items } = await adminSupabase
    .from("opportunity_queue")
    .select("*")
    .eq("status", "needs_review")
    .order("ingested_at", { ascending: false });

  const { count: processed } = await adminSupabase
    .from("opportunity_queue")
    .select("*", { count: "exact", head: true })
    .in("status", ["approved", "rejected"]);

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "1.5rem" }}>
        <div>
          <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "0.25rem" }}>
            Review Queue
          </h1>
          <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
            {items?.length || 0} pending review &middot; {processed || 0} processed
          </p>
        </div>
        <a href="/admin/opportunities" style={{ padding: "0.5rem 1rem", background: "transparent", color: "var(--midnight)", fontWeight: 600, fontSize: "0.875rem", borderRadius: "var(--radius-md)", border: "1px solid var(--border)", textDecoration: "none" }}>
          &larr; All Opportunities
        </a>
      </div>
      <OpportunityQueueList items={items || []} />
    </div>
  );
}
