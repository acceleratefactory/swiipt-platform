import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currency } = await request.json();

  // Validate currency exists and is active
  const { data: validCurrency } = await supabase
    .from("currencies")
    .select("code, is_active")
    .eq("code", currency)
    .single();

  if (!validCurrency) {
    return NextResponse.json({ error: "Currency code not found" }, { status: 400 });
  }
  if (!validCurrency.is_active) {
    return NextResponse.json({ error: "Currency is not active" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ preferred_currency: currency })
    .eq("id", user.id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ success: true });
}
