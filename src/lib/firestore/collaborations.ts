import { getAdminDb, batchGetByIds } from '@/lib/firebase/admin'
import {
  STAGE_LABELS,
  collaborationUrgency,
  collaborationNextAction,
  collaborationNeedsOwnerAction,
  contributorCollaborationUrgency,
  contributorCollaborationNextAction,
  paperStageRowLabel,
  paperStageRowAction,
  type CollaborationUrgency,
  type CollaborationNextAction,
  type ContributorNextAction,
} from '@/lib/labels'

export type OwnerCollaboration = {
  contributionId: string
  applicationId: string
  paperId: string
  paperTitle: string
  stageId: string
  stageLabel: string
  contributorId: string
  contributorName: string
  status: string
  urgency: CollaborationUrgency
  nextAction: CollaborationNextAction
}

export type PaperStageLine = {
  stageId: string
  stageLabel: string
  stageStatus: string
  line: string
  needsYou: boolean
}

function normaliseContribStatus(
  status: string,
  legacy: { doc_shared?: boolean; commitment_confirmed?: boolean; coauthorship?: string },
): string {
  if (status === 'in_progress') {
    if (legacy.doc_shared) return legacy.commitment_confirmed ? 'contribution_confirmed' : 'document_shared'
    return 'in_progress'
  }
  if (status === 'completed') {
    return legacy.coauthorship === 'granted' || legacy.coauthorship === 'substantial' ? 'substantial' : 'not_substantial'
  }
  return status
}

async function loadOwnerContributionDocs(userId: string) {
  const db = getAdminDb()
  const papersSnap = await db.collection('papers')
    .where('owner_id', '==', userId)
    .select()
    .get()

  const paperIds = papersSnap.docs.map((d) => d.id)
  if (paperIds.length === 0) return { paperIds, contribDocs: [] as Array<Record<string, unknown> & { id: string }> }

  const chunkQueries = []
  for (let i = 0; i < paperIds.length; i += 30) {
    const chunk = paperIds.slice(i, i + 30)
    chunkQueries.push(
      db.collection('contributions').where('paper_id', 'in', chunk).get(),
    )
  }
  const results = await Promise.all(chunkQueries)
  const contribDocs = results.flatMap((snap) =>
    snap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string })),
  )

  return { paperIds, contribDocs }
}

function stageLineForContribs(
  stageLabel: string,
  stageStatus: string,
  statuses: string[],
): PaperStageLine | null {
  const needsYou = statuses.filter((s) => collaborationNeedsOwnerAction(s)).length
  const inProgress = statuses.filter((s) => collaborationUrgency(s) === 'in_progress').length
  const completed = statuses.filter((s) => collaborationUrgency(s) === 'completed').length

  if (needsYou > 0) {
    const awaitingDoc = statuses.some((s) => s === 'interest_confirmed')
    return {
      stageId: '',
      stageLabel,
      stageStatus,
      needsYou: true,
      line: awaitingDoc
        ? `${stageLabel} · share document`
        : `${stageLabel} · needs review`,
    }
  }
  if (inProgress > 0) {
    return {
      stageId: '',
      stageLabel,
      stageStatus,
      needsYou: false,
      line: `${stageLabel} · ${inProgress} in progress`,
    }
  }
  if (completed > 0 && statuses.length === completed) {
    return {
      stageId: '',
      stageLabel,
      stageStatus,
      needsYou: false,
      line: `${stageLabel} · completed`,
    }
  }
  if (stageStatus === 'open' && statuses.length === 0) {
    return {
      stageId: '',
      stageLabel,
      stageStatus,
      needsYou: false,
      line: `${stageLabel} · open`,
    }
  }
  return null
}

export async function getOwnerNeedsActionCount(userId: string): Promise<number> {
  const { contribDocs } = await loadOwnerContributionDocs(userId)
  return contribDocs.filter((c) =>
    collaborationNeedsOwnerAction(
      normaliseContribStatus(c.status as string, {
        doc_shared: c.doc_shared as boolean | undefined,
        commitment_confirmed: c.commitment_confirmed as boolean | undefined,
        coauthorship: c.coauthorship as string | undefined,
      }),
    ),
  ).length
}

