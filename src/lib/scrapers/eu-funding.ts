import type { EvidenceRecord } from "../evidence-adapters";
import { computeHash, parseDate, stripHtml, extractFromHtmlGeneric, makeRecord, absolutizeUrl } from "./utils";

export async function euFundingScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const apiUrl = "https://ec.europa.eu/info/funding-tenders/opportunities/api/opportunities/v1/search";
  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(20000),
      method: "POST",
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)",
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({
        page: 0,
        size: Math.min(maxItems, 50),
        sort: "startDate",
        order: "DESC",
        programme: [],
        status: ["open", "upcoming"],
      }),
    });
    if (res.ok) {
      const json = await res.json();
      const results = json.results || json._embedded?.results || [];
      for (const item of results.slice(0, maxItems)) {
        const title = item.title || item.name || "";
        const url = item.url || item.guideUrl || item.callUrl || "";
        const id = item.id || item.callId || "";
        const fullUrl = url ? absolutizeUrl(url, "https://ec.europa.eu") : (id ? `https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-details/${id}` : pageUrl);
        const desc = (item.description || item.shortDescription || item.objective || "").replace(/<[^>]+>/g, "").trim();
        const deadline = parseDate(item.deadline || item.deadlineDate || item.submissionDeadline || item.closingDate || "");
        const budget = item.budget || item.euBudget || item.totalBudget || "";
        const org = "European Commission";
        const record = makeRecord(title, desc.slice(0, 2000), fullUrl, sourceName, pageUrl, {
          organisation: org,
          deadline,
          location: item.location || "Europe",
          salary: budget ? `€${Number(budget).toLocaleString()}` : null,
        });
        if (record) records.push(record);
      }
      if (records.length > 0) return records;
    }
  } catch { /* fall through */ }

  const searchUrl = "https://ec.europa.eu/info/funding-tenders/opportunities/portal/screen/opportunities/topic-search";
  const html = await fetchWithTimeout(searchUrl, 15000);
  if (!html) return [];

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set<string>();
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html)) && records.length < maxItems) {
    const href = lm[1];
    const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
    if (!/(?:funding|grant|call|tender|opportunity)/i.test(linkText + href)) continue;
    const abs = absolutizeUrl(href, searchUrl).split("#")[0];
    if (seen.has(abs)) continue;
    seen.add(abs);
    const record = makeRecord(linkText, "", abs, sourceName, pageUrl, {
      organisation: "European Commission",
    });
    if (record) records.push(record);
  }

  const extracted = extractFromHtmlGeneric(html, pageUrl);
  if (records.length === 0 && extracted.title) {
    const record = makeRecord(extracted.title, extracted.description, pageUrl, sourceName, pageUrl, {
      organisation: extracted.organisation || "European Commission",
    });
    if (record) records.push(record);
  }

  return records;
}

async function fetchWithTimeout(url: string, ms: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ms),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)",
        Accept: "text/html,application/json",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
