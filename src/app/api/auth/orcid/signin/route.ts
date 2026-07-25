import { NextRequest, NextResponse } from 'next/server'
import { getOrcidAuthUrl } from '@/lib/orcid'
import crypto from 'crypto'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
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
  response.cookies.set('orcid_signin', '1', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  })
  return response
}