export async function getOwnerCollaborations(userId: string): Promise<OwnerCollaboration[]> {
  const { paperIds, contribDocs } = await loadOwnerContributionDocs(userId)
  if (contribDocs.length === 0) return []

  const stageIds = Array.from(new Set(contribDocs.map((c) => c.stage_id as string).filter(Boolean)))
  const contributorIds = Array.from(new Set(contribDocs.map((c) => c.contributor_id as string).filter(Boolean)))

  const [paperResults, stageResults, userResults] = await Promise.all([
    batchGetByIds('papers', paperIds),
    batchGetByIds('stages', stageIds),
    batchGetByIds('users', contributorIds),
  ])

  const papers: Record<string, { teaser_title?: string }> = {}
  for (const snap of paperResults) {
    for (const d of snap.docs) {
      papers[d.id] = d.data() as { teaser_title?: string }
    }
  }

  const stages: Record<string, { type?: string }> = {}
  for (const snap of stageResults) {
    for (const d of snap.docs) {
      stages[d.id] = d.data() as { type?: string }
    }
  }

  const users: Record<string, { display_name?: string }> = {}
  for (const snap of userResults) {
    for (const d of snap.docs) {
      users[d.id] = d.data() as { display_name?: string }
    }
  }

  const rows: OwnerCollaboration[] = contribDocs.map((c) => {
    const paperId = c.paper_id as string
    const stageId = c.stage_id as string
    const contributorId = c.contributor_id as string
    const stageType = stages[stageId]?.type ?? ''
    const status = normaliseContribStatus(c.status as string, {
      doc_shared: c.doc_shared as boolean | undefined,
      commitment_confirmed: c.commitment_confirmed as boolean | undefined,
      coauthorship: c.coauthorship as string | undefined,
    })

    return {
      contributionId: c.id,
      applicationId: c.application_id as string,
      paperId,
      paperTitle: papers[paperId]?.teaser_title ?? 'Untitled paper',
      stageId,
      stageLabel: STAGE_LABELS[stageType] ?? stageType,
      contributorId,
      contributorName: users[contributorId]?.display_name ?? 'Researcher',
      status,
      urgency: collaborationUrgency(status),
      nextAction: collaborationNextAction(status),
    }
  })

  const urgencyOrder: Record<CollaborationUrgency, number> = {
    needs_you: 0,
    in_progress: 1,
    completed: 2,
  }

  return rows.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
}

export type ContributorCollaboration = {
  contributionId: string
  applicationId: string
  paperId: string
  paperTitle: string
  stageId: string
  stageLabel: string
  ownerName: string
  status: string
  urgency: CollaborationUrgency
  nextAction: ContributorNextAction
}

export async function getContributorCollaborations(userId: string): Promise<ContributorCollaboration[]> {
  const db = getAdminDb()
  const contribSnap = await db.collection('contributions')
    .where('contributor_id', '==', userId)
    .get()

  if (contribSnap.empty) return []

  const contribDocs = contribSnap.docs.map((d) => ({ id: d.id, ...d.data() } as Record<string, unknown> & { id: string }))

  const paperIds = Array.from(new Set(contribDocs.map((c) => c.paper_id as string).filter(Boolean)))
  const stageIds = Array.from(new Set(contribDocs.map((c) => c.stage_id as string).filter(Boolean)))

  const [paperResults, stageResults] = await Promise.all([
    batchGetByIds('papers', paperIds),
    batchGetByIds('stages', stageIds),
  ])

  const papers: Record<string, { teaser_title?: string; owner_id?: string }> = {}
  const ownerIds = new Set<string>()
  for (const snap of paperResults) {
    for (const d of snap.docs) {
      const data = d.data() as { teaser_title?: string; owner_id?: string }
      papers[d.id] = data
      if (data.owner_id) ownerIds.add(data.owner_id)
    }
  }

  const stages: Record<string, { type?: string }> = {}
  for (const snap of stageResults) {
    for (const d of snap.docs) {
      stages[d.id] = d.data() as { type?: string }
    }
  }

  const ownerResults = await batchGetByIds('users', Array.from(ownerIds))
  const owners: Record<string, { display_name?: string }> = {}
  for (const snap of ownerResults) {
    for (const d of snap.docs) {
      owners[d.id] = d.data() as { display_name?: string }
    }
  }

  const rows: ContributorCollaboration[] = contribDocs.map((c) => {
    const paperId = c.paper_id as string
    const stageId = c.stage_id as string
    const stageType = stages[stageId]?.type ?? ''
    const paper = papers[paperId]
    const ownerId = paper?.owner_id ?? ''
    const status = normaliseContribStatus(c.status as string, {
      doc_shared: c.doc_shared as boolean | undefined,
      commitment_confirmed: c.commitment_confirmed as boolean | undefined,
      coauthorship: c.coauthorship as string | undefined,
    })

    return {
      contributionId: c.id,
      applicationId: c.application_id as string,
      paperId,
      paperTitle: paper?.teaser_title ?? 'Untitled paper',
      stageId,
      stageLabel: STAGE_LABELS[stageType] ?? stageType,
      ownerName: owners[ownerId]?.display_name ?? 'Researcher',
      status,
      urgency: contributorCollaborationUrgency(status),
      nextAction: contributorCollaborationNextAction(status),
    }
  })

  const urgencyOrder: Record<CollaborationUrgency, number> = {
    needs_you: 0,
    in_progress: 1,
    completed: 2,
  }

  return rows.sort((a, b) => urgencyOrder[a.urgency] - urgencyOrder[b.urgency])
}

