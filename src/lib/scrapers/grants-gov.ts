import type { EvidenceRecord } from "../evidence-adapters";
import { extractFromHtmlGeneric, makeRecord, absolutizeUrl } from "./utils";

export async function grantsGovScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithTimeout(pageUrl, 15000);
  if (!html) return [];

  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const grants: Array<{ title: string; url: string; desc: string; org: string; deadline: string | null; number: string }> = [];

  const oppNumberRe = /(?:opportunity\s*(?:number|#|id|no\.?)\s*[:,]\s*|opp\s*#\s*)([A-Z0-9\-]+)/gi;
  const titleLines = text.split(/(?:\r?\n)+|\.\s+(?=[A-Z])/);
  let currentNumber = "";

  for (const line of titleLines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const nm = oppNumberRe.exec(trimmed);
    if (nm) currentNumber = nm[1];

    if (/\b(?:department|agency|office|administration|institute|bureau|center|foundation|program)\b/i.test(trimmed) && /grant|funding|opportunity/i.test(trimmed)) {
      const title = trimmed.replace(/\s+/g, " ").replace(/opportunity\s*(?:number|#|id|no\.?)\s*[:,]\s*[A-Z0-9\-]+\s*/gi, "").trim().slice(0, 300);
      if (title.length > 20) {
        grants.push({ title, url: pageUrl, desc: "", org: "", deadline: null, number: currentNumber });
      }
    }
  }

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html))) {
    const href = lm[1];
    const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/(?:grant|funding|opportunity|foa|rfa|rfp)\b/i.test(linkText + href)) continue;
    if (linkText.length < 15) continue;
    const abs = absolutizeUrl(href, pageUrl).split("#")[0];
    if (grants.some(g => g.url === abs)) continue;
    const oppNum = href.match(/[A-Z]+-\d+-[A-Z]+-\d+/)?.[0] || "";
    grants.push({ title: linkText.slice(0, 300), url: abs, desc: "", org: "", deadline: null, number: oppNum });
  }

  const cardRe = /<(?:div|tr|li)[^>]*class=["'][^"']*(?:grant|opportunity|result|row|item)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|tr|li)>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = cardRe.exec(html))) {
    const cardHtml = cm[1];
    const title = (cardHtml.match(/<[a-z]+[^>]*>([\s\S]*?)<\/[a-z]+>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    const link = cardHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
    const desc = (cardHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    if (!title || title.length < 15) continue;
    const abs = link ? absolutizeUrl(link, pageUrl).split("#")[0] : pageUrl;
    if (grants.some(g => g.url === abs)) continue;
    const oppNum = (cardHtml.match(/[A-Z]+-\d+-[A-Z]+-\d+/)?.[0] || "");
    grants.push({ title: title.slice(0, 300), url: abs, desc: desc.slice(0, 1000), org: "", deadline: null, number: oppNum });
  }

  for (const g of grants.slice(0, maxItems)) {
    const record = makeRecord(g.title, g.desc || g.title, g.url, sourceName, pageUrl, {
      organisation: g.org || "Grants.gov",
      deadline: g.deadline,
      location: "United States",
      requirements: g.number ? `Opportunity Number: ${g.number}` : null,
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = extractFromHtmlGeneric(html, pageUrl);
    if (extracted.title) {
      const record = makeRecord(extracted.title, extracted.description, pageUrl, sourceName, pageUrl, {
        organisation: extracted.organisation || "Grants.gov",
        location: "United States",
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
