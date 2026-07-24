import type { AIEnrichRequest } from "./providers/index";

export function buildDefaultPrompt(request: AIEnrichRequest): string {
  const { task, data, tier } = request;

  switch (task) {
    case "process-queue":
      return buildProcessQueuePrompt(data, tier);
    case "ingest-parse":
      return buildIngestParsePrompt(data, tier);
    case "paste-url":
      return buildPasteUrlPrompt(data);
    case "public-submission":
      return buildPublicSubmissionPrompt(data);
    case "translate":
      return buildTranslatePrompt(data);
    case "content-clean":
      return buildContentCleanPrompt(data);
    default:
      return JSON.stringify(data);
  }
}

// Shared English-output rule injected into enrichment prompts (Session 46 Step 2).
const ENGLISH_RULE = `IMPORTANT: The audience is English-speaking. If any input field is not in English, TRANSLATE it into natural, fluent English. Every field you return MUST be in English — never return German, French, or any other language.`;

const CLEAN_DESC_RULE = `Return a clean plaintext description with NO HTML entities, NO markup, NO social tags (#hashtags, @mentions, URLs). Maximum 200 words.`;

export function buildProcessQueuePrompt(data: Record<string, any>, tier?: string): string {
  const isFormatOnly = tier === "trusted" || tier === "standard";
  const instructions = isFormatOnly
    ? `Clean and format the following opportunity data. Fix typos, format the description (100-150 words), extract a clean title, a clean organisation name, and assign the best-matching type and segment. Do NOT evaluate legitimacy or confidence — that is not your job. ${CLEAN_DESC_RULE}`
    : `Analyze this opportunity for Swiipt, a Nigerian global mobility platform. Return valid JSON only.

Evaluate: confidence_score (0.0-1.0), is_legitimate, is_relevant_for_nigerians, is_scam_risk.
Then provide: cleaned_title, cleaned_description (100-200 words), cleaned_organisation, location_country, location_city, type, segment_slug, salary_range, deadline, requirements. ${CLEAN_DESC_RULE}`;

  return `You are an opportunity processing assistant for Swiipt.
${instructions}

${ENGLISH_RULE}

RAW DATA:
Title: ${data.raw_title || ""}
Organisation: ${data.raw_organisation || ""}
Location: ${data.raw_location || ""}
Description: ${data.raw_description || ""}
Salary/Funding: ${data.raw_salary || ""}
Deadline: ${data.raw_deadline || ""}
URL: ${data.raw_url || ""}
Requirements: ${data.raw_requirements || ""}

Return valid JSON only, no markdown.`;
}

// Translate an existing opportunity's text fields to English (Session 46 Step 2).
// Only translates — does not re-evaluate, re-categorise, or invent fields.
export function buildTranslatePrompt(data: Record<string, any>): string {
  return `You are a professional translator for Swiipt. Translate the following opportunity fields into natural, fluent English.

Rules:
- Preserve the original meaning, tone, and all factual details (names, dates, amounts, URLs).
- Do NOT summarise, shorten, embellish, or add information.
- Keep proper nouns (organisation names, cities) as-is unless they have a common English form.
- If a field is already in English, return it unchanged.
- Return valid JSON only, no markdown, with exactly these keys:
{
  "title": "English title",
  "description": "English description",
  "organisation": "English organisation name",
  "requirements": "English requirements or null"
}

FIELDS TO TRANSLATE:
Title: ${data.title || ""}
Organisation: ${data.organisation || ""}
Requirements: ${data.requirements || ""}
Description: ${data.description || ""}

Return valid JSON only, no markdown.`;
}

function buildIngestParsePrompt(data: Record<string, any>, tier?: string): string {
  if (tier === "trusted") {
    return `Extract structured fields from this RSS/feed item. Return valid JSON:
{
  "title": "cleaned title",
  "description": "cleaned description",
  "organisation": "extracted org name",
  "location_country": "country or null",
  "type": "job|scholarship|fellowship|visa_programme|sports_trial|remote_work|internship|training|grant|competition|conference|exchange|trade_show|trial|healthcare|residency|citizenship|funding|contest|accelerator|award",
  "segment_slug": "best matching segment slug",
  "deadline": "YYYY-MM-DD or null",
  "salary_range": "formatted or null"
}

Raw: ${JSON.stringify(data)}`;
  }
  return buildProcessQueuePrompt(data, tier);
}

