import type { QueryDocumentSnapshot } from 'firebase-admin/firestore'
import { getAdminDb, batchGetByIds } from '@/lib/firebase/admin'
import { STAGE_LABELS } from '@/lib/labels'
import { sortDocsByCreatedAtAsc, timestampMillis } from '@/lib/firestore/sort'

export type Message = {
  id: string
  sender_id: string
  body: string
  created_at_ms: number
}

export type MessageThreadSummary = {
  applicationId: string
  paperId: string
  paperTitle: string
  stageLabel: string
  counterpartName: string
  role: 'owner' | 'contributor'
  lastMessage: string | null
  lastMessageAtMs: number | null
  lastMessageSenderId: string | null
  unread: boolean
}

async function loadAcceptedAppsForUser(userId: string) {
  const db = getAdminDb()

  const [asApplicantSnap, ownedPapersSnap] = await Promise.all([
    db.collection('applications')
      .where('applicant_id', '==', userId)
      .where('status', '==', 'accepted')
      .get(),
    db.collection('papers')
      .where('owner_id', '==', userId)
      .select()
      .get(),
  ])

  const ownedPaperIds = ownedPapersSnap.docs.map((d) => d.id)

  const chunkQueries = []
  for (let i = 0; i < ownedPaperIds.length; i += 30) {
    const chunk = ownedPaperIds.slice(i, i + 30)
    chunkQueries.push(
      db.collection('applications')
        .where('paper_id', 'in', chunk)
        .where('status', '==', 'accepted')
        .get(),
    )
  }
  const ownedChunkResults = await Promise.all(chunkQueries)
  const ownedAccepted = ownedChunkResults.flatMap((snap) => snap.docs)

  const byId = new Map<string, QueryDocumentSnapshot>()
  for (const d of [...asApplicantSnap.docs, ...ownedAccepted]) {
    byId.set(d.id, d)
  }
  return Array.from(byId.values())
}

async function loadLastMessageForApp(
  appId: string,
): Promise<{ body: string; created_at_ms: number; sender_id: string } | null> {
  const db = getAdminDb()
  const col = db.collection('messages').where('application_id', '==', appId)

  try {
    const lastSnap = await col.orderBy('created_at', 'desc').limit(1).get()
    const lastDoc = lastSnap.docs[0]
    if (!lastDoc) return null
    const data = lastDoc.data()
    return {
      body: data.body as string,
      created_at_ms: timestampMillis(data.created_at),
      sender_id: data.sender_id as string,
    }
  } catch (err) {
    // Composite index may still be building in a new environment — fall back
    // to an equality-only query and pick the latest message in memory.
    const code = typeof err === 'object' && err && 'code' in err ? (err as { code: unknown }).code : null
    if (code !== 9 && code !== 'failed-precondition') throw err

    const snap = await col.get()
    if (snap.empty) return null
    let best: { body: string; created_at_ms: number; sender_id: string } | null = null
    for (const doc of snap.docs) {
      const data = doc.data()
      const created_at_ms = timestampMillis(data.created_at)
      if (!best || created_at_ms > best.created_at_ms) {
        best = { body: data.body as string, created_at_ms, sender_id: data.sender_id as string }
      }
    }
    return best
  }
}

async function loadMessagePreviews(
  appIds: string[],
): Promise<Record<string, { body: string; created_at_ms: number; sender_id: string }>> {
  const result: Record<string, { body: string; created_at_ms: number; sender_id: string }> = {}

  await Promise.all(
    appIds.map(async (appId) => {
      const last = await loadLastMessageForApp(appId)
      if (last) result[appId] = last
    }),
  )

  return result
}

