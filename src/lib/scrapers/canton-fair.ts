import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, extractFromHtmlGeneric, stripHtml } from "./utils";

const BASE_URL = "https://www.cantonfair.org.cn";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9,zh-CN;q=0.8,zh;q=0.7",
};

export async function cantonFairScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithRetry(pageUrl || `${BASE_URL}/en-US`, 25000, 3);
  if (!html) return [];

  const extracted = extractFromHtmlGeneric(html, pageUrl);
  if (extracted.title || extracted.description) {
    const text = stripHtml(html).slice(0, 2000);
    const record = makeRecord(
      extracted.title || "Canton Fair — China Import and Export Fair",
      extracted.description || text,
      pageUrl || `${BASE_URL}/en-US`,
      sourceName,
      pageUrl || `${BASE_URL}/en-US`,
      {
        organisation: "China Foreign Trade Centre",
        location: "Guangzhou, China",
      }
    );
    if (record) records.push(record);
  }

  const sections = html.match(/<(?:h[23])[^>]*>([\s\S]*?)<\/(?:h[23])>/gi);
  if (sections) {
    for (const s of sections) {
      const title = stripHtml(s).trim();
      if (title.length > 10 && /(?:exhibitor|product|schedule|register|phase|session|fair|trade)/i.test(title)) {
        if (records.length >= maxItems) break;
        const record = makeRecord(
          `Canton Fair — ${title.slice(0, 200)}`,
          title,
          pageUrl || `${BASE_URL}/en-US`,
          sourceName,
          pageUrl || `${BASE_URL}/en-US`,
          {
            organisation: "China Foreign Trade Centre",
            location: "Guangzhou, China",
          }
        );
        if (record) records.push(record);
      }
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
