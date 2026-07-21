import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, stripHtml, absolutizeUrl, parseDate } from "./utils";

const BASE_URL = "https://www.gov.uk";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-GB,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "no-cache",
};

export async function govUkVisasScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 15
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];
  const url = pageUrl || `${BASE_URL}/government/organisations/uk-visas-and-immigration`;

  const html = await fetchWithRetry(url, 25000, 3);
  if (!html) return [];

  const seen = new Set<string>();

  const docItemRe = /<li[^>]*class=["'][^"']*gem-c-document-list__item[^"']*["'][^>]*>([\s\S]*?)<\/li>/gi;
  let m: RegExpExecArray | null;
  while ((m = docItemRe.exec(html))) {
    const itemHtml = m[1];

    const titleMatch = itemHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!titleMatch) continue;
    const href = titleMatch[1];
    const title = stripHtml(titleMatch[2]).trim();
    if (!title || title.length < 4) continue;
    if (!href.startsWith("/government/")) continue;

    const abs = absolutizeUrl(href, BASE_URL).split("#")[0];
    const key = abs + title.slice(0, 50);
    if (seen.has(key)) continue;
    seen.add(key);

    const timeMatch = itemHtml.match(/<time[^>]*datetime=["']([^"']+)["']/i);
    const date = timeMatch ? parseDate(timeMatch[1]) || timeMatch[1].slice(0, 10) : null;

    const attrMatch = itemHtml.match(/<li[^>]*class=["'][^"']*gem-c-document-list__attribute[^"']*["'][^>]*>([\s\S]*?)<\/li>/i);
    const docType = attrMatch ? stripHtml(attrMatch[1]).trim() : "News";

    const record = makeRecord(
      title,
      `${docType} — ${sourceName}`,
      abs,
      sourceName,
      url,
      {
        organisation: "UK Visas & Immigration",
        location: "United Kingdom",
        deadline: date,
      }
    );
    if (record) records.push(record);
    if (records.length >= maxItems) break;
  }

  if (records.length === 0) {
    const extracted = stripHtml(html);
    if (extracted.length > 30) {
      const record = makeRecord(
        "UK Visas & Immigration — Latest Updates",
        extracted.slice(0, 2000),
        url,
        sourceName,
        url,
        { organisation: "UK Visas & Immigration", location: "United Kingdom" }
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
