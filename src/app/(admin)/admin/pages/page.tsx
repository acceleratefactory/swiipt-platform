import { createClient } from "@/lib/supabase/server";
import { createServiceClient } from "@/lib/supabase/service";
import { redirect } from "next/navigation";
import NichePagesList from "@/components/admin/pages/NichePagesList";

export default async function AdminPagesPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const serviceClient = createServiceClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: pages } = await (serviceClient as any)
    .from("niche_pages")
    .select("*")
    .order("url_prefix")
    .order("slug");

  return (
    <div>
      <NichePagesList pages={pages || []} />
    </div>
  );
}
