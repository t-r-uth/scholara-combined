'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { SCHOLARA_NAV, isTabActive } from '@/lib/scholara-routes'

export default function ScholaraMobileNav() {
  const pathname = usePathname()

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 w-full z-50 flex justify-around items-center px-2 pb-safe pt-2 bg-[#FFFFFF]/95 backdrop-blur-md border-t border-[#E2E8F0] shadow-md">
      {SCHOLARA_NAV.map((tab) => {
        const isActive = isTabActive(tab.id, pathname)
        return (
          <Link
            key={tab.id}
            href={tab.href}
            className={`flex flex-col items-center justify-center px-3 py-1.5 rounded-lg transition-all duration-200 active:scale-95 ${
              isActive
                ? 'bg-[#EEF4FA] text-[#1E293B] font-bold'
                : 'text-[#64748B] hover:text-[#0F172A]'
            }`}
          >
            <span
              className={`material-symbols-outlined text-[20px] ${
                isActive ? 'material-symbols-filled text-[#1E293B]' : ''
              }`}
            >
              {tab.icon}
            </span>
            <span className="font-sans text-[9px] font-bold uppercase tracking-wider mt-0.5">
              {tab.label}
            </span>
          </Link>
        )
      })}
    </nav>
  )
}
