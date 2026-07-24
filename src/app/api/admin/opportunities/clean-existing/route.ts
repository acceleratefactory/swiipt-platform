import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cleanOpportunityContent } from "@/lib/opportunities/content-cleaner";
import { stripHtml } from "@/lib/strip-html";

export const runtime = "nodejs";
export const maxDuration = 300;

function mechanicalScore(desc: string): number {
  const len = desc.length;
  if (len > 500) return 70;
  if (len > 200) return 50;
  if (len > 80) return 30;
  return 10;
}

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: opps } = await (serviceSupabase as any)
    .from("opportunities")
    .select("*")
    .eq("content_cleaned", false)
    .limit(10);

  if (!opps || opps.length === 0) {
    return NextResponse.json({ cleaned: 0, failed: 0, remaining: 0, message: "All opportunities cleaned." });
  }

  let cleaned = 0;
  let failed = 0;

  for (const opp of opps) {
    const aiResult = await cleanOpportunityContent({
      rawTitle: opp.title || "",
      rawDescription: opp.description || "",
      rawRequirements: opp.requirements || null,
      rawSalary: opp.salary_range || null,
      rawDeadline: opp.deadline || null,
      organisation: opp.organisation || "",
      locationCountry: opp.location_country || "Global",
      opportunityType: opp.type || "job",
    });

    if (aiResult.success) {
      await (serviceSupabase as any)
        .from("opportunities")
        .update({
          title: aiResult.title,
          description: aiResult.description,
          full_description: aiResult.full_description,
          requirements: aiResult.requirements,
          salary_range: aiResult.funding_display || opp.salary_range,
          deadline: aiResult.deadline || opp.deadline,
          editorial_score: aiResult.editorial_score,
          content_cleaned: true,
          content_cleaned_at: new Date().toISOString(),
        })
        .eq("id", opp.id);
      cleaned++;
    } else {
      const clean = stripHtml(opp.description || "");
      const score = mechanicalScore(clean);
      await (serviceSupabase as any)
        .from("opportunities")
        .update({
          full_description: clean.length > 600 ? clean.slice(0, 600) : clean,
          description: clean.length > 200 ? clean.slice(0, 200) : clean,
          editorial_score: score,
          content_cleaned: true,
          content_cleaned_at: new Date().toISOString(),
        })
        .eq("id", opp.id);
      failed++;
    }
  }

  const { count } = await (serviceSupabase as any)
    .from("opportunities")
    .select("*", { count: "exact", head: true })
    .eq("content_cleaned", false);

  return NextResponse.json({
    cleaned,
    failed,
    remaining: count || 0,
    message: count && count > 0 ? `${count} opportunities still need cleaning. Call again.` : "All opportunities cleaned.",
  });
}