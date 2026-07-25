'use client'

import Link from 'next/link'
import { useEffect, useId, useRef, useState } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { ROUTES } from '@/lib/routes'
import type { NavBadgeCounts } from '@/lib/firestore/nav-badges'

interface NavBarClientProps {
  user: { initials: string } | null
  badges: NavBadgeCounts | null
}

function isDiscoverActive(pathname: string) {
  return pathname === ROUTES.discover || (pathname.startsWith('/papers/') && pathname !== ROUTES.paperNew)
}

function isMyWorkActive(pathname: string) {
  return pathname === ROUTES.work || pathname.startsWith('/work/')
}

function isMessagesActive(pathname: string) {
  return pathname === ROUTES.messages || pathname.startsWith('/messages/')
}

function isProfileActive(pathname: string) {
  return pathname.startsWith('/profile')
}

function isNotificationsActive(pathname: string) {
  return pathname === ROUTES.notifications || pathname.startsWith('/notifications/')
}

export default function NavBarClient({ user, badges }: NavBarClientProps) {
  const pathname = usePathname()
  const router = useRouter()
  const profileMenuId = useId()
  const [menuOpen, setMenuOpen] = useState(false)
  const [profileOpen, setProfileOpen] = useState(false)

  const profileRef = useRef<HTMLDivElement>(null)

  const workBadge = badges
    ? badges.pendingCount + badges.applicationsCount
    : 0
  const notificationsCount = badges?.notificationsCount ?? 0

  useEffect(() => {
    setMenuOpen(false)
    setProfileOpen(false)
  }, [pathname])

  useEffect(() => {
    function onPointerDown(e: MouseEvent) {
      const target = e.target as Node
      if (profileRef.current && !profileRef.current.contains(target)) setProfileOpen(false)
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setProfileOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onPointerDown)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onPointerDown)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  async function handleLogout() {
    try {
      await fetch(ROUTES.api.session, { method: 'DELETE' })
      const { getClientAuth } = await import('@/lib/firebase/client')
      const auth = getClientAuth()
      const { signOut } = await import('firebase/auth')
      await signOut(auth)
    } catch {
      // Still redirect — cookie may already be cleared
    }
    router.push(ROUTES.signIn)
    router.refresh()
  }

  return (
    <nav className="app-nav" aria-label="Primary">
      <Link href={ROUTES.discover} className="app-nav__brand">
        Scho<span>lara</span>
      </Link>

      {user && (
        <button
          type="button"
          className="app-nav__menu-btn"
          aria-expanded={menuOpen}
          aria-controls="app-nav-links"
          onClick={() => setMenuOpen(v => !v)}
        >
          {menuOpen ? 'Close' : 'Menu'}
        </button>
      )}

      <div
        id="app-nav-links"
        className={`app-nav__links ${menuOpen ? 'app-nav__links--open' : ''}`}
      >
        {user ? (
          <>
            <Link
              href={ROUTES.discover}
              className={`app-nav__link ${isDiscoverActive(pathname) ? 'app-nav__link--active' : ''}`}
            >
              Discover
            </Link>

            <Link
              href={ROUTES.work}
              className={`app-nav__link ${isMyWorkActive(pathname) ? 'app-nav__link--active' : ''}`}
            >
              Dashboard
              {workBadge > 0 && (
                <span className="app-nav__badge" aria-label={`${workBadge} items needing attention`}>
                  {workBadge > 99 ? '99+' : workBadge}
                </span>
              )}
            </Link>

            <Link
              href={ROUTES.messages}
              className={`app-nav__link ${isMessagesActive(pathname) ? 'app-nav__link--active' : ''}`}
            >
              Messages
            </Link>

            <Link
              href={ROUTES.paperNew}
              className={`nav-post-btn ${pathname === ROUTES.paperNew ? 'nav-post-btn--active' : ''}`}
            >
              + Post
            </Link>
          </>
        ) : (
          <Link
            href={ROUTES.discover}
            className={`app-nav__link ${pathname === ROUTES.discover ? 'app-nav__link--active' : ''}`}
          >
            Discover
          </Link>
        )}
      </div>

      {user ? (
        <div className="app-nav__user">
          <Link
            href={ROUTES.notifications}
            className={`app-nav__icon-btn ${isNotificationsActive(pathname) ? 'app-nav__icon-btn--active' : ''}`}
            aria-label={notificationsCount > 0 ? `${notificationsCount} unread notifications` : 'Notifications'}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.55" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
              <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
              <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
            </svg>
            {notificationsCount > 0 && (
              <span className="app-nav__icon-count" aria-hidden>
                {notificationsCount > 9 ? '9+' : notificationsCount}
              </span>
            )}
          </Link>

          <div className="app-nav__divider" aria-hidden />

          <div className="app-nav__dropdown app-nav__dropdown--profile" ref={profileRef}>
            <button
              type="button"
              className={`app-nav__avatar app-nav__avatar--btn ${isProfileActive(pathname) || profileOpen ? 'app-nav__avatar--active' : ''}`}
              aria-label="Account menu"
              aria-expanded={profileOpen}
              aria-haspopup="menu"
              aria-controls={profileMenuId}
              onClick={() => setProfileOpen(v => !v)}
            >
              {user.initials}
            </button>
            {profileOpen && (
              <div id={profileMenuId} className="app-nav__menu app-nav__menu--right" role="menu">
                <p className="app-nav__menu-label">Account</p>
                <Link
                  href={ROUTES.profileMe}
                  role="menuitem"
                  className={`app-nav__menu-item ${isProfileActive(pathname) ? 'app-nav__menu-item--active' : ''}`}
                  onClick={() => setProfileOpen(false)}
                >
                  <span className="app-nav__menu-copy">
                    <span className="app-nav__menu-title">Profile</span>
                    <span className="app-nav__menu-desc">Identity, ORCID, contact</span>
                  </span>
                </Link>
                <div className="app-nav__menu-divider" role="separator" />
                <button
                  type="button"
                  role="menuitem"
                  className="app-nav__menu-item app-nav__menu-item--muted"
                  onClick={handleLogout}
                >
                  <span className="app-nav__menu-title">Sign out</span>
                </button>
              </div>
            )}
          </div>
        </div>
      ) : (
        <div className="app-nav__user">
          <Link
            href={ROUTES.signIn}
            className={`app-nav__link app-nav__link--signin ${pathname === ROUTES.signIn ? 'app-nav__link--active' : ''}`}
          >
            Sign in
          </Link>
        </div>
      )}
    </nav>
  )
}
