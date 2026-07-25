'use client'

import Link from 'next/link'
import { ROUTES } from '@/lib/routes'
import { getGoogleDriveConnected } from '@/lib/google-drive'
import { useEffect, useState } from 'react'

export interface DiscoverPaperCard {
  id: string
  teaser_title: string
  description: string | null
  owner_id?: string
  owner_name: string
  owner_institution: string
  orcid_verified: boolean
  orcid_id: string | null
  stage_labels: string[]
  meta_parts: string[]
  posted: string
  is_own: boolean
  authorship_offer: string | null
}

interface DiscoverFeedProps {
  papers: DiscoverPaperCard[]
  count: number
  hasFilters: boolean
  page: number
  totalPages: number
  filterUrl: (overrides: Record<string, string | undefined>) => string
}

export default function DiscoverFeed({
  papers,
  count,
  hasFilters,
  page,
  totalPages,
  filterUrl,
}: DiscoverFeedProps) {
  const [driveConnected, setDriveConnected] = useState(false)

  useEffect(() => {
    setDriveConnected(getGoogleDriveConnected())
  }, [])

  if (papers.length === 0) {
    return (
      <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6">
        <div className="p-12 text-center bg-[#FFFFFF] border border-[#E2E8F0] space-y-3">
          <span className="material-symbols-outlined text-4xl text-[#94A3B8]">search_off</span>
          <h3 className="font-bold text-base text-[#1E293B]">No research projects found</h3>
          <p className="text-xs text-[#64748B]">
            {hasFilters
              ? 'Try adjusting your search query or clear active filters.'
              : 'No papers have been published yet. Be the first to post one.'}
          </p>
          {!hasFilters && (
            <Link
              href={ROUTES.paperNew}
              className="inline-block px-4 py-2 bg-[#233242] text-white text-xs font-bold rounded-sm mt-2"
            >
              Submit Paper
            </Link>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6 font-sans">
      <div className="flex items-center justify-between mb-4 text-xs text-[#64748B]">
        <span className="font-semibold">
          {count} {count === 1 ? 'paper' : 'papers'}
          {hasFilters ? ' matching' : ''}
        </span>
        {hasFilters && (
          <Link href="/discover" className="font-bold hover:text-[#0F172A] underline">
            Clear filters
          </Link>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        <div className="lg:col-span-8 space-y-6">
          {papers.map((paper) => (
            <article
              key={paper.id}
              className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 shadow-xs hover:border-[#CBD5E1] transition-all relative group"
            >
              <div className="flex justify-between items-start gap-4 mb-3">
                <div className="flex flex-wrap items-center gap-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                  {paper.meta_parts.slice(0, 2).map((part, i) => (
                    <span key={part}>
                      {i > 0 && <span className="mx-1">•</span>}
                      {i === 0 ? (
                        <span className="px-2 py-0.5 bg-[#F1F5F9] text-[#1E293B] border border-[#E2E8F0]">
                          {part}
                        </span>
                      ) : (
                        part
                      )}
                    </span>
                  ))}
                </div>

                <div className="flex items-center gap-2 text-right">
                  <div>
                    {paper.owner_id ? (
                      <Link
                        href={ROUTES.profile(paper.owner_id)}
                        className="font-bold text-xs text-[#1E293B] block leading-tight hover:underline"
                      >
                        {paper.owner_name}
                      </Link>
                    ) : (
                      <span className="font-bold text-xs text-[#1E293B] block leading-tight">
                        {paper.owner_name}
                      </span>
                    )}
                    {paper.owner_institution && (
                      <span className="text-[10px] font-medium text-[#64748B] block">
                        {paper.owner_institution}
                      </span>
                    )}
                  </div>
                  {paper.orcid_verified && (
                    <span className="material-symbols-filled text-[#8CC63F] text-lg shrink-0">
                      verified
                    </span>
                  )}
                </div>
              </div>

              <h2 className="font-bold text-xl text-[#0F172A] leading-snug mb-3">
                <Link href={ROUTES.paper(paper.id)} className="hover:text-[#233242] transition-colors">
                  {paper.teaser_title}
                </Link>
                {paper.is_own && (
                  <span className="ml-2 text-[10px] font-bold uppercase tracking-wider text-[#64748B]">
                    Your paper
                  </span>
                )}
              </h2>

              {paper.description && (
                <p className="text-xs text-[#475569] leading-relaxed mb-5 font-normal line-clamp-3">
                  {paper.description}
                </p>
              )}

              {paper.stage_labels.length > 0 && (
                <div className="flex items-center gap-2 mb-5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-[#64748B]">
                    NEEDS:
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {paper.stage_labels.map((need) => (
                      <span
                        key={need}
                        className="px-3 py-1 bg-[#F1F5F9] border border-[#E2E8F0] text-[#1E293B] text-[10px] font-semibold rounded-xs"
                      >
                        {need}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 border-t border-[#F1F5F9] flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2 text-xs text-[#64748B]">
                  <span className="material-symbols-outlined text-base">co_present</span>
                  <span className="italic font-serif">
                    {paper.authorship_offer || 'Co-authorship for substantial work'}
                  </span>
                </div>

                <div className="flex items-center gap-2">
                  {driveConnected && (
                    <span className="hidden sm:flex items-center gap-1 px-3 py-2 border border-[#CBD5E1] text-[#64748B] text-[10px] font-bold">
                      <span className="material-symbols-filled text-sm text-[#8CC63F]">folder_shared</span>
                      Drive ready
                    </span>
                  )}
                  <Link
                    href={ROUTES.paper(paper.id)}
                    className="px-5 py-2 bg-[#233242] hover:bg-[#1A2633] text-white text-xs font-bold transition-all shadow-sm active:scale-95"
                  >
                    Apply to Project
                  </Link>
                </div>
              </div>

              {paper.posted && (
                <span className="absolute top-4 right-4 text-[10px] text-[#94A3B8] font-medium">
                  {paper.posted}
                </span>
              )}
            </article>
          ))}

          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-4 pt-4">
              <Link
                href={filterUrl({ page: page > 1 ? String(page - 1) : undefined })}
                className={`px-4 py-2 text-xs font-bold border border-[#CBD5E1] ${
                  page <= 1 ? 'opacity-40 pointer-events-none' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                ← Previous
              </Link>
              <span className="text-xs text-[#64748B]">
                {page} / {totalPages}
              </span>
              <Link
                href={filterUrl({ page: page < totalPages ? String(page + 1) : undefined })}
                className={`px-4 py-2 text-xs font-bold border border-[#CBD5E1] ${
                  page >= totalPages ? 'opacity-40 pointer-events-none' : 'hover:bg-[#F8FAFC]'
                }`}
              >
                Next →
              </Link>
            </div>
          )}
        </div>

        <div className="lg:col-span-4 space-y-6">
          <div className="bg-[#233242] text-white p-6 shadow-md border border-[#1A2633]">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-outlined text-[#8CC63F] text-xl">radar</span>
              <h3 className="font-bold text-sm tracking-wide">Research Radar</h3>
            </div>
            <p className="text-xs text-[#CBD5E1] leading-relaxed mb-4">
              Browse open listings and apply to contribute your expertise. Verified ORCID identity required to collaborate.
            </p>
            <Link
              href={ROUTES.signIn}
              className="block p-3.5 bg-[#2E3F52] hover:bg-[#384A5E] border border-[#3E5166] transition-colors text-xs font-bold"
            >
              Sign in to get personalized matches →
            </Link>
          </div>

          <div className="bg-[#FFFFFF] border border-[#E2E8F0] p-6 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <span className="material-symbols-filled text-[#8CC63F] text-xl">folder_shared</span>
              <h3 className="font-bold text-sm text-[#0F172A]">Google Drive Sharing</h3>
            </div>
            <p className="text-xs text-[#64748B] leading-relaxed">
              Manuscript files stay on Google Drive. After you match with a collaborator, share your Google Doc link via the paper&apos;s manage tab — no local file storage.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
