import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  const supabase = createClient();
  const { data } = await supabase.from("career_segments").select("*").order("name");
  return NextResponse.json(data || []);
}
