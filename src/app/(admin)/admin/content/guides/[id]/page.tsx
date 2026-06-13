import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GuideEditor from "@/components/admin/content/GuideEditor";

export default async function EditGuidePage({
  params,
}: {
  params: { id: string };
}) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: guide } = await (supabase as any)
    .from("resource_guides")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!guide) redirect("/admin/content/guides");

  return <GuideEditor guide={guide} />;
}
