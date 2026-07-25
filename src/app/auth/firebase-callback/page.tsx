import { Suspense } from 'react'
import FirebaseCallbackClient from './FirebaseCallbackClient'

export const dynamic = 'force-dynamic'

export default function FirebaseCallbackPage() {
  return (
    <Suspense fallback={
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)' }}>Signing you in…</p>
      </div>
    }>
      <FirebaseCallbackClient />
    </Suspense>
  )
}
