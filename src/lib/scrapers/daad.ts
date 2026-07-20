import type { EvidenceRecord } from "../evidence-adapters";
import { parseDate, extractFromHtmlGeneric, makeRecord } from "./utils";

function tryParseScholarshipData(text: string): any[] | null {
  const patterns = [
    /var\s+scholarships\s*=\s*(\[[\s\S]*?\])\s*;/,
    /window\.scholarships\s*=\s*(\[[\s\S]*?\])\s*;/,
    /scholarships\s*=\s*(\[[\s\S]*?\])\s*;/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (m) {
      try { return JSON.parse(m[1]); } catch { /* try next */ }
    }
  }
  const arrStart = text.indexOf("[{");
  if (arrStart !== -1) {
    let depth = 0;
    let end = arrStart;
    for (let i = arrStart; i < text.length; i++) {
      if (text[i] === "[") depth++;
      if (text[i] === "]") { depth--; if (depth === 0) { end = i + 1; break; } }
    }
    try { return JSON.parse(text.slice(arrStart, end)); } catch { /* not valid JSON */ }
  }
  return null;
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

async function extractScholarshipDetail(url: string): Promise<{ description: string; deadline: string | null } | null> {
  const html = await fetchWithTimeout(url, 15000);
  if (!html) return null;
  const extracted = extractFromHtmlGeneric(html, url);
  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
  const deadline = parseDate(text);
  return {
    description: extracted.description || text.slice(0, 1000),
    deadline,
  };
}

export async function daadScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const dataUrl = "https://www.daad.de/bundles/daadstipendiendatenbanklsh/data/a/js/scholarships.js";
  const jsContent = await fetchWithTimeout(dataUrl, 20000);

  if (jsContent) {
    const data = tryParseScholarshipData(jsContent);
    if (data && Array.isArray(data)) {
      const items = data.slice(0, maxItems);
      for (const item of items) {
        const title = item.titel || item.title || item.name || "";
        const org = "DAAD";
        const desc = (item.kurzbeschreibung || item.description || item.teaser || "").slice(0, 2000);
        const slug = item.slug || item.id || "";
        const href = item.href || item.link || (slug ? `/deutschland/stipendium/datenbank/en/${slug}/` : "");
        const url = href ? new URL(href, pageUrl).toString() : pageUrl;
        let deadline: string | null = null;
        if (item.frist || item.deadline) {
          deadline = parseDate(String(item.frist || item.deadline));
        }
        const location = item.land || item.country || "Germany";
        const record = makeRecord(title, desc, url, sourceName, pageUrl, {
          organisation: org,
          deadline,
          location,
          requirements: item.voraussetzungen || item.requirements || null,
        });
        if (record) records.push(record);
      }
      if (records.length > 0) return records;
    }
  }

  const html = await fetchWithTimeout(pageUrl, 15000);
  if (!html) return [];

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const seen = new Set<string>();
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html))) {
    const href = lm[1];
    const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
    if (!/scholarship|stipendium|funding|apply/i.test(linkText)) continue;
    const abs = new URL(href, pageUrl).toString().split("#")[0];
    if (seen.has(abs) || records.length >= maxItems) continue;
    seen.add(abs);
    const detail = await extractScholarshipDetail(abs);
    const record = makeRecord(linkText, detail?.description || "", abs, sourceName, pageUrl, {
      organisation: "DAAD",
      deadline: detail?.deadline || null,
    });
    if (record) records.push(record);
  }

  const extracted = extractFromHtmlGeneric(html, pageUrl);
  if (records.length === 0 && extracted.title) {
    const record = makeRecord(extracted.title, extracted.description, pageUrl, sourceName, pageUrl, {
      organisation: extracted.organisation || "DAAD",
    });
    if (record) records.push(record);
  }

  return records;
}
