import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import AiProvidersList from "@/components/admin/ai-providers/AiProvidersList";

export default async function AiProvidersPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  const { data: providers } = await (supabase as any)
    .from("ai_providers")
    .select("*")
    .order("priority", { ascending: true });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.25rem' }}>
            AI Providers
          </h1>
          <p style={{ fontSize: '0.8125rem', color: 'var(--text-muted)' }}>
            {providers?.length || 0} provider{providers?.length !== 1 ? 's' : ''} configured
          </p>
        </div>
        <a href="/admin/ai-providers/new" style={{ padding: '0.625rem 1.25rem', background: 'var(--midnight)', color: 'white', fontWeight: 700, fontSize: '0.875rem', borderRadius: 'var(--radius-md)', textDecoration: 'none' }}>
          + Add Provider
        </a>
      </div>
      <AiProvidersList providers={providers || []} />
    </div>
  );
}
