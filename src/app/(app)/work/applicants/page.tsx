import Link from 'next/link'
import { getServerUser } from '@/lib/firebase/session'
import { db, batchGetByIds } from '@/lib/firebase/admin'
import { sortDocsByCreatedAtAsc, sortDocsByCreatedAtDesc } from '@/lib/firestore/sort'
import { STAGE_LABELS, AWAITING_REVIEW_STATUSES, COLLABORATION_STATUS_LABELS, collaborationNextAction, COLLABORATION_NEXT_ACTION_LABELS, collaborationUrgency, JOB_TITLE_LABELS } from '@/lib/labels'
import { relativeTimeShort } from '@/lib/relative-time'
import { ROUTES } from '@/lib/routes'
import InboxActions from '../../inbox/InboxActions'
import WorkCard, { type WorkCardStatusVariant } from '../WorkCard'

export const metadata = { title: 'Requests — Scholara' }

function formatTimeframe(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

function collaborationStatusVariant(status: string): WorkCardStatusVariant {
  const urgency = collaborationUrgency(status)
  if (urgency === 'completed') return 'accepted'
  if (urgency === 'needs_you') return 'pending'
  return 'neutral'
}

export default async function WorkApplicantsPage() {
  const user = await getServerUser()
  if (!user) return null

  const [ownerSnap, papersSnap] = await Promise.all([
    db.collection('users').doc(user.id).get(),
    db.collection('papers').where('owner_id', '==', user.id).get(),
  ])

  const ownerProfile = ownerSnap.data()
  const ownerContactPrefs = (ownerProfile?.contact_prefs as {
    email?: boolean; whatsapp?: string; other?: string
  } | undefined) ?? null

  const paperDocs = sortDocsByCreatedAtDesc(papersSnap.docs)
  const paperIds = paperDocs.map((d) => d.id)
  const papersById = Object.fromEntries(
    paperDocs.map((doc) => [doc.id, { id: doc.id, teaser_title: doc.data().teaser_title as string }]),
  )

  const emptyApplicants = (
    <div className="work-empty">
      <div className="work-empty__title">Applicant requests appear here</div>
      <p className="work-empty__text">When researchers apply to stages on your papers, you review them here — accept to share contact details and start collaborating, or decline to keep the stage open.</p>
      <Link href={ROUTES.paperNew} className="btn-publish work-empty__cta">Post a paper</Link>
    </div>
  )

  if (paperIds.length === 0) return emptyApplicants

  // Fetch pending AND accepted applications
  const appQueries = []
  for (let i = 0; i < paperIds.length; i += 30) {
    const chunk = paperIds.slice(i, i + 30)
    appQueries.push(
      db.collection('applications')
        .where('paper_id', 'in', chunk)
        .where('status', 'in', [...AWAITING_REVIEW_STATUSES, 'accepted'])
        .get(),
    )
  }
  const appResults = await Promise.all(appQueries)
  const allAppDocs = sortDocsByCreatedAtAsc(appResults.flatMap((snap) => snap.docs))

  if (allAppDocs.length === 0) return emptyApplicants

  const stageIds = Array.from(
    new Set(allAppDocs.map((d) => d.data().stage_id as string).filter(Boolean)),
  )
  const stageResults = await batchGetByIds('stages', stageIds)
  const stagesById: Record<string, { id: string; type: string; paper_id: string }> = {}
  for (const snap of stageResults) {
    for (const d of snap.docs) {
      const data = d.data()
      stagesById[d.id] = { id: d.id, type: data.type as string, paper_id: data.paper_id as string }
    }
  }

  // Fetch contributions for accepted applications to get collaboration status
  const acceptedAppIds = allAppDocs.filter(d => d.data().status === 'accepted').map(d => d.id)
  const contribByAppId: Record<string, string> = {}
  if (acceptedAppIds.length > 0) {
    const contribChunks = []
    for (let i = 0; i < acceptedAppIds.length; i += 30) {
      contribChunks.push(
        db.collection('contributions')
          .where('application_id', 'in', acceptedAppIds.slice(i, i + 30))
          .get()
      )
    }
    const contribResults = await Promise.all(contribChunks)
    for (const snap of contribResults) {
      for (const d of snap.docs) {
        const raw = d.data()
        let status = raw.status as string
        if (status === 'in_progress') {
          if (raw.commitment_confirmed) status = 'contribution_confirmed'
          else if (raw.doc_shared) status = 'document_shared'
        } else if (status === 'completed') {
          status = raw.coauthorship === 'substantial' ? 'substantial' : 'not_substantial'
        }
        contribByAppId[raw.application_id as string] = status
      }
    }
  }

  type Applicant = {
    display_name?: string
    job_title?: string
    institution?: string
    field_of_study?: string
    email?: string
    orcid_id?: string | null
    orcid_verified?: boolean
    completionRate: number | null
    timesSubstantial: number
    missedCommitments: number
  } | null

  type AppRow = {
    id: string
    status: string
    stage_id: string
    applicant_id: string
    message: string | null
    timeframe: string | null
    created_at: FirebaseFirestore.Timestamp
    applicant: Applicant
    collabStatus: string | null
  }

  const applicantIds = Array.from(
    new Set(allAppDocs.map((d) => d.data().applicant_id as string).filter(Boolean)),
  )
  const applicants: Record<string, Applicant> = {}
  if (applicantIds.length > 0) {
    const profileResults = await batchGetByIds('users', applicantIds)
    for (const snap of profileResults) {
      for (const d of snap.docs) {
        const data = d.data()
        applicants[d.id] = {
          display_name: data.display_name as string | undefined,
          job_title: data.job_title as string | undefined,
          institution: data.institution as string | undefined,
          field_of_study: data.field_of_study as string | undefined,
          email: data.email as string | undefined,
          orcid_id: (data.orcid_id as string | null | undefined) ?? null,
          orcid_verified: (data.orcid_verified as boolean | undefined) ?? false,
          completionRate: null,
          timesSubstantial: 0,
          missedCommitments: 0,
        }
      }
    }

    const contribChunkQueries = []
    for (let i = 0; i < applicantIds.length; i += 30) {
      contribChunkQueries.push(
        db.collection('contributions').where('contributor_id', 'in', applicantIds.slice(i, i + 30)).get(),
      )
    }
    const contribResults = await Promise.all(contribChunkQueries)

    const statsByContributor: Record<string, {
      total: number; completed: number; substantial: number; missed: number
    }> = {}
    for (const snap of contribResults) {
      for (const d of snap.docs) {
        const c = d.data()
        const cid = c.contributor_id as string
        if (!statsByContributor[cid]) statsByContributor[cid] = { total: 0, completed: 0, substantial: 0, missed: 0 }
        const s = statsByContributor[cid]!
        s.total++
        if (c.status === 'completed') s.completed++
        if (c.coauthorship === 'granted') s.substantial++
        if (c.status === 'dropped_out' || c.status === 'expired') s.missed++
      }
    }

    for (const id of applicantIds) {
      const applicant = applicants[id]
      if (!applicant) continue
      const s = statsByContributor[id]
      if (s && s.total > 0) {
        applicant.completionRate = Math.round((s.completed / s.total) * 100)
        applicant.timesSubstantial = s.substantial
        applicant.missedCommitments = s.missed
      }
    }
  }

  const applications: AppRow[] = allAppDocs.map((d) => {
    const data = d.data()
    const appStatus = data.status as string
    return {
      id: d.id,
      status: appStatus,
      stage_id: data.stage_id as string,
      applicant_id: data.applicant_id as string,
      message: (data.message as string | undefined) ?? null,
      timeframe: (data.timeframe as string | undefined) ?? null,
      created_at: data.created_at as FirebaseFirestore.Timestamp,
      applicant: applicants[data.applicant_id as string] ?? null,
      collabStatus: appStatus === 'accepted' ? (contribByAppId[d.id] ?? 'in_progress') : null,
    }
  })

  const pending = applications.filter((a) => a.status !== 'accepted')
  const accepted = applications.filter((a) => a.status === 'accepted')
  const needsOwner = accepted.filter((a) => collaborationUrgency(a.collabStatus ?? 'in_progress') === 'needs_you')
  const inProgress = accepted.filter((a) => collaborationUrgency(a.collabStatus ?? 'in_progress') === 'in_progress')
  const completed = accepted.filter((a) => collaborationUrgency(a.collabStatus ?? 'in_progress') === 'completed')

  return (
    <div className="work-tab">
      <header className="work-tab__intro">
        <p className="work-tab__role">Your role: paper owner</p>
        <h2 className="work-tab__heading">Requests to join your papers</h2>
        <p className="work-tab__help">People who applied to contribute on papers you posted. Review new requests first, then manage anyone you&apos;ve already accepted.</p>
        {pending.length > 0 && <p className="work-panel__meta">{pending.length} waiting for your decision</p>}
      </header>
      {pending.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">Needs your decision ({pending.length})</h3>
          <div className="work-tab__list">
            {pending.map((app) => {
              const stage = stagesById[app.stage_id]
              const paper = stage ? papersById[stage.paper_id] : null
              if (!stage || !paper) return null
              const stageLabel = STAGE_LABELS[stage.type] ?? stage.type
              return renderPendingCard(app, paper, app.stage_id, stageLabel, user.email ?? '', ownerContactPrefs)
            })}
          </div>
        </section>
      )}

      {needsOwner.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">Needs your action ({needsOwner.length})</h3>
          <div className="work-tab__list">
            {needsOwner.map((app) => renderAcceptedCard(app, stagesById, papersById))}
          </div>
        </section>
      )}

      {inProgress.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">Working with you ({inProgress.length})</h3>
          <div className="work-tab__list">
            {inProgress.map((app) => renderAcceptedCard(app, stagesById, papersById))}
          </div>
        </section>
      )}

      {completed.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">Completed ({completed.length})</h3>
          <div className="work-tab__list">
            {completed.map((app) => renderAcceptedCard(app, stagesById, papersById))}
          </div>
        </section>
      )}
    </div>
  )
}

