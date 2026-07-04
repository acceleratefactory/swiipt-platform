import { NextRequest, NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

const SYSTEM_PROMPT =
  "You are a career opportunity researcher. Generate real, current international opportunities for Nigerian professionals. Return ONLY valid JSON.";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  try {
    const segmentsResult = await getSegmentsNeedingRefresh(adminSupabase);
    if (segmentsResult.length === 0) {
      return NextResponse.json({ refreshed: [], skipped: [] });
    }

    const providers = await getActiveProviders(adminSupabase);
    if (providers.length === 0) {
      return NextResponse.json({ error: "No active AI providers configured" }, { status: 400 });
    }

    const results: { segmentSlug: string; inserted: number; provider: string }[] = [];
    const skipped: { segmentSlug: string; reason: string }[] = [];

    for (const segment of segmentsResult) {
      const raw = await tryAllProviders(providers, segment.segmentSlug);
      if (!raw) {
        skipped.push({ segmentSlug: segment.segmentSlug, reason: "All providers failed" });
        continue;
      }

      const opportunities = parseOpportunities(raw);
      if (opportunities.length === 0) {
        skipped.push({ segmentSlug: segment.segmentSlug, reason: "Empty or invalid response" });
        continue;
      }

      const valid: typeof opportunities = [];
      for (const opp of opportunities) {
        if (opp.deadline && new Date(opp.deadline) <= new Date()) {
          console.log(`Skipping expired opportunity: ${opp.title}`);
          continue;
        }
        if (opp.application_url && opp.application_url !== "#") {
          try {
            const head = await fetch(opp.application_url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
            if (!head.ok) {
              console.log(`Skipping dead-link opportunity: ${opp.title} — ${head.status}`);
              continue;
            }
          } catch {
            console.log(`Skipping unreachable opportunity: ${opp.title}`);
            continue;
          }
        }
        valid.push(opp);
      }

      // Extract which provider succeeded
      const providerName = providers.find((p: any) => p.used)?.name || "unknown";

      if (valid.length > 0) {
        const rows = valid.map((o) => ({
          segment_slug: segment.segmentSlug,
          title: o.title,
          organisation: o.organisation,
          location_country: o.location_country || "Multiple",
          location_city: o.location_city || null,
          type: o.type || "job",
          description: o.description,
          requirements: o.requirements || null,
          salary_range: o.salary_range || null,
          funding_amount: o.funding_amount || null,
          deadline: o.deadline || null,
          application_url: o.application_url || "#",
          is_featured: false,
          ai_generated: true,
          source_name: "AI-sourced",
        }));

        const { error: insertError } = await adminSupabase.from("opportunities").insert(rows);
        if (insertError) {
          skipped.push({ segmentSlug: segment.segmentSlug, reason: insertError.message });
          continue;
        }
        results.push({ segmentSlug: segment.segmentSlug, inserted: rows.length, provider: providerName });
      } else {
        skipped.push({ segmentSlug: segment.segmentSlug, reason: "All failed pre-checks" });
      }
    }

    // Mark old AI-generated opportunities as inactive if zero views in 30 days
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    await adminSupabase
      .from("opportunities")
      .update({ is_active: false })
      .eq("ai_generated", true)
      .eq("is_active", true)
      .eq("view_count", 0)
      .lt("created_at", thirtyDaysAgo);

    return NextResponse.json({ refreshed: results, skipped });
  } catch (error) {
    console.error("Opportunity refresh error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getSegmentsNeedingRefresh(supabase: any) {
  const { data: activeSegments } = await supabase
    .from("career_profiles")
    .select("segment_slug");

  if (!activeSegments) return [];

  const uniqueSlugs = Array.from(new Set(activeSegments.map((p: any) => p.segment_slug).filter(Boolean))) as string[];
  const result: { segmentSlug: string }[] = [];

  for (const slug of uniqueSlugs) {
    const { count } = await supabase
      .from("opportunities")
      .select("*", { count: "exact", head: true })
      .eq("segment_slug", slug)
      .eq("is_active", true);

    if (count !== null && count < 15) {
      result.push({ segmentSlug: slug });
    }
  }

  return result;
}

async function getActiveProviders(supabase: any) {
  const { data } = await supabase
    .from("ai_providers")
    .select("*")
    .eq("is_active", true)
    .order("priority", { ascending: true });

  return (data || []).map((p: any) => ({
    ...p,
    resolvedKey: p.api_key.startsWith("$") ? (process.env[p.api_key.slice(1)] || "") : p.api_key,
    used: false,
  }));
}

async function tryAllProviders(providers: any[], segmentSlug: string): Promise<string | null> {
  const userPrompt = `Generate 3 real, current international opportunities for Nigerian ${segmentSlug}. Each opportunity must include: title, organisation, location_country, location_city, type, description (100 words), requirements, salary_range or funding_amount, application_url (real URL if known, placeholder if uncertain), deadline. Return a JSON object with "opportunities" array.`;

  for (const provider of providers) {
    try {
      const url = `${provider.base_url.replace(/\/$/, "")}/chat/completions`;
      const body = {
        model: provider.model,
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          { role: "user", content: userPrompt },
        ],
        temperature: 0.3,
        response_format: { type: "json_object" },
      };

      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.resolvedKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(30000),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "");
        console.warn(`Provider ${provider.name} returned ${response.status}: ${text.slice(0, 200)}`);
        continue;
      }

      const json = await response.json();
      provider.used = true;
      const content = json.choices?.[0]?.message?.content;
      if (content) return content;
    } catch (err) {
      console.warn(`Provider ${provider.name} failed:`, (err as Error).message);
    }
  }

  return null;
}

function parseOpportunities(rawJson: string): any[] {
  try {
    const parsed = JSON.parse(rawJson);
    const items = parsed.opportunities || (Array.isArray(parsed) ? parsed : [parsed]);
    return items.map((item: any) => ({
      ...item,
      type: item.type || "job",
      description: item.description || "",
    }));
  } catch {
    return [];
  }
}
