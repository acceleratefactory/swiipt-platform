import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SEOManager from "@/components/admin/seo/SEOManager";

export default async function AdminSEOPage() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") redirect("/dashboard");

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [nichePages, guides] = await Promise.all([
    (supabase as any).from("niche_pages").select("id, url_prefix, slug, title, meta_title, meta_description, og_image_url").order("url_prefix").order("slug"),
    (supabase as any).from("resource_guides").select("id, slug, title, meta_title, meta_description, og_image_url").order("slug"),
  ]);

  return (
    <div>
      <h1 style={{ fontFamily: 'Cabinet Grotesk, Plus Jakarta Sans, sans-serif', fontSize: '1.375rem', fontWeight: 800, color: 'var(--midnight)', marginBottom: '1.5rem' }}>
        SEO Manager
      </h1>
      <SEOManager nichePages={nichePages.data || []} guides={guides.data || []} />
    </div>
  );
}
