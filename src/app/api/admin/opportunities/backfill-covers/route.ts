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
    .select("id, title, organisation, type, location_country, application_url, source_url, cover_image_url, media_source, description")
    .eq("is_active", true)
    // Cursor on cover_stored_at IS NULL so every attempted row is marked and
    // the loop advances. Without this, a fixed .order("id").limit(50) would
    // re-select the same first 50 failing rows forever and never reach the
    // rest. Rows already in Storage are skipped inside the loop.
    .is("cover_stored_at", null)
    .order("id")
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

      const logo = await fetchOrgLogo(org, opp.application_url, opp.title, opp.description);

      const update: any = {
        org_logo_url: logo.cover_image_url || "",
        // Mark this row attempted so the cursor advances past it. Set on
        // every branch (success, fallback, or failure) to guarantee progress.
        cover_stored_at: new Date().toISOString(),
      };
      if (nameChanged) update.organisation = org;

      if (!opp.cover_image_url) {
        const cover = await getCoverImage(
          opp.application_url,
          opp.title,
          org,
          opp.type,
          opp.location_country || "Global",
          opp.source_url
        );
        if (cover.cover_image_url) {
          const mediaSource = cover.cover_source === "branded" || cover.cover_source === "none" ? "fallback" : "fetched";
          if (mediaSource === "fetched") {
            // P0#7: store the real cover in our own Storage bucket and rewrite
            // cover_image_url to the opaque, first-party public URL. This keeps
            // the upstream source domain out of the browser (ad-blockers /
            // hotlink protection otherwise suppress the image).
            const stored = await storeCoverLocally(serviceSupabase, opp.id, cover.cover_image_url);
            if (stored) {
              update.cover_image_url = stored;
              update.media_source = "fetched";
              update.media_type = "image";
            } else {
              // Upload failed — keep the external URL as a fallback so the
              // card can still proxy it (old behaviour) rather than dropping
              // the cover entirely.
              update.cover_image_url = cover.cover_image_url;
              update.media_source = "fetched";
              update.media_type = "image";
            }
          } else {
            update.cover_image_url = null;
            update.media_source = "fallback";
            update.media_type = "image";
          }
        } else {
          // No real image available — let the card render the on-brand
          // fallback (logo-on-colour or typographic tile). Keep the URL null.
          // media_type stays "image" so the card still shows the FallbackTile;
          // media_source="fallback" is what tells the card to use it.
          update.cover_image_url = null;
          update.media_source = "fallback";
          update.media_type = "image";
        }
      } else if (opp.media_source === "fetched" && opp.cover_image_url.startsWith("http")) {
        // Already has an external fetched URL — migrate it into Storage so the
        // feed serves a first-party image.
        const stored = await storeCoverLocally(serviceSupabase, opp.id, opp.cover_image_url);
        if (stored) {
          update.cover_image_url = stored;
          update.media_source = "fetched";
          update.media_type = "image";
        }
        // If stored is null, cover_image_url stays external and the card will
        // proxy it (see OpportunityCard). cover_stored_at is still set.
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

// P0#7: download an external cover image and store it in our own Storage
// bucket, returning the opaque first-party public URL. Returns null on any
// failure so the caller can fall back to the external URL.
async function storeCoverLocally(
  supabase: any,
  opportunityId: string,
  externalUrl: string
): Promise<string | null> {
  try {
    const upstream = await fetch(externalUrl, {
      method: "GET",
      redirect: "follow",
      signal: AbortSignal.timeout(20000),
      headers: { "User-Agent": "Swiipt/1.0 (cover backfill)" },
    });
    if (!upstream.ok) return null;
    const ct = upstream.headers.get("content-type") || "";
    if (!ct.startsWith("image/")) return null;

    const buf = Buffer.from(await upstream.arrayBuffer());
    if (buf.length < 1024) return null; // reject tiny/icon files

    const ext = ct.includes("png") ? "png" : ct.includes("webp") ? "webp" : ct.includes("gif") ? "gif" : "jpg";
    const path = `${opportunityId}.${ext}`;

    const { error } = await supabase.storage
      .from("opportunity-covers")
      .upload(path, buf, { contentType: ct, upsert: true });
    if (error) return null;

    const { data } = supabase.storage.from("opportunity-covers").getPublicUrl(path);
    return data?.publicUrl || null;
  } catch {
    return null;
  }
}
