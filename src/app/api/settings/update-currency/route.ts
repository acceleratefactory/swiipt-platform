import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currency } = await request.json();

  const validCurrencies = ["NGN", "USD", "AED", "QAR", "GBP", "CAD", "EUR"];
  if (!validCurrencies.includes(currency)) {
    return NextResponse.json({ error: "Invalid currency." }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ preferred_currency: currency })
    .eq("id", user.id);

  if (error) {
    return NextResponse.json({ error: "Failed to update currency." }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}
