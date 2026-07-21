import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, stripHtml, absolutizeUrl, parseDate } from "./utils";

const BASE_URL = "https://jobbank.gc.ca";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-CA,en-US;q=0.9,en;q=0.8",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "no-cache",
};

export async function canadaJobBankScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];
  const url = pageUrl || `${BASE_URL}/jobsearch/jobsearch?searchstring=trades&sort=D`;

  const html = await fetchWithRetry(url, 25000, 3);
  if (!html) return [];

  const seen = new Set<string>();
  const listings: Array<{ title: string; url: string; organisation: string; location: string; deadline: string | null }> = [];

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    const linkText = stripHtml(m[2]).trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/\/job\//i.test(href)) continue;
    if (linkText.length < 4) continue;
    const abs = absolutizeUrl(href, BASE_URL).split("#")[0];
    const key = abs + linkText.slice(0, 50);
    if (seen.has(key)) continue;
    seen.add(key);
    const orgMatch = html.slice(m.index).match(/<span[^>]*class=["'][^"']*(?:org|employer|company)[^"']*["'][^>]*>([\s\S]*?)<\/span>/i);
    const org = orgMatch ? stripHtml(orgMatch[1]).trim() : "";
    listings.push({ title: linkText.slice(0, 300), url: abs, organisation: org || "Canada Job Bank", location: "Canada", deadline: null });
  }

  const dateRe = /(?:Posted|Date|Closing|Deadline)[:\s]*((?:\d{4}-\d{2}-\d{2})|(?:\d{1,2}\s+\w+\s+\d{4}))/gi;
  for (const item of listings.slice(0, maxItems)) {
    const record = makeRecord(item.title, "", item.url, sourceName, url, {
      organisation: item.organisation,
      location: item.location,
      deadline: item.deadline,
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = stripHtml(html);
    if (extracted.length > 30) {
      const record = makeRecord(
        "Canada Job Bank — Skilled Trades",
        extracted.slice(0, 2000),
        url,
        sourceName,
        url,
        { organisation: "Government of Canada", location: "Canada" }
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
