import { NextResponse } from "next/server";
import { createClient as createAdminClient } from "@supabase/supabase-js";

export async function GET() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    return NextResponse.json({
      error: "Missing env vars",
      hasUrl: !!url,
      hasKey: !!key,
    });
  }

  const adminSupabase = createAdminClient(url, key);

  const { data: deposits, error: depErr } = await adminSupabase
    .from("deposits")
    .select("id, status")
    .limit(3);

  const { data: roles, error: roleErr } = await adminSupabase
    .from("user_roles")
    .select("*")
    .limit(3);

  return NextResponse.json({
    env: { urlPrefix: url.slice(0, 30), keyPrefix: key.slice(0, 20) },
    deposits: { count: deposits?.length, error: depErr?.message, sample: deposits },
    userRoles: { count: roles?.length, error: roleErr?.message, sample: roles },
  });
}
