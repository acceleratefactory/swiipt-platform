import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, stripHtml, absolutizeUrl, parseDate } from "./utils";

const BASE_URL = "https://www.homeaffairs.gov.au";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-AU,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "no-cache",
};

export async function australiaHomeAffairsScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 15
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];
  const url = pageUrl || `${BASE_URL}/news-media`;

  const html = await fetchWithRetry(url, 25000, 3);
  if (!html) return [];

  const seen = new Set<string>();
  const listings: Array<{ title: string; url: string; organisation: string; date: string | null }> = [];

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    const linkText = stripHtml(m[2]).trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!href.includes("/news-media/") && !href.includes("/news/")) continue;
    if (linkText.length < 4) continue;
    const abs = absolutizeUrl(href, BASE_URL).split("#")[0];
    if (abs.includes("/news-subsite/") || abs.includes("/Pages/")) continue;
    const key = abs + linkText.slice(0, 50);
    if (seen.has(key)) continue;
    seen.add(key);
    const snippet = html.slice(Math.max(0, m.index - 200), m.index + 400);
    const dateMatch = snippet.match(/(\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4})/i);
    const date = dateMatch ? parseDate(dateMatch[1]) : null;
    listings.push({ title: linkText.slice(0, 300), url: abs, organisation: "Australia Home Affairs", date });
  }

  for (const item of listings.slice(0, maxItems)) {
    const record = makeRecord(item.title, "", item.url, sourceName, url, {
      organisation: item.organisation,
      location: "Australia",
      deadline: item.date,
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = stripHtml(html);
    if (extracted.length > 30) {
      const record = makeRecord(
        "Australia Home Affairs — News & Media",
        extracted.slice(0, 2000),
        url,
        sourceName,
        url,
        { organisation: "Australian Department of Home Affairs", location: "Australia" }
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
      if (!res.ok) {
        if (attempt < retries) { await new Promise((r) => setTimeout(r, 1000)); continue; }
        return null;
      }
      const text = await res.text();
      if (text.length > 200) return text;
      if (attempt < retries) { await new Promise((r) => setTimeout(r, 1000)); continue; }
      return null;
    } catch {
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}
