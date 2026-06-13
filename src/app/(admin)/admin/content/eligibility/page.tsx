import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import EligibilityEditor from "@/components/admin/content/EligibilityEditor";

export default async function AdminEligibilityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pathways } = await (supabase as any)
    .from("eligibility_pathways")
    .select("*")
    .order("priority_order", { ascending: true });

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
        Eligibility Checker Editor
      </h1>
      <p style={{ color: 'var(--text-muted)', fontSize: '0.875rem', marginBottom: '1.5rem' }}>
        Manage the pathways shown when visitors complete the eligibility checker.
        Each pathway&apos;s conditions determine which user profiles it matches.
      </p>
      <EligibilityEditor pathways={pathways || []} />
    </div>
  );
}
