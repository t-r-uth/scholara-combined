'use server'
import { db } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { sendEmail, emailPrefEnabled } from '@/lib/email'
import { STAGE_LABELS, isAwaitingReviewStatus } from '@/lib/labels'
import {
  applicationAcceptedEmail,
  applicationRejectedEmail,
} from '@/lib/email/templates'

async function getUserEmail(userId: string): Promise<string | undefined> {
  const snap = await db.collection('users').doc(userId).get()
  const data = snap.data()
  if (!emailPrefEnabled(data)) return undefined
  return data?.email as string | undefined
}

export async function rejectApplication(applicationId: string) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const appSnap = await db.collection('applications').doc(applicationId).get()
  if (!appSnap.exists) throw new Error('Application not found.')
  const app = appSnap.data()
  if (!app) throw new Error('Application data missing.')

  if (!isAwaitingReviewStatus(app.status as string)) {
    throw new Error('This application is no longer awaiting review.')
  }

  const stageSnap = await db.collection('stages').doc(app.stage_id).get()
  const stage = stageSnap.data()
  if (!stage) throw new Error('Stage data missing.')

  const paperSnap = await db.collection('papers').doc(stage.paper_id).get()
  const paper = paperSnap.data()
  if (!paper) throw new Error('Paper data missing.')

  if (paper.owner_id !== user.id) throw new Error('Not authorised.')

  await db.collection('applications').doc(applicationId).update({ status: 'rejected' })

  const [, contributorEmail] = await Promise.all([
    db.collection('notifications').add({
      user_id: app.applicant_id,
      type: 'application_rejected',
      message: 'Your application was not selected',
      payload: { application_id: applicationId, stage_id: app.stage_id, paper_id: stage.paper_id },
      read: false,
      created_at: new Date(),
      purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
    }),
    getUserEmail(app.applicant_id),
  ])
  if (contributorEmail) {
    const tpl = applicationRejectedEmail({
      contributorEmail,
      paperTitle: paper.teaser_title,
      stageLabel: STAGE_LABELS[stage.type] ?? stage.type,
    })
    sendEmail(tpl.to, tpl.subject, tpl.html).catch(console.error)
  }

  revalidatePath('/work/applicants')
  revalidatePath('/work/applications')
  revalidatePath('/work/papers')
  revalidatePath('/inbox')
  revalidatePath('/applications')
}

export async function acceptApplication(
  applicationId: string,
  ownerContact: { email?: string; whatsapp?: string; other?: string }
) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const appRef = db.collection('applications').doc(applicationId)
  const appSnap = await appRef.get()
  if (!appSnap.exists) throw new Error('Application not found.')
  const app = appSnap.data()
  if (!app) throw new Error('Application data missing.')

  const stageId = app.stage_id as string
  const stageSnap = await db.collection('stages').doc(stageId).get()
  const stage = stageSnap.data()
  if (!stage) throw new Error('Stage data missing.')

  const paperId = stage.paper_id as string
  const paperSnap = await db.collection('papers').doc(paperId).get()
  const paper = paperSnap.data()
  if (!paper) throw new Error('Paper data missing.')
  if (paper.owner_id !== user.id) throw new Error('Not authorised.')

  // Accept atomically: update status, create connection + contribution if not already present.
  // Stage stays open — multiple contributors can be accepted per stage.
  await db.runTransaction(async (tx) => {
    const [freshAppSnap, existingConnSnap, existingContribSnap] = await Promise.all([
      tx.get(appRef),
      tx.get(db.collection('connections').where('application_id', '==', applicationId).limit(1)),
      tx.get(db.collection('contributions').where('application_id', '==', applicationId).limit(1)),
    ])
    const fresh = freshAppSnap.data()
    if (!fresh) throw new Error('Application data missing.')
    if (!isAwaitingReviewStatus(fresh.status as string)) {
      throw new Error('This application is no longer awaiting review.')
    }

    tx.update(appRef, { status: 'accepted', decided_at: new Date() })

    if (existingConnSnap.empty) {
      tx.set(db.collection('connections').doc(), {
        application_id: applicationId,
        owner_contact: ownerContact,
        contributor_contact: null,
      })
    }
    if (existingContribSnap.empty) {
      // Always starts at in_progress — the contributor must confirm interest before
      // the author can share the document, even if the paper has a default doc link.
      tx.set(db.collection('contributions').doc(), {
        stage_id: stageId,
        paper_id: paperId,
        contributor_id: fresh.applicant_id,
        application_id: applicationId,
        status: 'in_progress',
        doc_share_link: null,
        doc_shared_at: null,
        summary: null,
        submission_url: null,
        revision_feedback: null,
        revision_count: 0,
      })
    }
  })

  // Notification + email after the transaction succeeds
  const stageLabel = STAGE_LABELS[stage.type] ?? stage.type
  const paperTitle = paper.teaser_title as string

  await db.collection('notifications').add({
    user_id: app.applicant_id,
    type: 'application_accepted',
    message: 'Your application was accepted',
    payload: { application_id: applicationId, stage_id: stageId, paper_id: paperId },
    read: false,
    created_at: new Date(),
    purge_at: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
  })

  const contributorEmail = await getUserEmail(app.applicant_id as string)
  if (contributorEmail) {
    const tpl = applicationAcceptedEmail({
      contributorEmail,
      paperTitle,
      stageLabel,
      paperId,
    })
    sendEmail(tpl.to, tpl.subject, tpl.html).catch(console.error)
  }

  revalidatePath('/work/applicants')
  revalidatePath('/work/applications')
  revalidatePath('/work/papers')
  revalidatePath('/inbox')
  revalidatePath(`/papers/${paperId}`)
  revalidatePath('/applications')
}
