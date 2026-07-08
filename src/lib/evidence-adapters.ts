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

export async function createRSSEvidence(
  feedUrl: string,
  sourceName: string,
  maxItems: number = 100
): Promise<EvidenceRecord[]> {
  const rssParser = new Parser();
  const response = await fetch(feedUrl, {
    signal: AbortSignal.timeout(10000),
    headers: { "User-Agent": "Swiipt-Bot/1.0 (opportunities@swiipt.com)" },
  });
  if (!response.ok) return [];

  const xml = await response.text();
  const feed = await rssParser.parseString(xml);
  const items = feed.items.slice(0, maxItems);

  return items
    .filter((item) => item.link && item.link !== "#")
    .map((item) => ({
      evidence_type: "rss" as EvidenceType,
      raw_data: {
        title: item.title || "",
        organisation: item.creator || item.author || "",
        description: stripHtml(item.contentSnippet || item.content || ""),
        url: item.link || "",
        deadline: item.isoDate || null,
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
    signal: AbortSignal.timeout(10000),
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
