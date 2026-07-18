// P0#1a — Generic, dependency-free HTML extractor for sources that have
// no RSS/JSON-API feed (scholarship pages, visa news, healthcare boards,
// etc.). Fetches the page server-side and pulls structured fields from:
//   1. JSON-LD (<script type="application/ld+json">)
//   2. Open Graph / Twitter card meta tags
//   3. <title> + first meaningful <h1>/<p> content
// Returns a single EvidenceRecord per source page (listing/info pages are
// treated as one opportunity; sub-page crawling is out of scope for the
// generic path). Output shape mirrors createRSSEvidence so the ingest
// route and process-queue need no changes downstream.

import { createHash } from "crypto";
import type { EvidenceRecord, EvidenceType } from "./evidence-adapters";

function computeHash(data: string): string {
  return createHash("sha256").update(data).digest("hex").slice(0, 64);
}

function stripHtml(text: string): string {
  return text
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/gi, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function orgFromUrl(url: string): string {
  try {
    const host = new URL(url).hostname.replace(/^www\./, "");
    const base = host.split(".")[0] || host;
    return base
      .split(/[-_]/)
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" ");
  } catch {
    return "";
  }
}

function absolutize(url: string, base: string): string {
  try {
    return new URL(url, base).toString();
  } catch {
    return url;
  }
}

function findJsonLd(html: string): Record<string, any> | null {
  const re = /<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(html))) {
    try {
      const parsed = JSON.parse(m[1].trim());
      const obj = Array.isArray(parsed) ? parsed[0] : parsed;
      if (obj && (obj.name || obj.headline || obj.title)) return obj;
    } catch {
      // ignore malformed blocks
    }
  }
  return null;
}

function metaContent(html: string, prop: string): string | null {
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

function firstMeaningful(html: string, tag: string): string | null {
  const re = new RegExp(`<${tag}[^>]*>([\s\S]*?)<\/${tag}>`, "i");
  const m = html.match(re);
  if (!m) return null;
  const text = stripHtml(m[1]);
  return text.length > 30 ? text : null;
}

function extractDeadline(text: string): string | null {
  const re =
    /\b(?:deadline|closing date|application deadline|apply by|submission deadline)\s*(?:is|on|:)?\s*([0-9]{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)[a-z]*\.?\s*[0-9]{0,4})/i;
  const m = text.match(re);
  return m ? m[1].trim() : null;
}

export interface ExtractedOpportunity {
  title: string;
  organisation: string;
  description: string;
  url: string;
  deadline: string | null;
  location: string;
  requirements: string | null;
}

export function extractFromHtml(html: string, pageUrl: string): ExtractedOpportunity {
  const jsonLd = findJsonLd(html);

  const ogTitle = metaContent(html, "og:title");
  const ogDesc = metaContent(html, "og:description");
  const twitterDesc = metaContent(html, "twitter:description");
  const titleTag = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1]
    ? stripHtml((html.match(/<title[^>]*>([\s\S]*?)<\/title>/i) || [])[1])
    : "";
  const h1 = firstMeaningful(html, "h1");

  const title =
    (jsonLd?.headline as string) ||
    (jsonLd?.name as string) ||
    ogTitle ||
    h1 ||
    titleTag ||
    orgFromUrl(pageUrl);

  const description =
    (jsonLd?.description as string) ||
    ogDesc ||
    twitterDesc ||
    firstMeaningful(html, "p") ||
    titleTag;

  const organisation =
    (jsonLd?.author?.name as string) ||
    (jsonLd?.provider?.name as string) ||
    (jsonLd?.publisher?.name as string) ||
    orgFromUrl(pageUrl);

  const bodyText = stripHtml(html).slice(0, 4000);
  const deadline = extractDeadline(bodyText + " " + (description || ""));

  return {
    title: (title || "").slice(0, 300),
    organisation: (organisation || "").slice(0, 200),
    description: (description || "").slice(0, 2000),
    url: pageUrl,
    deadline,
    location: "",
    requirements: null,
  };
}

export async function createScraperEvidence(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 1
): Promise<EvidenceRecord[]> {
  try {
    const response = await fetch(pageUrl, {
      signal: AbortSignal.timeout(15000),
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!response.ok) return [];
    const html = await response.text();
    const finalUrl = response.url || pageUrl;

    // Collect sub-page links that look like individual opportunities so a
    // listing page yields multiple records instead of one.
    const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>/gi;
    const seen = new Set<string>();
    const links: string[] = [];
    let lm: RegExpExecArray | null;
    while ((lm = linkRe.exec(html))) {
      const href = lm[1];
      if (!href || href.startsWith("#") || href.startsWith("mailto:")) continue;
      const abs = absolutize(href, finalUrl);
      // heuristic: individual items usually sit on a deeper, keyword-rich path
      if (/scholarship|opportunity|job|vacanc|visa|apply|detail|post|2[0-9]{3}/i.test(abs)) {
        const norm = abs.split("#")[0];
        if (!seen.has(norm) && links.length < maxItems) {
          seen.add(norm);
          links.push(norm);
        }
      }
    }

    const targets = links.length > 0 ? links : [finalUrl];
    const records: EvidenceRecord[] = [];

    for (const target of targets.slice(0, maxItems)) {
      let extracted: ExtractedOpportunity;
      if (target === finalUrl) {
        extracted = extractFromHtml(html, finalUrl);
      } else {
        try {
          const subRes = await fetch(target, {
            signal: AbortSignal.timeout(15000),
            headers: {
              "User-Agent":
                "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)",
              Accept: "text/html,application/xhtml+xml",
            },
            redirect: "follow",
          });
          if (!subRes.ok) continue;
          const subHtml = await subRes.text();
          extracted = extractFromHtml(subHtml, subRes.url || target);
        } catch {
          continue;
        }
      }

      if (!extracted.title && !extracted.description) continue;

      records.push({
        evidence_type: "web" as EvidenceType,
        raw_data: {
          title: extracted.title,
          organisation: extracted.organisation,
          description: extracted.description,
          url: extracted.url,
          deadline: extracted.deadline,
          salary: null,
          location: extracted.location,
          requirements: extracted.requirements,
        },
        source_url: pageUrl,
        source_name: sourceName,
        content_hash: computeHash(target + (extracted.title || "") + (extracted.description || "")),
      });
    }

    return records;
  } catch {
    return [];
  }
}
