import { db } from '@/lib/firebase/admin'
import { AWAITING_REVIEW_STATUSES } from '@/lib/labels'

/** Pending applications on papers the user owns (inbox badge). */
export async function getPendingApplicationCount(userId: string): Promise<number> {
  const papersSnap = await db.collection('papers')
    .where('owner_id', '==', userId)
    .select()
    .get()

  const paperIds = papersSnap.docs.map((doc) => doc.id)
  if (paperIds.length === 0) return 0

  const chunkQueries = []
  for (let i = 0; i < paperIds.length; i += 30) {
    const chunk = paperIds.slice(i, i + 30)
    chunkQueries.push(
      db.collection('applications')
        .where('paper_id', 'in', chunk)
        .where('status', 'in', [...AWAITING_REVIEW_STATUSES])
        .count()
        .get(),
    )
  }
  const results = await Promise.all(chunkQueries)

  return results.reduce((sum, snap) => sum + snap.data().count, 0)
}
