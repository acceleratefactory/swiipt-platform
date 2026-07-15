interface OGResult {
  cover_image_url: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  media_source: "fetched" | "fallback";
}

// URLs that are almost certainly small icons/logos, not a natural cover photo.
const ICON_HINTS = /(logo|icon|favicon|avatar|sprite|badge|glyph|symbol|btn|button|thumb-?\d{1,3}|placeholder|blank|pixel|1x1|tracking)/i;

async function validateImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") || "";
    if (!contentType.startsWith("image/")) return false;
    // Reject suspiciously icon-sized images when content-length is known.
    const len = Number(res.headers.get("content-length") || "0");
    if (len > 0 && len < 4000) return false;
    return true;
  } catch {
    return false;
  }
}

function absolutize(url: string, base: string): string {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

// Recursively find an image URL inside JSON-LD (schema.org) structures.
function findLdImage(node: unknown, found: string[]): void {
  if (!node || typeof node !== "object") return;
  if (Array.isArray(node)) {
    for (const item of node) findLdImage(item, found);
    return;
  }
  const obj = node as Record<string, unknown>;
  for (const [key, val] of Object.entries(obj)) {
    const lower = key.toLowerCase();
    if (lower === "image" && typeof val === "string" && val.startsWith("http")) {
      found.push(val);
    } else if (
      lower === "image" &&
      val &&
      typeof val === "object" &&
      !Array.isArray(val) &&
      typeof (val as Record<string, unknown>).url === "string"
    ) {
      found.push((val as Record<string, unknown>).url as string);
    } else if (typeof val === "string" && lower === "contenturl" && val.startsWith("http")) {
      found.push(val);
    } else if (typeof val === "object") {
      findLdImage(val, found);
    }
  }
}

export async function fetchOGMedia(sourceUrl: string): Promise<OGResult> {
  try {
    const res = await fetch(sourceUrl, {
      headers: { "User-Agent": "Swiipt/1.0 (opportunity media fetcher)" },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) {
      return { cover_image_url: null, thumbnail_url: null, video_url: null, media_source: "fallback" };
    }
    const html = await res.text();

    // Ordered candidates: OG image first (usually a hero/banner), then the
    // large Twitter card, then schema.org / JSON-LD images, then the first
    // sizeable content <img> on the page. This raises real-photo coverage
    // well beyond plain og:image.
    const candidates: string[] = [];

    const ogImage = extractMeta(html, "og:image");
    const ogImageUrl = extractMeta(html, "og:image:url");
    const ogImageSecure = extractMeta(html, "og:image:secure_url");
    const twitterImage = extractMeta(html, "twitter:image");
    const twitterImageSrc = extractMeta(html, "twitter:image:src");
    [ogImage, ogImageUrl, ogImageSecure, twitterImage, twitterImageSrc]
      .filter(Boolean)
      .forEach((u) => candidates.push(absolutize(u as string, sourceUrl)));

    // schema.org JSON-LD
    const ldMatches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi);
    if (ldMatches) {
      for (const block of ldMatches) {
        const json = block.replace(/<[^>]+>/g, "").trim();
        try {
          findLdImage(JSON.parse(json), candidates);
        } catch {
          /* ignore malformed JSON-LD */
        }
      }
    }

    // First sizeable content image (skip obvious icons/logos).
    const imgMatches = html.match(/<img[^>]*src=["']([^"']+)["'][^>]*>/gi) || [];
    for (const tag of imgMatches) {
      const src = extractAttr(tag, "src");
      if (!src || !src.startsWith("http")) continue;
      if (ICON_HINTS.test(src)) continue;
      candidates.push(absolutize(src, sourceUrl));
      break;
    }

    let cover_image_url: string | null = null;
    for (const url of candidates) {
      if (await validateImage(url)) {
        cover_image_url = url;
        break;
      }
    }

    const ogVideo = extractMeta(html, "og:video");
    let video_url: string | null = null;
    let thumbnail_url: string | null = null;
    if (ogVideo) {
      const id = extractVideoId(ogVideo);
      if (id) {
        video_url = id;
        thumbnail_url = cover_image_url;
      }
    }

    return {
      cover_image_url,
      thumbnail_url,
      video_url,
      media_source: cover_image_url ? "fetched" : "fallback",
    };
  } catch {
    return { cover_image_url: null, thumbnail_url: null, video_url: null, media_source: "fallback" };
  }
}

function extractMeta(html: string, property: string): string | null {
  const patterns = [
    new RegExp(`<meta\\s+[^>]*property=["']${property}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta\\s+[^>]*name=["']${property}["'][^>]*content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta\\s+[^>]*content=["']([^"']+)["'][^>]*property=["']${property}["']`, "i"),
    new RegExp(`<meta\\s+[^>]*content=["']([^"']+)["'][^>]*name=["']${property}["']`, "i"),
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1];
  }
  return null;
}

function extractAttr(tag: string, attr: string): string | null {
  const m = tag.match(new RegExp(`${attr}=["']([^"']+)["']`, "i"));
  return m ? m[1] : null;
}

function extractVideoId(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `youtube:${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `vimeo:${vimeoMatch[1]}`;
  if (url.match(/\.(mp4|m3u8)(\?|$)/i)) return url;
  return null;
}
