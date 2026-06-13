import { createClient } from "@/lib/supabase/server";
import type { Metadata } from "next";
import GuidesList from "@/components/public/resources/GuidesList";

export const metadata: Metadata = {
  title: "Relocation Guides — Swiipt",
  description: "Everything you need to know about moving abroad. Visa guides, cost breakdowns, and step-by-step relocation resources.",
};

export default async function ResourcesPage() {
  const supabase = createClient();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: guides } = await (supabase as any)
    .from("resource_guides")
    .select("slug, title, subtitle, category, destination, reading_time_minutes, featured")
    .eq("published", true)
    .order("featured", { ascending: false })
    .order("created_at", { ascending: false });

  return <GuidesList guides={guides || []} />;
}
