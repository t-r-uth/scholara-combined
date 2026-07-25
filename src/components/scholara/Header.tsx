'use client'

import Link from 'next/link'
import { useRouter, usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState, useTransition } from 'react'
import { ROUTES } from '@/lib/routes'
import { tabFromPathname } from '@/lib/scholara-routes'
import { getGoogleDriveConnected, setGoogleDriveConnected } from '@/lib/google-drive'
import type { NavBadgeCounts } from '@/lib/firestore/nav-badges'

export interface ScholaraHeaderUser {
  name: string
  orcid: string | null
  avatarUrl: string | null
  initials: string
}

interface ScholaraHeaderProps {
  user: ScholaraHeaderUser | null
  badges: NavBadgeCounts | null
}

export default function ScholaraHeader({ user, badges }: ScholaraHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [isGoogleDriveConnected, setIsGoogleDriveConnectedState] = useState(false)
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') ?? '')

  const activeTab = tabFromPathname(pathname)
  const notificationsCount = badges?.notificationsCount ?? 0

  useEffect(() => {
    setIsGoogleDriveConnectedState(getGoogleDriveConnected())
  }, [])

  useEffect(() => {
    setSearchQuery(searchParams.get('q') ?? '')
  }, [searchParams])

  function handleToggleGoogleDrive() {
    if (isGoogleDriveConnected) {
      if (confirm('Disconnect Google Drive Workspace access?')) {
        setGoogleDriveConnected(false)
        setIsGoogleDriveConnectedState(false)
      }
    } else {
      setGoogleDriveConnected(true)
      setIsGoogleDriveConnectedState(true)
    }
  }

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = searchQuery.trim()
    if (trimmed) params.set('q', trimmed)
    else params.delete('q')
    params.delete('page')
    startTransition(() => {
      router.push(params.toString() ? `/discover?${params.toString()}` : '/discover')
    })
  }

  async function handleLogout() {
    try {
      await fetch(ROUTES.api.session, { method: 'DELETE' })
      const { getClientAuth } = await import('@/lib/firebase/client')
      const auth = getClientAuth()
      const { signOut } = await import('firebase/auth')
      await signOut(auth)
    } catch {
      // Still redirect
    }
    router.push(ROUTES.signIn)
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-20 bg-[#F4F6F8]/90 backdrop-blur-md border-b border-[#E2E8F0] px-4 lg:px-8 py-3.5 flex items-center justify-between font-sans">
      <form onSubmit={submitSearch} className="flex-1 max-w-xl pr-4">
        <div className="relative">
          <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none text-[#94A3B8]">
            <span className="material-symbols-outlined text-[20px]">search</span>
          </div>
          <input
            type="search"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search papers, disciplines, or methodologies..."
            className="w-full h-10 pl-11 pr-8 bg-[#E2E8F0]/50 hover:bg-[#E2E8F0]/70 focus:bg-[#FFFFFF] border border-transparent focus:border-[#CBD5E1] rounded-lg text-xs font-medium text-[#1E293B] placeholder:text-[#64748B] focus:outline-none transition-all"
            disabled={isPending}
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => {
                setSearchQuery('')
                const params = new URLSearchParams(searchParams.toString())
                params.delete('q')
                params.delete('page')
                startTransition(() => {
                  router.push(params.toString() ? `/discover?${params.toString()}` : '/discover')
                })
              }}
              className="absolute inset-y-0 right-3 flex items-center text-[#94A3B8] hover:text-[#475569]"
            >
              <span className="material-symbols-outlined text-sm">cancel</span>
            </button>
          )}
        </div>
      </form>

      <div className="flex items-center gap-3.5 shrink-0">
        <button
          type="button"
          onClick={handleToggleGoogleDrive}
          className={`hidden sm:flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all cursor-pointer ${
            isGoogleDriveConnected
              ? 'bg-[#F0FDF4] border-[#8CC63F]/40 text-[#166534] hover:bg-[#DCFCE7]'
              : 'bg-[#FFFFFF] border-[#CBD5E1] text-[#475569] hover:bg-[#F8FAFC]'
          }`}
          title={isGoogleDriveConnected ? 'Google Drive Connected' : 'Mark Google Drive as connected for sharing links'}
        >
          <span className={`material-symbols-filled text-base ${isGoogleDriveConnected ? 'text-[#8CC63F]' : 'text-[#64748B]'}`}>
            folder_shared
          </span>
          <span>{isGoogleDriveConnected ? 'Google Drive Connected' : 'Connect Google Drive'}</span>
        </button>

        {activeTab === 'my-papers' && user && (
          <Link
            href={ROUTES.paperNew}
            className="hidden sm:flex items-center gap-1.5 px-4 py-2 bg-[#233242] hover:bg-[#1A2633] text-white text-xs font-bold transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-base">post_add</span>
            <span>Post New Paper</span>
          </Link>
        )}

        {user ? (
          <>
            <div className="relative">
              <Link
                href={ROUTES.notifications}
                className="relative p-2 text-[#475569] hover:text-[#0F172A] hover:bg-[#E2E8F0]/60 rounded-full transition-colors"
                title="Notifications"
              >
                <span className="material-symbols-outlined text-[22px]">notifications</span>
                {notificationsCount > 0 && (
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-[#E11D48]" />
                )}
              </Link>
            </div>

            <div
              className="p-1.5 text-[#8CC63F] hover:bg-[#E2E8F0]/60 rounded-full transition-colors cursor-pointer"
              title="Verified ORCID Researcher"
            >
              <span className="material-symbols-filled text-[22px]">verified_user</span>
            </div>

            <Link
              href={ROUTES.profileMe}
              className="flex items-center gap-3 pl-2 border-l border-[#CBD5E1] hover:opacity-85 transition-opacity"
            >
              <div className="text-right hidden md:block">
                <span className="font-bold text-xs text-[#0F172A] uppercase tracking-wider block leading-tight">
                  {user.name}
                </span>
                {user.orcid && (
                  <span className="text-[10px] font-semibold text-[#64748B] block">
                    ORCID: {user.orcid}
                  </span>
                )}
              </div>
              {user.avatarUrl ? (
                <div className="w-9 h-9 rounded-full overflow-hidden border border-[#CBD5E1] shrink-0">
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                </div>
              ) : (
                <div className="w-9 h-9 rounded-full bg-[#233242] text-white text-xs font-bold flex items-center justify-center border border-[#CBD5E1] shrink-0">
                  {user.initials}
                </div>
              )}
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="hidden lg:flex items-center gap-1 px-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-[#64748B] hover:text-[#0F172A]"
            >
              Sign out
            </button>
          </>
        ) : (
          <Link
            href={ROUTES.signIn}
            className="px-4 py-2 bg-[#233242] hover:bg-[#1A2633] text-white text-xs font-bold transition-all"
          >
            Sign in with ORCID
          </Link>
        )}
      </div>
    </header>
  )
}
