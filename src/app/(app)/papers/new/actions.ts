'use server'
import { db } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { redirect } from 'next/navigation'
import type { DocumentReference, QueryDocumentSnapshot, Transaction } from 'firebase-admin/firestore'
import { TRACKING_STAGES, type TrackingStage } from '@/lib/labels'
import { sendEmail, emailPrefEnabled } from '@/lib/email'

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

export interface CreatePaperInput {
  teaser_title: string
  full_title: string
  description: string
  full_abstract: string
  abstract_visibility: 'accepted_only' | 'public' | 'teaser_only'
  teaser_description: string
  external_doc_link: string
  scope: string
  study_type: string
  dataset_size: string
  access_type: 'open' | 'institution' | 'invite'
  allowed_institutions: string   // newline-separated
  stages: Array<{ type: string; description: string }>
  authorship_offer: string
  authorship_order: string
  target_journal: string
  submission_timeline: string
  additional_terms: string
  post_submission_support?: boolean
  tracker_visible_to_contributors?: boolean
  tracking_stage?: TrackingStage
  needs_contributors?: 'yes' | 'no'
  status: 'draft' | 'published'
}

export type UpdatePaperInput = Omit<CreatePaperInput, 'status'> & { status?: 'draft' | 'published' }

export async function createPaper(input: CreatePaperInput): Promise<{ id?: string; error?: string }> {
  const user = await getServerUser()
  if (!user) redirect('/')

  // Next.js redacts thrown Server Action error messages in production builds —
  // catch here and return the message as a normal value so it actually reaches the client.
  try {
    if (!input.teaser_title.trim()) throw new Error('A title is required.')
    const hasValidStage = input.stages.some(s => s.type)
    if (input.status === 'published' && !hasValidStage) throw new Error('At least one contribution stage is required.')
    if (input.status === 'published' && !input.submission_timeline.trim()) throw new Error('A delivery timeline is required before publishing.')

    const allowedInstitutions =
      input.access_type === 'institution'
        ? input.allowed_institutions.split('\n').map(s => s.trim()).filter(Boolean)
        : null

    const ownerSnap = await db.collection('users').doc(user.id).get()
    const ownerData = ownerSnap.data() ?? {}

    const validStages = input.stages.filter(s => s.type)
    const stageTypes = Array.from(new Set(validStages.map(s => s.type)))

    const paperRef = await db.collection('papers').add({
      owner_id: user.id,
      owner_name: ownerData.display_name ?? null,
      owner_institution: ownerData.institution ?? null,
      teaser_title: input.teaser_title.trim(),
      full_title: input.full_title.trim() || null,
      description: input.description.trim() || null,
      full_abstract: input.full_abstract.trim() || null,
      abstract_visibility: input.abstract_visibility ?? 'accepted_only',
      teaser_description: input.abstract_visibility === 'teaser_only' ? (input.teaser_description.trim() || null) : null,
      external_doc_link: input.external_doc_link.trim() || null,
      scope: input.scope || null,
      study_type: input.study_type || null,
      dataset_size: input.dataset_size || null,
      access_type: input.access_type,
      allowed_institutions: allowedInstitutions,
      authorship_offer: input.authorship_offer || null,
      authorship_order: input.authorship_order || null,
      target_journal: input.target_journal.trim() || null,
      submission_timeline: input.submission_timeline.trim() || null,
      additional_terms: input.additional_terms.trim() || null,
      stage_types: stageTypes,
      post_submission_support: input.post_submission_support ?? false,
      tracker_visible_to_contributors: input.tracker_visible_to_contributors ?? false,
      status: input.status,
      tracking_stage: (input.tracking_stage && TRACKING_STAGES.includes(input.tracking_stage)) ? input.tracking_stage : 'idea',
      needs_contributors: input.needs_contributors === 'no' ? 'no' : 'yes',
      created_at: new Date(),
      ...(input.status === 'published' ? { published_at: new Date() } : {}),
    })

    const batch = db.batch()
    for (const stage of validStages) {
      const stageRef = db.collection('stages').doc()
      batch.set(stageRef, {
        paper_id: paperRef.id,
        type: stage.type,
        description: stage.description.trim() || null,
        status: 'open',
      })
    }
    await batch.commit()

    return { id: paperRef.id }
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong. Please try again.' }
  }
}

/**
 * Preserve stage document IDs by matching on type.
 * No-op when `validStages` is empty, unless `allowClear` is set (the owner explicitly
 * chose "not recruiting") — otherwise incomplete autosaves could wipe stages.
 * Refuses to delete stages that have applications or are no longer open.
 * Prefer keeping protected docs when collapsing same-type duplicates.
 */
