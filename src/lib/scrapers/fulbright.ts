import type { EvidenceRecord } from "../evidence-adapters";
import { extractFromHtmlGeneric, makeRecord, absolutizeUrl } from "./utils";

const BASE_URL = "https://us.fulbrightonline.org";

export async function fulbrightScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithTimeout(BASE_URL + "/about/fulbright-us-student-program", 15000);
  if (!html) return [];

  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const categories: Array<{ title: string; description: string; url: string }> = [];

  const h3Re = /<h3[^>]*>([\s\S]*?)<\/h3>/gi;
  let hm: RegExpExecArray | null;
  while ((hm = h3Re.exec(html))) {
    const catTitle = hm[1].replace(/<[^>]+>/g, "").trim();
    if (!catTitle || catTitle.length < 3) continue;

    const snippetStart = hm.index;
    const snippet = html.substring(snippetStart, snippetStart + 2000);
    const pMatch = snippet.match(/<p[^>]*>([\s\S]*?)<\/p>/i);
    const description = pMatch
      ? pMatch[1].replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()
      : "";

    const linkMatch = snippet.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i);
    const link = linkMatch ? absolutizeUrl(linkMatch[1], BASE_URL).split("#")[0] : BASE_URL;

    if (categories.some(c => c.title === catTitle)) continue;
    categories.push({
      title: `Fulbright - ${catTitle}`,
      description: description.slice(0, 2000),
      url: link,
    });
  }

  const competitionMatch = text.match(/(\d{4}-\d{4})\s+Competition/i);
  const competitionYear = competitionMatch ? competitionMatch[1] : "2027-2028";

  for (const cat of categories.slice(0, maxItems)) {
    const record = makeRecord(cat.title, cat.description, cat.url, sourceName, pageUrl, {
      organisation: "Fulbright Program",
      location: "International",
      deadline: null,
      requirements: `Competition: ${competitionYear}`,
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = extractFromHtmlGeneric(html, pageUrl);
    if (extracted.title) {
      const record = makeRecord(extracted.title, extracted.description, pageUrl, sourceName, pageUrl, {
        organisation: "Fulbright Program",
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