export type PaperStageSummary = {
  stageId: string
  stageLabel: string
  statusLabel: string
  needsYou: boolean
  action: CollaborationNextAction | null
  contributorCount: number
  pendingApplicantsCount: number
  stageOpen: boolean
  completedOnly: boolean
}

export type PaperCardSummary = {
  paperId: string
  title: string
  status: 'draft' | 'published'
  postedAt: string | null
  needsYouCount: number
  inProgressCount: number
  completedCount: number
  pendingApplicantsCount: number
  stageCount: number
  firstBlockingStageId: string | null
  stages: PaperStageSummary[]
  quietHint: string | null
}

async function loadPendingApplicants(paperIds: string[]): Promise<{
  byPaper: Record<string, number>
  byStage: Record<string, number>
}> {
  if (paperIds.length === 0) return { byPaper: {}, byStage: {} }
  const db = getAdminDb()
  const byPaper: Record<string, number> = {}
  const byStage: Record<string, number> = {}

  const chunkQueries = []
  for (let i = 0; i < paperIds.length; i += 30) {
    const chunk = paperIds.slice(i, i + 30)
    chunkQueries.push(
      db.collection('applications')
        .where('paper_id', 'in', chunk)
        .where('status', 'in', ['interest_registered', 'pending'])
        .get(),
    )
  }
  const results = await Promise.all(chunkQueries)
  for (const snap of results) {
    for (const d of snap.docs) {
      const data = d.data()
      const paperId = data.paper_id as string
      const stageId = data.stage_id as string
      byPaper[paperId] = (byPaper[paperId] ?? 0) + 1
      if (stageId) byStage[stageId] = (byStage[stageId] ?? 0) + 1
    }
  }
  return { byPaper, byStage }
}

function buildStageSummary(
  stage: { id: string; type: string; status: string },
  statuses: string[],
  pendingApplicants: number,
): PaperStageSummary {
  const stageLabel = STAGE_LABELS[stage.type] ?? stage.type
  const stageOpen = stage.status === 'open'
  const needsYou = statuses.some((s) => collaborationNeedsOwnerAction(s))
  const completedOnly = statuses.length > 0 && statuses.every((s) => collaborationUrgency(s) === 'completed')

  return {
    stageId: stage.id,
    stageLabel,
    statusLabel: paperStageRowLabel(stageOpen, statuses),
    needsYou,
    action: paperStageRowAction(stageOpen, statuses),
    contributorCount: statuses.length,
    pendingApplicantsCount: pendingApplicants,
    stageOpen,
    completedOnly,
  }
}