function syncPaperStagesInTx(
  tx: Transaction,
  paperId: string,
  existingDocs: QueryDocumentSnapshot[],
  validStages: Array<{ type: string; description: string }>,
  stageIdsWithApps: Set<string>,
  allowClear: boolean,
): void {
  if (validStages.length === 0) {
    if (!allowClear) return
    // Intentional clear — remove whatever's safely removable; leave stages that
    // already have applications or are filled untouched rather than erroring out.
    for (const doc of existingDocs) {
      if (isStageRemovable(doc, stageIdsWithApps)) tx.delete(doc.ref)
    }
    return
  }

  const byName = new Map<string, QueryDocumentSnapshot[]>()
  for (const doc of existingDocs) {
    const stageName = (doc.data().type as string | undefined) || ''
    if (!stageName) continue
    const list = byName.get(stageName) ?? []
    list.push(doc)
    byName.set(stageName, list)
  }

  const wanted = new Set(validStages.map(s => s.type))

  for (const stage of validStages) {
    const existing = byName.get(stage.type) ?? []
    if (existing.length === 0) {
      const stageRef = db.collection('stages').doc()
      tx.set(stageRef, {
        paper_id: paperId,
        type: stage.type,
        description: stage.description.trim() || null,
        status: 'open',
      })
      continue
    }

    const protectedDocs = existing.filter(d => !isStageRemovable(d, stageIdsWithApps))
    const removableDocs = existing.filter(d => isStageRemovable(d, stageIdsWithApps))
    // Prefer a protected doc as the primary (has apps / filled); otherwise first open.
    const keep = protectedDocs[0] ?? removableDocs[0] ?? existing[0]

    tx.update(keep.ref, {
      description: stage.description.trim() || null,
    })

    // Only delete removable duplicates — never attempt to delete filled/app stages.
    for (const dupe of removableDocs) {
      if (dupe.id === keep.id) continue
      tx.delete(dupe.ref)
    }

    byName.delete(stage.type)
  }

  for (const [stageName, docs] of Array.from(byName.entries())) {
    if (wanted.has(stageName)) continue
    for (const doc of docs) {
      assertStageRemovable(doc, stageIdsWithApps)
      tx.delete(doc.ref)
    }
  }
}

function isStageRemovable(doc: QueryDocumentSnapshot, stageIdsWithApps: Set<string>): boolean {
  const data = doc.data()
  if (stageIdsWithApps.has(doc.id)) return false
  if (data.status && data.status !== 'open') return false
  return true
}

function assertStageRemovable(doc: QueryDocumentSnapshot, stageIdsWithApps: Set<string>): void {
  const data = doc.data()
  const label = (data.type as string | undefined) || 'stage'
  if (stageIdsWithApps.has(doc.id)) {
    throw new Error(`Cannot remove "${label}" — it already has applications.`)
  }
  if (data.status && data.status !== 'open') {
    throw new Error(`Cannot remove "${label}" — that stage is already filled.`)
  }
}

