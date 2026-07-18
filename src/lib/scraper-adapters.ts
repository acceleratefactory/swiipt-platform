// P0#1a — Generic scraper adapter. Thin wrapper over the
// dependency-free HTML extractor so the ingest route can dispatch
// source_type='scraper' sources. Mirrors createRSSEvidence /
// createAPIEvidence's return shape (EvidenceRecord[]).

import { createScraperEvidence as extract } from "./html-extractor";
import type { EvidenceRecord } from "./evidence-adapters";

export async function createScraperEvidence(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  return extract(pageUrl, sourceName, maxItems);
}
