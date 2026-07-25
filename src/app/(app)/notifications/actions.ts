'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { getAdminDb } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { ROUTES } from '@/lib/routes'

export async function markAllNotificationsRead() {
  const user = await getServerUser()
  if (!user) redirect(ROUTES.signIn)

  const db = getAdminDb()
  const snap = await db
    .collection('notifications')
    .where('user_id', '==', user.id)
    .get()

  const unread = snap.docs.filter((doc) => doc.data().read !== true)
  for (let i = 0; i < unread.length; i += 400) {
    const batch = db.batch()
    for (const doc of unread.slice(i, i + 400)) {
      batch.update(doc.ref, { read: true, read_at: new Date() })
    }
    await batch.commit()
  }

  revalidatePath(ROUTES.notifications)
}
