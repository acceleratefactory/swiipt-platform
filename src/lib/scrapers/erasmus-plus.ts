import type { EvidenceRecord } from "../evidence-adapters";
import { parseDate, stripHtml, extractFromHtmlGeneric, makeRecord, absolutizeUrl } from "./utils";

export async function erasmusPlusScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const oppUrl = "https://erasmus-plus.ec.europa.eu/opportunities";
  const html = await fetchWithTimeout(oppUrl, 15000);
  if (!html) return [];

  const listings: Array<{ title: string; url: string; description: string; deadline: string | null; org: string }> = [];

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html))) {
    const href = lm[1];
    const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/(?:erasmus|exchange|study\s*abroad|internship|training|youth|volunteer|mobility|capacity\s*building|partnership|cooperation|funding|opportunity)/i.test(linkText + href)) continue;
    if (linkText.length < 15) continue;
    const abs = absolutizeUrl(href, oppUrl).split("#")[0];
    if (listings.some(l => l.url === abs)) continue;
    listings.push({ title: linkText.slice(0, 300), url: abs, description: "", deadline: null, org: "" });
  }

  const cardRe = /<(?:div|article|li)[^>]*class=["'][^"']*(?:card|item|tile|listing|opportunity|result|teaser)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li)>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = cardRe.exec(html))) {
    const cardHtml = cm[1];
    const title = (cardHtml.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    const link = cardHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
    const desc = (cardHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    if (!title || title.length < 10) continue;
    const abs = link ? absolutizeUrl(link, oppUrl).split("#")[0] : oppUrl;
    if (listings.some(l => l.url === abs)) continue;
    const dateStr = parseDate(cardHtml);
    const orgMatch = cardHtml.match(/(?:by|organisation|organization|provider|coordinator)\s*[:;]\s*([^<]{2,60})/i);
    listings.push({
      title: title.slice(0, 300),
      url: abs,
      description: desc.slice(0, 1000),
      deadline: dateStr,
      org: orgMatch ? stripHtml(orgMatch[1]).trim() : "",
    });
  }

  for (const item of listings.slice(0, maxItems)) {
    let description = item.description;
    let deadline = item.deadline;
    let org = item.org || "European Commission";

    if (item.url && item.url !== oppUrl) {
      const detailHtml = await fetchWithTimeout(item.url, 10000);
      if (detailHtml) {
        const extracted = extractFromHtmlGeneric(detailHtml, item.url);
        if (extracted.description) description = extracted.description;
        if (extracted.organisation) org = extracted.organisation;
        const body = detailHtml.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
        const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (!deadline) deadline = parseDate(text);
      }
    }

    const record = makeRecord(item.title, description, item.url, sourceName, pageUrl, {
      organisation: org,
      deadline,
      location: "Europe",
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = extractFromHtmlGeneric(html, oppUrl);
    if (extracted.title) {
      const record = makeRecord(extracted.title, extracted.description, oppUrl, sourceName, pageUrl, {
        organisation: extracted.organisation || "European Commission",
        location: "Europe",
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
        "User-Agent": "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)",
        Accept: "text/html,application/xhtml+xml,application/json",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
