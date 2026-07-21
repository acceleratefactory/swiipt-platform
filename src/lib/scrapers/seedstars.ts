import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, stripHtml, absolutizeUrl } from "./utils";

const BASE_URL = "https://seedstars.com";
const COMPETITIONS_URL = "https://seedstars.com/events";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "no-cache",
};

export async function seedstarsScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithRetry(pageUrl || COMPETITIONS_URL, 25000, 3);
  if (!html) return [];

  const listings: Array<{ title: string; description: string; location: string }> = [];

  const eventRe = /Seedstars\s+\w[\w\s]*?(?=Seedstars|$)/gi;
  let m: RegExpExecArray | null;
  while ((m = eventRe.exec(html))) {
    const text = stripHtml(m[0]).trim();
    if (!text || text.length < 10) continue;
    const locMatch = text.match(/(?:in|–)\s*([A-Za-z][A-Za-z\s,]+?)(?:\s*(?:–|$))/);
    const location = locMatch ? locMatch[1].trim() : "";
    listings.push({ title: text.slice(0, 300), description: "", location });
  }

  const eventCards: Array<{ title: string; url: string; location: string }> = [];
  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    const linkText = stripHtml(m[2]).trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/seedstars/i.test(linkText + href)) continue;
    if (linkText.length < 10) continue;
    const abs = absolutizeUrl(href, BASE_URL).split("#")[0];
    const locMatch = linkText.match(/(?:in|–)\s*([A-Za-z][A-Za-z\s,]+)/);
    const location = locMatch ? locMatch[1].trim() : "Global";
    eventCards.push({ title: linkText.slice(0, 300), url: abs, location });
  }

  const seen = new Set<string>();
  for (const item of eventCards.slice(0, maxItems)) {
    const key = item.title.slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    const record = makeRecord(item.title, "", item.url, sourceName, pageUrl || COMPETITIONS_URL, {
      organisation: "Seedstars",
      location: item.location,
      requirements: "Entrepreneurship competition",
    });
    if (record) records.push(record);
  }

  for (const item of listings.slice(0, maxItems)) {
    if (records.length >= maxItems) break;
    const key = item.title.slice(0, 40);
    if (seen.has(key)) continue;
    seen.add(key);
    const record = makeRecord(item.title, item.description, COMPETITIONS_URL, sourceName, pageUrl || COMPETITIONS_URL, {
      organisation: "Seedstars",
      location: item.location,
      requirements: "Entrepreneurship competition",
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = stripHtml(html);
    if (extracted.length > 30) {
      const record = makeRecord(
        "Seedstars World — Entrepreneurship Competition",
        extracted.slice(0, 2000),
        pageUrl || COMPETITIONS_URL,
        sourceName,
        pageUrl || COMPETITIONS_URL,
        { organisation: "Seedstars", location: "Global", requirements: "Entrepreneurship competition" }
      );
      if (record) records.push(record);
    }
  }

  return records;
}

async function fetchWithRetry(url: string, ms: number, retries: number): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(ms),
        headers: BROWSER_HEADERS,
        redirect: "follow",
      });
      if (!res.ok) return null;
      const text = await res.text();
      return text.length > 200 ? text : null;
    } catch {
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}
