import { db, batchGetByIds } from '@/lib/firebase/admin'
import { sortDocsByCreatedAtDesc } from '@/lib/firestore/sort'
import { STAGE_LABELS, AWAITING_REVIEW_STATUSES } from '@/lib/labels'

export type UserApplication = {
  id: string
  status: string
  message: string | null
  created_at: Date
  paper_id: string
  stage_id: string
  paper_title: string
  stage_type: string
  stage_label: string
  contribution_status: string | null
}

export async function getUserApplications(userId: string): Promise<UserApplication[]> {
  const appsSnap = await db.collection('applications')
    .where('applicant_id', '==', userId)
    .get()

  const sorted = sortDocsByCreatedAtDesc(appsSnap.docs)
  if (sorted.length === 0) return []

  const paperIds = Array.from(new Set(sorted.map((d) => d.data().paper_id as string).filter(Boolean)))
  const stageIds = Array.from(new Set(sorted.map((d) => d.data().stage_id as string).filter(Boolean)))
  const acceptedIds = sorted.filter(d => d.data().status === 'accepted').map(d => d.id)

  const [paperResults, stageResults, contribSnap] = await Promise.all([
    batchGetByIds('papers', paperIds),
    batchGetByIds('stages', stageIds),
    acceptedIds.length > 0
      ? db.collection('contributions')
          .where('contributor_id', '==', userId)
          .where('paper_id', 'in', paperIds.slice(0, 30))
          .get()
      : Promise.resolve(null),
  ])

  const papers: Record<string, { teaser_title?: string } | undefined> = {}
  for (const snap of paperResults) {
    for (const d of snap.docs) { papers[d.id] = d.data() as { teaser_title?: string } }
  }
  const stages: Record<string, { type?: string } | undefined> = {}
  for (const snap of stageResults) {
    for (const d of snap.docs) { stages[d.id] = d.data() as { type?: string } }
  }

  // Map stage_id → contribution status for accepted applications
  const contribByStageId: Record<string, string> = {}
  if (contribSnap) {
    for (const d of contribSnap.docs) {
      const raw = d.data()
      const stageId = raw.stage_id as string
      let status = raw.status as string
      // Normalise legacy boolean flags
      if (status === 'in_progress') {
        if (raw.commitment_confirmed) status = 'contribution_confirmed'
        else if (raw.doc_shared) status = 'document_shared'
      } else if (status === 'completed') {
        status = raw.coauthorship === 'substantial' ? 'substantial' : 'not_substantial'
      }
      contribByStageId[stageId] = status
    }
  }

  return sorted.map((doc) => {
    const data = doc.data()
    const paperId = data.paper_id as string
    const stageId = data.stage_id as string
    const paper = papers[paperId]
    const stage = stages[stageId]
    const stageName = (stage?.type as string | undefined) ?? ''
    const createdAt = data.created_at as { toDate(): Date } | Date | undefined
    const created = createdAt instanceof Date
      ? createdAt
      : createdAt && typeof createdAt === 'object' && 'toDate' in createdAt
        ? createdAt.toDate()
        : new Date()

    return {
      id: doc.id,
      status: data.status as string,
      message: (data.message as string | undefined) ?? null,
      created_at: created,
      paper_id: paperId,
      stage_id: stageId,
      paper_title: (paper?.teaser_title as string | undefined) ?? 'Untitled paper',
      stage_type: stageName,
      stage_label: STAGE_LABELS[stageName] ?? stageName,
      contribution_status: data.status === 'accepted' ? (contribByStageId[stageId] ?? 'in_progress') : null,
    }
  })
}

/** Interest registered, legacy pending, or accepted — still tracking for the contributor. */
export async function getActiveApplicationCount(userId: string): Promise<number> {
  const [awaitingSnap, acceptedSnap] = await Promise.all([
    db.collection('applications')
      .where('applicant_id', '==', userId)
      .where('status', 'in', [...AWAITING_REVIEW_STATUSES])
      .count()
      .get(),
    db.collection('applications')
      .where('applicant_id', '==', userId)
      .where('status', '==', 'accepted')
      .count()
      .get(),
  ])

  return awaitingSnap.data().count + acceptedSnap.data().count
}
