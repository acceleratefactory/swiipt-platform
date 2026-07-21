import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, extractFromHtmlGeneric, stripHtml, absolutizeUrl } from "./utils";

const BASE_URL = "https://www.imgacademy.com";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
};

export async function imgAcademyScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithRetry(pageUrl || `${BASE_URL}/sports/soccer`, 25000, 3);
  if (!html) return [];

  const extracted = extractFromHtmlGeneric(html, pageUrl);
  if (extracted.title) {
    const text = stripHtml(html).slice(0, 2000);
    const record = makeRecord(
      extracted.title,
      extracted.description || text,
      pageUrl || `${BASE_URL}/sports/soccer`,
      sourceName,
      pageUrl || `${BASE_URL}/sports/soccer`,
      {
        organisation: extracted.organisation || "IMG Academy",
        location: "Bradenton, Florida, USA",
      }
    );
    if (record) records.push(record);
  }

  const sports = ["soccer", "basketball", "baseball", "football", "lacrosse", "tennis", "golf", "track-and-field", "swimming", "volleyball"];
  const sportLinks = sports
    .filter((s) => !pageUrl || !pageUrl.includes(s))
    .map((s) => `${BASE_URL}/sports/${s}`);

  for (const url of sportLinks) {
    if (records.length >= maxItems) break;
    const record = makeRecord(
      `IMG Academy — ${url.split("/").pop()!.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}`,
      `IMG Academy sports program for ${url.split("/").pop()!.replace(/-/g, " ")}. Located in Bradenton, Florida.`,
      url,
      sourceName,
      pageUrl || `${BASE_URL}/sports/soccer`,
      {
        organisation: "IMG Academy",
        location: "Bradenton, Florida, USA",
      }
    );
    if (record) records.push(record);
  }

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;
  const seen = new Set<string>();
  while ((lm = linkRe.exec(html))) {
    const href = lm[1];
    const linkText = stripHtml(lm[2]).trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/(?:program|academy|camp|training|scholarship|admissions|register|apply)/i.test(linkText + href)) continue;
    if (linkText.length < 10) continue;
    const abs = absolutizeUrl(href, BASE_URL).split("#")[0];
    if (seen.has(abs)) continue;
    seen.add(abs);
    if (records.length >= maxItems) break;
    const record = makeRecord(linkText.slice(0, 250), linkText, abs, sourceName, pageUrl || `${BASE_URL}/sports/soccer`, {
      organisation: "IMG Academy",
      location: "Bradenton, Florida, USA",
    });
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
      if (text.length > 200) return text;
      if (attempt < retries) { await new Promise((r) => setTimeout(r, 1000)); continue; }
      return null;
    } catch {
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}
