import { Resend } from "resend"

let resend: Resend | null = null

function getResend() {
  if (!resend) {
    resend = new Resend(process.env.RESEND_API_KEY || "")
  }
  return resend
}

export async function sendWelcomeEmail(email: string) {
  await getResend().emails.send({
    from: "Swiipt <hello@swiipt.com>",
    to: email,
    subject: "Welcome to Swiipt Visa Intelligence",
    html: `
      <div style="font-family: 'Plus Jakarta Sans', sans-serif; max-width: 560px; margin: 0 auto; padding: 2rem;">
        <h1 style="color: #06112B; font-size: 1.5rem; margin-bottom: 1rem;">You're in.</h1>
        <p style="color: #3D4657; line-height: 1.6;">
          Every week we send you the most important visa and relocation updates
          for your target destinations. Policy changes, new visa categories,
          Express Entry draws, deadline reminders — straight to your inbox.
        </p>
        <p style="color: #3D4657; line-height: 1.6; margin-top: 1rem;">
          Ready to start planning your move?
        </p>
        <a href="https://swiipt.com/signup" style="display: inline-block; margin-top: 1.5rem; padding: 0.875rem 1.75rem; background: #00C896; color: #06112B; font-weight: 700; border-radius: 10px; text-decoration: none;">
          Create your free account →
        </a>
        <p style="color: #7A8599; font-size: 0.75rem; margin-top: 2rem;">
          Swiipt · swiipt.com · Unsubscribe anytime
        </p>
      </div>
    `,
  })
}
