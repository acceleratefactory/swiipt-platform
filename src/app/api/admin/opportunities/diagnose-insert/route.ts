import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();
  const oppId = crypto.randomUUID();

  // Try INSERT with explicit id
  const { data: insertData, error: insertError } = await (serviceSupabase as any)
    .from("opportunities")
    .insert({
      id: oppId,
      segment_slug: "job_seeker",
      title: "DIAGNOSTIC TEST - DELETE ME",
      organisation: "Diagnostic Test",
      location_country: "Global",
      type: "job",
      description: "Diagnostic test row - delete after reading",
      application_url: "https://example.com",
      source_name: "diagnostic",
      ai_generated: true,
      is_active: true,
      published_at: new Date().toISOString(),
    })
    .select("id")
    .single();

  // Clean up
  if (!insertError && insertData?.id) {
    await (serviceSupabase as any).from("opportunities").delete().eq("id", insertData.id);
  }

  return NextResponse.json({
    oppId,
    insertData,
    insertError: insertError?.message || null,
    publishedOppId: insertData?.id ?? null,
    fallbackWorks: insertData?.id ?? oppId,
  });
}
