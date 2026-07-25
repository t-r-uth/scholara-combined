'use client'

import { useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { signInWithCustomToken, getIdToken } from 'firebase/auth'
import { getClientAuth } from '@/lib/firebase/client'

export default function FirebaseCallbackClient() {
  const router = useRouter()
  const params = useSearchParams()

  useEffect(() => {
    const token = params.get('token')
    if (!token) { router.replace('/'); return }
    signInWithCustomToken(getClientAuth(), token)
      .then(async cred => {
        const idToken = await getIdToken(cred.user)
        await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        })
        router.replace('/discover')
      })
      .catch(() => router.replace('/'))
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
      <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Signing you in…</p>
    </div>
  )
}
