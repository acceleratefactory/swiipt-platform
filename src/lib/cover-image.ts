import { fetchOGMedia } from "./og-fetch";

// ─── Types ────────────────────────────────────────────────────
interface CoverResult {
  cover_image_url: string | null;
  cover_source: "og" | "logo" | "ai" | "branded" | "none";
}

// ─── Layer 1: OG Image (already built in og-fetch.ts) ─────────
async function fetchOGCover(url: string): Promise<CoverResult> {
  const og = await fetchOGMedia(url);
  if (og.cover_image_url) {
    return { cover_image_url: og.cover_image_url, cover_source: "og" };
  }
  return { cover_image_url: null, cover_source: "none" };
}

// ─── Layer 2: Logo.dev Lookup (resolves the ACTUAL employer) ──
const LEGAL_SUFFIXES = new Set([
  "gmbh", "ltd", "limited", "inc", "llc", "plc", "corp", "co", "ag", "bv",
  "pty", "group", "holding", "holdings", "international", "intl", "global",
  "uk", "usa", "sa", "oy", "kg", "ug",
]);

const JOB_BOARD_NAMES = [
  "arbeitnow", "lever", "greenhouse", "linkedin", "indeed", "remoteok",
  "weworkremotely", "wellfound", "ycombinator", "remote ok", "workable",
  "smartrecruiters", "ashby", "broadbean",
];

function isJobBoardName(org: string): boolean {
  const o = org.toLowerCase().trim();
  return JOB_BOARD_NAMES.some((b) => o === b || o.includes(b));
}

function deriveDomain(organisation: string): string | null {
  const name = organisation.toLowerCase().trim();
  const knownDomains: Record<string, string> = {
    google: "google.com",
    microsoft: "microsoft.com",
    apple: "apple.com",
    amazon: "amazon.com",
    meta: "meta.com",
    facebook: "facebook.com",
    "world health organization": "who.int",
    nhs: "nhs.uk",
    "united nations": "un.org",
    worldbank: "worldbank.org",
    "world bank": "worldbank.org",
    ford: "ford.com",
    bmw: "bmw.com",
    toyota: "toyota.com",
    chevening: "chevening.org",
    daad: "daad.de",
    fulbright: "fulbrightonline.org",
    gates: "gatescambridge.org",
    ycombinator: "ycombinator.com",
    "y combinator": "ycombinator.com",
  };

  if (knownDomains[name]) return knownDomains[name];

  const cleaned = name
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => !LEGAL_SUFFIXES.has(w))
    .join("");
  if (cleaned.length > 2) return `${cleaned}.com`;
  return null;
}

function domainFromUrl(url: string | null | undefined): string | null {
  if (!url) return null;
  try {
    const host = new URL(url).hostname.toLowerCase();
    const parts = host.split(".");
    if (parts.length >= 2) return parts.slice(-2).join(".");
    if (parts.length === 1 && parts[0].length > 2) return parts[0];
    return null;
  } catch {
    return null;
  }
}

// Heuristic: pull an employer name out of the posting title/description.
function extractEmployerFromText(
  title?: string | null,
  description?: string | null
): string | null {
  const text = `${title || ""}. ${description || ""}`;
  if (!text.trim()) return null;

  const patterns = [
    /\bat\s+([A-Z][\w&.\-]+(?:\s[A-Z][\w&.\-]+){0,3})/,
    /\bwith\s+([A-Z][\w&.\-]+(?:\s[A-Z][\w&.\-]+){0,3})/,
    /\bfor\s+([A-Z][\w&.\-]+(?:\s[A-Z][\w&.\-]+){0,3})/,
    /([A-Z][\w&.\-]+(?:\s[A-Z][\w&.\-]+){0,3})\s*(?:is hiring|are hiring|hiring)/,
    /join\s+([A-Z][\w&.\-]+(?:\s[A-Z][\w&.\-]+){0,3})/,
    /([A-Z][\w&.\-]+(?:\s[A-Z][\w&.\-]+){0,3})\s*[–—-]\s*(?:remote|full[\s-]?time|part[\s-]?time|intern)/i,
  ];

  for (const re of patterns) {
    const m = text.match(re);
    if (m && m[1]) {
      const cand = m[1].trim().replace(/[.,)\]]+$/, "");
      if (cand.length >= 2 && cand.length <= 60) return cand;
    }
  }
  return null;
}

