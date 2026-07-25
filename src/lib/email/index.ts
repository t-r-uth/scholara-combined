import { Resend } from 'resend'

const FROM = process.env.EMAIL_FROM ?? 'Scholara <noreply@scholara.app>'

let resend: Resend | null = null

function getResend(): Resend | null {
  const key = process.env.RESEND_API_KEY?.trim()
  if (!key) return null
  if (!resend) resend = new Resend(key)
  return resend
}

export function emailPrefEnabled(userData: FirebaseFirestore.DocumentData | undefined): boolean {
  return (userData?.email_notifications as boolean | undefined) ?? true
}

export async function sendEmail(to: string, subject: string, html: string) {
  const client = getResend()
  if (!client) {
    console.log(`[email] RESEND_API_KEY not set — skipping "${subject}" to ${to}`)
    return
  }
  try {
    await client.emails.send({ from: FROM, to, subject, html })
  } catch (err) {
    // Don't let email failures break the main action
    console.error('[email] Failed to send:', err)
  }
}
