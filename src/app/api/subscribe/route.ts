import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { sendWelcomeEmail } from "@/lib/resend"
import { addContactToBrevo } from "@/lib/integrations/brevo"

export async function POST(request: NextRequest) {
  const { email } = await request.json()

  if (!email || !email.includes("@")) {
    return NextResponse.json({ error: "Valid email required" }, { status: 400 })
  }

  const supabase = createClient()

  const { error } = await supabase
    .from("email_subscribers")
    .insert({ email, source: "landing_intel" })

  if (error && error.code !== "23505") {
    return NextResponse.json({ error: "Subscription failed" }, { status: 500 })
  }

  if (process.env.BREVO_API_KEY) {
    await addContactToBrevo({ email }).catch(() => {});
  }

  try {
    await sendWelcomeEmail(email)
  } catch {
    // Don't fail the request if email send fails — subscriber is saved
  }

  return NextResponse.json({ success: true })
}
