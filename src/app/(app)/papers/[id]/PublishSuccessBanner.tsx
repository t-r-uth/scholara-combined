'use client'
import { useEffect, useState, useRef } from 'react'
import { useRouter } from 'next/navigation'

export default function PublishSuccessBanner({ paperId }: { paperId: string }) {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [leaving, setLeaving] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const exitTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const mountTimer = setTimeout(() => setMounted(true), 20)
    timerRef.current = setTimeout(dismiss, 5000)
    return () => {
      clearTimeout(mountTimer)
      if (timerRef.current) clearTimeout(timerRef.current)
      if (exitTimerRef.current) clearTimeout(exitTimerRef.current)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  function dismiss() {
    if (timerRef.current) clearTimeout(timerRef.current)
    setLeaving(true)
    exitTimerRef.current = setTimeout(() => {
      router.replace(`/papers/${paperId}`, { scroll: false })
    }, 300)
  }

  return (
    <div
      className={`publish-banner${mounted ? ' publish-banner--in' : ''}${leaving ? ' publish-banner--out' : ''}`}
      role="status"
      aria-live="polite"
    >
      <div className="publish-banner__check" aria-hidden="true">
        <svg viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <polyline className="publish-banner__check-mark" points="4,10.5 8,14.5 16,6.5" />
        </svg>
      </div>

      <div className="publish-banner__body">
        <p className="publish-banner__title">Paper published</p>
        <p className="publish-banner__sub">
          Your paper is now live in Discover. Researchers can find and apply to your contribution stages.
        </p>
      </div>

      <button
        type="button"
        className="publish-banner__close"
        onClick={dismiss}
        aria-label="Dismiss"
      >
        <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="4" y1="4" x2="12" y2="12" />
          <line x1="12" y1="4" x2="4" y2="12" />
        </svg>
      </button>

      <div className="publish-banner__progress" aria-hidden="true" />
    </div>
  )
}
