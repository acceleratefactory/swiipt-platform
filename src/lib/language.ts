import franc from "franc";

// Language detection for opportunity listings, used to keep the feed English
// for our (overwhelmingly English-speaking) users. See Session 46.
//
// `franc` returns ISO 639-3 codes. On description-length text English is
// reliably "eng"; on very short strings franc guesses and often returns "und"
// (undetermined) or "sco" (Scots — its well-known English confusion). We treat
// "eng", "sco" and "und" as English/keep so we never hide a genuine English
// listing, and treat any other confidently-detected language (deu/fra/spa/
// nld/...) as non-English.

// Below this many characters franc's guess is unreliable → treat as undetermined.
const MIN_LENGTH = 25;

// Codes we treat as "English / safe to show" (plus NULL handled at query level).
const ENGLISH_CODES = new Set(["eng", "sco", "und"]);

// P0#5 (§1.6) stopword backstop: short German/French/etc. titles that franc
// returns as 'und' are still caught here. These are extremely rare in genuine
// English opportunity titles, so false positives are negligible.
const NON_ENGLISH_STOPWORDS = new Set([
  "und", "der", "die", "das", "für", "mit", "von", "und", "oder", "nicht",
  "stellen", "bewerbung", "ausbildung", "berlin", "münchen", "köln", "stelle",
  "emploi", "candidature", "poste", "recrutement", "formation", "france",
  "trabajo", "empleo", "solicitud", "vacante", "españa", "mexico",
  "vacature", "solliciteer", "nederland", "werk", "baan",
  "lavoro", "candidatura", "italia", "offerta",
]);

function hasNonEnglishStopword(text: string): boolean {
  const words = text.toLowerCase().split(/[^a-zäöüßàâçéèêëîïôùûüæœ]+/i);
  return words.some((w) => NON_ENGLISH_STOPWORDS.has(w));
}

export function detectLanguage(text: string | null | undefined): string {
  const clean = (text || "").replace(/\s+/g, " ").trim();
  // P0#5: stopword backstop fires even on short text franc can't classify.
  if (clean.length > 0 && hasNonEnglishStopword(clean)) return "deu";
  if (clean.length < MIN_LENGTH) return "und";
  try {
    return franc(clean, { minLength: MIN_LENGTH });
  } catch {
    return "und";
  }
}

// Detect from an opportunity's title + description (more text = more accurate).
export function detectOpportunityLanguage(
  title?: string | null,
  description?: string | null
): string {
  const combined = [title, description].filter(Boolean).join(". ");
  return detectLanguage(combined);
}

// Whether a stored language code should be shown in the feed.
export function isEnglishCode(lang: string | null | undefined): boolean {
  return !lang || ENGLISH_CODES.has(lang);
}
