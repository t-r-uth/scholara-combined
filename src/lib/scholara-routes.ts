import { ROUTES } from '@/lib/routes'

export type ScholaraTab = 'discover' | 'my-papers' | 'applied' | 'tracker' | 'profile'

export const SCHOLARA_NAV = [
  { id: 'discover' as const, label: 'Discover', icon: 'search', href: ROUTES.discover },
  { id: 'my-papers' as const, label: 'My Papers', icon: 'menu_book', href: ROUTES.workPapers },
  { id: 'applied' as const, label: 'Applied', icon: 'badge', href: ROUTES.workApplications },
  { id: 'tracker' as const, label: 'Tracker', icon: 'analytics', href: ROUTES.workTracking },
  { id: 'profile' as const, label: 'Profile', icon: 'person', href: ROUTES.profileMe },
]

export function tabFromPathname(pathname: string): ScholaraTab {
  if (pathname.startsWith('/work/papers') || pathname.startsWith('/papers/new') || pathname.startsWith('/work/applicants')) {
    return 'my-papers'
  }
  if (pathname.startsWith('/work/applications') || pathname === ROUTES.applications) {
    return 'applied'
  }
  if (pathname.startsWith('/work/tracking')) return 'tracker'
  if (pathname.startsWith('/profile')) return 'profile'
  return 'discover'
}

export function isTabActive(tab: ScholaraTab, pathname: string): boolean {
  if (tab === 'discover') {
    return pathname === ROUTES.discover || (pathname.startsWith('/papers/') && pathname !== ROUTES.paperNew)
  }
  if (tab === 'my-papers') {
    return pathname.startsWith('/work/papers') || pathname === ROUTES.paperNew || pathname.startsWith('/work/applicants')
  }
  if (tab === 'applied') {
    return pathname.startsWith('/work/applications') || pathname === ROUTES.applications
  }
  if (tab === 'tracker') return pathname.startsWith('/work/tracking')
  if (tab === 'profile') return pathname.startsWith('/profile')
  return false
}
