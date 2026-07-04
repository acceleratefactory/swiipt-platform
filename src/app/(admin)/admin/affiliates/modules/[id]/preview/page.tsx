import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect, notFound } from "next/navigation";
import ModuleDetailView from "@/app/(dashboard)/dashboard/affiliate/university/[moduleId]/ModuleDetailView";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function PreviewAffiliateModulePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase.from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const { data: mod } = await (adminSupabase as any)
    .from("affiliate_modules")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!mod) notFound();

  return (
    <div style={{ maxWidth: 720, margin: "0 auto" }}>
      {/* Admin chrome banner */}
      <div style={{ background: "#FEF3C7", border: "1px solid #F59E0B", borderRadius: "var(--radius-md)", padding: "0.625rem 1rem", marginBottom: "1rem", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <span style={{ fontSize: "0.8125rem", fontWeight: 600, color: "#B45309" }}>This is a preview — no progress will be recorded</span>
        <a href="/admin/affiliates/modules" style={{ fontSize: "0.8125rem", color: "var(--teal)", textDecoration: "underline" }}>Back to modules</a>
      </div>
      <ModuleDetailView module={mod} progress={null} isCompleted={true} />
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
