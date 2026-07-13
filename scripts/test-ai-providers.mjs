// Standalone AI provider connectivity test.
// Run:  node scripts/test-ai-providers.mjs
// (keys are read from process.env; if .env.local exists it is loaded automatically)
//
// NOTE: this script never prints secret values — only provider name, status, model, and a reply snippet.

import { readFileSync, existsSync } from "node:fs";

// --- Minimal .env.local loader (no external deps) ---
function loadEnvLocal() {
  const path = ".env.local";
  if (!existsSync(path)) return;
  const text = readFileSync(path, "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (!(key in process.env)) process.env[key] = val;
  }
}
loadEnvLocal();

const PING_PROMPT = "Reply with exactly the single word: pong";

async function openAiCompatible(baseUrl, model, apiKey, label) {
  const url = `${baseUrl.replace(/\/$/, "")}/chat/completions`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${apiKey}` },
    body: JSON.stringify({ model, max_tokens: 50, messages: [{ role: "user", content: PING_PROMPT }] }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  const text = data?.choices?.[0]?.message?.content || "";
  return { ok: res.ok && !!text, status: res.status, model, reply: text.slice(0, 40) };
}

async function gemini(apiKey, label) {
  const url = `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ contents: [{ parts: [{ text: PING_PROMPT }] }] }),
    signal: AbortSignal.timeout(20000),
  });
  const data = await res.json().catch(() => ({}));
  const text = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
  return { ok: res.ok && !!text, status: res.status, model: "gemini-1.5-flash", reply: text.slice(0, 40) };
}

async function testProvider(label, fn, apiKey) {
  if (!apiKey) {
    console.log(`  ⚠  ${label.padEnd(10)} SKIPPED — API key not found in env (add it to .env.local or Vercel)`);
    return;
  }
  try {
    const r = await fn();
    if (r.ok) {
      console.log(`  ✅ ${label.padEnd(10)} OK   (model: ${r.model}, status ${r.status}, reply: "${r.reply}")`);
    } else {
      console.log(`  ❌ ${label.padEnd(10)} FAIL (status ${r.status}, reply: "${r.reply}")`);
    }
  } catch (err) {
    console.log(`  ❌ ${label.padEnd(10)} ERROR ${err?.message || err}`);
  }
}

console.log("AI provider connectivity test\n");
await testProvider("omniroute", () =>
  openAiCompatible(process.env.OMNIROUTE_URL || "http://localhost:20128/v1", "auto/best-fast", process.env.OMNIROUTE_API_KEY, "omniroute"),
  process.env.OMNIROUTE_API_KEY);

await testProvider("gemini", () => gemini(process.env.GEMINI_API_KEY, "gemini"), process.env.GEMINI_API_KEY);

await testProvider("opencode", () =>
  openAiCompatible(process.env.OPENCODE_URL || "https://opencode.ai/zen/v1", "deepseek-v4-flash-free", process.env.OPENCODE_API_KEY, "opencode"),
  process.env.OPENCODE_API_KEY);

await testProvider("openrouter", () =>
  openAiCompatible(process.env.OPENROUTER_URL || "https://openrouter.ai/api/v1", "openai/gpt-4o-mini", process.env.OPENROUTER_API_KEY, "openrouter"),
  process.env.OPENROUTER_API_KEY);

console.log("\nDone.");
