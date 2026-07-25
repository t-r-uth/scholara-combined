import { cache } from 'react'
import { cookies } from 'next/headers'
import { getAdminAuth } from './admin'

/** One session verify per request (shared across layout + page). */
export const getServerUser = cache(async () => {
  const cookieStore = await cookies()
  const sessionCookie = cookieStore.get('__session')?.value
  if (!sessionCookie) return null
  try {
    // checkRevoked=false avoids an extra Firebase network round-trip
    const decoded = await getAdminAuth().verifySessionCookie(sessionCookie, false)
    return { id: decoded.uid, email: decoded.email ?? '' }
  } catch {
    return null
  }
})