function ownerNextStep(collabStatus: string): string {
  if (collabStatus === 'in_progress') return "Waiting for them to confirm they'd like to proceed."
  if (collabStatus === 'interest_confirmed') return 'Share a working document so they can start contributing.'
  if (collabStatus === 'document_shared') return 'Waiting for them to confirm they received the document.'
  if (collabStatus === 'contribution_confirmed') return 'They are working. Message them if you need an update.'
  if (collabStatus === 'revision_requested') return 'Waiting for them to revise and resubmit.'
  if (collabStatus === 'submitted') return 'Review their submission and decide if the work is substantial.'
  if (collabStatus === 'expired') return 'This collaboration expired.'
  return 'This collaboration is complete.'
}

function renderAcceptedCard(
  app: {
    id: string
    applicant_id: string
    stage_id: string
    applicant: { display_name?: string } | null
    collabStatus: string | null
  },
  stagesById: Record<string, { id: string; type: string; paper_id: string }>,
  papersById: Record<string, { id: string; teaser_title: string }>,
) {
  const stage = stagesById[app.stage_id]
  const paper = stage ? papersById[stage.paper_id] : null
  if (!stage || !paper) return null

  const stageLabel = STAGE_LABELS[stage.type] ?? stage.type
  const collabStatus = app.collabStatus ?? 'in_progress'
  const nextAction = collaborationNextAction(collabStatus)
  const actionHref = nextAction === 'share_document' || nextAction === 'review_submission'
    ? ROUTES.paperManage(paper.id, stage.id)
    : ROUTES.message(app.id)
  const needsYou = collaborationUrgency(collabStatus) === 'needs_you'

  return (
    <WorkCard
      key={app.id}
      title={app.applicant?.display_name ?? 'Researcher'}
      titleHref={ROUTES.profile(app.applicant_id)}
      pill={`Joined: ${stageLabel}`}
      meta={paper.teaser_title}
      status={{
        label: COLLABORATION_STATUS_LABELS[collabStatus] ?? collabStatus,
        variant: collaborationStatusVariant(collabStatus),
      }}
      nextStep={ownerNextStep(collabStatus)}
      footerDate="Collaborating"
      footerHref={actionHref}
      footerLabel={COLLABORATION_NEXT_ACTION_LABELS[nextAction]}
      footerEmphasis={needsYou}
      attention={needsYou}
    />
  )
}

