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

interface DiscoverToolbarProps {
  q: string
  studyType?: string
  scope?: string
  accessType?: string
  studyTypes: FilterOption[]
  scopes: FilterOption[]
  accessTypes: FilterOption[]
  activeFilters: Record<string, string>
}


export default function DiscoverToolbar({
  q,
  studyType,
  scope,
  accessType,
  studyTypes,
  scopes,
  accessTypes,
  activeFilters,
}: DiscoverToolbarProps) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const [query, setQuery] = useState(q)
  const activeFilterCount = [studyType, scope, accessType].filter(Boolean).length
  const [filtersOpen, setFiltersOpen] = useState(activeFilterCount > 0)

  function submitSearch(e: React.FormEvent) {
    e.preventDefault()
    const params = new URLSearchParams(searchParams.toString())
    const trimmed = query.trim()
    if (trimmed) params.set('q', trimmed)
    else params.delete('q')
    params.delete('page')
    startTransition(() => {
      router.push(params.toString() ? `/discover?${params.toString()}` : '/discover')
    })
  }

  function clearSearch() {
    setQuery('')
    const params = new URLSearchParams(searchParams.toString())
    params.delete('q')
    params.delete('page')
    startTransition(() => {
      router.push(params.toString() ? `/discover?${params.toString()}` : '/discover')
    })
  }

  function setFilter(key: 'study' | 'scope' | 'access_type', value: string) {
    startTransition(() => {
      router.push(filterUrl(activeFilters, {
        [key]: value || undefined,
        page: undefined,
      }))
    })
  }

  return (
    <div className="discover-toolbar">
      <form className="discover-search" onSubmit={submitSearch} role="search">
        <input
          type="search"
          className="discover-search__input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by title, topic, or institution…"
          aria-label="Search papers"
        />
        {q && (
          <button type="button" className="discover-search__clear" onClick={clearSearch} aria-label="Clear search">
            ×
          </button>
        )}
        <button type="submit" className="discover-search__submit" disabled={isPending}>
          Search
        </button>
      </form>

      <button
        type="button"
        className={`discover-filters-toggle ${filtersOpen ? 'discover-filters-toggle--open' : ''}`}
        onClick={() => setFiltersOpen((v) => !v)}
        aria-expanded={filtersOpen}
      >
        Filters
        {activeFilterCount > 0 && (
          <span className="discover-filters-toggle__count" aria-label={`${activeFilterCount} active`}>
            {activeFilterCount}
          </span>
        )}
        <svg
          className="discover-filters-toggle__chevron"
          viewBox="0 0 10 6"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <polyline points="1,1 5,5 9,1" />
        </svg>
      </button>

      {filtersOpen && (
        <div className="discover-filters">
          <div className="discover-filter-fields">
            <label className="discover-filter-field">
              <span className="discover-filter-label">Study type</span>
              <select
                className="discover-filter-select"
                value={studyType ?? ''}
                onChange={(e) => setFilter('study', e.target.value)}
                disabled={isPending}
              >
                <option value="">All</option>
                {studyTypes.map((st) => (
                  <option key={st.value} value={st.value}>{st.label}</option>
                ))}
              </select>
            </label>

            <label className="discover-filter-field">
              <span className="discover-filter-label">Scope</span>
              <select
                className="discover-filter-select"
                value={scope ?? ''}
                onChange={(e) => setFilter('scope', e.target.value)}
                disabled={isPending}
              >
                <option value="">All</option>
                {scopes.map((sc) => (
                  <option key={sc.value} value={sc.value}>{sc.label}</option>
                ))}
              </select>
            </label>

            <label className="discover-filter-field">
              <span className="discover-filter-label">Access</span>
              <select
                className="discover-filter-select"
                value={accessType ?? ''}
                onChange={(e) => setFilter('access_type', e.target.value)}
                disabled={isPending}
              >
                <option value="">All</option>
                {accessTypes.map((at) => (
                  <option key={at.value} value={at.value}>{at.label}</option>
                ))}
              </select>
            </label>
          </div>
        </div>
      )}
    </div>
  )
}
