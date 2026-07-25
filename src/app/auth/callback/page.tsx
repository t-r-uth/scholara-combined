'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

// This route is no longer used — Firebase auth goes through /auth/firebase-callback.
// Redirect to home if someone lands here directly.
export default function AuthCallback() {
  const router = useRouter()

  useEffect(() => {
    router.replace('/')
  }, [router])

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center', gap: '12px',
      color: 'var(--text-muted)', fontFamily: 'var(--font-sans)',
    }}>
      <div style={{
        width: '20px', height: '20px', borderRadius: '50%',
        border: '2px solid var(--border)', borderTopColor: 'var(--text-accent)',
        animation: 'spin 0.7s linear infinite',
      }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      Redirecting…
    </div>
  )
}
