import { NextRequest, NextResponse } from "next/server";
import { omnirouteProvider } from "@/lib/ai/providers/omniroute";
import { geminiProvider } from "@/lib/ai/providers/gemini";
import { opencodeProvider } from "@/lib/ai/providers/opencode";
import { openrouterProvider } from "@/lib/ai/providers/openrouter";

const ADAPTERS: Record<string, any> = {
  omniroute: omnirouteProvider,
  gemini: geminiProvider,
  opencode: opencodeProvider,
  openrouter: openrouterProvider,
};

const ENV_MAP: Record<string, string> = {
  omniroute: "OMNIROUTE_API_KEY",
  gemini: "GEMINI_API_KEY",
  opencode: "OPENCODE_API_KEY",
  openrouter: "OPENROUTER_API_KEY",
};

const SLUGS = ["omniroute", "gemini", "opencode", "openrouter"];

const DUMMY: any = {
  task: "process-queue",
  tier: "standard",
  data: {
    raw_title: "Test Scholarship for Nigerian Students",
    raw_organisation: "Swiipt Test Foundation",
    raw_location: "Lagos, Nigeria",
    raw_description: "A test opportunity used to verify AI provider connectivity.",
    raw_url: "https://example.com/test",
  },
};

async function directCheck(slug: string, apiKey: string): Promise<any> {
  try {
    if (slug === "gemini") {
      const url = `https://generativelanguage.googleapis.com/v1/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ contents: [{ parts: [{ text: "Reply with: pong" }] }] }),
        signal: AbortSignal.timeout(30000),
      });
      const text = await res.text();
      return { status: res.status, body: text.slice(0, 200) };
    }
    const cfg: Record<string, { base: string; model: string; env: string }> = {
      omniroute: { base: process.env.OMNIROUTE_URL || "http://localhost:20128/v1", model: "auto/best-fast", env: "OMNIROUTE_URL" },
      opencode: { base: process.env.OPENCODE_URL || "https://opencode.ai/zen/v1", model: "deepseek-v4-flash-free", env: "OPENCODE_URL" },
      openrouter: { base: process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1", model: "openai/gpt-4o-mini", env: "OPENROUTER_URL" },
    };
    const c = cfg[slug];
    const res = await fetch(`${c.base}/chat/completions`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ model: c.model, max_tokens: 20, messages: [{ role: "user", content: "Reply with: pong" }] }),
      signal: AbortSignal.timeout(30000),
    });
    const text = await res.text();
    return { status: res.status, resolvedBase: c.base, body: text.slice(0, 200) };
  } catch (e: any) {
    return { status: "ERR", error: e?.message || "unknown" };
  }
}

export async function POST(req: NextRequest) {
  if (req.headers.get("x-internal-secret") !== process.env.INTERNAL_API_SECRET) {
    return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  }

  const results: any[] = [];
  for (const slug of SLUGS) {
    const adapter = ADAPTERS[slug];
    const apiKey = process.env[ENV_MAP[slug]] || "";
    if (!adapter || !apiKey) {
      results.push({ slug, ok: false, reason: !adapter ? "no adapter" : "no api key in env" });
      continue;
    }
    const start = Date.now();
    let adapterResult: any = null;
    try {
      adapterResult = await Promise.race([
        adapter.enrich(DUMMY, apiKey),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout (>35s)")), 35000)),
      ]);
    } catch (e: any) {
      adapterResult = { success: false, model: "?", error: e?.message };
    }
    const diag = await directCheck(slug, apiKey);
    results.push({
      slug,
      adapterOk: !!adapterResult?.success,
      model: adapterResult?.model,
      ms: Date.now() - start,
      diag,
    });
  }
  return NextResponse.json({ results });
}
