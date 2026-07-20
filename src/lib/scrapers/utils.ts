import { createHash } from "crypto";
import type { EvidenceRecord, EvidenceType } from "../evidence-adapters";

export function computeHash(data: string): string {
  return createHash("sha256").update(data).digest("hex").slice(0, 64);
}

export function stripHtml(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function absolutizeUrl(href: string, base: string): string {
  try {
    return new URL(href, base).toString();
  } catch {
    return href;
  }
}

export function parseDate(text: string): string | null {
  const months: Record<string, number> = {
    jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
    jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11,
  };
  const patterns: RegExp[] = [
    /\b(\d{1,2})\s+(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{4})\b/i,
    /\b(jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})\b/i,
    /\b(\d{4})-(\d{2})-(\d{2})\b/,
    /\b(\d{1,2})\/(\d{1,2})\/(\d{4})\b/,
  ];
  for (const p of patterns) {
    const m = text.match(p);
    if (!m) continue;
    if (m[0].includes("-")) {
      return m[0];
    }
    if (m[0].includes("/")) {
      const [, mo, d, y] = m;
      return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
    const day = m[1]!.length <= 2 ? parseInt(m[1]!) : parseInt(m[2]!);
    const monStr = m[1]!.length <= 2 ? m[2]! : m[1]!;
    const year = parseInt(m[3]!);
    const mon = months[monStr.slice(0, 3).toLowerCase()];
    if (mon === undefined) return null;
    const d = m[1]!.length <= 2 ? parseInt(m[1]!) : parseInt(m[2]!);
    return `${year}-${String(mon + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
  }
  return null;
}

export function metaContent(html: string, prop: string): string | null {
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*content=["']([^"']*)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']*)["'][^>]+(?:property|name)=["']${prop}["']`, "i"),
  ];
  for (const p of patterns) {
    const m = html.match(p);
    if (m) return stripHtml(m[1]);
  }
  return null;
}

export function findJsonLd(html: string): Record<string, any> | null {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const obj = Array.isArray(parsed) ? parsed[0] : parsed;
      if (obj && (obj.name || obj.headline || obj.title)) return obj;
    } catch { /* skip malformed */ }
  }
  return null;
}

export function makeRecord(
  title: string,
  description: string,
  url: string,
  sourceName: string,
  pageUrl: string,
  extra?: Partial<EvidenceRecord["raw_data"]>
): EvidenceRecord | null {
  const t = (title || "").slice(0, 300);
  const d = (description || "").slice(0, 2000);
  if (!t && !d) return null;
  return {
    evidence_type: "web" as EvidenceType,
    raw_data: {
      title: t,
      organisation: extra?.organisation || "",
      description: d,
      url: url,
      deadline: extra?.deadline || null,
      salary: extra?.salary || null,
      location: extra?.location || "",
      requirements: extra?.requirements || null,
      ...extra,
    },
    source_url: pageUrl,
    source_name: sourceName,
    content_hash: computeHash(url + t + d),
  };
}

export function extractFromHtmlGeneric(html: string, pageUrl: string): { title: string; description: string; organisation: string } {
  const jsonLd = findJsonLd(html);
  const ogTitle = metaContent(html, "og:title");
  const ogDesc = metaContent(html, "og:description");
  const h1m = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  const h1 = h1m ? stripHtml(h1m[1]) : "";
  const titleTag = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || "");
  const title = (jsonLd?.headline as string) || (jsonLd?.name as string) || ogTitle || h1 || stripHtml(titleTag) || "";
  const description = (jsonLd?.description as string) || ogDesc || metaContent(html, "twitter:description") || "";
  const organisation = (jsonLd?.author?.name as string) || (jsonLd?.provider?.name as string) || (jsonLd?.publisher?.name as string) || "";
  return { title: title.slice(0, 300), description: (description || "").slice(0, 2000), organisation: organisation.slice(0, 200) };
}
