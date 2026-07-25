import { cache } from 'react'
import { db } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { getNavBadgeCounts } from '@/lib/firestore/nav-badges'
import ScholaraShellClient from './ScholaraShellClient'
import type { ScholaraHeaderUser } from './Header'

function initialsFromEmail(email: string) {
  const local = email.split('@')[0] || 'U'
  const parts = local.replace(/[._-]+/g, ' ').split(' ').filter(Boolean)
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase()
  return local.slice(0, 2).toUpperCase() || 'U'
}

const getHeaderUser = cache(async (userId: string, email: string): Promise<ScholaraHeaderUser> => {
  const doc = await db.collection('users').doc(userId).get()
  const data = doc.data()
  return {
    name: (data?.display_name as string | undefined) || 'Researcher',
    orcid: (data?.orcid_id as string | undefined) || null,
    avatarUrl: (data?.avatar_url as string | undefined) || null,
    initials: initialsFromEmail(email),
  }
})

export default async function ScholaraShell({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  const badges = user ? await getNavBadgeCounts(user.id) : null
  const headerUser = user ? await getHeaderUser(user.id, user.email) : null

  return (
    <ScholaraShellClient user={headerUser} badges={badges}>
      {children}
    </ScholaraShellClient>
  )
}
