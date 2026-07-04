import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import AffiliateModulesList from "@/components/admin/affiliates/AffiliateModulesList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/* eslint-disable @typescript-eslint/no-explicit-any */
export default async function AdminAffiliateModulesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase.from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const { data: modules } = await (adminSupabase as any)
    .from("affiliate_modules")
    .select("*")
    .order("order_in_course", { ascending: true });

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        Affiliate University Modules
      </h1>
      <AffiliateModulesList modules={modules || []} />
    </div>
  );
}
/* eslint-enable @typescript-eslint/no-explicit-any */
