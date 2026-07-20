import type { EvidenceRecord } from "../evidence-adapters";
import { makeRecord, stripHtml } from "./utils";

const ALGOLIA_SEARCH =
  "https://hn.algolia.com/api/v1/search?tags=author_whoishiring&query=who%20is%20hiring&hitsPerPage=3";

export async function hnWhoIsHiringScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 25
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const search = await fetchJson(ALGOLIA_SEARCH);
  if (!search || !Array.isArray(search.hits) || search.hits.length === 0) return [];

  for (const hit of search.hits) {
    if (records.length >= maxItems) break;
    const threadId = hit.objectID;
    if (!threadId) continue;

    const thread = await fetchJson(`https://hn.algolia.com/api/v1/items/${threadId}`);
    if (!thread || !Array.isArray(thread.children)) continue;

    for (const child of thread.children) {
      if (records.length >= maxItems) break;
      const raw = child.text || "";
      if (!raw || raw.length < 30) continue;

      const plain = stripHtml(raw);
      const lines = plain.split("\n").map((l) => l.trim()).filter(Boolean);
      const firstLine = lines[0] || "HN: Who is hiring?";

      const urlMatch = raw.match(/href=["']([^"']+)["']/i);
      const url = urlMatch ? urlMatch[1] : `https://news.ycombinator.com/item?id=${child.id}`;

      const orgMatch = firstLine.match(/^(.*?)\s*[|]/);
      const organisation = orgMatch ? orgMatch[1].trim().slice(0, 200) : "Hacker News";

      const isRemote = /remote/i.test(plain);
      const locMatch = firstLine.match(/[|]\s*([^|]+?)\s*[|]/);
      const location = isRemote ? "Remote" : locMatch ? locMatch[1].trim().slice(0, 120) : "";

      const record = makeRecord(
        firstLine.slice(0, 300),
        plain.slice(0, 2000),
        url,
        sourceName,
        pageUrl,
        {
          organisation,
          location,
          requirements: isRemote ? "Remote role" : null,
        }
      );
      if (record) records.push(record);
    }
  }

  return records;
}

async function fetchJson(url: string): Promise<any | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(20000),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)",
        Accept: "application/json",
      },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  }
}
