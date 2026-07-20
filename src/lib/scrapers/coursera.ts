import type { EvidenceRecord } from "../evidence-adapters";
import { extractFromHtmlGeneric, makeRecord, absolutizeUrl } from "./utils";

export async function courseraScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const catalogUrl = "https://www.coursera.org/courses?query=free&page=1";
  const html = await fetchWithTimeout(catalogUrl, 20000);
  if (!html) return [];

  const courses: Array<{ title: string; url: string; description: string; org: string; rating: string; duration: string; level: string }> = [];

  const nextDataMatch = html.match(/<script[^>]*id="__NEXT_DATA__"[^>]*>([\s\S]*?)<\/script>/i);
  if (nextDataMatch) {
    try {
      const parsed = JSON.parse(nextDataMatch[1]);
      const pages = parsed?.props?.pageProps?.courses || [];
      const hits = parsed?.props?.pageProps?.searchResults?.hits || [];
      const data = pages.length > 0 ? pages : hits;
      for (const c of data.slice(0, maxItems)) {
        const title = c.name || c.title || c.courseName || "";
        const slug = c.slug || c.id || "";
        const url = slug ? `https://www.coursera.org/learn/${slug}` : catalogUrl;
        const org = c.partnerName || c.university || c.partners?.[0]?.name || c.provider?.name || "";
        const desc = c.description || c.tagline || c.subtitle || "";
        const rating = c.rating || c.avgRating || "";
        const duration = c.duration || c.estimatedWorkload || "";
        const level = c.level || c.difficultyLevel || c.metadata?.level || "";
        courses.push({ title: title.slice(0, 300), url, description: desc.slice(0, 1500), org, rating: String(rating || ""), duration: String(duration || ""), level: String(level || "") });
      }
      if (courses.length > 0) {
        for (const c of courses) {
          const record = makeRecord(c.title, c.description, c.url, sourceName, pageUrl, {
            organisation: c.org || "Coursera",
            location: "Online",
            requirements: [c.duration, c.level, c.rating ? `Rating: ${c.rating}` : ""].filter(Boolean).join(" | ") || null,
          });
          if (record) records.push(record);
        }
        return records;
      }
    } catch { /* fall through */ }
  }

  const jsonLdBlocks = html.match(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/gi);
  if (jsonLdBlocks) {
    for (const block of jsonLdBlocks) {
      try {
        const jsonStr = block.replace(/<[^>]+>/g, "");
        const parsed = JSON.parse(jsonStr);
        const items = Array.isArray(parsed) ? parsed : [parsed];
        for (const item of items) {
          if (item["@type"] === "Course" && item.name) {
            const title = item.name || "";
            const url = item.url || item["@id"] || catalogUrl;
            const desc = item.description || "";
            const org = item.provider?.name || item.author?.name || "";
            courses.push({ title: title.slice(0, 300), url, description: desc.slice(0, 1500), org, rating: "", duration: "", level: "" });
          }
        }
      } catch { /* skip */ }
    }
  }

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html))) {
    const href = lm[1];
    const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!href.includes("/learn/") && !/(?:course|class|program|specialization)/i.test(linkText)) continue;
    if (linkText.length < 10) continue;
    const abs = absolutizeUrl(href, catalogUrl).split("#")[0];
    if (courses.some(c => c.url === abs)) continue;
    courses.push({ title: linkText.slice(0, 300), url: abs, description: "", org: "", rating: "", duration: "", level: "" });
  }

  const cardRe = /<(?:div|article|li)[^>]*class=["'][^"']*(?:card|tile|item|course|result|product)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = cardRe.exec(html))) {
    const cardHtml = cm[1];
    const title = (cardHtml.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    const link = cardHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
    const desc = (cardHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    if (!title || title.length < 5) continue;
    const abs = link ? absolutizeUrl(link, catalogUrl).split("#")[0] : catalogUrl;
    if (courses.some(c => c.url === abs)) continue;
    const org = (cardHtml.match(/(?:by|from|university|school|partner)\s*[:;]\s*([^<]{2,60})/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    courses.push({ title: title.slice(0, 300), url: abs, description: desc.slice(0, 1000), org, rating: "", duration: "", level: "" });
  }

  for (const c of courses.slice(0, maxItems)) {
    let description = c.description;

    if (!description && c.url && c.url !== catalogUrl) {
      const detailHtml = await fetchWithTimeout(c.url, 10000);
      if (detailHtml) {
        const extracted = extractFromHtmlGeneric(detailHtml, c.url);
        if (extracted.description) description = extracted.description;
      }
    }

    const record = makeRecord(c.title, description || c.title, c.url, sourceName, pageUrl, {
      organisation: c.org || "Coursera",
      location: "Online",
      requirements: [c.duration, c.level, c.rating ? `Rating: ${c.rating}` : ""].filter(Boolean).join(" | ") || null,
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = extractFromHtmlGeneric(html, catalogUrl);
    if (extracted.title) {
      const record = makeRecord(extracted.title, extracted.description, catalogUrl, sourceName, pageUrl, {
        organisation: extracted.organisation || "Coursera",
        location: "Online",
      });
      if (record) records.push(record);
    }
  }

  return records;
}

async function fetchWithTimeout(url: string, ms: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ms),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)",
        Accept: "text/html,application/xhtml+xml,application/json",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
