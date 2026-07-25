import { NextResponse } from 'next/server'
import { getAdminDb } from '@/lib/firebase/admin'

/** Returns a 401 response when the request lacks the CRON_SECRET bearer token, otherwise null. */
export function assertCronAuthorized(req: Request): NextResponse | null {
  const secret = process.env.CRON_SECRET
  if (secret && req.headers.get('authorization') !== `Bearer ${secret}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  return null
}

/** Deletes up to 400 docs whose `purge_at` is due; returns the number deleted. */
export async function purgeExpiredDocs(collection: string): Promise<number> {
  const db = getAdminDb()
  const snap = await db
    .collection(collection)
    .where('purge_at', '<=', new Date())
    .limit(400)
    .get()

  if (snap.empty) return 0

  const batch = db.batch()
  for (const d of snap.docs) {
    batch.delete(d.ref)
  }
  await batch.commit()

  return snap.size
}
