import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, stripHtml } from "./utils";

const BASE_URL = "https://africanbusinessheroes.org";
const APPLY_URL = "https://africanbusinessheroes.org/apply";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-US,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "no-cache",
};

export async function africanBusinessHeroesScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html =
    (await fetchWithRetry(pageUrl || APPLY_URL, 25000, 3)) ||
    (await fetchWithRetry(BASE_URL, 25000, 3));
  if (!html) return [];

  const text = stripHtml(html);

  const prizeMatch = text.match(/\$\d[\d,]*/);
  const deadlineMatch = text.match(/\b(deadline|by|closes?)\s*:?\s*(.+?(?:\d{4}))/i);

  const record = makeRecord(
    "African Business Heroes — Entrepreneurship Competition",
    text.slice(0, 2000),
    pageUrl || APPLY_URL,
    sourceName,
    pageUrl || APPLY_URL,
    {
      organisation: "African Business Heroes",
      location: "Africa",
      requirements: prizeMatch ? "Prize: " + prizeMatch[0] : "Entrepreneurship competition",
      deadline: deadlineMatch ? deadlineMatch[2].trim() : null,
    }
  );
  if (record) records.push(record);

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
