import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import GuideEditor from "@/components/admin/content/GuideEditor";

export default async function NewGuidePage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  return <GuideEditor />;
}
