import type { EvidenceRecord } from "../evidence-adapters";
import { parseDate, extractFromHtmlGeneric, makeRecord } from "./utils";

const BASE_URL = "https://www.scholars4dev.com";

export async function scholars4devScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithTimeout(BASE_URL + "/", 15000);
  if (!html) return [];

  const listings: Array<{ title: string; url: string }> = [];

  const linkRe = /<a[^>]+href=["'](https:\/\/www\.scholars4dev\.com\/\d+\/[^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html))) {
    const href = lm[1];
    const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
    if (!href || linkText.length < 5) continue;
    if (/(?:read more|comments|reply|facebook|twitter|pinterest)/i.test(linkText)) continue;
    if (listings.some(l => l.url === href)) continue;
    listings.push({ title: linkText.slice(0, 300), url: href });
  }

  for (const item of listings.slice(0, maxItems)) {
    const detailHtml = await fetchWithTimeout(item.url, 10000);
    if (!detailHtml) {
      const record = makeRecord(item.title, "", item.url, sourceName, pageUrl, {
        organisation: "Scholars4Dev",
        location: "International",
      });
      if (record) records.push(record);
      continue;
    }

    const body = detailHtml.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
    const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

    const titleTag = (detailHtml.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "").trim();
    const h1 = (detailHtml.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    const title = h1 || titleTag.replace(/\s+\|\s+Scholars4Dev.*$/i, "").trim();

    const article = detailHtml.match(/<(?:article|div)[^>]*class=["'][^"']*(?:entry|content|post)[^"']*["'][^>]*>([\s\S]*?)<\/(?:article|div)>/i);
    const description = article
      ? article[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 2000)
      : text.slice(0, 2000);

    let deadline: string | null = null;
    const dlMatch = text.match(/\bDeadline\s*:\s*([^|]+)/i);
    if (dlMatch) deadline = parseDate(dlMatch[1].trim());

    let organisation = "Scholars4Dev";
    const orgMatch = text.match(/\b(?:Host\s+)?(?:Institution|University|Organisation|Organization)\s*[\(:]?\s*([^|)]+)/i);
    if (orgMatch) organisation = orgMatch[1].trim();

    let location = "International";
    const locMatch = text.match(/\bStudy\s+in\s*:\s*([^|]+)/i);
    if (locMatch) location = locMatch[1].trim();

    let level = "";
    const levelMatch = text.match(/\bDegree\s*:\s*([^|]+)/i);
    if (levelMatch) level = levelMatch[1].trim();

    const record = makeRecord(title, description, item.url, sourceName, pageUrl, {
      organisation,
      deadline,
      location,
      requirements: level || null,
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = extractFromHtmlGeneric(html, BASE_URL);
    if (extracted.title) {
      const record = makeRecord(extracted.title, extracted.description, BASE_URL, sourceName, pageUrl, {
        organisation: extracted.organisation || "Scholars4Dev",
        location: "International",
      });
      if (record) records.push(record);
    }
  }

  return records;
}

async function fetchWithTimeout(url: string, ms: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ms),
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        Accept: "text/html,application/xhtml+xml,application/xml;q=0.9",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
