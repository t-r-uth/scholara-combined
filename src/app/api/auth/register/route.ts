import { NextRequest, NextResponse } from 'next/server'
import { adminAuth, db } from '@/lib/firebase/admin'
import { FieldValue } from 'firebase-admin/firestore'

export async function POST(req: NextRequest) {
  try {
    const { idToken, email, name } = await req.json()
    if (!idToken || !email) {
      return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
    }

    // Verify the token and extract uid — prevents anyone writing to arbitrary docs
    const decoded = await adminAuth.verifyIdToken(idToken)
    const uid = decoded.uid

    const userRef = db.collection('users').doc(uid)
    const existing = await userRef.get()
    const displayName = (name as string)?.trim() || ''

    if (!existing.exists) {
      // New account — create profile defaults once
      await userRef.set({
        display_name: displayName,
        email,
        orcid_id: null,
        orcid_verified: false,
        institution: null,
        field_of_study: null,
        bio: null,
        avatar_url: null,
        contact_prefs: null,
        created_at: FieldValue.serverTimestamp(),
      })
    } else {
      // Returning user — only sync email; fill display_name if still empty
      const data = existing.data() ?? {}
      const update: Record<string, unknown> = { email }
      if (!data.display_name && displayName) {
        update.display_name = displayName
      }
      await userRef.set(update, { merge: true })
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('[register] Failed:', err)
    const message = err instanceof Error ? err.message : 'Registration failed'
    const isConfig = message.includes('Firebase Admin is not configured')
    return NextResponse.json(
      { error: isConfig ? message : 'Registration failed' },
      { status: isConfig ? 503 : 401 }
    )
  }
}
