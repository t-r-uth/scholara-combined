'use client'

import { useCallback, useEffect, useRef, useState, useTransition, type KeyboardEvent } from 'react'

interface OwnerPaperTabsProps {
  listing: React.ReactNode
  manage: React.ReactNode
  initialTab?: 'listing' | 'manage'
  focusStageId?: string
}

const TABS = [
  { id: 'listing' as const, label: 'Listing', panelId: 'owner-paper-panel-listing' },
  { id: 'manage' as const, label: 'Manage', panelId: 'owner-paper-panel-manage' },
]

export default function OwnerPaperTabs({
  listing,
  manage,
  initialTab = 'listing',
  focusStageId,
}: OwnerPaperTabsProps) {
  const [tab, setTab] = useState<'listing' | 'manage'>(initialTab)
  const [isPending, startTransition] = useTransition()
  const tabRefs = useRef<Array<HTMLButtonElement | null>>([])
  const scrolledRef = useRef(false)

  useEffect(() => {
    if (tab !== 'manage' || !focusStageId || scrolledRef.current) return
    const el = document.getElementById(`stage-${focusStageId}`)
    if (!el) return
    scrolledRef.current = true
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      el.classList.add('stage-focus-highlight')
      el.addEventListener('animationend', () => el.classList.remove('stage-focus-highlight'), { once: true })
    })
  }, [tab, focusStageId])

  const switchTab = useCallback((next: 'listing' | 'manage', focus = false) => {
    startTransition(() => setTab(next))
    if (focus) {
      const idx = TABS.findIndex((t) => t.id === next)
      requestAnimationFrame(() => tabRefs.current[idx]?.focus())
    }
  }, [])

  function onKeyDown(e: KeyboardEvent<HTMLDivElement>) {
    const idx = TABS.findIndex((t) => t.id === tab)
    let nextIdx: number | null = null

    switch (e.key) {
      case 'ArrowRight':
        nextIdx = (idx + 1) % TABS.length
        break
      case 'ArrowLeft':
        nextIdx = (idx - 1 + TABS.length) % TABS.length
        break
      case 'Home':
        nextIdx = 0
        break
      case 'End':
        nextIdx = TABS.length - 1
        break
      default:
        return
    }

    e.preventDefault()
    switchTab(TABS[nextIdx]!.id, true)
  }

  return (
    <div className="owner-paper-tabs">
      <div
        className="owner-paper-tabs__nav"
        role="tablist"
        aria-label="Paper views"
        onKeyDown={onKeyDown}
      >
        {TABS.map((item, idx) => (
          <button
            key={item.id}
            ref={(el) => { tabRefs.current[idx] = el }}
            type="button"
            role="tab"
            id={`owner-paper-tab-${item.id}`}
            aria-selected={tab === item.id}
            aria-controls={item.panelId}
            tabIndex={tab === item.id ? 0 : -1}
            className={`owner-paper-tabs__tab ${tab === item.id ? 'owner-paper-tabs__tab--active' : ''}`}
            onClick={() => switchTab(item.id)}
          >
            {item.label}
          </button>
        ))}
      </div>
      <p className="owner-paper-tabs__hint">
        {tab === 'listing'
          ? 'Preview what applicants see on your listing.'
          : 'Private details, applicant review, and stage management.'}
      </p>
      <div
        role="tabpanel"
        id="owner-paper-panel-listing"
        aria-labelledby="owner-paper-tab-listing"
        hidden={tab !== 'listing'}
        className={isPending ? 'owner-paper-tabs__panel--switching' : undefined}
      >
        {listing}
      </div>
      <div
        role="tabpanel"
        id="owner-paper-panel-manage"
        aria-labelledby="owner-paper-tab-manage"
        hidden={tab !== 'manage'}
        className={isPending ? 'owner-paper-tabs__panel--switching' : undefined}
      >
        {manage}
      </div>
    </div>
  )
}
