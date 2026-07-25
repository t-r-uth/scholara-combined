import { getServerUser } from '@/lib/firebase/session'
import { getNavBadgeCounts } from '@/lib/firestore/nav-badges'
import NavBarClient from './NavBarClient'

function initialsFromEmail(email: string) {
  const local = email.split('@')[0] || 'U'
  const parts = local.replace(/[._-]+/g, ' ').split(' ').filter(Boolean)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return local.slice(0, 2).toUpperCase() || 'U'
}

export default async function NavBar() {
  const user = await getServerUser()
  const badges = user ? await getNavBadgeCounts(user.id) : null

  return (
    <NavBarClient
      user={user ? { initials: initialsFromEmail(user.email) } : null}
      badges={badges}
    />
  )
}
