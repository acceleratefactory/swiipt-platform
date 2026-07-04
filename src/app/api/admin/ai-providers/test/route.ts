import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { id } = await request.json();
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });

  const { data: provider } = await (supabase as any)
    .from("ai_providers")
    .select("*")
    .eq("id", id)
    .single();

  if (!provider) return NextResponse.json({ error: "Provider not found" }, { status: 404 });

  const resolvedKey = provider.api_key.startsWith("$")
    ? (process.env[provider.api_key.slice(1)] || "")
    : provider.api_key;

  if (!resolvedKey) return NextResponse.json({ error: "API key not resolved — check env var" }, { status: 400 });

  try {
    const url = `${provider.base_url.replace(/\/$/, "")}/chat/completions`;
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${resolvedKey}`,
      },
      body: JSON.stringify({
        model: provider.model,
        messages: [{ role: "user", content: "Say 'ok' in one word." }],
        max_tokens: 10,
      }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const text = await res.text().catch(() => "");
      return NextResponse.json({ error: `HTTP ${res.status}: ${text.slice(0, 200)}` }, { status: 502 });
    }

    const json = await res.json();
    const reply = json.choices?.[0]?.message?.content;
    return NextResponse.json({ success: true, reply });
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 502 });
  }
}
