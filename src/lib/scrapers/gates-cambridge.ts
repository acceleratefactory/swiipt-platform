import type { EvidenceRecord } from "../evidence-adapters";
import { extractFromHtmlGeneric, makeRecord } from "./utils";

export async function gatesCambridgeScraper(
  pageUrl: string,
  sourceName: string,
  _maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const html = await fetchWithTimeout(pageUrl, 15000);
  if (!html) return [];

  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

  const title = "Gates Cambridge Scholarship";
  const sections: { heading: string; content: string }[] = [];

  const headingRe = /<h([23])[^>]*>([\s\S]*?)<\/h\1>/gi;
  let hm: RegExpExecArray | null;
  while ((hm = headingRe.exec(html))) {
    const hText = hm[2].replace(/<[^>]+>/g, "").trim();
    if (!hText || hText.length < 3) continue;

    const start = hm.index + hm[0].length;
    const nextHeading = new RegExp(`<h[${parseInt(hm[1]) <= 2 ? 2 : 3}][^>]*>`, "i");
    const rest = html.substring(start);
    const nextMatch = rest.match(nextHeading);
    const sectionHtml = nextMatch ? rest.substring(0, nextMatch.index) : rest;
    const sectionText = sectionHtml
      .replace(/<script[\s\S]*?<\/script>/gi, " ")
      .replace(/<style[\s\S]*?<\/style>/gi, " ")
      .replace(/<[^>]+>/g, " ")
      .replace(/\s+/g, " ")
      .trim();

    if (sectionText.length > 20) {
      sections.push({ heading: hText, content: sectionText });
    }
  }

  if (sections.length > 0) {
    const fullDescription = sections
      .map(s => `${s.heading}: ${s.content}`)
      .join("\n")
      .slice(0, 2000);

    let deadline: string | null = null;
    const dlMatch = text.match(/(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\s+\d{4})/i);
    if (dlMatch) {
      deadline = dlMatch[1];
    }

    const record = makeRecord(title, fullDescription, pageUrl, sourceName, pageUrl, {
      organisation: "Gates Cambridge Trust",
      location: "United Kingdom (Cambridge)",
      deadline,
      requirements: "Postgraduate study at University of Cambridge",
    });
    if (record) records.push(record);
  } else {
    const extracted = extractFromHtmlGeneric(html, pageUrl);
    const description = extracted.description || text.slice(0, 2000);
    const record = makeRecord(title, description, pageUrl, sourceName, pageUrl, {
      organisation: "Gates Cambridge Trust",
      location: "United Kingdom (Cambridge)",
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
