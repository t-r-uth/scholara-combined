import { cache } from 'react'
import { getPendingApplicationCount } from '@/lib/firestore/inbox'
import { getActiveApplicationCount } from '@/lib/firestore/applications'
import { getUnreadNotificationCount } from '@/lib/firestore/notifications'

export type NavBadgeCounts = {
  pendingCount: number
  applicationsCount: number
  notificationsCount: number
}

/** Deduped per request — safe to call from NavBar and nested layouts. */
export const getNavBadgeCounts = cache(async (userId: string): Promise<NavBadgeCounts> => {
  const [pendingCount, applicationsCount, notificationsCount] = await Promise.all([
    getPendingApplicationCount(userId),
    getActiveApplicationCount(userId),
    getUnreadNotificationCount(userId),
  ])

  return { pendingCount, applicationsCount, notificationsCount }
})
