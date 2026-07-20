import type { EvidenceRecord } from "../evidence-adapters";
import { parseDate, stripHtml, extractFromHtmlGeneric, makeRecord, absolutizeUrl } from "./utils";

function extractEventseyeTable(html: string, baseUrl: string): Array<{ title: string; url: string; description: string; location: string; date: string | null }> {
  const results: Array<{ title: string; url: string; description: string; location: string; date: string | null }> = [];

  const tableRe = /<table[^>]*class=["'][^"']*tradeshows[^"']*["'][^>]*>([\s\S]*?)<\/table>/i;
  const tableMatch = html.match(tableRe);
  if (!tableMatch) return results;

  const tableHtml = tableMatch[1];
  const rowRe = /<tr[^>]*>([\s\S]*?)<\/tr>/gi;
  let rm: RegExpExecArray | null;
  while ((rm = rowRe.exec(tableHtml))) {
    const rowHtml = rm[1];
    if (!rowHtml.includes("<td")) continue;

    const cellMatches: RegExpExecArray[] = [];
    let cellM: RegExpExecArray | null;
    const cellRe = /<td[^>]*>([\s\S]*?)<\/td>/gi;
    while ((cellM = cellRe.exec(rowHtml))) cellMatches.push(cellM);
    const cells = cellMatches;
    if (cells.length < 4) continue;

    const nameCell = cells[0][1];
    const venueCell = cells[2][1];
    const dateCell = cells[3][1];

    const linkMatch = nameCell.match(/<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/i);
    if (!linkMatch) continue;
    const href = linkMatch[1];
    const linkHtml = linkMatch[2];

    const title = (linkHtml.match(/<b[^>]*>([\s\S]*?)<\/b>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    const desc = (linkHtml.match(/<i[^>]*>([\s\S]*?)<\/i>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    if (!title) continue;

    const absUrl = absolutizeUrl(href, baseUrl);
    const location = venueCell.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
    const dateStr = parseDate(dateCell) || parseDate(dateCell.replace(/<br\s*\/?>/i, " "));

    results.push({
      title: title.slice(0, 300),
      url: absUrl,
      description: desc.slice(0, 1500),
      location: location || "TBD",
      date: dateStr,
    });
  }

  return results;
}

export async function tenTimesScraper(
  pageUrl: string,
  sourceName: string,
  maxItems: number = 20
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const eventseyeUrl = "https://www.eventseye.com/fairs/d1_trade-shows_august_0.html";
  const esHtml = await fetchWithTimeout(eventseyeUrl, 15000);
  if (esHtml) {
    const listings = extractEventseyeTable(esHtml, eventseyeUrl);
    for (const item of listings.slice(0, maxItems)) {
      const record = makeRecord(item.title, item.description, item.url, sourceName, pageUrl, {
        organisation: sourceName,
        deadline: item.date,
        location: item.location,
      });
      if (record) records.push(record);
    }
    if (records.length > 0) return records;
  }

  const html = await fetchWithTimeout(pageUrl, 15000);
  if (!html) return [];

  const listings: Array<{ title: string; url: string; description: string; location: string; date: string | null }> = [];

  const linkRe = /<a[^>]+href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  let lm: RegExpExecArray | null;
  while ((lm = linkRe.exec(html))) {
    const href = lm[1];
    const linkText = lm[2].replace(/<[^>]+>/g, "").trim();
    if (!href || href.startsWith("#") || href.startsWith("mailto:") || href.startsWith("javascript:")) continue;
    if (!/(?:event|trade\s*show|exhibition|conference|summit|forum|expo|fair|convention|meet|workshop)/i.test(linkText + href)) continue;
    if (linkText.length < 10) continue;
    const abs = absolutizeUrl(href, pageUrl).split("#")[0];
    if (listings.some(l => l.url === abs)) continue;
    listings.push({ title: linkText.slice(0, 300), url: abs, description: "", location: "", date: null });
  }

  const cardRe = /<(?:div|article|li|tr)[^>]*class=["'][^"']*(?:event|card|tile|item|listing|show|fair|exhibition|conference)[^"']*["'][^>]*>([\s\S]*?)<\/(?:div|article|li|tr)>/gi;
  let cm: RegExpExecArray | null;
  while ((cm = cardRe.exec(html))) {
    const cardHtml = cm[1];
    const title = (cardHtml.match(/<h[23][^>]*>([\s\S]*?)<\/h[23]>/i)?.[1] || cardHtml.match(/<h4[^>]*>([\s\S]*?)<\/h4>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    const link = cardHtml.match(/<a[^>]+href=["']([^"']+)["'][^>]*>/i)?.[1] || "";
    const desc = (cardHtml.match(/<p[^>]*>([\s\S]*?)<\/p>/i)?.[1] || "").replace(/<[^>]+>/g, "").trim();
    if (!title || title.length < 10) continue;
    const abs = link ? absolutizeUrl(link, pageUrl).split("#")[0] : pageUrl;
    if (listings.some(l => l.url === abs)) continue;
    const locationMatch = cardHtml.match(/(?:location|venue|city)\s*[:;]\s*([^<]{2,60})/i);
    const location = locationMatch ? stripHtml(locationMatch[1]).trim() : "";
    const dateStr = parseDate(cardHtml);
    listings.push({ title: title.slice(0, 300), url: abs, description: desc.slice(0, 1000), location, date: dateStr });
  }

  for (const item of listings.slice(0, maxItems)) {
    let description = item.description;
    let deadline = item.date;
    let location = item.location;

    if (item.url && item.url !== pageUrl) {
      const detailHtml = await fetchWithTimeout(item.url, 10000);
      if (detailHtml) {
        const extracted = extractFromHtmlGeneric(detailHtml, item.url);
        if (extracted.description) description = extracted.description;
        const body = detailHtml.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
        const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
        if (!deadline) deadline = parseDate(text);
        if (!location) {
          const lc = text.match(/(?:location|venue|city)\s*[:;]\s*([^,]{2,60})/i);
          if (lc) location = lc[1].trim();
        }
      }
    }

    const record = makeRecord(item.title, description, item.url, sourceName, pageUrl, {
      organisation: sourceName,
      deadline,
      location: location || "TBD",
    });
    if (record) records.push(record);
  }

  if (records.length === 0) {
    const extracted = extractFromHtmlGeneric(html, pageUrl);
    if (extracted.title) {
      const record = makeRecord(extracted.title, extracted.description, pageUrl, sourceName, pageUrl, {
        organisation: extracted.organisation || sourceName,
        location: "TBD",
      });
      if (record) records.push(record);
    }
  }

  return records;
}

async function fetchWithTimeout(url: string, ms: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ms),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)",
        Accept: "text/html,application/xhtml+xml,application/json",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}
