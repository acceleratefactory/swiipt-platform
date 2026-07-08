import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function GET(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();
  const { searchParams } = new URL(request.url);
  const format = searchParams.get("format") || "json";
  const limit = Math.min(parseInt(searchParams.get("limit") || "500"), 2000);

  const { data: opps } = await (serviceSupabase as any)
    .from("opportunities")
    .select(`
      id, title, organisation, type, segment_slug, location_country,
      source_name, source_url, ai_generated, ai_relevance_score,
      published_at, is_active, provenance
    `)
    .order("published_at", { ascending: false })
    .limit(limit);

  if (!opps) {
    return NextResponse.json({ error: "No data" }, { status: 500 });
  }

  if (format === "csv") {
    const headers = [
      "id", "title", "organisation", "type", "segment", "country",
      "source", "ai_confidence", "published_at", "is_active",
      "evidence_type", "ai_model", "source_trust_tier",
    ];

    const rows = opps.map((o: any) => {
      const p = o.provenance || {};
      return [
        o.id,
        `"${(o.title || "").replace(/"/g, '""')}"`,
        `"${(o.organisation || "").replace(/"/g, '""')}"`,
        o.type,
        o.segment_slug,
        o.location_country,
        o.source_name,
        o.ai_relevance_score ? o.ai_relevance_score / 100 : "",
        o.published_at,
        o.is_active,
        p.evidence_type || "",
        p.ai_model || "",
        p.source_trust_tier || "",
      ].join(",");
    });

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv",
        "Content-Disposition": `attachment; filename="provenance-export-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    });
  }

  // JSON format
  const exportData = opps.map((o: any) => {
    const p = o.provenance || {};
    return {
      id: o.id,
      title: o.title,
      organisation: o.organisation,
      type: o.type,
      segment: o.segment_slug,
      country: o.location_country,
      source: o.source_name,
      source_url: o.source_url,
      ai_generated: o.ai_generated,
      ai_confidence: o.ai_relevance_score ? o.ai_relevance_score / 100 : null,
      published_at: o.published_at,
      is_active: o.is_active,
      provenance: {
        evidence_type: p.evidence_type || null,
        ai_model: p.ai_model || null,
        source_trust_tier: p.source_trust_tier || null,
        confidence_history: p.confidence_history || [],
        edited_by: p.edited_by || [],
        edited_at: p.edited_at || [],
      },
    };
  });

  return new NextResponse(JSON.stringify(exportData, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="provenance-export-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