export async function updatePaper(id: string, input: UpdatePaperInput): Promise<{ error?: string }> {
  const user = await getServerUser()
  if (!user) redirect('/')

  const paperRef = db.collection('papers').doc(id) as DocumentReference
  const stagesQuery = db.collection('stages').where('paper_id', '==', id)
  const appsQuery = db.collection('applications').where('paper_id', '==', id)
  const validStages = input.stages.filter(s => s.type)
  const stageTypes = Array.from(new Set(validStages.map(s => s.type)))

  const allowedInstitutions =
    input.access_type === 'institution'
      ? input.allowed_institutions.split('\n').map(s => s.trim()).filter(Boolean)
      : null

  // Next.js redacts thrown Server Action error messages in production builds —
  // catch here and return the message as a normal value so it actually reaches the client.
  try {
    await db.runTransaction(async (tx) => {
      // Apps are read inside the transaction so a concurrent apply cannot be ignored.
      const [paperSnap, stagesSnap, appsSnap] = await Promise.all([
        tx.get(paperRef),
        tx.get(stagesQuery),
        tx.get(appsQuery),
      ])
      const existing = paperSnap.data()
      if (!paperSnap.exists || existing?.owner_id !== user.id) {
        throw new Error('Paper not found or not authorised.')
      }
      if (existing.status !== 'draft' && existing.status !== 'published') {
        throw new Error('This paper cannot be edited.')
      }

      const publishing = input.status === 'published' && existing.status === 'draft'
      const demoting = input.status === 'draft' && existing.status === 'published'
      const wantsNoContributors = input.needs_contributors === 'no'

      if (publishing && wantsNoContributors) {
        throw new Error('Switch on "I need contributors" before publishing — Discover listings are for finding contributors.')
      }

      // "Not right now" and "published" can't coexist — demoting back to draft is only
      // allowed when the paper hasn't picked up any real applications yet.
      if (demoting && !wantsNoContributors) {
        throw new Error('Published papers cannot be moved back to draft.')
      }
      if (demoting) {
        const hasEngagement = appsSnap.docs.some(d => {
          const s = d.data().status as string | undefined
          return !!s && s !== 'rejected'
        })
        if (hasEngagement) {
          throw new Error('This paper already has applications from contributors, so it can\'t be made private again.')
        }
      }

      if (publishing || (existing.status === 'published' && !demoting)) {
        if (!input.teaser_title.trim()) throw new Error('A public title is required.')
        if (!input.submission_timeline.trim()) throw new Error('A delivery timeline is required before publishing.')
        if (validStages.length === 0 && existing.status === 'published') {
          // Published edit with empty form stages: keep existing stages (sync no-op).
        } else if (publishing && validStages.length === 0) {
          throw new Error('At least one contribution stage is required.')
        }
      }

      const stageIdsWithApps = new Set(
        appsSnap.docs
          .map(d => d.data().stage_id as string | undefined)
          .filter((sid): sid is string => !!sid),
      )

      tx.update(paperRef, {
        teaser_title: input.teaser_title.trim(),
        full_title: input.full_title.trim() || null,
        description: input.description.trim() || null,
        full_abstract: input.full_abstract.trim() || null,
        abstract_visibility: input.abstract_visibility ?? 'accepted_only',
        teaser_description: input.abstract_visibility === 'teaser_only' ? (input.teaser_description.trim() || null) : null,
        external_doc_link: input.external_doc_link.trim() || null,
        scope: input.scope || null,
        study_type: input.study_type || null,
        dataset_size: input.dataset_size || null,
        access_type: input.access_type,
        allowed_institutions: allowedInstitutions,
        authorship_offer: input.authorship_offer || null,
        authorship_order: input.authorship_order || null,
        target_journal: input.target_journal.trim() || null,
        submission_timeline: input.submission_timeline.trim() || null,
        additional_terms: input.additional_terms.trim() || null,
        post_submission_support: input.post_submission_support ?? false,
        tracker_visible_to_contributors: input.tracker_visible_to_contributors ?? false,
        needs_contributors: wantsNoContributors ? 'no' : 'yes',
        ...(validStages.length > 0
          ? { stage_types: stageTypes }
          : wantsNoContributors ? { stage_types: [] } : {}),
        ...(publishing
          ? { status: 'published', published_at: existing.published_at ?? new Date() }
          : demoting ? { status: 'draft' } : {}),
        ...(input.tracking_stage && TRACKING_STAGES.includes(input.tracking_stage)
          ? { tracking_stage: input.tracking_stage }
          : {}),
        updated_at: new Date(),
      })

      syncPaperStagesInTx(tx, id, stagesSnap.docs, validStages, stageIdsWithApps, wantsNoContributors)
    })
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Something went wrong. Please try again.' }
  }
}

/** Publish an existing draft without rewriting its stages. */
export async function publishPaper(id: string): Promise<{ error?: string }> {
  const user = await getServerUser()
  if (!user) redirect('/')

  const paperRef = db.collection('papers').doc(id)
  const stagesQuery = db.collection('stages').where('paper_id', '==', id)

  // Next.js redacts thrown Server Action error messages in production builds —
  // catch here and return the message as a normal value so it actually reaches the client.
  try {
    await db.runTransaction(async (tx) => {
    const [paperSnap, stagesSnap] = await Promise.all([
      tx.get(paperRef),
      tx.get(stagesQuery),
    ])
    const paper = paperSnap.data()
    if (!paperSnap.exists || paper?.owner_id !== user.id) {
      throw new Error('Paper not found or not authorised.')
    }
    if (paper.status === 'published') return
    if (paper.status !== 'draft') {
      throw new Error('Only drafts can be published this way.')
    }
    if (!(paper.teaser_title as string | undefined)?.trim()) {
      throw new Error('A public title is required before publishing.')
    }
    if (!(paper.submission_timeline as string | undefined)?.trim()) {
      throw new Error('A delivery timeline is required before publishing.')
    }
    if (paper.needs_contributors === 'no') {
      throw new Error('Switch on "I need contributors" before publishing — Discover listings are for finding contributors.')
    }
    if (stagesSnap.empty) {
      throw new Error('Add at least one contribution stage before publishing.')
    }

    tx.update(paperRef, {
      status: 'published',
      updated_at: new Date(),
      published_at: new Date(),
      ...(!paper.tracking_stage || paper.tracking_stage === 'idea'
        ? { tracking_stage: 'recruiting' }
        : {}),
    })
    })
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not publish.' }
  }
}

