import { NextRequest, NextResponse } from "next/server";
import { enrich } from "@/lib/ai-service";
import { fetchOGMedia } from "@/lib/og-fetch";

interface PasteUrlResult {
  title: string;
  organisation: string;
  location_country: string;
  location_city: string | null;
  type: string;
  segment_slug: string;
  description: string;
  requirements: string | null;
  salary_range: string | null;
  funding_amount: string | null;
  deadline: string | null;
  cover_image_url: string | null;
  thumbnail_url: string | null;
  media_type: string;
  media_source: string;
  org_logo_url: string | null;
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    if (!url) {
      return NextResponse.json({ error: "URL is required" }, { status: 400 });
    }

    const response = await enrich({
      task: "paste-url",
      data: { url },
    });

    let data: Partial<PasteUrlResult> = {};
    try {
      const rawText = response.enriched?.raw_text || JSON.stringify(response.enriched || {});
      const cleaned = rawText.replace(/```json?\n?/g, "").replace(/```\n?/g, "").trim();
      data = JSON.parse(cleaned);
    } catch {
      if (response.enriched && !response.enriched.raw_text) {
        data = response.enriched as any;
      } else {
        return NextResponse.json({ error: "AI parsing failed" }, { status: 422 });
      }
    }

    const media = await fetchOGMedia(url);

    return NextResponse.json({
      ...data,
      cover_image_url: media.cover_image_url || data.cover_image_url || null,
      thumbnail_url: media.thumbnail_url || null,
      media_type: media.cover_image_url ? "image" : "none",
      media_source: media.media_source,
    });
  } catch (error) {
    console.error("Paste URL error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
