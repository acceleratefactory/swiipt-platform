import type { EvidenceRecord } from "../evidence-adapters";
import { parseDate, stripHtml, extractFromHtmlGeneric, makeRecord, absolutizeUrl } from "./utils";

export async function devpostScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const apiUrl = "https://devpost.com/api/hackathons?page=1&status[]=open&status[]=upcoming";
  try {
    const res = await fetch(apiUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)",
        Accept: "application/json",
      },
    });
    if (res.ok) {
      const json = await res.json();
      const challenges = json.hackathons || json.challenges || [];
      for (const c of challenges.slice(0, maxItems)) {
        const title = c.title || c.name || "";
        const url = c.url || c.link || "";
        const org = (c.organization_name || c.host || "").replace(/<[^>]+>/g, "").trim() || "Devpost";
        const desc = (c.short_description || c.description || c.tagline || "").replace(/<[^>]+>/g, "").trim();
        const deadline = parseDate(c.submission_period_dates || c.submission_deadline || c.deadline || "");
        const prize = c.prize_amount || c.total_prize_amount || "";
        const label = parsePrize(prize);
        const location = c.location || "Online";
        const record = makeRecord(title, desc.slice(0, 2000), url, sourceName, pageUrl, {
          organisation: org,
          deadline,
          location,
          salary: label || null,
          requirements: c.themes?.join(", ") || c.tags?.join(", ") || null,
        });
        if (record) records.push(record);
      }
      if (records.length > 0) return records;
    }
  } catch { /* fall through */ }

  const html = await fetchWithTimeout(pageUrl, 15000);
  if (!html) return [];

  const cardRe = /<article[^>]*class=["'][^"']*(?:hackathon-tile|challenge-card|card)[^"']*["'][^>]*>([\s\S]*?)<\/article>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = cardRe.exec(html)) && records.length < maxItems) {
    const cardHtml = cm[1];
    const title = extractField(cardHtml, /<h2[^>]*>([\s\S]*?)<\/h2>/i) || extractField(cardHtml, /<h3[^>]*>([\s\S]*?)<\/h3>/i) || "";
    const link = extractField(cardHtml, /<a[^>]+href=["']([^"']+)["'][^>]*>/i) || "";
    const description = extractField(cardHtml, /<p[^>]*>([\s\S]*?)<\/p>/i) || "";
    const dateText = extractField(cardHtml, /(?:date|deadline|submission)[^:]*:\s*([^<]+)/i) || "";
    const org = extractField(cardHtml, /(?:by|hosted by|organization)[^:]*:\s*([^<]+)/i) || "Devpost";
    const prize = extractField(cardHtml, /\$[0-9,]+(?:\s*[A-Z]{2,3})?(?:\s*in\s+prizes)?/i) || "";

    if (!title || !title.trim()) continue;
    const absUrl = link ? absolutizeUrl(link, pageUrl) : pageUrl;
    const deadline = parseDate(dateText);
    const record = makeRecord(stripHtml(title), stripHtml(description || "").slice(0, 2000), absUrl, sourceName, pageUrl, {
      organisation: stripHtml(org).trim() || "Devpost",
      deadline,
      salary: prize || null,
    });
    if (record) records.push(record);
  }

  const extracted = extractFromHtmlGeneric(html, pageUrl);
  if (records.length === 0 && extracted.title) {
    const record = makeRecord(extracted.title, extracted.description, pageUrl, sourceName, pageUrl, {
      organisation: extracted.organisation || "Devpost",
    });
    if (record) records.push(record);
  }

  return records;
}

function extractField(html: string, pattern: RegExp): string {
  const m = html.match(pattern);
  return m ? m[1]!.trim() : "";
}

function parsePrize(text: string): string {
  if (!text) return "";
  const n = text.replace(/[^0-9.]/g, "");
  if (n) return `$${parseInt(n).toLocaleString()}`;
  return text;
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
