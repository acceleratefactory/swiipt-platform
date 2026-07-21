import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, stripHtml, absolutizeUrl, parseDate } from "./utils";

const BASE_URL = "https://www.nursingjobs.com.au";

const BROWSER_HEADERS: Record<string, string> = {
  "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
  Accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
  "Accept-Language": "en-AU,en;q=0.9",
  "Accept-Encoding": "gzip, deflate, br",
  "Upgrade-Insecure-Requests": "1",
  "Sec-Fetch-Dest": "document",
  "Sec-Fetch-Mode": "navigate",
  "Sec-Fetch-Site": "none",
  "Sec-Fetch-User": "?1",
  "Cache-Control": "no-cache",
};

export async function nursingJobsAuScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithRetry(pageUrl || BASE_URL, 25000, 3);
  if (!html) return [];

  const jobs: Array<{
    title: string;
    url: string;
    organisation: string;
    location: string;
    salary: string;
    description: string;
    deadline: string | null;
  }> = [];

  const jobBlocks = html.split(/<div[^>]*class="[^"]*job[^"]*"[^>]*>/gi);
  const fallbackBlocks = html.split(/<div[^>]*(?:listing|result|card|item)[^>]*>/gi);
  const blocks = jobBlocks.length > 1 ? jobBlocks : fallbackBlocks;

  for (const block of blocks.slice(0, 30)) {
    if (jobs.length >= maxItems) break;

    const linkM = block.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkM) continue;
    const href = linkM[1];
    const linkText = stripHtml(linkM[2]).trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (linkText.length < 5) continue;

    const abs = absolutizeUrl(href, BASE_URL).split("#")[0];
    if (jobs.some((j) => j.url === abs)) continue;

    const text = stripHtml(block);

    const orgM = text.match(/(?:at|for|–)\s*([A-Za-z][A-Za-z\s,.'&]+?)(?:\s*\d|$)/);
    const organisation = orgM ? orgM[1].trim().slice(0, 200) : "Nursing Jobs Australia";

    const locM = text.match(/(?:location|locality|area|in)\s*[:\s]+(.+?)(?:\s*[´\d$]|$)/i) ||
                text.match(/^(.+?)(?:,|\s+–)/);
    const location = locM ? locM[1].trim().slice(0, 120) : "Australia";

    const salaryM = text.match(/\$[\d,]+(?:\s*–\s*\$[\d,]+)?(?:\s*per\s+(?:annum|year|hour|yr))?/i);
    const salary = salaryM ? salaryM[0] : "";

    const deadlineM = text.match(/(?:closes?|apply\s+by|deadline)\s*:?\s*(.+?(?:\d{4}))/i);
    const deadline = deadlineM ? parseDate(deadlineM[1]) : null;

    jobs.push({ title: linkText.slice(0, 300), url: abs, organisation, location, salary, description: text.slice(0, 500), deadline });
  }

  const seen = new Set<string>();
  for (const job of jobs) {
    const key = job.url;
    if (seen.has(key)) continue;
    seen.add(key);
    const record = makeRecord(job.title, job.description, job.url, sourceName, pageUrl || BASE_URL, {
      organisation: job.organisation,
      location: job.location,
      salary: job.salary,
      deadline: job.deadline,
      requirements: "Nursing job",
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = stripHtml(html);
    if (extracted.length > 30) {
      const record = makeRecord(
        "Nursing Jobs Australia — Nursing Positions",
        extracted.slice(0, 2000),
        pageUrl || BASE_URL,
        sourceName,
        pageUrl || BASE_URL,
        { organisation: "Nursing Jobs Australia", location: "Australia" }
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
