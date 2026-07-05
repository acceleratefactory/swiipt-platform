import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: sources } = await (serviceSupabase as any)
    .from("opportunity_sources")
    .select("*")
    .eq("is_active", true)
    .in("source_type", ["rss", "api"])
    .or(`last_pulled_at.is.null,last_pulled_at.lt.${new Date(Date.now() - 60 * 60 * 1000).toISOString()}`);

  let totalIngested = 0;

  for (const source of (sources || [])) {
    if (source.source_url === "#") continue;

    try {
      if (source.source_type === "rss") {
        const rssResponse = await fetch(source.source_url, {
          signal: AbortSignal.timeout(10000),
          headers: { "User-Agent": "Swiipt-Bot/1.0 (opportunities@swiipt.com)" },
        });

        if (!rssResponse.ok) continue;

        const rssText = await rssResponse.text();
        const items = parseBasicRSS(rssText);

        let sourceIngested = 0;
        for (const item of items) {
          if (!item.url || item.url === "#") continue;

          const { data: existing } = await (serviceSupabase as any)
            .from("opportunity_queue")
            .select("id")
            .eq("raw_url", item.url)
            .limit(1)
            .maybeSingle();

          if (existing) continue;

          const { data: existingOpp } = await (serviceSupabase as any)
            .from("opportunities")
            .select("id")
            .eq("application_url", item.url)
            .limit(1)
            .maybeSingle();

          if (existingOpp) continue;

          await (serviceSupabase as any).from("opportunity_queue").insert({
            raw_title: item.title,
            raw_organisation: item.organisation,
            raw_location: item.location,
            raw_description: item.description,
            raw_salary: item.salary,
            raw_deadline: item.deadline,
            raw_url: item.url,
            raw_requirements: item.requirements,
            source_name: source.name,
            source_url: source.source_url,
            ingest_method: "rss",
          });

          sourceIngested++;
          totalIngested++;
        }

        await (serviceSupabase as any)
          .from("opportunity_sources")
          .update({
            last_pulled_at: new Date().toISOString(),
            total_ingested: (source.total_ingested || 0) + sourceIngested,
          })
          .eq("id", source.id);
      }
    } catch {
      console.error(`Failed to ingest from ${source.name}`);
    }
  }

  if (totalIngested > 0) {
    fetch(`${process.env.NEXT_PUBLIC_APP_URL}/api/admin/opportunities/process-queue`, {
      method: "POST",
      headers: { "x-internal-secret": process.env.INTERNAL_API_SECRET! },
    }).catch(() => {});
  }

  return NextResponse.json({ ingested: totalIngested });
}

interface RSSItem {
  title: string;
  organisation: string;
  location: string;
  description: string;
  salary: string | null;
  deadline: string | null;
  url: string;
  requirements: string | null;
}

function parseBasicRSS(xml: string): RSSItem[] {
  const items: RSSItem[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/gi;
  let match;

  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    items.push({
      title: extractTag(content, "title"),
      organisation: extractTag(content, "author") || extractTag(content, "dc:creator") || "",
      location: "",
      description: stripHtml(extractTag(content, "description") || ""),
      salary: null,
      deadline: null,
      url: extractTag(content, "link"),
      requirements: null,
    });
  }

  return items;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([^\\]]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i");
  const m = xml.match(regex);
  return (m?.[1] || m?.[2] || "").trim();
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}
