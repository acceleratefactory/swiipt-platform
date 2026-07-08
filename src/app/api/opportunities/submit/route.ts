import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { createHash } from "crypto";

function hashApiKey(key: string): string {
  return createHash("sha256").update(key).digest("hex");
}

const REQUIRED_FIELDS = ["title", "description", "url"];
const MAX_DESCRIPTION_LENGTH = 5000;
const MAX_TITLE_LENGTH = 200;

export async function POST(request: NextRequest) {
  const apiKey = request.headers.get("x-api-key");
  if (!apiKey) {
    return NextResponse.json({ error: "Missing x-api-key header" }, { status: 401 });
  }

  const serviceSupabase = createServiceClient();
  const apiKeyHash = hashApiKey(apiKey);

  const { data: partner } = await serviceSupabase
    .from("platform_partners")
    .select("id, name, status, daily_submission_limit, submissions_today, submission_reset_at")
    .eq("api_key_hash", apiKeyHash)
    .eq("status", "verified")
    .single();

  if (!partner) {
    return NextResponse.json({ error: "Invalid or inactive API key" }, { status: 401 });
  }

  // Rate limiting: reset counter if window passed
  const now = new Date();
  const resetAt = partner.submission_reset_at ? new Date(partner.submission_reset_at) : null;
  const hoursSinceReset = resetAt ? (now.getTime() - resetAt.getTime()) / (1000 * 60 * 60) : 25;

  if (hoursSinceReset >= 24) {
    await serviceSupabase
      .from("platform_partners")
      .update({ submissions_today: 0, submission_reset_at: now.toISOString() })
      .eq("id", partner.id);
    partner.submissions_today = 0;
  }

  if (partner.submissions_today >= partner.daily_submission_limit) {
    return NextResponse.json(
      { error: `Daily submission limit reached (${partner.daily_submission_limit})` },
      { status: 429 }
    );
  }

  const body = await request.json();

  // Validate required fields
  const missing = REQUIRED_FIELDS.filter((f) => !body[f] || body[f].toString().trim() === "");
  if (missing.length > 0) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(", ")}` },
      { status: 400 }
    );
  }

  // Validate URL format
  if (body.url) {
    try {
      new URL(body.url);
    } catch {
      return NextResponse.json({ error: "Invalid URL format" }, { status: 400 });
    }
  }

  // Validate lengths
  if (body.title && body.title.length > MAX_TITLE_LENGTH) {
    return NextResponse.json(
      { error: `Title must be ${MAX_TITLE_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  if (body.description && body.description.length > MAX_DESCRIPTION_LENGTH) {
    return NextResponse.json(
      { error: `Description must be ${MAX_DESCRIPTION_LENGTH} characters or less` },
      { status: 400 }
    );
  }

  // Check duplicate URL
  if (body.url) {
    const { data: existing } = await serviceSupabase
      .from("partner_submissions")
      .select("id")
      .eq("url", body.url)
      .eq("partner_id", partner.id)
      .limit(1)
      .maybeSingle();

    if (existing) {
      return NextResponse.json({ error: "Duplicate submission (URL already submitted)" }, { status: 409 });
    }
  }

  // Insert submission
  const { data: submission, error: insertError } = await serviceSupabase
    .from("partner_submissions")
    .insert({
      partner_id: partner.id,
      title: body.title.trim(),
      organisation: body.organisation?.trim() || partner.name,
      description: body.description.trim(),
      url: body.url?.trim() || null,
      location: body.location?.trim() || null,
      type: body.type?.trim() || null,
      deadline: body.deadline?.trim() || null,
      salary: body.salary?.trim() || null,
      raw_data: body,
      status: "pending",
    })
    .select("id, status, created_at")
    .single();

  if (insertError) {
    return NextResponse.json({ error: "Failed to create submission" }, { status: 500 });
  }

  // Increment counter
  await serviceSupabase
    .from("platform_partners")
    .update({ submissions_today: partner.submissions_today + 1 })
    .eq("id", partner.id);

  return NextResponse.json({
    success: true,
    submission: {
      id: submission.id,
      status: submission.status,
      created_at: submission.created_at,
    },
  });
}
