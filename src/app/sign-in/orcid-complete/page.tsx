'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { signInWithCustomToken, getIdToken } from 'firebase/auth'
import { getClientAuth } from '@/lib/firebase/client'

export default function OrcidCompletePage() {
  const router = useRouter()
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const hash = window.location.hash.slice(1) // remove leading '#'
    const params = new URLSearchParams(hash)
    const token = params.get('token')

    if (!token) {
      setError('Missing sign-in token.')
      return
    }

    async function completeSignIn(customToken: string) {
      try {
        const cred = await signInWithCustomToken(getClientAuth(), customToken)
        const idToken = await getIdToken(cred.user)

        const sessionRes = await fetch('/api/auth/session', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ idToken }),
        })
        if (!sessionRes.ok) throw new Error('Could not start your session.')

        router.push('/discover')
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Sign-in failed.')
      }
    }

    completeSignIn(token)
  }, [router])

  if (error) {
    return (
      <div className="sign-in-page">
        <p className="form-error">{error}</p>
      </div>
    )
  }

  return (
    <div className="sign-in-page">
      <p>Signing you in…</p>
    </div>
  )
}