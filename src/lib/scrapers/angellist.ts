import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, stripHtml, absolutizeUrl } from "./utils";

const PRIMARY_URL = "https://wellfound.com/jobs";
const FALLBACK_URL = "https://angel.co/jobs";

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

export async function angellistScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html =
    (await fetchWithRetry(PRIMARY_URL, 25000, 3)) ||
    (await fetchWithRetry(FALLBACK_URL, 25000, 3));
  if (!html) return [];

  const listings: Array<{ title: string; url: string; organisation: string }> = [];

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html))) {
    const href = lm[1];
    const linkText = stripHtml(lm[2]).trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/(?:job|career|role|engineer|designer|remote|hiring)/i.test(linkText + href)) continue;
    if (linkText.length < 4) continue;
    const abs = absolutizeUrl(href, PRIMARY_URL).split("#")[0];
    if (!/angel\.co|wellfound\.com/i.test(abs)) continue;
    const orgMatch = linkText.match(/^(.*?)\s*[—–-]\s*(.+)$/);
    const organisation = orgMatch ? orgMatch[1].trim().slice(0, 200) : "AngelList";
    listings.push({ title: linkText.slice(0, 300), url: abs, organisation });
  }

  for (const item of listings.slice(0, maxItems)) {
    const record = makeRecord(item.title, "", item.url, sourceName, pageUrl, {
      organisation: item.organisation,
      location: "Remote",
      requirements: "Remote role",
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = stripHtml(html);
    if (extracted.length > 30) {
      const record = makeRecord(
        "AngelList Talent — Startup Jobs",
        extracted.slice(0, 2000),
        PRIMARY_URL,
        sourceName,
        pageUrl,
        { organisation: "AngelList", location: "Remote" }
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
