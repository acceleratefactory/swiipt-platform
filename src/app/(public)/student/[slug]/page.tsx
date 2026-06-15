import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import NicheLandingPage from "@/components/public/niche/NicheLandingPage";

const URL_PREFIX = "student";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient() as any;
  const { data: page } = await supabase
    .from("niche_pages")
    .select("meta_title, meta_description, og_image_url")
    .eq("url_prefix", URL_PREFIX)
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!page) return { title: "Not found" };
  return {
    title: page.meta_title || "Swiipt",
    description: page.meta_description || "",
    openGraph: {
      title: page.meta_title || "Swiipt",
      description: page.meta_description || "",
      images: page.og_image_url ? [{ url: page.og_image_url }] : [],
    },
  };
}

export default async function NichePage({ params }: { params: { slug: string } }) {
  const supabase = createClient() as any;

  const { data: page } = await supabase
    .from("niche_pages")
    .select("*")
    .eq("url_prefix", URL_PREFIX)
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!page) notFound();

  supabase.from("niche_pages").update({ view_count: (page.view_count || 0) + 1 }).eq("id", page.id).then(() => {});

  const { data: configs } = await supabase.from("calculator_configs").select("*").eq("is_active", true);

  const relatedSlugs = page.related_page_slugs || [];
  const { data: relatedPages } = relatedSlugs.length > 0
    ? await supabase.from("niche_pages").select("slug, url_prefix, title, subtitle, destination").in("slug", relatedSlugs).eq("published", true)
    : { data: [] };

  return <NicheLandingPage page={page} configs={configs || []} relatedPages={relatedPages || []} />;
}
