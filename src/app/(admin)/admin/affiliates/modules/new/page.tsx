import { createClient } from "@/lib/supabase/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";
import { redirect } from "next/navigation";
import ModuleForm from "@/components/admin/affiliates/ModuleForm";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function NewAffiliateModulePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data: role } = await adminSupabase.from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // Fetch next available order
  const { data: last } = await (adminSupabase as any)
    .from("affiliate_modules")
    .select("order_in_course")
    .order("order_in_course", { ascending: false })
    .limit(1);

  const nextOrder = (last && last.length > 0 ? last[0].order_in_course : 0) + 1;

  return (
    <div>
      <h1 style={{ fontFamily: "Cabinet Grotesk, Plus Jakarta Sans, sans-serif", fontSize: "1.375rem", fontWeight: 800, color: "var(--midnight)", marginBottom: "1.5rem" }}>
        New Module
      </h1>
      <ModuleForm mode="create" initialData={{ order_in_course: nextOrder }} />
    </div>
  );
}
