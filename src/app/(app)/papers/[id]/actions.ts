'use server'
import { FieldValue } from 'firebase-admin/firestore'
import { db } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendEmail, emailPrefEnabled } from '@/lib/email'
import { STAGE_LABELS } from '@/lib/labels'
import {
  newApplicantEmail,
  slotExpiredContributorEmail,
  revisionSubmittedEmail,
  newMessageEmail,
} from '@/lib/email/templates'

// ─── Owner toggles contributor-visible tracker ─────────────────────────────────

export async function setTrackerVisibility(paperId: string, visible: boolean): Promise<{ error?: string }> {
  const user = await getServerUser()
  if (!user) redirect('/')

  try {
    const paperRef = db.collection('papers').doc(paperId)
    const paperSnap = await paperRef.get()
    if (!paperSnap.exists || paperSnap.data()?.owner_id !== user.id) {
      throw new Error('Paper not found or not authorised.')
    }
    await paperRef.update({ tracker_visible_to_contributors: visible })
    revalidatePath(`/papers/${paperId}`)
    return {}
  } catch (e) {
    return { error: e instanceof Error ? e.message : 'Could not save.' }
  }
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;')
}

function stageLabelHtml(stageName: string | undefined) {
  return escapeHtml(STAGE_LABELS[stageName ?? ''] ?? stageName ?? 'contribution')
}

// ─── Contributor confirms interest (before the author shares the document) ────

export async function confirmInterest(contributionId: string) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const contribRef = db.collection('contributions').doc(contributionId)
  let contrib!: Record<string, unknown>

  await db.runTransaction(async (tx) => {
    const contribSnap = await tx.get(contribRef)
    if (!contribSnap.exists) throw new Error('Contribution not found.')
    contrib = contribSnap.data()!

    if (contrib.contributor_id !== user.id) throw new Error('Not authorised.')

    if (contrib.status !== 'in_progress') return  // already past this step (idempotent)

    tx.update(contribRef, { status: 'interest_confirmed' })
  })

  if (contrib.status !== 'in_progress') {
    revalidatePath(`/papers/${contrib.paper_id as string}`)
    return
  }

  try {
    const [paperSnap, contributorSnap] = await Promise.all([
      db.collection('papers').doc(contrib.paper_id as string).get(),
      db.collection('users').doc(user.id).get(),
    ])
    const paper = paperSnap.data()
    if (paper) {
      const contributorName = escapeHtml(
        (contributorSnap.data()?.display_name as string | undefined) ?? 'A contributor'
      )
      const paperTitle = escapeHtml(paper.teaser_title as string)

      const ownerSnap = await db.collection('users').doc(paper.owner_id).get()
      const ownerEmail = emailPrefEnabled(ownerSnap.data()) ? (ownerSnap.data()?.email as string | undefined) : undefined

      await Promise.all([
        db.collection('notifications').add({
          user_id: paper.owner_id,
          type: 'interest_confirmed',
          message: 'Contributor confirmed interest — ready for you to share the document',
          payload: { contribution_id: contributionId, stage_id: contrib.stage_id, paper_id: contrib.paper_id },
          read: false,
          created_at: new Date(),
          purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
        }),
        ownerEmail && sendEmail(
          ownerEmail,
          `${(contributorSnap.data()?.display_name as string | undefined) ?? 'A contributor'} confirmed interest — ${paper.teaser_title}`,
          `<p>${contributorName} confirmed they'd like to proceed on your paper "${paperTitle}". Open Manage on the paper to share the working document with them.</p>`
        ),
      ])
    }
  } catch (err) {
    console.error('[confirmInterest] notify/email failed after successful confirm:', err)
  }

  revalidatePath(`/papers/${contrib.paper_id as string}`)
}

// ─── Contributor confirms their commitment ────────────────────────────────────

