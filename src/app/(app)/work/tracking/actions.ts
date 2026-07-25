'use server'

import { getServerUser } from '@/lib/firebase/session'
import { getAdminDb } from '@/lib/firebase/admin'
import { TRACKING_STAGES, type TrackingStage } from '@/lib/labels'

export async function updateTrackingStage(
  paperId: string,
  stage: TrackingStage,
): Promise<void> {
  const user = await getServerUser()
  if (!user) throw new Error('Not authenticated')

  if (!TRACKING_STAGES.includes(stage)) throw new Error('Invalid stage')

  const db = getAdminDb()
  const ref = db.collection('papers').doc(paperId)
  const snap = await ref.get()
  if (!snap.exists) throw new Error('Paper not found')
  if (snap.get('owner_id') !== user.id) throw new Error('Not your paper')

  await ref.update({ tracking_stage: stage })
}
