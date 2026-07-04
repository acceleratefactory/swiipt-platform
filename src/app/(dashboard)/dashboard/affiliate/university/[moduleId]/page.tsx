import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import ModuleDetailView from "./ModuleDetailView";

export default async function ModuleDetailPage({ params }: { params: { moduleId: string } }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: mod } = await supabase
    .from("affiliate_modules")
    .select("*")
    .eq("id", params.moduleId)
    .single();

  if (!mod) notFound();

  const { data: progress } = await supabase
    .from("affiliate_module_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("module_id", params.moduleId)
    .single();

  const isCompleted = progress?.status === "completed";

  return (
    <div>
      <a href="/dashboard/affiliate/university" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}>
        ← Back to modules
      </a>
      <ModuleDetailView module={mod} progress={progress} isCompleted={isCompleted} />
    </div>
  );
}