export function buildPasteUrlPrompt(data: Record<string, any>): string {
  return `You are an opportunity pre-fill assistant. Based on this URL metadata, suggest fields for a new opportunity. Return valid JSON:
{
  "title": "suggested title",
  "description": "100-150 word summary",
  "organisation": "org name",
  "location_country": "country",
  "location_city": "city or null",
  "type": "job|scholarship|fellowship|visa_programme|sports_trial|remote_work|internship|training|grant|competition|conference|exchange|trade_show|trial|healthcare|residency|citizenship|funding|contest|accelerator|award",
  "segment_slug": "best segment slug",
  "salary_range": "if available or null",
  "deadline": "YYYY-MM-DD or null",
  "requirements": "extracted requirements or null"
}

URL: ${data.url || ""}
OG Title: ${data.og_title || ""}
OG Description: ${data.og_description || ""}
OG Image: ${data.og_image || ""}`;
}

function buildPublicSubmissionPrompt(data: Record<string, any>): string {
  return `You are a quality control agent for Swiipt. Analyze this user-submitted opportunity and return valid JSON:
{
  "confidence_score": 0.0-1.0,
  "is_legitimate": true/false,
  "is_scam_risk": true/false,
  "cleaned_title": "improved title",
  "cleaned_description": "improved description",
  "cleaned_organisation": "org",
  "location_country": "country",
  "location_city": "city or null",
  "type": "best type slug",
  "segment_slug": "best segment slug",
  "rejection_reason": "reason if confidence below 0.6 or null"
}

Submitted Data: ${JSON.stringify(data)}`;
}

export function buildContentCleanPrompt(data: Record<string, any>): string {
  return `You are an editorial assistant for Swiipt, a Nigerian platform helping Africans access global opportunities. Clean and rewrite this opportunity content for a mobile feed card.

${ENGLISH_RULE}

SOURCE DATA:
Title: ${data.rawTitle || ""}
Description: ${data.rawDescription || ""}
Requirements: ${data.rawRequirements || ""}
Salary/Funding: ${data.rawSalary || ""}
Deadline: ${data.rawDeadline || ""}
Organisation: ${data.organisation || ""}
Country: ${data.locationCountry || ""}
Type: ${data.opportunityType || ""}

RULES:
1. Title: max 80 characters. Lead with the outcome for a Nigerian reader. Not the programme name.
   Good: "Germany funds your Master's — DAAD Scholarship 2027"
   Bad: "DAAD Scholarships in Germany for Development-Related Postgraduate Courses"
2. Description (card preview): max 200 characters. What do they get? How much? Nothing else.
   Good: "DAAD funds your full postgraduate degree in Germany. €992–€1,300/month stipend + health insurance + travel allowance."
   Bad: Long paragraph copied from source.
3. Full description (detail page): max 600 characters. 2-3 sentences covering: what it is, what you get, who can apply. Plain English. No copied text. No HTML.
4. Requirements: extract the 3-4 most important eligibility criteria. Rewrite in plain English. Format: "Criterion 1 · Criterion 2 · Criterion 3". Max 300 characters.
5. Funding display: the money/benefit in one line. Format: amount + currency + frequency + key extras. Max 80 characters.
   Good: "€992–€1,300/month + health insurance + travel allowance"
   Good: "£32,000–£38,000/year + visa sponsorship"
   Good: "Full tuition + $35,000/year living allowance + flights"
6. Deadline: extract as YYYY-MM-DD. If range given (e.g. "August-October 2026"), use last day of range (2026-10-31). If no deadline found, return null. Never guess.
7. Editorial score (0-100): score this opportunity on impact (20), trust (20), urgency (15), audience fit for Nigerians (15), accessibility (15), difficulty (10), evergreen value (5).

Return ONLY valid JSON, no other text:
{
  "success": true,
  "title": "string (max 80 chars)",
  "description": "string (max 200 chars)",
  "full_description": "string (max 600 chars)",
  "requirements": "string (max 300 chars, bullet format with ·)",
  "funding_display": "string (max 80 chars)",
  "deadline": "YYYY-MM-DD or null",
  "editorial_score": 0-100,
  "failure_reason": null
}

If you cannot produce a clean title and description (e.g. source data is too incomplete), return:
{
  "success": false,
  "failure_reason": "brief explanation",
  "title": "",
  "description": "",
  "full_description": "",
  "requirements": "",
  "funding_display": "",
  "deadline": null,
  "editorial_score": 0
}`;
}
