interface OGResult {
  cover_image_url: string | null;
  thumbnail_url: string | null;
  video_url: string | null;
  media_source: "fetched" | "fallback";
}

async function validateImage(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: "HEAD", signal: AbortSignal.timeout(5000) });
    if (!res.ok) return false;
    const contentType = res.headers.get("content-type") || "";
    return contentType.startsWith("image/");
  } catch {
    return false;
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
    const ogImage = extractMeta(html, "og:image");
    const twitterImage = extractMeta(html, "twitter:image");
    const ogVideo = extractMeta(html, "og:video");

    let cover_image_url: string | null = null;
    let thumbnail_url: string | null = null;
    let video_url: string | null = null;

    const candidates = [ogImage, twitterImage].filter(Boolean) as string[];
    for (const url of candidates) {
      if (await validateImage(url)) {
        cover_image_url = url;
        break;
      }
    }

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

function extractVideoId(url: string): string | null {
  const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch) return `youtube:${ytMatch[1]}`;
  const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
  if (vimeoMatch) return `vimeo:${vimeoMatch[1]}`;
  if (url.match(/\.(mp4|m3u8)(\?|$)/i)) return url;
  return null;
}
