import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, extractFromHtmlGeneric, stripHtml } from "./utils";

const BASE_URL = "https://www.gitex.com";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
};

export async function gitexScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithRetry(pageUrl || `${BASE_URL}/register`, 15000, 3);
  if (!html) return [];

  const extracted = extractFromHtmlGeneric(html, pageUrl);
  if (extracted.title) {
    const text = stripHtml(html).slice(0, 2000);
    const record = makeRecord(
      extracted.title,
      extracted.description || text,
      pageUrl || BASE_URL,
      sourceName,
      pageUrl || BASE_URL,
      {
        organisation: extracted.organisation || "GITEX Global",
        location: "Dubai, UAE",
      }
    );
    if (record) records.push(record);
  }

  const links = html.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi);
  if (links) {
    const seen = new Set<string>();
    for (const a of links) {
      const href = a.match(/href=["']([^"']+)["']/i)?.[1];
      const text = stripHtml(a).trim();
      if (!href || href.startsWith("#") || href.startsWith("mailto:") || text.length < 10) continue;
      if (!/(?:exhibitor|register|visit|conference|startup|seminar|workshop|award|summit)/i.test(text + href)) continue;
      const abs = href.startsWith("http") ? href : new URL(href, BASE_URL).toString();
      if (seen.has(abs)) continue;
      seen.add(abs);
      if (records.length >= maxItems) break;
      const record = makeRecord(`GITEX — ${text.slice(0, 200)}`, text, abs, sourceName, pageUrl || BASE_URL, {
        organisation: "GITEX Global",
        location: "Dubai, UAE",
      });
      if (record) records.push(record);
    }
  }

  return records.slice(0, maxItems);
}

async function fetchWithRetry(url: string, ms: number, retries: number): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(ms),
        headers: BROWSER_HEADERS,
        redirect: "follow",
      });
      if (!res.ok) { if (attempt < retries) { await new Promise((r) => setTimeout(r, 1000)); continue; } return null; }
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
