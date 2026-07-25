'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ROUTES } from '@/lib/routes'

const TABS = [
  { href: ROUTES.workApplications, label: 'Applied',   badgeKey: 'applications' as const },
  { href: ROUTES.workApplicants,   label: 'Requests',  badgeKey: 'pending'      as const },
  { href: ROUTES.workPapers,       label: 'My papers', badgeKey: null },
  { href: ROUTES.workTracking,     label: 'Tracker',   badgeKey: null },
]

type WorkTabsProps = {
  pendingCount: number
  applicationsCount: number
}

export default function WorkTabs({ pendingCount, applicationsCount }: WorkTabsProps) {
  const pathname = usePathname()

  function badgeFor(key: 'applications' | 'pending' | null) {
    if (key === 'applications') return applicationsCount
    if (key === 'pending') return pendingCount
    return 0
  }

  return (
    <nav className="work-tabs" aria-label="My work sections">
      {TABS.map((tab) => {
        const active = pathname === tab.href
        const count = badgeFor(tab.badgeKey)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`work-tabs__tab${active ? ' work-tabs__tab--active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            {tab.label}
            {count > 0 && (
              <span className="work-tabs__badge" aria-label={`${count} items`}>
                {count > 99 ? '99+' : count}
              </span>
            )}
          </Link>
        )
      })}
    </nav>
  )
}
