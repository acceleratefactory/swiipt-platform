import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import GuideContent from "@/components/public/resources/GuideContent";

export async function generateMetadata({ params }: { params: { slug: string } }): Promise<Metadata> {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: guide } = await (supabase as any)
    .from("resource_guides")
    .select("title, meta_description")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();
  if (!guide) return { title: "Guide not found" };
  return {
    title: `${guide.title} — Swiipt`,
    description: guide.meta_description || guide.title,
  };
}

export default async function GuidePage({ params }: { params: { slug: string } }) {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: guide } = await (supabase as any)
    .from("resource_guides")
    .select("*")
    .eq("slug", params.slug)
    .eq("published", true)
    .single();

  if (!guide) notFound();

  // Increment view count (fire and forget)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  (supabase as any)
    .from("resource_guides")
    .update({ view_count: (guide.view_count || 0) + 1 })
    .eq("id", guide.id)
    .then(() => {});

  return <GuideContent guide={guide} />;
}