export async function confirmCommitment(contributionId: string) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const contribRef = db.collection('contributions').doc(contributionId)
  let contrib!: Record<string, unknown>

  await db.runTransaction(async (tx) => {
    const contribSnap = await tx.get(contribRef)
    if (!contribSnap.exists) throw new Error('Contribution not found.')
    contrib = contribSnap.data()!

    if (contrib.contributor_id !== user.id) throw new Error('Not authorised.')

    // Already confirmed (new or legacy)
    if (contrib.status === 'contribution_confirmed' || (contrib as Record<string, unknown>).commitment_confirmed === true) return

    if (contrib.status === 'in_progress') throw new Error('The author has not shared the document yet.')
    if (contrib.status !== 'document_shared') return  // past this step

    const now = new Date()
    tx.update(contribRef, {
      status: 'contribution_confirmed',
      confirmed_at: now,
      deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    })
    tx.update(db.collection('stages').doc(contrib.stage_id as string), { status: 'filled' })
  })

  // Already confirmed before this transaction fired — no emails needed
  if (contrib.status === 'contribution_confirmed' || (contrib as Record<string, unknown>).commitment_confirmed === true) {
    revalidatePath(`/papers/${contrib.paper_id as string}`)
    return
  }

  const [paperSnap, stageSnap, contributorSnap] = await Promise.all([
    db.collection('papers').doc(contrib.paper_id as string).get(),
    db.collection('stages').doc(contrib.stage_id as string).get(),
    db.collection('users').doc(user.id).get(),
  ])
  const paper = paperSnap.data()
  if (paper) {
    const stage = stageSnap.data()
    const contributorName = escapeHtml(
      (contributorSnap.data()?.display_name as string | undefined) ?? 'A contributor'
    )
    const paperTitle = escapeHtml(paper.teaser_title as string)

    const ownerSnap = await db.collection('users').doc(paper.owner_id).get()
    const ownerEmail = emailPrefEnabled(ownerSnap.data()) ? (ownerSnap.data()?.email as string | undefined) : undefined

    await Promise.all([
      db.collection('notifications').add({
        user_id: paper.owner_id,
        type: 'commitment_confirmed',
        message: 'Contributor confirmed their role',
        payload: { contribution_id: contributionId, stage_id: contrib.stage_id, paper_id: contrib.paper_id },
        read: false,
        created_at: new Date(),
        purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      }),
      ownerEmail && sendEmail(
        ownerEmail,
        `${(contributorSnap.data()?.display_name as string | undefined) ?? 'A contributor'} accepted their role — ${paper.teaser_title}`,
        `<p>${contributorName} has confirmed their commitment to the <strong>${stageLabelHtml(stage?.type)}</strong> stage on your paper "${paperTitle}" and is ready to begin.</p>`
      ),
    ])
  }

  revalidatePath(`/papers/${contrib.paper_id as string}`)
}

// ─── Contributor submits their work ──────────────────────────────────────────

type QuantLog = {
  words_added?: number | null
  words_removed?: number | null
  refs_added?: number | null
  tables_added?: number | null
  figures_added?: number | null
  code_files_added?: number | null
}

