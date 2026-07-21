import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, stripHtml, absolutizeUrl } from "./utils";

const BASE_URL = "https://www.peopleperhour.com";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-GB,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "no-cache",
};

export async function peoplePerHourScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithRetry(pageUrl || BASE_URL, 25000, 3);
  if (!html) return [];

  const offers: Array<{ title: string; url: string; organisation: string; description: string; salary: string }> = [];

  const offerRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = offerRe.exec(html))) {
    const href = m[1];
    const linkText = stripHtml(m[2]).trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/(?:freelancer|offer|gig|service|hire|expert|profession)/i.test(linkText) && linkText.length < 10) continue;
    if (linkText.length < 5) continue;
    const abs = absolutizeUrl(href, BASE_URL).split("#")[0];
    if (offers.some((o) => o.url === abs)) continue;

    const orgMatch = linkText.match(/^(.+?)\s+by\s+(.+)$/i);
    const organisation = orgMatch ? orgMatch[2].trim().slice(0, 200) : "PeoplePerHour Freelancer";
    const title = orgMatch ? orgMatch[1].trim().slice(0, 300) : linkText.slice(0, 300);

    const priceMatch = html.slice(0, m.index).match(/\$(\d[\d,]*)\s*(?:delivered|per\s+project|price)/i);
    const salary = priceMatch ? "$" + priceMatch[1] : "";

    offers.push({ title, url: abs, organisation, description: "", salary });
  }

  const seen = new Set<string>();
  const deduped = offers.filter((o) => {
    const key = o.url + o.title.slice(0, 30);
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });

  for (const item of deduped.slice(0, maxItems)) {
    const record = makeRecord(item.title, item.description, item.url, sourceName, pageUrl || BASE_URL, {
      organisation: item.organisation,
      location: "Remote",
      salary: item.salary,
      requirements: "Freelance gig",
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = stripHtml(html);
    if (extracted.length > 30) {
      const record = makeRecord(
        "PeoplePerHour — Hire Freelancers",
        extracted.slice(0, 2000),
        pageUrl || BASE_URL,
        sourceName,
        pageUrl || BASE_URL,
        { organisation: "PeoplePerHour", location: "Remote" }
      );
      if (record) records.push(record);
    }
  }

  return records;
}

async function fetchWithRetry(url: string, ms: number, retries: number): Promise<string | null> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        signal: AbortSignal.timeout(ms),
        headers: BROWSER_HEADERS,
        redirect: "follow",
      });
      if (!res.ok) return null;
      const text = await res.text();
      return text.length > 200 ? text : null;
    } catch {
      if (attempt < retries) await new Promise((r) => setTimeout(r, 1000));
    }
  }
  return null;
}
