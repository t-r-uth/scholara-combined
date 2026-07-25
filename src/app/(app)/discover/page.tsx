import { Suspense } from 'react'
import { db, batchGetByIds } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import {
  SCOPE_LABELS,
  STUDY_TYPE_LABELS,
  DATASET_SIZE_LABELS,
  ACCESS_LABELS,
  CONTRIBUTION_LABELS,
  STAGE_LABELS,
  AUTHORSHIP_OFFER_LABELS,
} from '@/lib/labels'
import ScholaraDiscoverFilters, { filterUrl } from '@/components/scholara/DiscoverFilters'
import DiscoverFeed from '@/components/scholara/DiscoverFeed'

export const metadata = { title: 'Discover Research — Scholara' }
export const revalidate = 60

const PAGE_SIZE = 12

const STUDY_TYPES_FILTER = Object.entries(STUDY_TYPE_LABELS).map(([value, label]) => ({ value, label }))

const SCOPES = [
  { value: 'global', label: SCOPE_LABELS.global },
  { value: 'regional', label: SCOPE_LABELS.regional },
  { value: 'country', label: SCOPE_LABELS.country },
]

const ACCESS_TYPES = [
  { value: 'open', label: 'Open' },
  { value: 'institution', label: 'By Institution' },
  { value: 'invite', label: 'Invite Only' },
]

function getStageLabel(type: string) {
  return CONTRIBUTION_LABELS[type] ?? STAGE_LABELS[type] ?? type
}

function relativeTime(date: Date | { toDate(): Date } | string | null | undefined) {
  if (!date) return ''
  const d = date instanceof Date ? date : (typeof date === 'object' && 'toDate' in date) ? date.toDate() : new Date(date as string)
  const diff = Date.now() - d.getTime()
  const days = Math.floor(diff / 86400000)
  if (days === 0) return 'Today'
  if (days === 1) return 'Yesterday'
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

export default async function DiscoverPage({
  searchParams,
}: {
  searchParams: { study?: string; scope?: string; access_type?: string; page?: string; q?: string }
}) {
  const studyType = searchParams.study
  const scope = searchParams.scope
  const accessType = searchParams.access_type
  const searchQuery = searchParams.q?.trim().toLowerCase() ?? ''
  const page = Math.max(1, parseInt(searchParams.page ?? '1', 10))

  const activeFilters = {
    ...(studyType ? { study: studyType } : {}),
    ...(scope ? { scope } : {}),
    ...(accessType ? { access_type: accessType } : {}),
    ...(searchQuery ? { q: searchQuery } : {}),
  }
  const hasFilters = !!(studyType || scope || accessType || searchQuery)

  const currentUser = await getServerUser()

  const allSnap = await db.collection('papers')
    .where('status', '==', 'published')
    .orderBy('created_at', 'desc')
    .limit(120)
    .get()

  let allDocs = allSnap.docs

  const paperIds = allDocs.map((doc) => doc.id)
  const stageChunkQueries = []
  for (let i = 0; i < paperIds.length; i += 30) {
    stageChunkQueries.push(
      db.collection('stages').where('paper_id', 'in', paperIds.slice(i, i + 30)).get(),
    )
  }
  const stageResults = await Promise.all(stageChunkQueries)
  const paperIdsWithOpenStage = new Set<string>()
  for (const snap of stageResults) {
    for (const doc of snap.docs) {
      if (doc.data().status === 'open') paperIdsWithOpenStage.add(doc.data().paper_id as string)
    }
  }
  allDocs = allDocs.filter((doc) => paperIdsWithOpenStage.has(doc.id))

  if (searchQuery) {
    allDocs = allDocs.filter((doc) => {
      const d = doc.data()
      const haystack = [
        d.teaser_title,
        d.description,
        d.owner_name,
        d.owner_institution,
      ].filter(Boolean).join(' ').toLowerCase()
      return haystack.includes(searchQuery)
    })
  }

  if (studyType) allDocs = allDocs.filter((doc) => doc.data().study_type === studyType)
  if (scope) allDocs = allDocs.filter((doc) => doc.data().scope === scope)
  if (accessType) allDocs = allDocs.filter((doc) => doc.data().access_type === accessType)

  const count = allDocs.length
  const totalPages = Math.ceil(count / PAGE_SIZE)
  const offset = (page - 1) * PAGE_SIZE
  const pageDocs = allDocs.slice(offset, offset + PAGE_SIZE)

  const ownerIds = Array.from(
    new Set(pageDocs.map((doc) => doc.data().owner_id as string).filter(Boolean))
  )
  const ownerProfiles: Record<string, { name: string; affiliation: string; orcid_verified: boolean; orcid_id: string | null }> = {}
  if (ownerIds.length > 0) {
    const chunks = await batchGetByIds('users', ownerIds)
    chunks.flatMap((snap) => snap.docs).forEach((doc) => {
      const data = doc.data()
      ownerProfiles[doc.id] = {
        name: (data?.display_name as string | undefined) || '',
        affiliation: (data?.institution as string | undefined) || '',
        orcid_verified: (data?.orcid_verified as boolean | undefined) ?? false,
        orcid_id: (data?.orcid_id as string | undefined) || null,
      }
    })
  }

  const papers = pageDocs.map((doc) => {
    const data = doc.data()
    const authorId = data.owner_id as string | undefined
    const live = authorId ? ownerProfiles[authorId] : undefined
    const stageLabels = ((data.stage_types as string[] | undefined) ?? []).map(getStageLabel)
    const metaParts = [
      data.study_type ? (STUDY_TYPE_LABELS[data.study_type as string] ?? null) : null,
      data.dataset_size ? (DATASET_SIZE_LABELS[data.dataset_size as string] ?? null) : null,
      data.access_type ? (ACCESS_LABELS[data.access_type as string] ?? null) : null,
      data.scope ? (SCOPE_LABELS[data.scope as string] ?? data.scope) : null,
    ].filter(Boolean) as string[]

    return {
      id: doc.id,
      teaser_title: data.teaser_title as string,
      description: (data.description as string | null | undefined) ?? null,
      owner_id: authorId,
      owner_name: live?.name || (data.owner_name as string | undefined) || 'Researcher',
      owner_institution: live?.affiliation || (data.owner_institution as string | undefined) || '',
      orcid_verified: live?.orcid_verified ?? false,
      orcid_id: live?.orcid_id ?? null,
      stage_labels: stageLabels,
      meta_parts: metaParts,
      posted: relativeTime(data.created_at as Parameters<typeof relativeTime>[0]),
      is_own: !!currentUser && authorId === currentUser.id,
      authorship_offer: data.authorship_offer
        ? (AUTHORSHIP_OFFER_LABELS[data.authorship_offer as string] ?? null)
        : null,
    }
  })

  function buildFilterUrl(overrides: Record<string, string | undefined>) {
    return filterUrl(activeFilters, overrides)
  }

  return (
    <>
      <Suspense fallback={null}>
        <ScholaraDiscoverFilters
          studyType={studyType}
          scope={scope}
          accessType={accessType}
          studyTypes={STUDY_TYPES_FILTER}
          scopes={SCOPES}
          accessTypes={ACCESS_TYPES}
          activeFilters={activeFilters}
        />
      </Suspense>

      <DiscoverFeed
        papers={papers}
        count={count}
        hasFilters={hasFilters}
        page={page}
        totalPages={totalPages}
        filterUrl={buildFilterUrl}
      />
    </>
  )
}