/** Make a published paper private again — only while no one has applied yet. */
export async function unpublishPaper(id: string): Promise<{ error?: string }> {
  const user = await getServerUser()
  if (!user) redirect('/')

  const paperRef = db.collection('papers').doc(id)
  const appsQuery = db.collection('applications').where('paper_id', '==', id)

  try {
    await db.runTransaction(async (tx) => {
      const [paperSnap, appsSnap] = await Promise.all([tx.get(paperRef), tx.get(appsQuery)])
      const paper = paperSnap.data()
      if (!paperSnap.exists || paper?.owner_id !== user.id) {
        throw new Error('Paper not found or not authorised.')
      }
      if (paper.status !== 'published') return

      const hasEngagement = appsSnap.docs.some(d => {
        const status = d.data().status as string | undefined
        return !!status && status !== 'rejected'
      })
      if (hasEngagement) {
        throw new Error('This paper already has applications from contributors, so it can\'t be made private again.')
      }

      tx.update(paperRef, { status: 'draft', needs_contributors: 'no', updated_at: new Date() })
    })
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not make private.' }
  }
}

/**
 * Permanently delete a paper. If anyone has applied or is contributing, a reason is
 * required and everyone affected is notified (in-app + email) before their records
 * are removed along with the paper.
 */
export async function deletePaper(id: string, reason: string): Promise<{ error?: string }> {
  const user = await getServerUser()
  if (!user) redirect('/')

  try {
    const paperRef = db.collection('papers').doc(id)
    const [paperSnap, stagesSnap, appsSnap, contribsSnap] = await Promise.all([
      paperRef.get(),
      db.collection('stages').where('paper_id', '==', id).get(),
      db.collection('applications').where('paper_id', '==', id).get(),
      db.collection('contributions').where('paper_id', '==', id).get(),
    ])
    if (!paperSnap.exists || paperSnap.data()?.owner_id !== user.id) {
      throw new Error('Paper not found or not authorised.')
    }
    const paperTitle = (paperSnap.data()?.teaser_title as string | undefined) || 'Untitled paper'

    const notifyIds = new Set<string>()
    for (const doc of appsSnap.docs) {
      const applicantId = doc.data().applicant_id as string | undefined
      const status = doc.data().status as string | undefined
      if (applicantId && status !== 'rejected') notifyIds.add(applicantId)
    }
    for (const doc of contribsSnap.docs) {
      const contributorId = doc.data().contributor_id as string | undefined
      if (contributorId) notifyIds.add(contributorId)
    }

    const trimmedReason = reason.trim()
    if (notifyIds.size > 0 && !trimmedReason) {
      throw new Error('People have applied to or are contributing to this paper — add a short reason so they understand why it was removed.')
    }

    const recipientSnaps = await Promise.all(
      Array.from(notifyIds).map(uid => db.collection('users').doc(uid).get())
    )

    await Promise.all(recipientSnaps.map(async (snap) => {
      if (!snap.exists) return
      const data = snap.data()!
      await db.collection('notifications').add({
        user_id: snap.id,
        type: 'paper_deleted',
        message: trimmedReason
          ? `"${paperTitle}" was removed by its author: ${trimmedReason}`
          : `"${paperTitle}" was removed by its author.`,
        payload: { paper_title: paperTitle, reason: trimmedReason || null },
        read: false,
        created_at: new Date(),
        purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      })
      const email = emailPrefEnabled(data) ? (data.email as string | undefined) : undefined
      if (email) {
        await sendEmail(
          email,
          'A paper you were involved with was removed',
          `<p>The author has removed "${escapeHtml(paperTitle)}" from Scholara.</p>${
            trimmedReason ? `<p><strong>Reason given:</strong> ${escapeHtml(trimmedReason)}</p>` : ''
          }`,
        ).catch(console.error)
      }
    }))

    const batch = db.batch()
    for (const doc of contribsSnap.docs) batch.delete(doc.ref)
    for (const doc of appsSnap.docs) batch.delete(doc.ref)
    for (const doc of stagesSnap.docs) batch.delete(doc.ref)
    batch.delete(paperRef)
    await batch.commit()

    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not delete paper.' }
  }
}
