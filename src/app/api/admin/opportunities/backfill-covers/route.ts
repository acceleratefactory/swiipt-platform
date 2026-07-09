import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCoverImage } from "@/lib/cover-image";

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: opportunities, error: fetchError } = await serviceSupabase
    .from("opportunities")
    .select("id, title, organisation, type, location_country, application_url")
    .is("cover_image_url", null)
    .eq("is_active", true)
    .limit(50);

  if (fetchError) {
    return NextResponse.json({ error: fetchError.message }, { status: 500 });
  }

  if (!opportunities || opportunities.length === 0) {
    return NextResponse.json({ updated: 0, message: "No opportunities need cover images" });
  }

  let updated = 0;
  let failed = 0;

  for (const opp of opportunities) {
    try {
      const cover = await getCoverImage(
        opp.application_url,
        opp.title,
        opp.organisation,
        opp.type,
        opp.location_country || "Global"
      );

      if (cover.cover_image_url) {
        const mediaSource = cover.cover_source === "branded" || cover.cover_source === "none" ? "fallback" : "fetched";
        await serviceSupabase
          .from("opportunities")
          .update({
            cover_image_url: cover.cover_image_url,
            media_source: mediaSource,
            media_type: "image",
          })
          .eq("id", opp.id);
        updated++;
      } else {
        failed++;
      }
    } catch {
      failed++;
    }
  }

  return NextResponse.json({
    updated,
    failed,
    remaining: "Run again to process more",
  });
}