export async function submitContribution(
  contributionId: string,
  note: string,
  url: string,
  quantLog: QuantLog = {}
) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const trimmedNote = note.trim()
  const trimmedUrl = url.trim()
  if (!trimmedNote) throw new Error('Add a contribution summary.')
  if (!trimmedUrl) throw new Error('Paste your contribution document link.')
  if (!/^https?:\/\//.test(trimmedUrl)) {
    throw new Error('Link must start with http:// or https://.')
  }

  const contribRef = db.collection('contributions').doc(contributionId)
  let contrib!: Record<string, unknown>
  let alreadySubmitted = false

  await db.runTransaction(async (tx) => {
    const contribSnap = await tx.get(contribRef)
    if (!contribSnap.exists) throw new Error('Contribution not found.')
    contrib = contribSnap.data()!

    if (contrib.contributor_id !== user.id) throw new Error('Not authorised.')
    if (contrib.status === 'substantial' || contrib.status === 'not_substantial' || contrib.status === 'completed') {
      throw new Error('This contribution is already completed.')
    }
    // Idempotent: first submit already landed (retry / double-click / slow network).
    if (contrib.status === 'submitted') {
      alreadySubmitted = true
      return
    }
    // Allow submit from contribution_confirmed (first submit) or revision_requested (resubmit)
    // Also allow legacy in_progress with commitment_confirmed=true
    const canSubmit =
      contrib.status === 'contribution_confirmed' ||
      contrib.status === 'revision_requested' ||
      (contrib.status === 'in_progress' && (contrib as Record<string, unknown>).commitment_confirmed === true)
    if (!canSubmit) throw new Error('Please confirm your commitment first.')

    const cleanQuant: QuantLog = {}
    if (quantLog.words_added != null && quantLog.words_added > 0) cleanQuant.words_added = quantLog.words_added
    if (quantLog.words_removed != null && quantLog.words_removed > 0) cleanQuant.words_removed = quantLog.words_removed
    if (quantLog.refs_added != null && quantLog.refs_added > 0) cleanQuant.refs_added = quantLog.refs_added
    if (quantLog.tables_added != null && quantLog.tables_added > 0) cleanQuant.tables_added = quantLog.tables_added
    if (quantLog.figures_added != null && quantLog.figures_added > 0) cleanQuant.figures_added = quantLog.figures_added
    if (quantLog.code_files_added != null && quantLog.code_files_added > 0) cleanQuant.code_files_added = quantLog.code_files_added

    tx.update(contribRef, {
      status: 'submitted',
      summary: trimmedNote,
      submission_url: trimmedUrl,
      quant_log: Object.keys(cleanQuant).length > 0 ? cleanQuant : null,
      submitted_at: new Date(),
      revision_feedback: null,
    })
  })

  if (alreadySubmitted) {
    revalidatePath(`/papers/${contrib.paper_id as string}`)
    return
  }

  const isResubmission = contrib.status === 'revision_requested'

  try {
    const [paperSnap, stageSnap, contributorSnap] = await Promise.all([
      db.collection('papers').doc(contrib.paper_id as string).get(),
      db.collection('stages').doc(contrib.stage_id as string).get(),
      db.collection('users').doc(user.id).get(),
    ])
    const paper = paperSnap.data()
    if (paper) {
      const stage = stageSnap.data()
      const contributorName = (contributorSnap.data()?.display_name as string | undefined) ?? 'A contributor'
      const paperTitle = paper.teaser_title as string
      const stageLabel = STAGE_LABELS[stage?.type as string] ?? (stage?.type as string) ?? 'contribution'

      const ownerSnap = await db.collection('users').doc(paper.owner_id).get()
      const ownerEmail = emailPrefEnabled(ownerSnap.data()) ? (ownerSnap.data()?.email as string | undefined) : undefined

      if (isResubmission) {
        const tpl = revisionSubmittedEmail({
          ownerEmail: ownerEmail ?? '',
          contributorName,
          paperTitle,
          stageLabel,
          paperId: contrib.paper_id as string,
          submissionNote: trimmedNote,
          submissionUrl: trimmedUrl,
        })
        await Promise.all([
          db.collection('notifications').add({
            user_id: paper.owner_id,
            type: 'revision_submitted',
            message: 'Contributor resubmitted after revision',
            payload: { contribution_id: contributionId, stage_id: contrib.stage_id, paper_id: contrib.paper_id },
            read: false,
            created_at: new Date(),
            purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          }),
          ownerEmail && sendEmail(tpl.to, tpl.subject, tpl.html),
        ])
      } else {
        await Promise.all([
          db.collection('notifications').add({
            user_id: paper.owner_id,
            type: 'contribution_submitted',
            message: 'Contributor submitted their work',
            payload: { contribution_id: contributionId, stage_id: contrib.stage_id, paper_id: contrib.paper_id },
            read: false,
            created_at: new Date(),
            purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
          }),
          ownerEmail && sendEmail(
            ownerEmail,
            `${contributorName} submitted their contribution — ${paperTitle}`,
            `<p>${escapeHtml(contributorName)} has submitted their work for the <strong>${stageLabelHtml(stage?.type as string | undefined)}</strong> stage on your paper "${escapeHtml(paperTitle)}". Please review it in the Manage tab.</p>` +
            (trimmedNote ? `<p>Their note: "${escapeHtml(trimmedNote)}"</p>` : '') +
            (trimmedUrl ? `<p>Submission link: <a href="${escapeHtml(trimmedUrl)}">${escapeHtml(trimmedUrl)}</a></p>` : '')
          ),
        ])
      }
    }
  } catch (err) {
    // Submission already saved — don't fail the contributor if notify/email breaks.
    console.error('[submitContribution] notify/email failed after successful submit:', err)
  }

  revalidatePath(`/papers/${contrib.paper_id as string}`)
}

// ─── Author requests revision from contributor ────────────────────────────────

