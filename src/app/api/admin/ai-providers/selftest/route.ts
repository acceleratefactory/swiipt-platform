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
    try {
      const r: any = await Promise.race([
        adapter.enrich(DUMMY, apiKey),
        new Promise((_, rej) => setTimeout(() => rej(new Error("timeout (>35s)")), 35000)),
      ]);
      results.push({
        slug,
        ok: !!r.success,
        model: r.model,
        provider: r.provider,
        ms: Date.now() - start,
        replySnippet: JSON.stringify(r.enriched).slice(0, 100),
      });
    } catch (e: any) {
      results.push({ slug, ok: false, error: e?.message || "unknown", ms: Date.now() - start });
    }
  }
  return NextResponse.json({ results });
}
