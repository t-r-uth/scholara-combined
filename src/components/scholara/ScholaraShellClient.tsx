'use client'

import { Suspense } from 'react'
import ScholaraSidebar from './Sidebar'
import ScholaraHeader, { type ScholaraHeaderUser } from './Header'
import ScholaraMobileNav from './MobileNav'
import type { NavBadgeCounts } from '@/lib/firestore/nav-badges'

interface ScholaraShellClientProps {
  children: React.ReactNode
  user: ScholaraHeaderUser | null
  badges: NavBadgeCounts | null
}

function HeaderFallback() {
  return <header className="sticky top-0 z-20 h-16 bg-[#F4F6F8]/90 border-b border-[#E2E8F0]" />
}

export default function ScholaraShellClient({ children, user, badges }: ScholaraShellClientProps) {
  return (
    <div className="min-h-screen bg-[#F4F6F8] text-[#0F172A] flex font-sans selection:bg-[#233242] selection:text-white">
      <ScholaraSidebar />

      <div className="flex-1 lg:pl-64 flex flex-col min-h-screen pb-20 lg:pb-12">
        <Suspense fallback={<HeaderFallback />}>
          <ScholaraHeader user={user} badges={badges} />
        </Suspense>

        <main className="flex-1 scholara-main">{children}</main>
      </div>

      <ScholaraMobileNav />
    </div>
  )
}
