import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { url, title, organisation, location, description, salary, deadline, requirements } = body;

    if (!url) {
      return NextResponse.json({ error: "url is required" }, { status: 400 });
    }

    const { error } = await (supabase as any).from("opportunity_queue").insert({
      raw_url: url,
      raw_title: title || null,
      raw_organisation: organisation || null,
      raw_location: location || null,
      raw_description: description || null,
      raw_salary: salary || null,
      raw_deadline: deadline || null,
      raw_requirements: requirements || null,
      source_name: "user_submission",
      source_url: null,
      ingest_method: "manual",
      status: "pending",
    });

    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
