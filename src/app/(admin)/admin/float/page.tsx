import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AdminFloatPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || (role.role !== "admin" && role.role !== "case_manager")) redirect("/dashboard");

  return (
    <div style={{ background: 'white', borderRadius: 'var(--radius-md)', padding: '2rem', border: '1px solid var(--border)' }}>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', color: 'var(--midnight)', marginBottom: '0.5rem' }}>Float Ledger — Sprint 10</h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>Full float ledger management builds in Sprint 10.</p>
    </div>
  );
}
