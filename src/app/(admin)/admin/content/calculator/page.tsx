import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import CalculatorEditor from "@/components/admin/content/CalculatorEditor";

export default async function AdminCalculatorPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: configs } = await (supabase as any)
    .from("calculator_configs")
    .select("*")
    .order("destination")
    .order("service_type")
    .order("family_size");

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
        Cost Calculator Editor
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        All figures update on the public landing page immediately on save.
        Enter your actual service fees and current government fee estimates.
      </p>
      <CalculatorEditor configs={configs || []} />
    </div>
  );
}
