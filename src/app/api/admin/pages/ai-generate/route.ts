import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

const SYSTEM_PROMPT = `You are a content writer for Swiipt, a Nigerian global mobility platform. Generate a complete niche landing page for the given topic.

Return ONLY valid JSON with this exact structure. No explanation, no markdown, just the JSON object:

{
  "slug": "url-friendly-slug-here",
  "url_prefix": "move",
  "title": "Page title",
  "subtitle": "One sentence subtitle",
  "hero_headline": "Compelling hero headline",
  "hero_subtext": "Hero supporting text 1-2 sentences",
  "hero_cta_label": "Start my Fund",
  "destination": "Country name or null",
  "category": "residency_permit",
  "process_steps": [
    {"step": 1, "title": "Step title", "body": "Step description 1-2 sentences"},
    {"step": 2, "title": "Step title", "body": "Step description"}
  ],
  "requirements": ["Requirement 1", "Requirement 2", "Requirement 3"],
  "faqs": [
    {"q": "Common question?", "a": "Direct answer 2-3 sentences."},
    {"q": "Another question?", "a": "Direct answer."}
  ],
  "success_story_name": "Nigerian person name",
  "success_story_role": "Job title, now resident/worker in destination",
  "success_story_quote": "1-2 sentence authentic quote about their experience",
  "success_story_destination": "City, Country",
  "meta_title": "SEO page title under 60 chars",
  "meta_description": "SEO description under 155 chars",
  "cost_calculator_destination": "Country code or null",
  "cost_calculator_service_type": "residency or visa or company or null"
}

Rules:
- url_prefix must be one of: move, work, study, holiday, business, citizenship, remote, corporate, student, parents
- category must be one of: residency_permit, work_visa, remote_work_visa, second_citizenship, company_registration, holiday_package, general_travel, relocation_concierge
- Write for Nigerian professionals planning international moves
- Process steps: 4-6 steps
- Requirements: 5-8 items
- FAQs: 4-6 questions
- All content must be accurate for 2026
- Success story person should be Nigerian
- Meta title and description must contain the main keyword`;

interface ProviderConfig {
  url: string;
  model: string;
  apiKeyEnv: string;
  headers: (apiKey: string) => Record<string, string>;
  formatBody: (prompt: string, model: string) => unknown;
  parseContent: (data: any) => string;
}

