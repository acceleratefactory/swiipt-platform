import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
  const adminSupabase = createAdminClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const { data, error } = await adminSupabase
    .from("deposits")
    .select("id, status")
    .limit(3);

  return NextResponse.json({
    url: process.env.NEXT_PUBLIC_SUPABASE_URL?.slice(0, 30),
    keyPrefix: process.env.SUPABASE_SERVICE_ROLE_KEY?.slice(0, 20),
    count: data?.length,
    error: error?.message,
    data,
  });
}