export async function requestRevision(contributionId: string, feedback: string) {
  const user = await getServerUser()
  if (!user) redirect('/')

  if (!feedback.trim()) throw new Error('Add a note explaining what still needs to be done.')
  const trimmedFeedback = feedback.trim()
  const contribRef = db.collection('contributions').doc(contributionId)
  let contrib!: Record<string, unknown>
  let paper!: Record<string, unknown>

  await db.runTransaction(async (tx) => {
    const contribSnap = await tx.get(contribRef)
    if (!contribSnap.exists) throw new Error('Contribution not found.')
    contrib = contribSnap.data()!

    const paperSnap = await tx.get(db.collection('papers').doc(contrib.paper_id as string))
    if (!paperSnap.exists) throw new Error('Paper not found.')
    paper = paperSnap.data()!
    if (paper.owner_id !== user.id) throw new Error('Not authorised.')
    if (contrib.status !== 'submitted') throw new Error('Contribution has not been submitted yet.')

    const revisionCount = (contrib.revision_count as number | undefined) ?? 0
    if (revisionCount >= 2) throw new Error('Maximum of 2 revisions allowed per stage.')

    const now = new Date()
    tx.update(contribRef, {
      status: 'revision_requested',
      revision_feedback: trimmedFeedback,
      revision_count: FieldValue.increment(1),
      revision_requested_at: now,
      confirmed_at: now,  // reset 30-day window from revision date
      deadline: new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000),
    })
  })

  const [stageSnap, contributorSnap] = await Promise.all([
    db.collection('stages').doc(contrib.stage_id as string).get(),
    db.collection('users').doc(contrib.contributor_id as string).get(),
  ])
  const stage = stageSnap.data()
  const contributorEmail = emailPrefEnabled(contributorSnap.data()) ? (contributorSnap.data()?.email as string | undefined) : undefined
  const paperTitle = escapeHtml(paper.teaser_title as string)

  await Promise.all([
    db.collection('notifications').add({
      user_id: contrib.contributor_id,
      type: 'revision_requested',
      message: 'Revision requested on your contribution',
      payload: { contribution_id: contributionId, stage_id: contrib.stage_id, paper_id: contrib.paper_id },
      read: false,
      created_at: new Date(),
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    contributorEmail && sendEmail(
      contributorEmail,
      `Revision requested — ${paper.teaser_title}`,
      `<p>The author of "${paperTitle}" has reviewed your ${stageLabelHtml(stage?.type as string | undefined)} contribution and is requesting a revision.</p>` +
      `<p>Their feedback: "${escapeHtml(trimmedFeedback)}"</p>` +
      `<p>Please update your submission when ready. You have 30 days from today.</p>`
    ),
  ])

  revalidatePath(`/papers/${contrib.paper_id as string}`)
}

// ─── Apply to stage ───────────────────────────────────────────────────────────

export async function applyToStage(stageId: string, intent: string, timeframe: string) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const trimmedIntent = intent.trim()
  if (trimmedIntent.length < 100) throw new Error('Your note needs at least 100 characters.')
  const trimmedTimeframe = timeframe.trim()
  if (!trimmedTimeframe) throw new Error('Add a timeframe.')

  const stageSnap = await db.collection('stages').doc(stageId).get()
  if (!stageSnap.exists) throw new Error('Stage not found.')
  const stage = stageSnap.data()
  if (!stage) throw new Error('Stage data missing.')

  if (stage.status !== 'open') throw new Error('This stage is no longer accepting applications.')

  const paperSnap = await db.collection('papers').doc(stage.paper_id).get()
  if (!paperSnap.exists) throw new Error('Paper not found.')
  const paper = paperSnap.data()
  if (!paper) throw new Error('Paper data missing.')

  if (paper.owner_id === user.id) throw new Error("You can't apply to your own paper.")

  // Institution access gate
  if (paper.access_type === 'institution') {
    const allowed = (paper.allowed_institutions as string[] | null | undefined) ?? []
    if (allowed.length > 0) {
      const userSnap = await db.collection('users').doc(user.id).get()
      const userInstitution = ((userSnap.data()?.institution as string | undefined) ?? '').trim().toLowerCase()
      const match = allowed.some(inst => inst.trim().toLowerCase() === userInstitution)
      if (!match || !userInstitution) {
        throw new Error(
          'This paper is restricted to specific institutions. Your profile institution does not match.'
        )
      }
    }
  }

  const ACTIVE_STATUSES = ['in_progress', 'interest_confirmed', 'document_shared', 'contribution_confirmed', 'submitted', 'revision_requested']

  // Early exit if already at limit (authoritative check is inside transaction below)
  const earlyContribsSnap = await db.collection('contributions').where('contributor_id', '==', user.id)
    .where('status', 'in', ACTIVE_STATUSES)
    .get()
  if (earlyContribsSnap.size >= 3) {
    throw new Error('You already have 3 active commitments. Complete or submit your current work before applying to new stages.')
  }

  // transaction prevents duplicate applications and commitment limit under concurrent requests
  await db.runTransaction(async (tx) => {
    const [existingSnap, activeContribsSnap] = await Promise.all([
      tx.get(
        db.collection('applications')
          .where('stage_id', '==', stageId)
          .where('applicant_id', '==', user.id)
          .limit(1)
      ),
      tx.get(
        db.collection('contributions').where('contributor_id', '==', user.id)
          .where('status', 'in', ACTIVE_STATUSES)
      ),
    ])
    if (!existingSnap.empty) throw new Error('You have already applied to this stage.')
    if (activeContribsSnap.size >= 3) {
      throw new Error('You already have 3 active commitments. Complete or submit your current work before applying to new stages.')
    }

    const ref = db.collection('applications').doc()
    tx.set(ref, {
      stage_id: stageId,
      paper_id: stage.paper_id,
      applicant_id: user.id,
      message: trimmedIntent,
      timeframe: trimmedTimeframe,
      status: 'interest_registered',
      created_at: new Date(),
    })
  })

  const [, ownerSnap, applicantSnap] = await Promise.all([
    db.collection('notifications').add({
      user_id: paper.owner_id,
      type: 'new_applicant',
      message: 'New application received',
      payload: { stage_id: stageId, paper_id: stage.paper_id, applicant_id: user.id },
      read: false,
      created_at: new Date(),
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    db.collection('users').doc(paper.owner_id).get(),
    db.collection('users').doc(user.id).get(),
  ])
  const ownerEmail = emailPrefEnabled(ownerSnap.data()) ? (ownerSnap.data()?.email as string | undefined) : undefined
  if (ownerEmail) {
    const applicantName = (applicantSnap.data()?.display_name as string | undefined) ?? 'A researcher'
    const tpl = newApplicantEmail({
      ownerEmail,
      applicantName,
      paperTitle: paper.teaser_title,
      stageLabel: STAGE_LABELS[stage.type] ?? stage.type,
      paperId: stage.paper_id,
    })
    await sendEmail(tpl.to, tpl.subject, tpl.html)
  }

  revalidatePath(`/papers/${stage.paper_id}`)
  revalidatePath('/work/applications')
  revalidatePath('/applications')
}

// ─── Save contributor contact ─────────────────────────────────────────────────

export async function saveContributorContact(
  connectionId: string,
  contact: { email?: string; whatsapp?: string; other?: string }
) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const connSnap = await db.collection('connections').doc(connectionId).get()
  if (!connSnap.exists) throw new Error('Connection not found.')
  const conn = connSnap.data()!

  const appSnap = await db.collection('applications').doc(conn.application_id as string).get()
  if (!appSnap.exists) throw new Error('Application not found.')
  const app = appSnap.data()!
  if (app.applicant_id !== user.id) throw new Error('Not authorised.')

  await db.collection('connections').doc(connectionId).update({
    contributor_contact: contact,
  })

  revalidatePath(`/papers/${app.paper_id}`)
}

// ─── Author marks contribution as substantial ─────────────────────────────────

export async function markSubstantial(contributionId: string) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const contribSnap = await db.collection('contributions').doc(contributionId).get()
  if (!contribSnap.exists) throw new Error('Contribution not found.')
  const contrib = contribSnap.data()!

  const stageSnap = await db.collection('stages').doc(contrib.stage_id as string).get()
  const stage = stageSnap.data()
  if (!stage) throw new Error('Stage data missing.')

  const paperSnap = await db.collection('papers').doc(stage.paper_id as string).get()
  const paper = paperSnap.data()
  if (!paper) throw new Error('Paper data missing.')
  if (paper.owner_id !== user.id) throw new Error('Not authorised.')
  if (contrib.status !== 'submitted') throw new Error('Contribution has not been submitted yet.')

  const now = new Date()
  const notifBody = {
    contribution_id: contributionId,
    stage_id: contrib.stage_id,
    paper_id: stage.paper_id,
  }
  const substantialMsg =
    `<p>This contribution has been marked as substantial. Co-authorship arrangement should now be discussed and agreed directly between both parties. This platform does not mediate authorship agreements.</p>`

  const [, contributorSnap, ownerSnap] = await Promise.all([
    db.collection('contributions').doc(contributionId).update({
      status: 'substantial',
      author_decision: 'substantial',
      completed_at: now,
    }),
    db.collection('users').doc(contrib.contributor_id as string).get(),
    db.collection('users').doc(user.id).get(),
  ])

  const contributorEmail = emailPrefEnabled(contributorSnap.data()) ? (contributorSnap.data()?.email as string | undefined) : undefined
  const ownerEmail = emailPrefEnabled(ownerSnap.data()) ? (ownerSnap.data()?.email as string | undefined) : undefined
  const paperTitle = escapeHtml(paper.teaser_title as string)
  const stageLabel = stageLabelHtml(stage.type as string)

  await Promise.all([
    db.collection('notifications').add({
      user_id: contrib.contributor_id,
      type: 'contribution_substantial',
      message: 'Contribution marked as substantial',
      payload: notifBody,
      read: false,
      created_at: now,
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    db.collection('notifications').add({
      user_id: user.id,
      type: 'contribution_substantial',
      message: 'Contribution marked as substantial',
      payload: notifBody,
      read: false,
      created_at: now,
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    contributorEmail && sendEmail(
      contributorEmail,
      `Your contribution has been marked as substantial — ${paper.teaser_title as string}`,
      `<p>Your <strong>${stageLabel}</strong> contribution to "${paperTitle}" has been marked as substantial.</p>${substantialMsg}`
    ),
    ownerEmail && sendEmail(
      ownerEmail,
      `Contribution marked as substantial — ${paper.teaser_title as string}`,
      `<p>You have marked the <strong>${stageLabel}</strong> contribution to "${paperTitle}" as substantial.</p>${substantialMsg}`
    ),
  ])

  revalidatePath(`/papers/${stage.paper_id as string}`)
  revalidatePath('/work/papers')
}

// ─── Author marks contribution as not substantial ─────────────────────────────

export async function markNotSubstantial(contributionId: string, note?: string) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const contribSnap = await db.collection('contributions').doc(contributionId).get()
  if (!contribSnap.exists) throw new Error('Contribution not found.')
  const contrib = contribSnap.data()!

  const stageSnap = await db.collection('stages').doc(contrib.stage_id as string).get()
  const stage = stageSnap.data()
  if (!stage) throw new Error('Stage data missing.')

  const paperSnap = await db.collection('papers').doc(stage.paper_id as string).get()
  const paper = paperSnap.data()
  if (!paper) throw new Error('Paper data missing.')
  if (paper.owner_id !== user.id) throw new Error('Not authorised.')
  if (contrib.status !== 'submitted') throw new Error('Contribution has not been submitted yet.')

  const trimmedNote = (note ?? '').trim()
  const now = new Date()

  const [, contributorSnap] = await Promise.all([
    db.collection('contributions').doc(contributionId).update({
      status: 'not_substantial',
      author_decision: 'not_substantial',
      completed_at: now,
      author_note: trimmedNote || null,
    }),
    db.collection('users').doc(contrib.contributor_id as string).get(),
  ])

  const contributorEmail = emailPrefEnabled(contributorSnap.data()) ? (contributorSnap.data()?.email as string | undefined) : undefined
  const paperTitle = escapeHtml(paper.teaser_title as string)
  const stageLabel = stageLabelHtml(stage.type as string)

  await Promise.all([
    db.collection('notifications').add({
      user_id: contrib.contributor_id,
      type: 'contribution_not_substantial',
      message: 'Contribution review complete',
      payload: {
        contribution_id: contributionId,
        stage_id: contrib.stage_id,
        paper_id: stage.paper_id,
        note: trimmedNote || null,
      },
      read: false,
      created_at: now,
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    contributorEmail && sendEmail(
      contributorEmail,
      `Contribution review complete — ${paper.teaser_title as string}`,
      `<p>The author of "${paperTitle}" has reviewed your <strong>${stageLabel}</strong> contribution.</p>` +
      `<p>The contribution has been recorded but was not assessed as substantial for co-authorship purposes.</p>` +
      (trimmedNote ? `<p>Author's note: "${escapeHtml(trimmedNote)}"</p>` : '')
    ),
  ])

  revalidatePath(`/papers/${stage.paper_id as string}`)
  revalidatePath('/work/papers')
}

// ─── Author shares Google Doc with accepted contributor ───────────────────────

export async function shareDocument(contributionId: string, docLink: string) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const trimmedLink = docLink.trim()
  if (!trimmedLink) throw new Error('Paste a Google Doc link.')
  if (!/^https?:\/\//.test(trimmedLink)) throw new Error('Link must start with https://.')

  const contribRef = db.collection('contributions').doc(contributionId)
  const contribSnap = await contribRef.get()
  if (!contribSnap.exists) throw new Error('Contribution not found.')
  const contrib = contribSnap.data()!

  const stageSnap = await db.collection('stages').doc(contrib.stage_id as string).get()
  const stage = stageSnap.data()
  if (!stage) throw new Error('Stage data missing.')

  const paperSnap = await db.collection('papers').doc(stage.paper_id as string).get()
  const paper = paperSnap.data()
  if (!paper) throw new Error('Paper data missing.')
  if (paper.owner_id !== user.id) throw new Error('Not authorised.')
  if (contrib.status === 'in_progress') throw new Error("The contributor hasn't confirmed interest yet.")

  await contribRef.update({
    status: contrib.status === 'interest_confirmed' ? 'document_shared' : contrib.status,
    doc_share_link: trimmedLink,
    doc_shared_at: new Date(),
  })

  try {
    const contributorSnap = await db.collection('users').doc(contrib.contributor_id as string).get()
    const contributorEmail = emailPrefEnabled(contributorSnap.data()) ? (contributorSnap.data()?.email as string | undefined) : undefined

    await db.collection('notifications').add({
      user_id: contrib.contributor_id,
      type: 'document_shared',
      message: 'The author shared the paper document with you',
      payload: {
        contribution_id: contributionId,
        stage_id: contrib.stage_id,
        paper_id: stage.paper_id,
      },
      read: false,
      created_at: new Date(),
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    })

    if (contributorEmail) {
      const teaserTitle = (paper.teaser_title as string | undefined) ?? 'your paper'
      sendEmail(
        contributorEmail,
        `Your document is ready — ${teaserTitle}`,
        `<p>The author of "${escapeHtml(teaserTitle)}" has shared the paper document with you for the <strong>${stageLabelHtml(stage.type as string)}</strong> stage. You can view it on the platform.</p>`
      ).catch(console.error)
    }
  } catch (err) {
    console.error('[shareDocument] notify/email failed after successful share:', err)
  }

  revalidatePath(`/papers/${stage.paper_id as string}`)
  revalidatePath('/work/papers')
}

// ─── Expire a contribution (called by cron) ──────────────────────────────────

export async function expireContribution(contributionId: string) {
  const contribRef = db.collection('contributions').doc(contributionId)
  const contribSnap = await contribRef.get()
  if (!contribSnap.exists) return
  const contrib = contribSnap.data()!
  const expirableStatuses = ['contribution_confirmed', 'revision_requested']
  if (!expirableStatuses.includes(contrib.status as string)) return

  const stageRef = db.collection('stages').doc(contrib.stage_id as string)

  await Promise.all([
    contribRef.update({ status: 'expired', expired_at: new Date() }),
    stageRef.update({ status: 'open' }),
    db.collection('users').doc(contrib.contributor_id as string).update({
      missed_commitments: FieldValue.increment(1),
    }),
  ])

  const [paperSnap, stageSnap, contributorSnap] = await Promise.all([
    db.collection('papers').doc(contrib.paper_id as string).get(),
    stageRef.get(),
    db.collection('users').doc(contrib.contributor_id as string).get(),
  ])
  const paper = paperSnap.data()
  if (!paper) return

  const ownerSnap = await db.collection('users').doc(paper.owner_id as string).get()
  const ownerEmail = emailPrefEnabled(ownerSnap.data()) ? (ownerSnap.data()?.email as string | undefined) : undefined
  const stage = stageSnap.data()
  const contributorName = escapeHtml(
    (contributorSnap.data()?.display_name as string | undefined) ?? 'A contributor'
  )
  const paperTitle = escapeHtml(paper.teaser_title as string)

  const contributorEmail = emailPrefEnabled(contributorSnap.data()) ? (contributorSnap.data()?.email as string | undefined) : undefined
  const stageLabel = STAGE_LABELS[stage?.type as string] ?? (stage?.type as string) ?? 'contribution'

  const expiredTpl = slotExpiredContributorEmail({
    contributorEmail: contributorEmail ?? '',
    paperTitle: paper.teaser_title as string,
    stageLabel,
  })

  await Promise.all([
    db.collection('notifications').add({
      user_id: paper.owner_id,
      type: 'slot_reopened',
      message: 'Contribution slot reopened',
      payload: {
        contribution_id: contributionId,
        stage_id: contrib.stage_id,
        paper_id: contrib.paper_id,
      },
      read: false,
      created_at: new Date(),
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    db.collection('notifications').add({
      user_id: contrib.contributor_id,
      type: 'slot_expired',
      message: 'Your contribution slot has expired',
      payload: {
        contribution_id: contributionId,
        stage_id: contrib.stage_id,
        paper_id: contrib.paper_id,
      },
      read: false,
      created_at: new Date(),
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    ownerEmail && sendEmail(
      ownerEmail,
      `Slot reopened — ${paper.teaser_title as string}`,
      `<p>${contributorName} did not submit within 30 days for the <strong>${stageLabelHtml(stage?.type as string | undefined)}</strong> stage on your paper "${paperTitle}". The slot is now open for new applications.</p>`
    ),
    contributorEmail && sendEmail(expiredTpl.to, expiredTpl.subject, expiredTpl.html),
  ])
}

// ─── Send a message (author ↔ contributor thread) ────────────────────────────

export async function sendMessage(applicationId: string, body: string) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const trimmed = body.trim()
  if (!trimmed) throw new Error('Message cannot be empty.')
  if (trimmed.length > 2000) throw new Error('Message too long (max 2000 characters).')

  const appSnap = await db.collection('applications').doc(applicationId).get()
  if (!appSnap.exists) throw new Error('Application not found.')
  const app = appSnap.data()!

  if (app.status !== 'accepted') throw new Error('Messaging is only available after acceptance.')

  const paperId = app.paper_id as string
  const isContributor = app.applicant_id === user.id

  const paperSnap = await db.collection('papers').doc(paperId).get()
  const paper = paperSnap.data()
  if (!paper) throw new Error('Paper not found.')

  if (!isContributor && paper.owner_id !== user.id) throw new Error('Not authorised.')

  const recipientId = isContributor ? (paper.owner_id as string) : (app.applicant_id as string)

  const now       = new Date()
  const purgeAt   = new Date(now.getTime() + 365 * 24 * 60 * 60 * 1000)

  const [, senderSnap, recipientSnap] = await Promise.all([
    db.collection('messages').add({
      application_id: applicationId,
      sender_id: user.id,
      body: trimmed,
      created_at: now,
      purge_at: purgeAt,
    }),
    db.collection('users').doc(user.id).get(),
    db.collection('users').doc(recipientId).get(),
  ])

  const senderName = (senderSnap.data()?.display_name as string | undefined) ?? 'Someone'
  const recipientEmail = emailPrefEnabled(recipientSnap.data()) ? (recipientSnap.data()?.email as string | undefined) : undefined

  const tpl = newMessageEmail({
    recipientEmail: recipientEmail ?? '',
    senderName,
    paperTitle: paper.teaser_title as string,
    paperId,
    applicationId,
    messagePreview: trimmed,
  })

  await Promise.all([
    db.collection('notifications').add({
      user_id: recipientId,
      type: 'new_message',
      message: `${senderName} sent you a message on “${paper.teaser_title as string}”`,
      payload: {
        application_id: applicationId,
        paper_id: paperId,
        sender_id: user.id,
        sender_name: senderName,
        preview: trimmed.slice(0, 160),
      },
      read: false,
      created_at: now,
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    recipientEmail && sendEmail(tpl.to, tpl.subject, tpl.html),
  ])

  revalidatePath(`/papers/${paperId}`)
  revalidatePath('/messages')
  revalidatePath(`/messages/${applicationId}`)
  revalidatePath('/notifications')
}

// ─── Report / flag ────────────────────────────────────────────────────────────

export async function submitReport(
  targetType: 'paper' | 'user',
  targetId: string,
  reason: string
) {
  const user = await getServerUser()
  if (!user) redirect('/')

  if (!reason.trim()) throw new Error('Please provide a reason.')

  await db.collection('reports').add({
    reporter_id: user.id,
    target_type: targetType,
    target_id: targetId,
    reason: reason.trim(),
    created_at: new Date(),
  })
}
