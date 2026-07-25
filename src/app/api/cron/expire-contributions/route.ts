import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { assertCronAuthorized } from '@/lib/cron'
import { expireContribution } from '@/app/(app)/papers/[id]/actions'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(req: Request) {
  const unauthorized = assertCronAuthorized(req)
  if (unauthorized) return unauthorized

  const db = getAdminDb()

  const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)

  const snap = await db
    .collection('contributions')
    .where('status', 'in', ['contribution_confirmed', 'revision_requested'])
    .where('confirmed_at', '<=', cutoff)
    .get()

  if (snap.empty) {
    return NextResponse.json({ expired: 0 })
  }

  await Promise.all(snap.docs.map(d => expireContribution(d.id)))

  return NextResponse.json({ expired: snap.size })
}
