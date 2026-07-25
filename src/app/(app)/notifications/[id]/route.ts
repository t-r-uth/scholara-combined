import { NextRequest, NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { getNotificationHref } from '@/lib/firestore/notifications'
import { ROUTES } from '@/lib/routes'

export const dynamic = 'force-dynamic'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.redirect(new URL(ROUTES.signIn, request.url))
  }

  const ref = getAdminDb().collection('notifications').doc(params.id)
  const snap = await ref.get()
  const data = snap.data()

  if (!snap.exists || !data || data.user_id !== user.id) {
    return NextResponse.redirect(new URL(ROUTES.notifications, request.url))
  }

  if (data.read !== true) {
    await ref.update({ read: true, read_at: new Date() })
  }

  const href = getNotificationHref((data.type as string | undefined) ?? 'unknown', data.payload)
  return NextResponse.redirect(new URL(href, request.url))
}
