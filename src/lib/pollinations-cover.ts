import { selectCoverStyle } from "@/components/dashboard/opportunities/cover-styles/selectCoverStyle";
import type { CoverStyle } from "@/components/dashboard/opportunities/cover-styles/selectCoverStyle";

const POLLINATIONS_BASE = "https://image.pollinations.ai/prompt";

const STYLE_A_PROMPTS: Record<string, string> = {
  scholarship: "abstract geometric shapes in deep teal and gold, minimalist, clean, editorial style, no text",
  fellowship: "abstract geometric shapes in warm amber and navy, minimalist, clean, editorial style, no text",
  grant: "abstract geometric shapes in rose and plum, minimalist, clean, editorial style, no text",
  award: "abstract geometric shapes in gold and midnight blue, elegant, minimalist, no text",
};

const STYLE_B_PROMPTS: Record<string, string> = {
  visa_programme: "professional immigration officer at modern airport counter, documentary photography style, natural light, no text",
  internship: "young professional in modern open-plan office working at laptop, documentary photography, natural light, no text",
  training: "professional in workshop training environment teaching a class, candid, documentary photography, no text",
  residency: "doctor in modern hospital corridor walking, documentary style, natural light, no text",
  healthcare: "healthcare professional in clinic consulting a patient, compassionate, documentary photography, no text",
};

const STYLE_D_PROMPTS: Record<string, string> = {
  trade_show: "wide angle photo of busy trade show exhibition floor, dramatic lighting, convention center, cinematic, no text",
  job: "modern city skyline at golden hour, professional business district, dramatic, cinematic, no text",
  remote_work: "laptop on wooden desk with ocean view window, remote work lifestyle, warm lighting, no text",
  trial: "wide angle empty sports stadium during golden hour, dramatic clouds, cinematic, no text",
  sports_trial: "football stadium during match, dramatic clouds, cinematic lighting, no text",
  citizenship: "passport and globe on wooden table, city skyline out of focus background, dramatic, no text",
};

const STYLE_A_DEFAULT = "abstract geometric shapes in modern colors, minimalist, clean, editorial style, no text";
const STYLE_B_DEFAULT = "professional in modern office environment, documentary photography style, natural light, no text";
const STYLE_D_DEFAULT = "dramatic wide angle landscape, cinematic lighting, sunset, professional photography, no text";

function getStyleAPrompt(type: string): string {
  return STYLE_A_PROMPTS[type] || STYLE_A_DEFAULT;
}

function getStyleBPrompt(type: string, country?: string): string {
  const base = STYLE_B_PROMPTS[type] || STYLE_B_DEFAULT;
  if (!country || country === "Global" || country === "Remote") return base;
  return `${base}, set in ${country}`;
}

function getStyleDPrompt(type: string, country?: string): string {
  const base = STYLE_D_PROMPTS[type] || STYLE_D_DEFAULT;
  if (!country || country === "Global" || country === "Remote") return base;
  return `${base}, ${country}`;
}

export function buildCoverPrompt(style: CoverStyle, type: string, country?: string): string | null {
  switch (style) {
    case "A": return getStyleAPrompt(type);
    case "B": return getStyleBPrompt(type, country);
    case "D": return getStyleDPrompt(type, country);
    case "C": return null;
  }
}

export function getPollinationsUrl(prompt: string): string {
  const encoded = encodeURIComponent(prompt);
  return `${POLLINATIONS_BASE}/${encoded}?width=400&height=500`;
}

export function getCoverForType(type: string, country?: string): { url: string | null; style: CoverStyle } {
  const style = selectCoverStyle(type);
  if (style === "C") return { url: null, style };
  const prompt = buildCoverPrompt(style, type, country);
  if (!prompt) return { url: null, style };
  return { url: getPollinationsUrl(prompt), style };
}
