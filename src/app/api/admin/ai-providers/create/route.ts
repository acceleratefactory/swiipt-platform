import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { data: role } = await (supabase as any).from("user_roles").select("role").eq("user_id", user.id).single();
  if (!role || role.role !== "admin") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { name, providerSlug, baseUrl, apiKey, model, priority } = await request.json();
  if (!name || !providerSlug || !baseUrl || !apiKey || !model) {
    return NextResponse.json({ error: "name, providerSlug, baseUrl, apiKey, and model are required" }, { status: 400 });
  }

  const { data, error } = await (supabase as any)
    .from("ai_providers")
    .insert({
      name,
      provider_slug: providerSlug,
      base_url: baseUrl,
      api_key: apiKey,
      model,
      priority: priority || 0,
      is_active: true,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") return NextResponse.json({ error: "A provider with this slug already exists" }, { status: 409 });
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true, id: data.id });
}
