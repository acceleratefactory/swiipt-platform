import Parser from "rss-parser";
import { createHash } from "crypto";

export type EvidenceType =
  | "rss"
  | "api"
  | "web"
  | "email"
  | "partner"
  | "pdf"
  | "government"
  | "social_facebook"
  | "social_linkedin"
  | "messaging"
  | "manual"
  | "url"
  | "watcher";

export interface EvidenceRecord {
  evidence_type: EvidenceType;
  raw_data: Record<string, any>;
  source_url: string | null;
  source_name: string | null;
  content_hash: string;
}

function computeHash(data: string): string {
  return createHash("sha256").update(data).digest("hex").slice(0, 64);
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, "").replace(/&[^;]+;/g, " ").trim();
}

/**
 * Tolerant pre-parse XML cleanup. rss-parser is strict and throws on the
 * malformed XML that many real-world feeds emit ("Attribute without value",
 * "Invalid character in entity name/tag name", "Unexpected close tag").
 * We fix the common cases so those feeds parse instead of being dropped.
 */
function sanitizeXml(xml: string): string {
  let s = xml;

  // 1) Escape stray '&' that are NOT the start of a valid entity
  //    (&amp; &lt; &gt; &quot; &#123; etc.). Raw '&' breaks the parser.
  s = s.replace(/&(?!(?:amp|lt|gt|quot|apos|#\d+|#x[0-9a-fA-F]+);)/g, "&amp;");

  // 2) Remove attributes that have no value (e.g. <tag foo> -> <tag>).
  //    Matches ` name` immediately followed by whitespace or `>` (not `=`).
  s = s.replace(/(\s+[a-zA-Z_:][-a-zA-Z0-9_:.]*)\s+(?=[\/>\s])/g, "$1");

  // 3) Strip invalid characters from tag/attribute names (e.g. stray
  //    '/' or '.' inside a name) — catch-all for parser "Invalid char".
  s = s.replace(/<(\/?)([^\s>\/]+)/g, (_m, slash, name) => {
    const cleaned = name.replace(/[^\w:.-]/g, "");
    return `<${slash}${cleaned}`;
  });

  return s;
}

/** Last-resort fallback: pull <item>/<entry> blocks via regex when the
 *  strict parser still fails. Returns minimal records so the source still
 *  yields something rather than 0 items. */
function extractItemsFallback(xml: string, sourceUrl: string, sourceName: string, maxItems: number): EvidenceRecord[] {
  const blocks = xml.match(/<(item|entry)[\s\S]*?<\/\1>/gi) || [];
  return blocks.slice(0, maxItems).map((block) => {
    const pick = (tag: string): string => {
      const m = block.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, "i"));
      return m ? stripHtml(m[1]).trim() : "";
    };
    const link =
      pick("link") ||
      (block.match(/<link[^>]*href=["']([^"']+)["']/i) || [])[1] ||
      "";
    return {
      evidence_type: "rss" as EvidenceType,
      raw_data: {
        title: pick("title"),
        organisation: pick("creator") || pick("author") || "",
        description: pick("description") || pick("summary") || pick("content") || "",
        url: link,
        deadline: null,
        published_date: pick("pubDate") || pick("updated") || pick("published") || null,
        salary: null,
        location: "",
        requirements: null,
      },
      source_url: sourceUrl,
      source_name: sourceName,
      content_hash: computeHash(link || pick("title") || ""),
    };
  });
}

export async function createRSSEvidence(
  feedUrl: string,
  sourceName: string,
  maxItems: number = 100
): Promise<EvidenceRecord[]> {
  const rssParser = new Parser();
  const response = await fetch(feedUrl, {
    signal: AbortSignal.timeout(30000),
    headers: { "User-Agent": "Swiipt-Bot/1.0 (opportunities@swiipt.com)" },
  });
  if (!response.ok) return [];

  const xml = await response.text();

  let items: any[] = [];
  try {
    const feed = await rssParser.parseString(sanitizeXml(xml));
    items = feed.items.slice(0, maxItems);
  } catch {
    // Strict parse failed even after sanitizing — fall back to regex extraction
    // so the source still produces records instead of being silently dropped.
    const fallback = extractItemsFallback(xml, feedUrl, sourceName, maxItems);
    items = fallback.map((r) => ({
      title: r.raw_data.title,
      creator: r.raw_data.organisation,
      contentSnippet: r.raw_data.description,
      link: r.raw_data.url,
      isoDate: r.raw_data.published_date,
    }));
  }

  return items
    .filter((item) => item.link && item.link !== "#")
    .map((item) => ({
      evidence_type: "rss" as EvidenceType,
      raw_data: {
        title: item.title || "",
        organisation: item.creator || item.author || "",
        description: stripHtml(item.contentSnippet || item.content || ""),
        url: item.link || "",
        deadline: null,
        published_date: item.isoDate || null,
        salary: null,
        location: "",
        requirements: null,
      },
      source_url: feedUrl,
      source_name: sourceName,
      content_hash: computeHash(item.link || item.title || ""),
    }));
}

export async function createAPIEvidence(
  apiUrl: string,
  sourceName: string,
  maxItems: number = 100
): Promise<EvidenceRecord[]> {
  const response = await fetch(apiUrl, {
    signal: AbortSignal.timeout(30000),
    headers: { "User-Agent": "Swiipt-Bot/1.0 (opportunities@swiipt.com)" },
  });
  if (!response.ok) return [];

  const data = await response.json();
  const items = Array.isArray(data) ? data.slice(0, maxItems) : [];

  return items
    .filter((item: any) => item.url || item.link || item.application_url)
    .map((item: any) => ({
      evidence_type: "api" as EvidenceType,
      raw_data: item,
      source_url: apiUrl,
      source_name: sourceName,
      content_hash: computeHash(JSON.stringify(item)),
    }));
}

export function createManualEvidence(
  data: Record<string, any>,
  sourceName: string
): EvidenceRecord {
  return {
    evidence_type: "manual",
    raw_data: data,
    source_url: null,
    source_name: sourceName,
    content_hash: computeHash(JSON.stringify(data)),
  };
}

export function createURLEvidence(
  url: string,
  data: Record<string, any>,
  sourceName: string
): EvidenceRecord {
  return {
    evidence_type: "url",
    raw_data: { ...data, url },
    source_url: url,
    source_name: sourceName,
    content_hash: computeHash(url + JSON.stringify(data)),
  };
}
