import { NextResponse } from 'next/server'
import { getServerUser } from '@/lib/firebase/session'
import { getNavBadgeCounts } from '@/lib/firestore/nav-badges'

export const dynamic = 'force-dynamic'

export async function GET() {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.json({ pendingCount: 0, applicationsCount: 0, needsActionCount: 0, notificationsCount: 0 })
  }

  const counts = await getNavBadgeCounts(user.id)

  return NextResponse.json(counts, {
    headers: {
      'Cache-Control': 'private, max-age=30, stale-while-revalidate=60',
    },
  })
}
