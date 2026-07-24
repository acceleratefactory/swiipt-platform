import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { cleanOpportunityContent } from "@/lib/opportunities/content-cleaner";

export const runtime = "nodejs";
export const maxDuration = 60;

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
    const result = await cleanOpportunityContent({
      rawTitle: opp.title || "",
      rawDescription: opp.description || "",
      rawRequirements: opp.requirements || null,
      rawSalary: opp.salary_range || null,
      rawDeadline: opp.deadline || null,
      organisation: opp.organisation || "",
      locationCountry: opp.location_country || "Global",
      opportunityType: opp.type || "job",
    });

    if (result.success) {
      await (serviceSupabase as any)
        .from("opportunities")
        .update({
          title: result.title,
          description: result.description,
          full_description: result.full_description,
          requirements: result.requirements,
          salary_range: result.funding_display || opp.salary_range,
          deadline: result.deadline || opp.deadline,
          editorial_score: result.editorial_score,
          content_cleaned: true,
          content_cleaned_at: new Date().toISOString(),
        })
        .eq("id", opp.id);
      cleaned++;
    } else {
      await (serviceSupabase as any)
        .from("opportunities")
        .update({
          needs_review: true,
          review_reason: `Content cleaning failed: ${result.failure_reason}`,
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