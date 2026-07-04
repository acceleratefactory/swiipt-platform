import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import EditAiProviderForm from "@/components/admin/ai-providers/EditAiProviderForm";

export default async function EditAiProviderPage({ params }: { params: { id: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const { data: provider } = await (supabase as any)
    .from("ai_providers")
    .select("*")
    .eq("id", params.id)
    .single();

  if (!provider) notFound();

  return (
    <div>
      <a href="/admin/ai-providers" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1.5rem' }}>
        ← Back to AI Providers
      </a>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        Edit AI Provider
      </h1>
      <EditAiProviderForm provider={provider} />
    </div>
  );
}