export async function getUserMessageThreads(userId: string): Promise<MessageThreadSummary[]> {
  const apps = await loadAcceptedAppsForUser(userId)
  if (apps.length === 0) return []

  const paperIds = Array.from(new Set(apps.map((d) => d.data().paper_id as string).filter(Boolean)))
  const stageIds = Array.from(new Set(apps.map((d) => d.data().stage_id as string).filter(Boolean)))
  const counterpartIds = Array.from(new Set(
    apps.flatMap((d) => {
      const data = d.data()
      const applicantId = data.applicant_id as string
      return applicantId === userId ? [] : [applicantId]
    })
  ))

  // Counterpart is the applicant (for owners) or the paper owner (for contributors),
  // so paper owner ids are only known after papers load.
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

  const allUserIds = Array.from(new Set([...counterpartIds, ...Array.from(ownerIds)]))
  const userResults = await batchGetByIds('users', allUserIds)
  const users: Record<string, { display_name?: string }> = {}
  for (const snap of userResults) {
    for (const d of snap.docs) {
      users[d.id] = d.data() as { display_name?: string }
    }
  }

  const appIds = apps.map((d) => d.id)
  const [lastByApp, readReceiptsSnap] = await Promise.all([
    loadMessagePreviews(appIds),
    getAdminDb()
      .collection('message_reads')
      .where('user_id', '==', userId)
      .get(),
  ])

  const lastReadByApp: Record<string, number> = {}
  for (const doc of readReceiptsSnap.docs) {
    const data = doc.data()
    const appId = data.application_id as string
    lastReadByApp[appId] = timestampMillis(data.last_read_at)
  }

  const threads: MessageThreadSummary[] = apps.map((doc) => {
    const data = doc.data()
    const paperId = data.paper_id as string
    const stageId = data.stage_id as string
    const applicantId = data.applicant_id as string
    const paper = papers[paperId]
    const isContributor = applicantId === userId
    const counterpartId = isContributor
      ? (paper?.owner_id as string | undefined) ?? ''
      : applicantId
    const stageType = stages[stageId]?.type ?? ''
    const last = lastByApp[doc.id]
    const lastReadAtMs = lastReadByApp[doc.id] ?? 0
    const unread = last != null
      && last.sender_id !== userId
      && last.created_at_ms > lastReadAtMs

    return {
      applicationId: doc.id,
      paperId,
      paperTitle: paper?.teaser_title ?? 'Untitled paper',
      stageLabel: STAGE_LABELS[stageType] ?? stageType,
      counterpartName: users[counterpartId]?.display_name ?? 'Researcher',
      role: isContributor ? 'contributor' : 'owner',
      lastMessage: last?.body ?? null,
      lastMessageAtMs: last?.created_at_ms ?? null,
      lastMessageSenderId: last?.sender_id ?? null,
      unread,
    }
  })

  return threads.sort((a, b) => (b.lastMessageAtMs ?? 0) - (a.lastMessageAtMs ?? 0))
}

export async function markThreadRead(userId: string, applicationId: string): Promise<void> {
  const db = getAdminDb()
  const docId = `${userId}_${applicationId}`
  await db.collection('message_reads').doc(docId).set(
    {
      user_id: userId,
      application_id: applicationId,
      last_read_at: new Date(),
    },
    { merge: true },
  )
}

export async function getThreadForUser(userId: string, applicationId: string): Promise<{
  applicationId: string
  paperId: string
  paperTitle: string
  stageLabel: string
  counterpartName: string
  role: 'owner' | 'contributor'
  messages: Message[]
} | null> {
  const db = getAdminDb()
  const appSnap = await db.collection('applications').doc(applicationId).get()
  if (!appSnap.exists) return null
  const app = appSnap.data()!
  if (app.status !== 'accepted') return null

  const paperId = app.paper_id as string
  const paperSnap = await db.collection('papers').doc(paperId).get()
  const paper = paperSnap.data()
  if (!paper) return null

  const isContributor = app.applicant_id === userId
  const isOwner = paper.owner_id === userId
  if (!isContributor && !isOwner) return null

  const [stageSnap, counterpartSnap, messagesSnap] = await Promise.all([
    db.collection('stages').doc(app.stage_id as string).get(),
    db.collection('users').doc(
      isContributor ? (paper.owner_id as string) : (app.applicant_id as string)
    ).get(),
    db.collection('messages')
      .where('application_id', '==', applicationId)
      .get(),
  ])

  const stageType = (stageSnap.data()?.type as string | undefined) ?? ''
  const messages = sortDocsByCreatedAtAsc(messagesSnap.docs).map((d) => {
    const data = d.data()
    return {
      id: d.id,
      sender_id: data.sender_id as string,
      body: data.body as string,
      created_at_ms: timestampMillis(data.created_at),
    }
  })

  return {
    applicationId,
    paperId,
    paperTitle: (paper.teaser_title as string | undefined) ?? 'Untitled paper',
    stageLabel: STAGE_LABELS[stageType] ?? stageType,
    counterpartName: (counterpartSnap.data()?.display_name as string | undefined) ?? 'Researcher',
    role: isContributor ? 'contributor' : 'owner',
    messages,
  }
}
