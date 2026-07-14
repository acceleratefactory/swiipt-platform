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

// ─── Layer 2: Clearbit Logo Lookup ────────────────────────────
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

  const cleaned = name.replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, "");
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

export async function fetchOrgLogo(
  organisation: string,
  applicationUrl?: string | null
): Promise<CoverResult> {
  const domain = domainFromUrl(applicationUrl) || deriveDomain(organisation);
  if (!domain) return { cover_image_url: null, cover_source: "none" };

  const logoUrl = `https://icons.duckduckgo.com/ip3/${domain}.ico`;
  try {
    const res = await fetch(logoUrl, {
      method: "HEAD",
      signal: AbortSignal.timeout(5000),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.startsWith("image/")) {
        return { cover_image_url: logoUrl, cover_source: "logo" };
      }
    }
  } catch {}
  return { cover_image_url: null, cover_source: "none" };
}

// ─── Layer 3: Pollinations.ai Generated Cover ─────────────────
function buildAIPrompt(
  title: string,
  organisation: string,
  type: string,
  country: string
): string {
  const typeKeywords: Record<string, string> = {
    scholarship: "graduation cap, university campus, academic excellence",
    visa_programme: "passport, airplane, international travel, global city",
    remote_work: "laptop, digital nomad, modern workspace, coffee shop",
    job: "professional office, business meeting, career growth",
    fellowship: "research lab, academic collaboration, prestige",
    grant: "innovation, startup funding, business growth",
    internship: "young professional, learning, mentorship",
    training: "classroom, professional development, skill building",
    healthcare: "hospital, medical professionals, healthcare technology",
    sports_trial: "stadium, athletic field, sports training",
    competition: "trophy, winners podium, achievement",
    conference: "conference hall, networking, professional event",
    exchange: "world map, cultural exchange, international campus",
    trade_show: "exhibition hall, business networking, trade fair",
    residency: "home, community, new beginning",
    citizenship: "national flag, civic pride, belonging",
    funding: "financial growth, investment, opportunity",
    contest: "creative challenge, innovation, discovery",
    accelerator: "startup accelerator, technology, growth",
    award: "award ceremony, recognition, excellence",
  };

  const keywords = typeKeywords[type] || "professional opportunity, global career";
  return `Professional ${type.replace(/_/g, " ")} opportunity cover image, ${organisation}, ${country}, ${keywords}, modern clean design, high quality, no text, no watermark, cinematic lighting, 4k`;
}

async function generateAICover(
  title: string,
  organisation: string,
  type: string,
  country: string
): Promise<CoverResult> {
  const prompt = buildAIPrompt(title, organisation, type, country);
  const encodedPrompt = encodeURIComponent(prompt);
  const url = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1200&height=630&seed=42&nologo=true`;

  try {
    const res = await fetch(url, {
      method: "HEAD",
      signal: AbortSignal.timeout(15000),
    });
    if (res.ok) {
      const ct = res.headers.get("content-type") || "";
      if (ct.startsWith("image/")) {
        return { cover_image_url: url, cover_source: "ai" };
      }
    }
  } catch {}
  return { cover_image_url: null, cover_source: "none" };
}

// ─── Layer 4: Branded Template (SVG-based fallback) ───────────
const TYPE_COLORS: Record<string, [string, string]> = {
  scholarship: ["#0f766e", "#0d9488"],
  visa_programme: ["#1e40af", "#3b82f6"],
  remote_work: ["#6b21a8", "#8b5cf6"],
  job: ["#166534", "#22c55e"],
  fellowship: ["#92400e", "#d97706"],
  grant: ["#831843", "#ec4899"],
  internship: ["#1e3a5f", "#3b82f6"],
  training: ["#374151", "#6b7280"],
  healthcare: ["#0c4a6e", "#0284c7"],
  sports_trial: ["#14532d", "#22c55e"],
  competition: ["#7c2d12", "#f97316"],
  conference: ["#0f172a", "#334155"],
  exchange: ["#0e7490", "#06b6d4"],
  trade_show: ["#4c1d95", "#7c3aed"],
  residency: ["#0f766e", "#14b8a6"],
  citizenship: ["#1e40af", "#6366f1"],
  funding: ["#831843", "#ec4899"],
  contest: ["#7c2d12", "#f97316"],
  accelerator: ["#6b21a8", "#8b5cf6"],
  award: ["#92400e", "#d97706"],
};

const TYPE_ICONS: Record<string, string> = {
  scholarship: "🎓",
  visa_programme: "🌍",
  remote_work: "💻",
  job: "💼",
  fellowship: "⭐",
  grant: "💰",
  internship: "👩‍🎓",
  training: "📚",
  healthcare: "⚕️",
  sports_trial: "⚽",
  competition: "🏆",
  conference: "🌐",
  exchange: "✈️",
  trade_show: "🎪",
  residency: "🏠",
  citizenship: "📜",
  funding: "💰",
  contest: "⭐",
  accelerator: "🚀",
  award: "🏆",
};

function generateBrandedSVG(
  title: string,
  organisation: string,
  type: string,
  country: string
): string {
  const [from, to] = TYPE_COLORS[type] || ["#374151", "#6b7280"];
  const icon = TYPE_ICONS[type] || "🌍";
  const truncatedOrg =
    organisation.length > 30 ? organisation.slice(0, 27) + "…" : organisation;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:${from}"/>
      <stop offset="100%" style="stop-color:${to}"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <text x="600" y="260" text-anchor="middle" font-size="80" fill="white">${icon}</text>
  <text x="600" y="340" text-anchor="middle" font-size="28" font-family="system-ui, sans-serif" font-weight="600" fill="rgba(255,255,255,0.95)">${truncatedOrg}</text>
  <text x="600" y="380" text-anchor="middle" font-size="16" font-family="system-ui, sans-serif" fill="rgba(255,255,255,0.6)">${country}</text>
  <text x="600" y="580" text-anchor="middle" font-size="14" font-family="system-ui, sans-serif" fill="rgba(255,255,255,0.4)">Swiipt</text>
</svg>`;
}

async function generateBrandedCover(
  title: string,
  organisation: string,
  type: string,
  country: string
): Promise<CoverResult> {
  const svg = generateBrandedSVG(title, organisation, type, country);
  const encoded = encodeURIComponent(svg);
  const url = `data:image/svg+xml,${encoded}`;
  return { cover_image_url: url, cover_source: "branded" };
}

// ─── Orchestrator: Try all 4 layers in priority order ─────────
export async function getCoverImage(
  url: string | null,
  title: string,
  organisation: string,
  type: string,
  country: string
): Promise<CoverResult> {
  // Layer 1: OG image
  if (url) {
    const og = await fetchOGCover(url);
    if (og.cover_image_url) return og;
  }

  // Layer 2: DuckDuckGo favicon (derived from the real posting URL)
  const logo = await fetchOrgLogo(organisation, url);
  if (logo.cover_image_url) return logo;

  // Layer 3: AI generated
  const ai = await generateAICover(title, organisation, type, country);
  if (ai.cover_image_url) return ai;

  // Layer 4: Branded template
  const branded = await generateBrandedCover(title, organisation, type, country);
  return branded;
}
