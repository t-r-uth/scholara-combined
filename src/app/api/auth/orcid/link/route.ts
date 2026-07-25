import { NextRequest, NextResponse } from 'next/server'
import { getOrcidAuthUrl } from '@/lib/orcid'
import { getServerUser } from '@/lib/firebase/session'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await getServerUser()
  if (!user) {
    return NextResponse.redirect(new URL('/sign-in', request.url))
  }

  const state = crypto.randomBytes(16).toString('hex')
  const url = getOrcidAuthUrl(state)

  const response = NextResponse.redirect(url)
  response.cookies.set('orcid_state', state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  // Tag this as a link operation so the callback updates the existing user
  response.cookies.set('orcid_link_uid', user.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return response
}
