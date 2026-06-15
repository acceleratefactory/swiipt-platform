import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient() as any;

  const [nichePages, guides] = await Promise.all([
    supabase.from("niche_pages").select("url_prefix, slug, updated_at").eq("published", true),
    supabase.from("resource_guides").select("slug, updated_at").eq("published", true),
  ]);

  const staticPages = [
    { url: "https://swiipt.com", priority: "1.0", changefreq: "weekly" },
    { url: "https://swiipt.com/resources", priority: "0.8", changefreq: "weekly" },
    { url: "https://swiipt.com/about", priority: "0.5", changefreq: "monthly" },
    { url: "https://swiipt.com/privacy", priority: "0.3", changefreq: "yearly" },
    { url: "https://swiipt.com/terms", priority: "0.3", changefreq: "yearly" },
  ];

  const nichePagesEntries = (nichePages.data || []).map((p: any) => ({
    url: `https://swiipt.com/${p.url_prefix}/${p.slug}`,
    lastmod: p.updated_at?.split("T")[0],
    priority: "0.9",
    changefreq: "monthly",
  }));

  const guideEntries = (guides.data || []).map((g: any) => ({
    url: `https://swiipt.com/resources/${g.slug}`,
    lastmod: g.updated_at?.split("T")[0],
    priority: "0.7",
    changefreq: "monthly",
  }));

  const allPages = [...staticPages, ...nichePagesEntries, ...guideEntries];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map((p) => `  <url>
    <loc>${p.url}</loc>
    ${p.lastmod ? `<lastmod>${p.lastmod}</lastmod>` : ""}
    <changefreq>${p.changefreq}</changefreq>
    <priority>${p.priority}</priority>
  </url>`).join("\n")}
</urlset>`;

  return new NextResponse(xml, {
    headers: { "Content-Type": "application/xml" },
  });
}
