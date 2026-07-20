import type { EvidenceRecord } from "../evidence-adapters";
import { extractFromHtmlGeneric, makeRecord } from "./utils";

const VISA_PAGES = [
  {
    name: "UK Global Talent Visa",
    url: "https://www.gov.uk/global-talent-visa",
    org: "UK Visas & Immigration",
  },
  {
    name: "EU Blue Card",
    url: "https://ec.europa.eu/info/eu-blue-card_en",
    org: "European Commission",
  },
  {
    name: "Germany Opportunity Card",
    url: "https://www.make-it-in-germany.com/en/visa-residence/employment/opportunity-card",
    org: "Make It In Germany",
  },
  {
    name: "Canada Global Talent Stream",
    url: "https://www.canada.ca/en/employment-social-development/services/foreign-workers/global-talent.html",
    org: "Employment and Social Development Canada",
  },
  {
    name: "Australia Global Talent Visa",
    url: "https://immi.homeaffairs.gov.au/visas/getting-a-visa/visa-listing/global-talent858",
    org: "Australia Home Affairs",
  },
  {
    name: "Portugal D7 Visa",
    url: "https://www.sef.pt/en/pages/conteudo-detalhe.aspx?nID=82",
    org: "SEF Portugal",
  },
  {
    name: "Spain Digital Nomad Visa",
    url: "https://www.sepe.es/en/ciudadanos/detalle_ciudadano/detalle/visado-para-teletrabajo-de-caracter-internacional.html",
    org: "Spanish Government",
  },
];

async function fetchWithTimeout(url: string, ms: number): Promise<string | null> {
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(ms),
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; SwiiptBot/1.0; +https://swiipt.com)",
        Accept: "text/html,application/xhtml+xml",
      },
      redirect: "follow",
    });
    if (!res.ok) return null;
    return await res.text();
  } catch {
    return null;
  }
}

export async function ukVisaScraper(
  pageUrl: string,
  sourceName: string,
  _maxItems: number = 10
): Promise<EvidenceRecord[]> {
  const records: EvidenceRecord[] = [];

  const page = VISA_PAGES.find(p => p.name === sourceName);
  if (!page) return [];

  const html = await fetchWithTimeout(page.url, 15000);
  if (!html) return [];

  const extracted = extractFromHtmlGeneric(html, page.url);
  if (!extracted.title && !extracted.description) return [];

  const body = html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ");
  const text = body.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);

  const feeMatch = text.match(/\£([0-9,]+)/) || text.match(/€([0-9,]+)/) || text.match(/\$([0-9,]+)/);
  const salary = feeMatch ? `${feeMatch[0]}` : null;

  const record = makeRecord(
    extracted.title || sourceName,
    extracted.description || text.slice(0, 1000),
    page.url,
    sourceName,
    pageUrl,
    {
      organisation: page.org,
      deadline: null,
      location: page.url.includes("gov.uk") ? "United Kingdom" : page.url.includes("europa.eu") ? "European Union" : "",
      salary,
      requirements: "Visa-specific eligibility criteria apply",
    }
  );
  if (record) records.push(record);

  return records;
}
