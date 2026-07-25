'use client'

import { useRouter, useSearchParams } from 'next/navigation'
import { useState, useTransition } from 'react'

function filterUrl(base: Record<string, string | undefined>, overrides: Record<string, string | undefined>): string {
  const merged = { ...base, ...overrides }
  const q = new URLSearchParams()
  Object.entries(merged).forEach(([k, v]) => { if (v) q.set(k, v) })
  const s = q.toString()
  return s ? `/discover?${s}` : '/discover'
}

type FilterOption = { value: string; label: string }

interface ScholaraDiscoverFiltersProps {
  studyType?: string
  scope?: string
  accessType?: string
  studyTypes: FilterOption[]
  scopes: FilterOption[]
  accessTypes: FilterOption[]
  activeFilters: Record<string, string>
}

export default function ScholaraDiscoverFilters({
  studyType,
  scope,
  accessType,
  studyTypes,
  scopes,
  accessTypes,
  activeFilters,
}: ScholaraDiscoverFiltersProps) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function setFilter(key: 'study' | 'scope' | 'access_type', value: string) {
    startTransition(() => {
      router.push(filterUrl(activeFilters, {
        [key]: value || undefined,
        page: undefined,
      }))
    })
  }

  const hasActive = !!(studyType || scope || accessType)

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 pt-6">
      <div className="flex flex-wrap items-center gap-3 mb-2 pb-4 border-b border-[#E2E8F0]">
        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Type:</label>
          <select
            value={studyType ?? ''}
            onChange={(e) => setFilter('study', e.target.value)}
            disabled={isPending}
            className="bg-[#FFFFFF] border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] px-3 py-1.5 rounded-md focus:outline-none focus:border-[#233242] cursor-pointer"
          >
            <option value="">Study Type ▾</option>
            {studyTypes.map((st) => (
              <option key={st.value} value={st.value}>{st.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Scope:</label>
          <select
            value={scope ?? ''}
            onChange={(e) => setFilter('scope', e.target.value)}
            disabled={isPending}
            className="bg-[#FFFFFF] border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] px-3 py-1.5 rounded-md focus:outline-none focus:border-[#233242] cursor-pointer"
          >
            <option value="">Scope ▾</option>
            {scopes.map((sc) => (
              <option key={sc.value} value={sc.value}>{sc.label}</option>
            ))}
          </select>
        </div>

        <div className="flex items-center gap-2">
          <label className="text-[11px] font-bold uppercase tracking-wider text-[#64748B]">Access:</label>
          <select
            value={accessType ?? ''}
            onChange={(e) => setFilter('access_type', e.target.value)}
            disabled={isPending}
            className="bg-[#FFFFFF] border border-[#CBD5E1] text-xs font-semibold text-[#1E293B] px-3 py-1.5 rounded-md focus:outline-none focus:border-[#233242] cursor-pointer"
          >
            <option value="">Access ▾</option>
            {accessTypes.map((at) => (
              <option key={at.value} value={at.value}>{at.label}</option>
            ))}
          </select>
        </div>

        {hasActive && (
          <button
            type="button"
            onClick={() => startTransition(() => router.push('/discover'))}
            className="text-xs font-bold text-[#64748B] hover:text-[#0F172A] underline ml-auto cursor-pointer"
          >
            Clear All
          </button>
        )}
      </div>
    </div>
  )
}

export { filterUrl }