/** Full paper card data for My papers (summary + optional stage breakdown). */
export async function getOwnerPaperSummaries(userId: string): Promise<PaperCardSummary[]> {
  const db = getAdminDb()
  const papersSnap = await db.collection('papers').where('owner_id', '==', userId).get()
  if (papersSnap.empty) return []

  const paperDocs = papersSnap.docs.map((d) => ({
    id: d.id,
    teaser_title: (d.data().teaser_title as string | undefined) ?? 'Untitled paper',
    status: ((d.data().status as string | undefined) ?? 'draft') as 'draft' | 'published',
    created_at: d.data().created_at as { toDate(): Date } | undefined,
  }))

  const paperIds = paperDocs.map((p) => p.id)
  const [{ contribDocs }, { byPaper: pendingByPaper, byStage: pendingByStage }] = await Promise.all([
    loadOwnerContributionDocs(userId),
    loadPendingApplicants(paperIds),
  ])

  const stageChunkQueries = []
  for (let i = 0; i < paperIds.length; i += 30) {
    stageChunkQueries.push(
      db.collection('stages').where('paper_id', 'in', paperIds.slice(i, i + 30)).get(),
    )
  }
  const stageResults = await Promise.all(stageChunkQueries)

  const stagesByPaper: Record<string, Array<{ id: string; type: string; status: string }>> = {}
  for (const snap of stageResults) {
    for (const d of snap.docs) {
      const data = d.data()
      const paperId = data.paper_id as string
      if (!stagesByPaper[paperId]) stagesByPaper[paperId] = []
      stagesByPaper[paperId]!.push({
        id: d.id,
        type: data.type as string,
        status: (data.status as string | undefined) ?? 'open',
      })
    }
  }

  const contribsByStage: Record<string, string[]> = {}
  for (const c of contribDocs) {
    const stageId = c.stage_id as string
    const status = normaliseContribStatus(c.status as string, {
      doc_shared: c.doc_shared as boolean | undefined,
      commitment_confirmed: c.commitment_confirmed as boolean | undefined,
      coauthorship: c.coauthorship as string | undefined,
    })
    if (!contribsByStage[stageId]) contribsByStage[stageId] = []
    contribsByStage[stageId]!.push(status)
  }

  return paperDocs.map((paper) => {
    const stages = (stagesByPaper[paper.id] ?? []).map((stage) =>
      buildStageSummary(stage, contribsByStage[stage.id] ?? [], pendingByStage[stage.id] ?? 0),
    )

    let needsYouCount = 0
    let inProgressCount = 0
    let completedCount = 0
    let firstBlockingStageId: string | null = null

    for (const c of contribDocs) {
      if ((c.paper_id as string) !== paper.id) continue
      const status = normaliseContribStatus(c.status as string, {
        doc_shared: c.doc_shared as boolean | undefined,
        commitment_confirmed: c.commitment_confirmed as boolean | undefined,
        coauthorship: c.coauthorship as string | undefined,
      })
      const urgency = collaborationUrgency(status)
      if (urgency === 'needs_you') {
        needsYouCount++
        if (!firstBlockingStageId) firstBlockingStageId = c.stage_id as string
      } else if (urgency === 'in_progress') {
        inProgressCount++
      } else {
        completedCount++
      }
    }

    const pendingApplicantsCount = pendingByPaper[paper.id] ?? 0
    const stageCount = stages.length

    let quietHint: string | null = null
    if (paper.status === 'draft') {
      quietHint = stageCount === 0
        ? 'No stages yet — finish posting to invite collaborators.'
        : 'Draft — not visible on Discover until published.'
    } else if (
      pendingApplicantsCount === 0 &&
      needsYouCount === 0 &&
      inProgressCount === 0 &&
      completedCount === 0
    ) {
      quietHint = 'No applicants yet — your listing is live on Discover.'
    }

    const postedAt = paper.created_at?.toDate?.()
      ? paper.created_at.toDate().toISOString()
      : null

    return {
      paperId: paper.id,
      title: paper.teaser_title,
      status: paper.status,
      postedAt,
      needsYouCount,
      inProgressCount,
      completedCount,
      pendingApplicantsCount,
      stageCount,
      firstBlockingStageId,
      stages,
      quietHint,
    }
  }).sort((a, b) => {
    const aTime = a.postedAt ? new Date(a.postedAt).getTime() : 0
    const bTime = b.postedAt ? new Date(b.postedAt).getTime() : 0
    return bTime - aTime
  })
}

/** @deprecated Use getOwnerPaperSummaries */
export async function getOwnerPaperStageLines(
  userId: string,
): Promise<Record<string, PaperStageLine[]>> {
  const db = getAdminDb()
  const papersSnap = await db.collection('papers').where('owner_id', '==', userId).get()
  if (papersSnap.empty) return {}

  const paperIds = papersSnap.docs.map((d) => d.id)
  const { contribDocs } = await loadOwnerContributionDocs(userId)

  const stageChunkQueries = []
  for (let i = 0; i < paperIds.length; i += 30) {
    const chunk = paperIds.slice(i, i + 30)
    stageChunkQueries.push(
      db.collection('stages').where('paper_id', 'in', chunk).get(),
    )
  }
  const stageResults = await Promise.all(stageChunkQueries)

  const stagesByPaper: Record<string, Array<{ id: string; type: string; status: string }>> = {}
  for (const snap of stageResults) {
    for (const d of snap.docs) {
      const data = d.data()
      const paperId = data.paper_id as string
      if (!stagesByPaper[paperId]) stagesByPaper[paperId] = []
      stagesByPaper[paperId]!.push({
        id: d.id,
        type: data.type as string,
        status: (data.status as string | undefined) ?? 'open',
      })
    }
  }

  const contribsByStage: Record<string, string[]> = {}
  for (const c of contribDocs) {
    const stageId = c.stage_id as string
    const status = normaliseContribStatus(c.status as string, {
      doc_shared: c.doc_shared as boolean | undefined,
      commitment_confirmed: c.commitment_confirmed as boolean | undefined,
      coauthorship: c.coauthorship as string | undefined,
    })
    if (!contribsByStage[stageId]) contribsByStage[stageId] = []
    contribsByStage[stageId]!.push(status)
  }

  const result: Record<string, PaperStageLine[]> = {}
  for (const paperId of paperIds) {
    const lines: PaperStageLine[] = []
    for (const stage of stagesByPaper[paperId] ?? []) {
      const stageLabel = STAGE_LABELS[stage.type] ?? stage.type
      const statuses = contribsByStage[stage.id] ?? []
      const line = stageLineForContribs(stageLabel, stage.status, statuses)
      if (line) {
        lines.push({ ...line, stageId: stage.id })
      }
    }
    if (lines.length > 0) result[paperId] = lines
  }

  return result
}
