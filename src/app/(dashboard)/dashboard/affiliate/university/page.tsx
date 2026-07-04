import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import UniversityModuleCard from "@/components/dashboard/affiliate/UniversityModuleCard";

export default async function UniversityPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: modules } = await supabase
    .from("affiliate_modules")
    .select("*")
    .order("order_in_course", { ascending: true });

  const { data: progress } = await supabase
    .from("affiliate_module_progress")
    .select("*")
    .eq("user_id", user.id);

  const progressMap = new Map((progress || []).map((p: any) => [p.module_id, p]));

  const completedCount = (progress || []).filter((p: any) => p.status === "completed").length;
  const totalPoints = (progress || []).reduce((sum: number, p: any) => sum + (p.score || 0), 0);

  return (
    <div>
      <a href="/dashboard/affiliate" style={{ color: 'var(--text-muted)', fontSize: '0.875rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.375rem', marginBottom: '1rem' }}>
        ← Back to affiliate hub
      </a>

      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '0.5rem' }}>
        Affiliate University
      </h1>
      <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        {completedCount} of {modules?.length || 0} modules completed · {totalPoints} points earned
      </p>

      <div style={{ display: 'grid', gap: '1rem', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))' }}>
        {(modules || []).map((mod: any) => (
          <UniversityModuleCard key={mod.id} module={mod} progress={progressMap.get(mod.id)} />
        ))}
      </div>
    </div>
  );
}
