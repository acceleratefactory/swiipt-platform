import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function ReferPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <div style={{ background: "white", borderRadius: "var(--radius-lg)", padding: "2rem" }}>
      <h2 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", color: "var(--midnight)", marginBottom: "0.5rem" }}>
        Refer & Earn — Sprint 9
      </h2>
      <p style={{ color: "var(--text-muted)", fontSize: "0.875rem" }}>
        This section builds in Sprint 9.
      </p>
    </div>
  );
}
