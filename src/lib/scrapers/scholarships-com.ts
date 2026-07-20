import type { EvidenceRecord } from "../evidence-adapters";
import { parseDate, extractFromHtmlGeneric, makeRecord, absolutizeUrl } from "./utils";

const SCHOLARSHIP_SOURCES = [
  {
    name: "International Scholarships",
    url: "https://www.internationalscholarships.com/",
    org: "International Scholarships",
  },
  {
    name: "Scholarships.com",
    url: "https://www.scholarships.com/",
    org: "Scholarships.com",
  },
];

export async function scholarshipsScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const source = SCHOLARSHIP_SOURCES.find(s => sourceName.includes(s.name));
  if (!source) return [];

  const html = await fetchWithTimeout(source.url, 15000);
  if (!html) return [];

  const listings: Array<{ title: string; url: string; description: string }> = [];

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html))) {
    const href = lm[1];
    const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/(?:scholarship|award|grant|fellowship|funding|study\s*abroad)/i.test(linkText + href)) continue;
    if (linkText.length < 10) continue;
    const abs = absolutizeUrl(href, source.url).split("#")[0];
    if (listings.some(l => l.url === abs)) continue;
    listings.push({ title: linkText.slice(0, 300), url: abs, description: "" });
  }

  const cardRe = /<(?:div|article|li)[^>]*class=["'][^"']*(?:card|item|tile|col[^\s]*|listing|scholarship)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = cardRe.exec(html))) {
    const cardHtml = cm[1];
    const title = (cardHtml.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    const link = cardHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
    const desc = (cardHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    if (!title || title.length < 10) continue;
    const abs = link ? absolutizeUrl(link, source.url).split("#")[0] : source.url;
    if (listings.some(l => l.url === abs)) continue;
    listings.push({ title: title.slice(0, 300), url: abs, description: desc.slice(0, 1000) });
  }

  for (const item of listings.slice(0, maxItems)) {
    let description = item.description;
    let deadline: string | null = null;

    if (item.url && item.url !== source.url) {
      const detailHtml = await fetchWithTimeout(item.url, 10000);
      if (detailHtml) {
        const extracted = extractFromHtmlGeneric(detailHtml, item.url);
        if (extracted.description) description = extracted.description;
        const body = detailHtml.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
        const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        deadline = parseDate(text);
      }
    }

    const record = makeRecord(item.title, description, item.url, sourceName, pageUrl, {
      organisation: source.org,
      deadline,
      location: "International",
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = extractFromHtmlGeneric(html, source.url);
    if (extracted.title) {
      const record = makeRecord(extracted.title, extracted.description, source.url, sourceName, pageUrl, {
        organisation: extracted.organisation || source.org,
        location: "International",
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
