import { NextRequest, NextResponse } from 'next/server'
import { adminAuth } from '@/lib/firebase/admin'
import { cookies } from 'next/headers'

export async function POST(req: NextRequest) {
  try {
    const { idToken } = await req.json()
    if (!idToken) return NextResponse.json({ error: 'Missing token' }, { status: 400 })

    const expiresIn = 60 * 60 * 24 * 14 * 1000 // 14 days
    const sessionCookie = await adminAuth.createSessionCookie(idToken, { expiresIn })
    const cookieStore = await cookies()
    cookieStore.set('__session', sessionCookie, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: expiresIn / 1000,
      path: '/',
      sameSite: 'lax',
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[session] Failed to create session cookie:', err)
    const message = err instanceof Error ? err.message : 'Invalid or expired token'
    const isConfig = message.includes('Firebase Admin is not configured')
    return NextResponse.json(
      { error: isConfig ? message : 'Invalid or expired token' },
      { status: isConfig ? 503 : 401 }
    )
  }
}

export async function DELETE() {
  const cookieStore = await cookies()
  cookieStore.delete('__session')
  return NextResponse.json({ ok: true })
}
