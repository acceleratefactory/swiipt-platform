import type { EvidenceRecord } from "../evidence-adapters";
import { parseDate, extractFromHtmlGeneric, makeRecord, absolutizeUrl } from "./utils";

export async function schwarzmanScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 1
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithTimeout(pageUrl, 15000);
  if (!html) return [];

  const extracted = extractFromHtmlGeneric(html, pageUrl);
  if (!extracted.title && !extracted.description) return [];

  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
  const deadline = parseDate(text);

  const record = makeRecord(
    extracted.title || "Schwarzman Scholars",
    extracted.description || text.slice(0, 1000),
    pageUrl,
    sourceName,
    pageUrl,
    {
      organisation: extracted.organisation || "Schwarzman Scholars",
      deadline,
      location: "Beijing, China",
      requirements: "Must be 18-28 years old, Bachelor's degree or first degree, English proficiency",
    }
  );
  if (record) records.push(record);

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set<string>();
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html)) && records.length < maxItems) {
    const href = lm[1];
    const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
    if (!/(?:apply|scholarship|program|admission)/i.test(linkText + href)) continue;
    const abs = absolutizeUrl(href, pageUrl).split("#")[0];
    if (seen.has(abs)) continue;
    seen.add(abs);
    const record = makeRecord(linkText, "", abs, sourceName, pageUrl, {
      organisation: "Schwarzman Scholars",
    });
    if (record) records.push(record);
  }

  return records;
}

async function fetchWithTimeout(url: string, ms: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ms),
      headers: { "User-Agent": "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
