import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { assertCronAuthorized } from '@/lib/cron'
import { sendEmail, emailPrefEnabled } from '@/lib/email'
import { STAGE_LABELS } from '@/lib/labels'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const unauthorized = assertCronAuthorized(req)
  if (unauthorized) return unauthorized

  const db = getAdminDb()

  // Find contributions confirmed 23–24 days ago (7 days remaining)
  const windowEnd   = new Date(Date.now() - 23 * 24 * 60 * 60 * 1000)
  const windowStart = new Date(Date.now() - 24 * 24 * 60 * 60 * 1000)

  const snap = await db
    .collection('contributions')
    .where('status', 'in', ['contribution_confirmed', 'revision_requested'])
    .where('confirmed_at', '>=', windowStart)
    .where('confirmed_at', '<=', windowEnd)
    .get()

  if (snap.empty) {
    return NextResponse.json({ reminders: 0 })
  }

  let sent = 0

  await Promise.all(snap.docs.map(async (d) => {
    const contrib = d.data()

    const [stageSnap, paperSnap, contributorSnap] = await Promise.all([
      db.collection('stages').doc(contrib.stage_id as string).get(),
      db.collection('papers').doc(contrib.paper_id as string).get(),
      db.collection('users').doc(contrib.contributor_id as string).get(),
    ])
    const stage = stageSnap.data()
    const paper = paperSnap.data()
    const contributorData = contributorSnap.data()
    const contributorEmail = emailPrefEnabled(contributorData) ? (contributorData?.email as string | undefined) : undefined

    await db.collection('notifications').add({
      user_id: contrib.contributor_id,
      type: 'submission_reminder',
      message: '7 days left to submit your contribution',
      payload: {
        contribution_id: d.id,
        stage_id: contrib.stage_id,
        paper_id: contrib.paper_id,
        days_remaining: 7,
      },
      read: false,
      created_at: new Date(),
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    })

    if (contributorEmail && paper && stage) {
      const stageLabel = STAGE_LABELS[stage.type as string] ?? stage.type as string
      await sendEmail(
        contributorEmail,
        `7 days left to submit — ${paper.teaser_title as string}`,
        `<p>You have <strong>7 days remaining</strong> to submit your contribution for the <strong>${stageLabel}</strong> stage on "<em>${paper.teaser_title as string}</em>". Please log in and submit before the deadline.</p>`
      )
      sent++
    }
  }))

  return NextResponse.json({ reminders: sent })
}
