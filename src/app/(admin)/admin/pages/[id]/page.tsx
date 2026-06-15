import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import NichePageEditor from "@/components/admin/pages/NichePageEditor";

export default async function EditNichePage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: page } = await (supabase as any)
    .from("niche_pages")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!page) notFound();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: templates } = await (supabase as any)
    .from("goal_templates")
    .select("id, name")
    .eq("is_active", true)
    .order("sort_order");

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Edit Landing Page
      </h1>
      <NichePageEditor pkg={page} goalTemplates={templates || []} />
    </div>
  );
}
