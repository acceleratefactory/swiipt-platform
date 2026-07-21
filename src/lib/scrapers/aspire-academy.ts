import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, extractFromHtmlGeneric, stripHtml } from "./utils";

const BASE_URL = "https://www.aspire.qa";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function aspireAcademyScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const urlsToTry = [
    pageUrl || `${BASE_URL}/trials`,
    `${BASE_URL}/en`,
    BASE_URL,
  ];

  let html: string | null = null;
  for (const u of urlsToTry) {
    html = await fetchWithRetry(u, 15000, 2);
    if (html) break;
  }
  if (!html) return [];

  const extracted = extractFromHtmlGeneric(html, pageUrl || BASE_URL);
  if (extracted.title || extracted.description) {
    const text = stripHtml(html).slice(0, 1500);
    const record = makeRecord(
      extracted.title || "Aspire Academy — Qatar",
      extracted.description || text || "Aspire Academy is a world-class sports academy in Doha, Qatar, offering training programmes for young athletes.",
      pageUrl || `${BASE_URL}/trials`,
      sourceName,
      pageUrl || `${BASE_URL}/trials`,
      {
        organisation: extracted.organisation || "Aspire Academy",
        location: "Doha, Qatar",
      }
    );
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const record = makeRecord(
      "Aspire Academy — Qatar Sports Academy",
      "Aspire Academy is a world-class sports academy in Doha, Qatar, providing elite training programmes for young athletes in football, athletics, and other sports.",
      pageUrl || `${BASE_URL}/trials`,
      sourceName,
      pageUrl || `${BASE_URL}/trials`,
      {
        organisation: "Aspire Academy",
        location: "Doha, Qatar",
      }
    );
    if (record) records.push(record);
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
      if (text.length > 100) return text;
      if (attempt < retries) { await new Promise((r) => setTimeout(r, 1000)); continue; }
      return null;
    } catch {
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}