const PROVIDERS: Record<string, ProviderConfig> = {
  anthropic: {
    url: "https://api.anthropic.com/v1/messages",
    model: "claude-sonnet-4-6",
    apiKeyEnv: "ANTHROPIC_API_KEY",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    }),
    formatBody: (prompt, model) => ({
      model,
      max_tokens: 4000,
      messages: [{ role: "user", content: `${SYSTEM_PROMPT}\n\nPrompt: ${prompt}` }],
    }),
    parseContent: (data) => data.content?.[0]?.text || "",
  },
  openai: {
    url: "https://api.openai.com/v1/chat/completions",
    model: "gpt-4o",
    apiKeyEnv: "OPENAI_API_KEY",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    formatBody: (prompt, model) => ({
      model,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
    parseContent: (data) => data.choices?.[0]?.message?.content || "",
  },
  gemini: {
    url: "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-pro:generateContent",
    model: "gemini-1.5-pro",
    apiKeyEnv: "GEMINI_API_KEY",
    headers: () => ({ "Content-Type": "application/json" }),
    formatBody: (prompt) => ({
      contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\nPrompt: ${prompt}` }] }],
    }),
    parseContent: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || "",
  },
  openrouter: {
    url: "https://openrouter.ai/api/v1/chat/completions",
    model: "openai/gpt-4o",
    apiKeyEnv: "OPENROUTER_API_KEY",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    formatBody: (prompt, model) => ({
      model,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
    parseContent: (data) => data.choices?.[0]?.message?.content || "",
  },
  deepseek: {
    url: "https://api.deepseek.com/v1/chat/completions",
    model: "deepseek-chat",
    apiKeyEnv: "DEEPSEEK_API_KEY",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    formatBody: (prompt, model) => ({
      model,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
    parseContent: (data) => data.choices?.[0]?.message?.content || "",
  },
  groq: {
    url: "https://api.groq.com/openai/v1/chat/completions",
    model: "llama3-70b-8192",
    apiKeyEnv: "GROQ_API_KEY",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    formatBody: (prompt, model) => ({
      model,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
    parseContent: (data) => data.choices?.[0]?.message?.content || "",
  },
  together: {
    url: "https://api.together.xyz/v1/chat/completions",
    model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
    apiKeyEnv: "TOGETHER_API_KEY",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    formatBody: (prompt, model) => ({
      model,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
    parseContent: (data) => data.choices?.[0]?.message?.content || "",
  },
  custom: {
    url: "", // resolved from env CUSTOM_AI_URL at runtime
    model: "", // resolved from env CUSTOM_AI_MODEL at runtime
    apiKeyEnv: "CUSTOM_AI_KEY",
    headers: (apiKey) => ({
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    }),
    formatBody: (prompt, model) => ({
      model,
      max_tokens: 4000,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: prompt },
      ],
    }),
    parseContent: (data) => data.choices?.[0]?.message?.content || "",
  },
};

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: role } = await (supabase as any)
    .from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { prompt, provider } = await request.json();
  if (!prompt?.trim()) {
    return NextResponse.json({ error: "Prompt is required." }, { status: 400 });
  }

  const providerName = provider || "anthropic";
  const config = PROVIDERS[providerName];
  if (!config) {
    return NextResponse.json({ error: `Unknown provider: "${providerName}". Supported: ${Object.keys(PROVIDERS).join(", ")}` }, { status: 400 });
  }

  const apiKey = process.env[config.apiKeyEnv];
  if (!apiKey) {
    return NextResponse.json({ error: `API key not configured for "${providerName}". Set ${config.apiKeyEnv} environment variable.` }, { status: 500 });
  }

  try {
    let model = config.model;
    let url = config.url;

    if (providerName === "custom") {
      const customUrl = process.env.CUSTOM_AI_URL;
      const customModel = process.env.CUSTOM_AI_MODEL;
      if (!customUrl) {
        return NextResponse.json({ error: 'Custom provider requires CUSTOM_AI_URL environment variable.' }, { status: 500 });
      }
      if (!customModel) {
        return NextResponse.json({ error: 'Custom provider requires CUSTOM_AI_MODEL environment variable.' }, { status: 500 });
      }
      url = customUrl;
      model = customModel;
    }

    const body = config.formatBody(prompt, model);

    // Gemini uses query param for API key
    if (providerName === "gemini") {
      url = `${url}?key=${apiKey}`;
    }

    const response = await fetch(url, {
      method: "POST",
      headers: config.headers(apiKey),
      body: JSON.stringify(body),
    });

    if (!response.ok) {
      const errData = await response.json().catch(() => ({}));
      console.error(`${providerName} API error:`, errData);
      return NextResponse.json({ error: `AI service (${providerName}) unavailable. Please fill the form manually.` }, { status: 500 });
    }

    const aiData = await response.json();
    const rawText = config.parseContent(aiData);
    if (!rawText) {
      return NextResponse.json({ error: "AI returned empty response. Please try again." }, { status: 500 });
    }

    let pageData;
    try {
      const cleaned = rawText.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      pageData = JSON.parse(cleaned);
    } catch {
      console.error("Failed to parse AI response:", rawText);
      return NextResponse.json({ error: "AI returned invalid data. Please try again or fill the form manually." }, { status: 500 });
    }

    const sanitized = {
      slug: pageData.slug || "",
      url_prefix: pageData.url_prefix || "move",
      title: pageData.title || "",
      subtitle: pageData.subtitle || "",
      hero_headline: pageData.hero_headline || "",
      hero_subtext: pageData.hero_subtext || "",
      hero_cta_label: pageData.hero_cta_label || "Get started free",
      hero_cta_url: "/signup",
      destination: pageData.destination || "",
      category: pageData.category || "residency_permit",
      process_steps: Array.isArray(pageData.process_steps) ? pageData.process_steps : [],
      requirements: Array.isArray(pageData.requirements) ? pageData.requirements : [],
      faqs: Array.isArray(pageData.faqs) ? pageData.faqs : [],
      success_story_name: pageData.success_story_name || "",
      success_story_role: pageData.success_story_role || "",
      success_story_quote: pageData.success_story_quote || "",
      success_story_destination: pageData.success_story_destination || "",
      meta_title: pageData.meta_title || "",
      meta_description: pageData.meta_description || "",
      cost_calculator_destination: pageData.cost_calculator_destination || "",
      cost_calculator_service_type: pageData.cost_calculator_service_type || "",
      related_page_slugs: [],
      recommended_goal_template_id: "",
      og_image_url: "",
      published: false,
    };

    return NextResponse.json({ page: sanitized });

  } catch (err) {
    console.error("AI generate error:", err);
    return NextResponse.json({ error: "AI generation failed. Please fill the form manually." }, { status: 500 });
  }
}
