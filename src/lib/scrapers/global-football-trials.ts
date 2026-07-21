import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, stripHtml, absolutizeUrl, parseDate } from "./utils";

const BASE_URL = "https://www.globalfootballtrials.com";

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

export async function globalFootballTrialsScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithRetry(pageUrl || BASE_URL, 25000, 3);
  if (!html) return [];

  const trials: Array<{ title: string; url: string; organisation: string; location: string; deadline: string | null }> = [];

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let m: RegExpExecArray | null;
  while ((m = linkRe.exec(html))) {
    const href = m[1];
    const linkText = stripHtml(m[2]).trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/(?:trial|academy|soccer|football|scout|club|junior|\d+\s*-\s*\d+)/i.test(linkText + href)) continue;
    if (linkText.length < 5) continue;
    const abs = absolutizeUrl(href, BASE_URL).split("#")[0];

    const locM = linkText.match(/(?:in|at|–)\s*([A-Za-z][A-Za-z\s,'-]+?)(?:\s*\d|$)/);
    const location = locM ? locM[1].trim().slice(0, 120) : "United Kingdom";

    const orgM = linkText.match(/^(.*?)\s+(?:trial|academy|club|fc|soccer)/i);
    const organisation = orgM ? orgM[1].trim().slice(0, 200) : "Global Football Trials";

    const deadlineM = linkText.match(/\b(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+\d{4})\b/i);
    const deadline = deadlineM ? parseDate(deadlineM[1]) : null;

    trials.push({ title: linkText.slice(0, 300), url: abs, organisation, location, deadline });
  }

  const seen = new Set<string>();
  for (const item of trials.slice(0, maxItems)) {
    const key = item.url;
    if (seen.has(key)) continue;
    seen.add(key);
    const record = makeRecord(item.title, "", item.url, sourceName, pageUrl || BASE_URL, {
      organisation: item.organisation,
      location: item.location,
      deadline: item.deadline,
      requirements: "Football trial",
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = stripHtml(html);
    if (extracted.length > 30) {
      const record = makeRecord(
        "Global Football Trials UK — Football Trials",
        extracted.slice(0, 2000),
        pageUrl || BASE_URL,
        sourceName,
        pageUrl || BASE_URL,
        { organisation: "Global Football Trials", location: "United Kingdom", requirements: "Football trial" }
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
