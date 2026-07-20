import type { EvidenceRecord } from "../evidence-adapters";
import { extractFromHtmlGeneric, makeRecord, absolutizeUrl } from "./utils";

const BASE_URL = "https://study-uk.britishcouncil.org";
const FALLBACK_URL = "https://www.britishcouncil.org/study-work-abroad/scholarships";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "no-cache",
};

export async function britishCouncilScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html =
    (await fetchWithRetry(BASE_URL + "/scholarships", 25000, 3)) ||
    (await fetchWithRetry(FALLBACK_URL, 25000, 3));
  if (!html) return [];

  const listings: Array<{ title: string; url: string; description: string }> = [];

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html))) {
    const href = lm[1];
    const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/(?:scholarship|funding|award|great|chevening|commonwealth|alumni)/i.test(linkText + href)) continue;
    if (linkText.length < 5) continue;
    const abs = absolutizeUrl(href, BASE_URL).split("#")[0];
    if (listings.some(l => l.url === abs)) continue;
    listings.push({ title: linkText.slice(0, 300), url: abs, description: "" });
  }

  for (const item of listings.slice(0, maxItems)) {
    const detailHtml = await fetchWithTimeout(item.url, 15000);
    if (!detailHtml) {
      const record = makeRecord(item.title, item.description, item.url, sourceName, pageUrl, {
        organisation: "British Council",
        location: "United Kingdom",
      });
      if (record) records.push(record);
      continue;
    }

    const body = detailHtml.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
    const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const title = (detailHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || item.title).replace(/<[^>]+>/g, "").trim();

    const extracted = extractFromHtmlGeneric(detailHtml, item.url);
    const description = extracted.description || text.slice(0, 2000);

    const record = makeRecord(title, description, item.url, sourceName, pageUrl, {
      organisation: "British Council",
      location: "United Kingdom",
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = extractFromHtmlGeneric(html, BASE_URL);
    if (extracted.title) {
      const record = makeRecord(extracted.title, extracted.description, BASE_URL, sourceName, pageUrl, {
        organisation: "British Council",
        location: "United Kingdom",
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
      headers: BROWSER_HEADERS,
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

async function fetchWithRetry(url: string, ms: number, retries: number): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const html = await fetchWithTimeout(url, ms);
    if (html) return html;
    if (attempt < retries) await new Promise((r) => setTimeout(r, 1000));
  }
  return null;
}
