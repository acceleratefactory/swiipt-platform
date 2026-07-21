import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, extractFromHtmlGeneric, stripHtml } from "./utils";

const BASE_URL = "https://www.righttodream.com";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function rightToDreamScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const academyPages = [
    { name: "Ghana Academy", url: `${BASE_URL}/ghana-academy` },
    { name: "Denmark Academy", url: `${BASE_URL}/denmark-academy` },
    { name: "Egypt Academy", url: `${BASE_URL}/egypt-academy` },
    { name: "San Diego Academy", url: `${BASE_URL}/san-diego-academy` },
    { name: "International Student-Athlete Pathway", url: `${BASE_URL}/education-pathway` },
    { name: "International Academy", url: `${BASE_URL}/international-academy` },
  ];

  const pagesToScrape = pageUrl
    ? [{ name: sourceName, url: pageUrl }, ...academyPages.filter((p) => p.url !== pageUrl)]
    : academyPages;

  for (const page of pagesToScrape) {
    if (records.length >= maxItems) break;

    const html = await fetchWithRetry(page.url, 20000, 2);
    if (!html) continue;

    const extracted = extractFromHtmlGeneric(html, page.url);
    const text = stripHtml(html).slice(0, 1500);

    const record = makeRecord(
      extracted.title || `Right to Dream — ${page.name}`,
      extracted.description || text || `Right to Dream ${page.name} — world-class football and education academy.`,
      page.url,
      sourceName,
      pageUrl || `${BASE_URL}/ghana-academy`,
      {
        organisation: extracted.organisation || "Right to Dream",
        location: page.name.includes("Ghana") ? "Ghana" :
                  page.name.includes("Denmark") ? "Denmark" :
                  page.name.includes("Egypt") ? "Egypt" :
                  page.name.includes("San Diego") ? "San Diego, USA" :
                  page.name.includes("International") ? "Global" : "Global",
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