async function tryLogoDevName(name: string): Promise<string | null> {
  const key = process.env.LOGO_DEV_API_KEY;
  if (!key) return null;
  const url = `https://img.logo.dev/name/${encodeURIComponent(name)}?token=${key}&size=200&format=png&fallback=404`;
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.startsWith("image/")) return url;
    }
  } catch {}
  return null;
}

async function tryLogoDevDomain(domain: string): Promise<string | null> {
  const key = process.env.LOGO_DEV_API_KEY;
  if (!key) return null;
  const url = `https://img.logo.dev/${domain}?token=${key}&size=200&format=png&fallback=404`;
  try {
    const res = await fetch(url, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.startsWith("image/")) return url;
    }
  } catch {}
  return null;
}

const GENERIC_ORGS = new Set(["unknown", "untitled", "n/a", "na", "tbd", ""]);

// Resolves the real employer logo, NOT the job-board domain.
export async function fetchOrgLogo(
  organisation: string,
  applicationUrl?: string | null,
  title?: string | null,
  description?: string | null
): Promise<CoverResult> {
  const key = process.env.LOGO_DEV_API_KEY;
  if (!key) return { cover_image_url: null, cover_source: "none" };

  const org = (organisation || "").trim();
  const isGeneric = !org || GENERIC_ORGS.has(org.toLowerCase());

  // 1. Employer NAME → logo.dev name endpoint (preferred; gives the real logo)
  if (!isGeneric && !isJobBoardName(org)) {
    const cleaned = org
      .replace(/\b(gmbh|ltd|limited|inc|llc|plc|corp|co|ag|b\.v\.|pty|group|holdings?|international|global)\b\.?/gi, "")
      .replace(/\s+/g, " ")
      .trim();
    if (cleaned.length > 1) {
      const logo = await tryLogoDevName(cleaned);
      if (logo) return { cover_image_url: logo, cover_source: "logo" };
    }
  }

  // 2. Employer extracted from the posting text
  const extracted = extractEmployerFromText(title, description);
  if (extracted && !isJobBoardName(extracted)) {
    const logo = await tryLogoDevName(extracted);
    if (logo) return { cover_image_url: logo, cover_source: "logo" };
  }

  // 3. Domain derived from the org name
  const derived = deriveDomain(org);
  if (derived) {
    const logo = await tryLogoDevDomain(derived);
    if (logo) return { cover_image_url: logo, cover_source: "logo" };
  }

  // 4. Job-board / application URL domain (last resort — kept to preserve coverage)
  const urlDomain = domainFromUrl(applicationUrl);
  if (urlDomain) {
    const logo = await tryLogoDevDomain(urlDomain);
    if (logo) return { cover_image_url: logo, cover_source: "logo" };
  }

  return { cover_image_url: null, cover_source: "none" };
}

// ─── Orchestrator: real opportunity image first, else no cover ──
// When no real image exists we return null and let the card render an
// intentional, on-brand fallback (logo-on-colour or typographic tile) —
// we never generate a fake/guessed image.
export async function getCoverImage(
  url: string | null,
  _title: string,
  _organisation: string,
  _type: string,
  _country: string,
  sourceUrl?: string | null
): Promise<CoverResult> {
  // Layer 1: the original opportunity image (OG / page hero). Prefer the
  // posting URL; if it has no image (job-board apply/tracking links often
  // don't), fall back to the source listing URL, which usually carries it.
  if (url) {
    const og = await fetchOGCover(url);
    if (og.cover_image_url) return og;
  }
  if (sourceUrl) {
    const og = await fetchOGCover(sourceUrl);
    if (og.cover_image_url) return og;
  }

  return { cover_image_url: null, cover_source: "none" };
}