function renderPendingCard(
  app: {
    id: string
    status: string
    stage_id: string
    applicant_id: string
    message: string | null
    timeframe: string | null
    created_at: FirebaseFirestore.Timestamp
    applicant: {
      display_name?: string
      job_title?: string
      institution?: string
      field_of_study?: string
      email?: string
      orcid_id?: string | null
      orcid_verified?: boolean
      completionRate: number | null
      timesSubstantial: number
      missedCommitments: number
    } | null
    collabStatus: string | null
  },
  paper: { id: string; teaser_title: string },
  stageId: string,
  stageLabel: string,
  userEmail: string,
  ownerContactPrefs: { email?: boolean; whatsapp?: string; other?: string } | null,
) {
  const applicant = app.applicant
  const name = applicant?.display_name ?? 'Researcher'
  const createdAt = app.created_at?.toDate ? app.created_at.toDate() : new Date(app.created_at as unknown as string)
  const hasProfileDetails = Boolean(
    applicant?.job_title
    || applicant?.institution
    || applicant?.field_of_study
    || applicant?.orcid_id
    || (applicant && (applicant.completionRate !== null || applicant.timesSubstantial > 0 || applicant.missedCommitments > 0)),
  )

  return (
    <WorkCard
      key={app.id}
      title={name}
      titleHref={ROUTES.profile(app.applicant_id)}
      pill={`Wants to join: ${stageLabel}`}
      meta={paper.teaser_title}
      status={{ label: 'Needs decision', variant: 'pending' }}
      footerDate={`Received ${relativeTimeShort(createdAt)}`}
      attention
    >
      <InboxActions
        applicationId={app.id}
        applicantName={name}
        applicantEmail={applicant?.email}
        userEmail={userEmail}
        paperId={paper.id}
        paperTitle={paper.teaser_title}
        stageId={stageId}
        stageLabel={stageLabel}
        contactPrefs={ownerContactPrefs}
      />

      {app.message && (
        <details className="work-card__details">
          <summary className="work-card__details-label">Message</summary>
          <p className="work-card__details-body">&ldquo;{app.message}&rdquo;</p>
        </details>
      )}

      {hasProfileDetails && (
        <details className="work-card__details">
          <summary className="work-card__details-label">Applicant profile</summary>
          <div className="work-card__details-body">
            {(applicant?.job_title || applicant?.institution || applicant?.field_of_study) && (
              <p className="work-card__submeta">
                {[
                  applicant.job_title ? (JOB_TITLE_LABELS[applicant.job_title] ?? applicant.job_title) : null,
                  applicant.institution,
                  applicant.field_of_study,
                ].filter(Boolean).join(' · ')}
              </p>
            )}
            {applicant?.orcid_id ? (
              <div className="owner-orcid-text">
                ORCID {applicant.orcid_id}
                {applicant.orcid_verified
                  ? <span className="profile-identity__orcid-verified">Verified</span>
                  : <span className="profile-identity__orcid-unverified">Unverified</span>
                }
              </div>
            ) : (
              <p className="work-card__orcid-missing">No ORCID linked</p>
            )}
            {applicant && (applicant.completionRate !== null || applicant.timesSubstantial > 0 || applicant.missedCommitments > 0) && (
              <div className="work-card__stats">
                {applicant.completionRate !== null && (
                  <span className="work-card__stat">{applicant.completionRate}% completion</span>
                )}
                {applicant.timesSubstantial > 0 && (
                  <span
                    className="work-card__stat"
                    title="The paper owner judged this contribution significant enough to warrant co-authorship consideration"
                  >
                    {applicant.timesSubstantial}× substantial
                  </span>
                )}
                {applicant.missedCommitments > 0 && (
                  <span className="work-card__stat work-card__stat--warning">{applicant.missedCommitments} missed</span>
                )}
              </div>
            )}
          </div>
        </details>
      )}

      {app.timeframe && (
        <p className="work-card__note">
          <span className="work-card__note-label">Estimated completion by: </span>
          {formatTimeframe(app.timeframe)}
        </p>
      )}
    </WorkCard>
  )
}
