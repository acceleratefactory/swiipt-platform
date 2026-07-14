import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getCoverImage, fetchOrgLogo } from "@/lib/cover-image";

function deriveFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    const labels = host.split(".").filter((p) => !["www", "jobs", "careers", "apply", "app", "web"].includes(p));
    const sld = labels.length >= 2 ? labels[labels.length - 2] : labels[labels.length - 1];
    if (!sld || sld.length < 3) return null;
    return sld.charAt(0).toUpperCase() + sld.slice(1);
  } catch {
    return null;
  }
}

export const runtime = "nodejs";
export const maxDuration = 300;

export async function POST(request: NextRequest) {
  if (request.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();

  const { data: opportunities, error: fetchError } = await serviceSupabase
    .from("opportunities")
    .select("id, title, organisation, type, location_country, application_url, cover_image_url")
    .or("cover_image_url.is.null,org_logo_url.is.null")
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
      let org = (opp.organisation || "").trim();
      let nameChanged = false;
      if (!org || org.toLowerCase() === "unknown") {
        const derived = deriveFromUrl(opp.application_url);
        if (derived) {
          org = derived;
          nameChanged = true;
        }
      }

      const logo = await fetchOrgLogo(org);

      const update: any = {
        org_logo_url: logo.cover_image_url || "",
      };
      if (nameChanged) update.organisation = org;

      if (!opp.cover_image_url) {
        const cover = await getCoverImage(
          opp.application_url,
          opp.title,
          org,
          opp.type,
          opp.location_country || "Global"
        );
        if (cover.cover_image_url) {
          const mediaSource = cover.cover_source === "branded" || cover.cover_source === "none" ? "fallback" : "fetched";
          update.cover_image_url = cover.cover_image_url;
          update.media_source = mediaSource;
          update.media_type = "image";
        }
      }

      await serviceSupabase
        .from("opportunities")
        .update(update)
        .eq("id", opp.id);
      updated++;
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
