import Link from 'next/link'
import { getServerUser } from '@/lib/firebase/session'
import { getAdminDb, batchGetByIds } from '@/lib/firebase/admin'
import { ROUTES } from '@/lib/routes'
import { TRACKING_STAGES, type TrackingStage } from '@/lib/labels'
import TrackingBoard, { type TrackingPaper, type TrackingCoAuthor, type ContributingPaper } from './TrackingBoard'

export const metadata = { title: 'Paper tracker — Scholara' }

function formatDue(value: string | null): { label: string; urgent: boolean } | null {
  if (!value) return null
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return null

  const target = new Date(year, month - 1, day)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const diffDays = Math.round((target.getTime() - today.getTime()) / 86_400_000)

  if (diffDays < 0) {
    const days = Math.abs(diffDays)
    return { label: `Overdue ${days} day${days === 1 ? '' : 's'}`, urgent: true }
  }
  if (diffDays === 0) return { label: 'Due today', urgent: true }
  return { label: `Due in ${diffDays} day${diffDays === 1 ? '' : 's'}`, urgent: false }
}

export default async function TrackingPage() {
  const user = await getServerUser()
  if (!user) return null

  const db = getAdminDb()
  const [snap, contribAsUserSnap] = await Promise.all([
    db.collection('papers').where('owner_id', '==', user.id).get(),
    db.collection('contributions').where('contributor_id', '==', user.id).get(),
  ])

  const paperIds = snap.docs.map(d => d.id)

  const coAuthorsByPaperId: Record<string, TrackingCoAuthor[]> = {}
  if (paperIds.length > 0) {
    const chunkQueries = []
    for (let i = 0; i < paperIds.length; i += 30) {
      chunkQueries.push(
        db.collection('contributions').where('paper_id', 'in', paperIds.slice(i, i + 30)).get(),
      )
    }
    const chunkResults = await Promise.all(chunkQueries)
    const contribDocs = chunkResults.flatMap(s =>
      s.docs.map(d => d.data() as { paper_id: string; contributor_id: string }),
    )

    const contributorIds = Array.from(new Set(contribDocs.map(c => c.contributor_id)))
    const contributors: Record<string, { name: string; avatarUrl: string | null }> = {}
    if (contributorIds.length > 0) {
      const contributorResults = await batchGetByIds('users', contributorIds)
      for (const s of contributorResults) {
        for (const d of s.docs) {
          const data = d.data()
          contributors[d.id] = {
            name: (data.display_name as string | undefined) ?? 'Contributor',
            avatarUrl: (data.avatar_url as string | undefined) ?? null,
          }
        }
      }
    }

    const seenPerPaper: Record<string, Set<string>> = {}
    for (const c of contribDocs) {
      if (!coAuthorsByPaperId[c.paper_id]) coAuthorsByPaperId[c.paper_id] = []
      const seen = (seenPerPaper[c.paper_id] ??= new Set())
      if (seen.has(c.contributor_id)) continue
      seen.add(c.contributor_id)
      const contributor = contributors[c.contributor_id]
      if (contributor) coAuthorsByPaperId[c.paper_id]!.push({ id: c.contributor_id, ...contributor })
    }
  }

  const papers: TrackingPaper[] = snap.docs.map(doc => {
    const d = doc.data()
    const stage = d.tracking_stage as string | undefined
    return {
      id:             doc.id,
      title:          (d.teaser_title as string | undefined) ?? (d.full_title as string | undefined) ?? 'Untitled',
      tracking_stage: (TRACKING_STAGES.includes(stage as TrackingStage) ? stage : 'idea') as TrackingStage,
      status:         (d.status as 'draft' | 'published') ?? 'draft',
      study_type:     (d.study_type as string | undefined) ?? null,
      co_authors:     coAuthorsByPaperId[doc.id] ?? [],
      due:            formatDue((d.submission_timeline as string | null | undefined) ?? null),
    }
  })

  // Papers this user contributes to (not owns), where the author opted in to sharing the tracker.
  const contributingPaperIds = Array.from(
    new Set(contribAsUserSnap.docs.map(d => d.data().paper_id as string).filter(id => !paperIds.includes(id))),
  )
  let contributingPapers: ContributingPaper[] = []
  if (contributingPaperIds.length > 0) {
    const paperResults = await batchGetByIds('papers', contributingPaperIds)
    const contributingDocs = paperResults.flatMap(s => s.docs)
      .filter(d => (d.data().tracker_visible_to_contributors as boolean | undefined) === true)

    const ownerIds = Array.from(new Set(contributingDocs.map(d => d.data().owner_id as string).filter(Boolean)))
    const owners: Record<string, string> = {}
    if (ownerIds.length > 0) {
      const ownerResults = await batchGetByIds('users', ownerIds)
      for (const s of ownerResults) {
        for (const d of s.docs) {
          owners[d.id] = (d.data().display_name as string | undefined) ?? 'Researcher'
        }
      }
    }

    contributingPapers = contributingDocs.map(doc => {
      const d = doc.data()
      const stage = d.tracking_stage as string | undefined
      return {
        id:             doc.id,
        title:          (d.teaser_title as string | undefined) ?? (d.full_title as string | undefined) ?? 'Untitled',
        tracking_stage: (TRACKING_STAGES.includes(stage as TrackingStage) ? stage : 'idea') as TrackingStage,
        ownerName:      owners[d.owner_id as string] ?? 'Researcher',
      }
    })
  }

  if (papers.length === 0 && contributingPapers.length === 0) {
    return (
      <div className="work-empty">
        <div className="work-empty__title">Track your papers here</div>
        <p className="work-empty__text">
          Add a paper to start tracking it — a title is all you need, and it stays private until you choose to publish. Drag cards between columns to mark which stage each paper is in, from first idea through to published.
        </p>
        <Link href={ROUTES.paperNew} className="btn-publish work-empty__cta">Add a paper</Link>
      </div>
    )
  }

  return (
    <div className="work-tab">
      <header className="work-tab__intro">
        <h2 className="work-tab__heading">Paper tracker</h2>
        <p className="work-tab__help">Drag cards between columns to move a paper through the publication pipeline.</p>
      </header>
      <TrackingBoard papers={papers} contributingPapers={contributingPapers} />
    </div>
  )
}
