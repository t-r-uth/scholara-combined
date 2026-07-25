import Link from 'next/link'
import { notFound } from 'next/navigation'
import { getServerUser } from '@/lib/firebase/session'
import { db, batchGetByIds } from '@/lib/firebase/admin'
import UserAvatar from '@/components/UserAvatar'
import StageActions from './StageActions'
import ContributionManager from './ContributionManager'
import OwnerPaperTabs from './OwnerPaperTabs'
import StageFocus from './StageFocus'
import ReportButton from '@/components/ReportButton'
import DraftActions from './DraftActions'
import PublishSuccessBanner from './PublishSuccessBanner'
import { SCOPE_DETAIL_LABELS, ACCESS_LABELS, STAGE_LABELS, CONTRIBUTION_LABELS, CONTRIBUTION_PILL_CLASS, STUDY_TYPE_LABELS, DATASET_SIZE_LABELS, AUTHORSHIP_OFFER_LABELS, AUTHORSHIP_ORDER_LABELS, JOB_TITLE_LABELS, authorshipSummaryLine } from '@/lib/labels'
import TrackerVisibilityToggle from './TrackerVisibilityToggle'
import { ROUTES } from '@/lib/routes'

type ContribStatus =
  | 'in_progress'
  | 'interest_confirmed'
  | 'document_shared'
  | 'contribution_confirmed'
  | 'submitted'
  | 'substantial'
  | 'not_substantial'
  | 'revision_requested'
  | 'expired'
  | 'completed'  // legacy

function formatDeliveryDate(value: string): string {
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

/** Normalise old boolean-flag data to explicit status values. */
function normaliseContribStatus(
  status: string,
  legacy: { doc_shared?: boolean; commitment_confirmed?: boolean; coauthorship?: string }
): ContribStatus {
  if (status === 'in_progress') {
    if (legacy.commitment_confirmed) return 'contribution_confirmed'
    if (legacy.doc_shared) return 'document_shared'
    return 'in_progress'
  }
  if (status === 'completed') {
    return legacy.coauthorship === 'substantial' ? 'substantial' : 'not_substantial'
  }
  return status as ContribStatus
}

type UserContribution = {
  id: string
  status: ContribStatus
  confirmed_at_ms: number | null
  summary: string | null
  submission_url: string | null
  revision_feedback: string | null
  doc_share_link: string | null
} | null

type Contribution = {
  id: string
  application_id: string
  status: ContribStatus
  revision_count: number
  author_decision: string | null
  contributor: { name?: string; affiliation?: string; email?: string; orcid_id?: string | null; orcid_verified?: boolean }
  summary: string | null
  submission_url: string | null
  quant_log: Record<string, number> | null
  revision_feedback: string | null
  author_note: string | null
  doc_share_link: string | null
}

function getStageMeta(stageName: string) {
  const label = CONTRIBUTION_LABELS[stageName] ?? STAGE_LABELS[stageName] ?? stageName
  const pillClass = CONTRIBUTION_PILL_CLASS[stageName] ?? 'pill-data'
  return { label, pillClass }
}

type UserApp  = { id: string; status: string } | null
type UserConn = { id: string; application_id: string; owner_contact: Record<string, string> | null; contributor_contact: Record<string, string> | null } | null

function stageStatusLabel(status: string) {
  if (status === 'open') return 'Accepting applications'
  if (status === 'filled') return 'Position filled'
  return 'Completed'
}

export default async function PaperDetailPage({ params, searchParams }: { params: { id: string }; searchParams: { from?: string; published?: string; tab?: string; stage?: string } }) {
  const [user, paperSnap] = await Promise.all([
    getServerUser(),
    db.collection('papers').doc(params.id).get(),
  ])

  if (!paperSnap.exists) notFound()
  const paper = { id: paperSnap.id, ...paperSnap.data()! } as Record<string, unknown> & { id: string }

  const isOwner = user?.id === paper.owner_id
  if (paper.status !== 'published' && !isOwner) notFound()

  const [stagesSnap, ownerSnap, viewerSnap, appsSnap, activeContribsSnap] = await Promise.all([
    db.collection('stages').where('paper_id', '==', params.id).get(),
    db.collection('users').doc(paper.owner_id as string).get(),
    user ? db.collection('users').doc(user.id).get() : Promise.resolve(null),
    user && !isOwner
      ? db.collection('applications')
          .where('applicant_id', '==', user.id)
          .where('paper_id', '==', params.id)
          .get()
      : Promise.resolve(null),
    user && !isOwner
      ? db.collection('contributions').where('contributor_id', '==', user.id)
          .where('status', 'in', ['in_progress', 'interest_confirmed', 'document_shared', 'contribution_confirmed', 'submitted', 'revision_requested'])
          .get()
      : Promise.resolve(null),
  ])

  const atCommitmentLimit = activeContribsSnap ? activeContribsSnap.size >= 3 : false

  const stages = stagesSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{
    id: string; type: string; description: string | null; status: string
  }>

  const owner = ownerSnap.data() ?? null
  const ownerName = (owner?.display_name as string | undefined) ?? 'Researcher'
  const ownerAvatarUrl = (owner?.avatar_url as string | undefined) ?? null
  const ownerOrcidVerified = (owner?.orcid_verified as boolean | undefined) ?? false
  const ownerOrcidId = (owner?.orcid_id as string | undefined) ?? null

  let userAppsByStageId: Record<string, UserApp>  = {}
  let connectionsByAppId: Record<string, UserConn> = {}
  let contributionsForUser: Record<string, UserContribution> = {}
  let viewerContactPrefs: { email?: boolean; whatsapp?: string; other?: string } | null = null

  if (viewerSnap) {
    viewerContactPrefs = (viewerSnap.data()?.contact_prefs as typeof viewerContactPrefs) ?? null
  }

  if (appsSnap) {
    const apps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() })) as Array<{
      id: string; stage_id: string; status: string
    }>

    for (const a of apps) {
      userAppsByStageId[a.stage_id] = { id: a.id, status: a.status }
    }

    const acceptedIds = apps.filter(a => a.status === 'accepted').map(a => a.id)
    if (acceptedIds.length > 0) {
      const [connsSnap, cSnap] = await Promise.all([
        db.collection('connections').where('application_id', 'in', acceptedIds).get(),
        db.collection('contributions').where('contributor_id', '==', user!.id)
          .where('paper_id', '==', params.id)
          .get(),
      ])

      for (const d of connsSnap.docs) {
        const c = { id: d.id, ...d.data() } as UserConn & { id: string }
        if (c?.application_id) connectionsByAppId[c.application_id] = c
      }

      for (const d of cSnap.docs) {
        const raw = d.data()
        const confirmedAt = raw.confirmed_at as FirebaseFirestore.Timestamp | null
        contributionsForUser[raw.stage_id as string] = {
          id: d.id,
          status: normaliseContribStatus(raw.status as string, {
            doc_shared: raw.doc_shared as boolean | undefined,
            commitment_confirmed: raw.commitment_confirmed as boolean | undefined,
            coauthorship: raw.coauthorship as string | undefined,
          }),
          confirmed_at_ms: confirmedAt ? confirmedAt.toMillis() : null,
          summary: (raw.summary as string | null) ?? null,
          submission_url: (raw.submission_url as string | null) ?? null,
          revision_feedback: (raw.revision_feedback as string | null) ?? null,
          doc_share_link: (raw.doc_share_link as string | undefined) ?? null,
        }
      }
    }
  }

  let contributionsByStageId: Record<string, Contribution[]> = {}

  if (isOwner && stages.length > 0) {
    const stageIds = stages.map(s => s.id)

    const chunkQueries = []
    for (let i = 0; i < stageIds.length; i += 30) {
      chunkQueries.push(
        db.collection('contributions').where('stage_id', 'in', stageIds.slice(i, i + 30)).get()
      )
    }
    const chunkResults = await Promise.all(chunkQueries)

    const contribDocs = chunkResults.flatMap(snap =>
      snap.docs.map(d => ({ id: d.id, ...d.data() } as {
        id: string; stage_id: string; contributor_id: string; application_id: string
        status: string; coauthorship?: string; commitment_confirmed?: boolean
        revision_count?: number; author_decision?: string | null
        summary: string | null; submission_url: string | null
        quant_log: Record<string, number> | null
        revision_feedback: string | null; author_note: string | null
        doc_share_link: string | null; doc_shared?: boolean
      }))
    )

    const contributorIds = Array.from(new Set(contribDocs.map(c => c.contributor_id)))
    const contributors: Record<string, { name?: string; affiliation?: string; email?: string; orcid_id?: string | null; orcid_verified?: boolean }> = {}
    if (contributorIds.length > 0) {
      const contributorResults = await batchGetByIds('users', contributorIds)
      for (const snap of contributorResults) {
        for (const d of snap.docs) {
          const data = d.data()
          contributors[d.id] = {
            name: data.display_name as string | undefined,
            affiliation: data.institution as string | undefined,
            email: data.email as string | undefined,
            orcid_id: (data.orcid_id as string | null | undefined) ?? null,
            orcid_verified: (data.orcid_verified as boolean | undefined) ?? false,
          }
        }
      }
    }

    for (const c of contribDocs) {
      if (!contributionsByStageId[c.stage_id]) contributionsByStageId[c.stage_id] = []
      contributionsByStageId[c.stage_id]!.push({
        id: c.id,
        application_id: c.application_id,
        status: normaliseContribStatus(c.status, {
          doc_shared: c.doc_shared,
          commitment_confirmed: c.commitment_confirmed,
          coauthorship: c.coauthorship,
        }),
        author_decision: c.author_decision ?? null,
        contributor: contributors[c.contributor_id] ?? {},
        revision_count: c.revision_count ?? 0,
        summary: c.summary ?? null,
        submission_url: c.submission_url ?? null,
        quant_log: c.quant_log ?? null,
        revision_feedback: c.revision_feedback ?? null,
        author_note: c.author_note ?? null,
        doc_share_link: c.doc_share_link ?? null,
      })
    }

  }

  const allowedInstitutions = paper.allowed_institutions as string[] | null
  const teaserTitle = paper.teaser_title as string
  const description = paper.description as string | null | undefined
  const scopeStr = paper.scope as string | null | undefined
  const studyTypeStr = paper.study_type as string | null | undefined
  const datasetSizeStr = paper.dataset_size as string | null | undefined
  const accessTypeStr = paper.access_type as string | null | undefined
  const fullTitle = paper.full_title as string | null | undefined
  const fullAbstract = paper.full_abstract as string | null | undefined
  const abstractVisibility = (paper.abstract_visibility as string | null | undefined) ?? 'accepted_only'
  const publicSummary = paper.teaser_description as string | null | undefined
  const externalDocLink = paper.external_doc_link as string | null | undefined
  const coauthorshipTerms = paper.additional_terms as string | null | undefined
  const coauthorshipOffer = paper.authorship_offer as string | null | undefined
  const authorshipOrder = paper.authorship_order as string | null | undefined
  const targetJournal = paper.target_journal as string | null | undefined
  const submissionTimeline = paper.submission_timeline as string | null | undefined
  const hasAuthorshipTerms = !!(coauthorshipOffer || authorshipOrder || targetJournal || submissionTimeline || coauthorshipTerms)
  const postSubmissionSupport = (paper.post_submission_support as boolean | undefined) ?? false
  const trackerVisibleToContributors = (paper.tracker_visible_to_contributors as boolean | undefined) ?? false
  const ownerInst = owner?.institution as string | undefined
  const ownerFieldOfStudy = owner?.field_of_study as string | undefined
  const ownerJobTitleRaw = owner?.job_title as string | undefined
  const ownerJobTitle = ownerJobTitleRaw ? (JOB_TITLE_LABELS[ownerJobTitleRaw] ?? ownerJobTitleRaw) : undefined

  // Institution access gate (UI — server action enforces it too)
  let institutionBlocked = false
  if (!isOwner && user && accessTypeStr === 'institution') {
    const allowed = (allowedInstitutions ?? []).map(s => s.trim().toLowerCase()).filter(Boolean)
    if (allowed.length > 0) {
      const viewerInst = ((viewerSnap?.data()?.institution as string | undefined) ?? '').trim().toLowerCase()
      institutionBlocked = !viewerInst || !allowed.includes(viewerInst)
    }
  }

  const metaParts = [
    scopeStr && (SCOPE_DETAIL_LABELS[scopeStr] ?? scopeStr),
    studyTypeStr && (STUDY_TYPE_LABELS[studyTypeStr] ?? studyTypeStr),
    datasetSizeStr && (DATASET_SIZE_LABELS[datasetSizeStr] ?? datasetSizeStr),
    accessTypeStr && (ACCESS_LABELS[accessTypeStr] ?? accessTypeStr),
  ].filter(Boolean) as string[]

  const ownerInfo = (
    <>
      <UserAvatar name={ownerName} avatarUrl={ownerAvatarUrl} className="paper-detail__owner-avatar" />
      <div>
        <div className="paper-detail__owner-name">{ownerName}</div>
        <div className="paper-detail__owner-inst">
          {[ownerJobTitle, ownerInst, ownerFieldOfStudy].filter(Boolean).join(' · ') || 'Researcher'}
        </div>
        {ownerOrcidId && (
          <div className="owner-orcid-text">
            ORCID {ownerOrcidId}
            {ownerOrcidVerified
              ? <span className="profile-identity__orcid-verified">Verified</span>
              : <span className="profile-identity__orcid-unverified">Unverified</span>
            }
          </div>
        )}
      </div>
    </>
  )

  const ownerBox = isOwner ? (
    <div className="paper-detail__owner-box">
      {ownerInfo}
      <span className="paper-detail__owner-badge">Your paper</span>
    </div>
  ) : (
    <Link href={`/profile/${paper.owner_id as string}`} className="paper-detail__owner-box">
      {ownerInfo}
    </Link>
  )

  const openCount = stages.filter(s => s.status === 'open').length

  function renderStageCard(
    stage: typeof stages[number],
    mode: 'listing' | 'manage' | 'contributor'
  ) {
    const meta = getStageMeta(stage.type)
    const app = userAppsByStageId[stage.id] ?? null
    const conn = app ? (connectionsByAppId[app.id] ?? null) : null
    const contribs = contributionsByStageId[stage.id] ?? []

    // Gated per-stage: only shown once THIS stage's own contribution is accepted,
    // even if the contributor already has an accepted contribution on another stage.
    const unlocked = mode === 'contributor' && contributionsForUser[stage.id]

    // 'listing' renders the same stages a second time (as a read-only preview next
    // to 'manage'), both mounted at once with only one panel hidden via CSS. Only
    // give the scroll/highlight target id to the mode that's actually addressable,
    // so `getElementById` can't grab the hidden listing copy instead.
    return (
      <div
        key={stage.id}
        id={mode !== 'listing' ? `stage-${stage.id}` : undefined}
        className={`paper-stage-card paper-stage-card--${stage.status}${unlocked ? ' paper-stage-card--unlocked' : ''}`}
      >
        {unlocked && privateSection}
        <div className="paper-stage-card__body">
          <div className="paper-stage-card__left">
            <div className={`paper-stage-card__pill ${meta.pillClass}`}>
              {meta.label}
            </div>
            {stage.description && (
              <div className="paper-stage-card__desc">{stage.description}</div>
            )}
            <div className={`paper-stage-card__status paper-stage-card__status--${stage.status}`}>
              {mode === 'contributor' && contributionsForUser[stage.id]
                ? 'Your contribution'
                : stageStatusLabel(stage.status)}
            </div>
          </div>

          {mode === 'manage' && isOwner && contribs.length > 0 ? (
            <div className="stage-contributors">
              {contribs.map(contrib => (
                <ContributionManager
                  key={contrib.id}
                  contribution={contrib}
                />
              ))}
            </div>
          ) : mode === 'contributor' ? (
            <StageActions
              stageId={stage.id}
              stageLabel={meta.label}
              stageStatus={stage.status}
              isOwner={isOwner}
              user={user ? { id: user.id, email: user.email ?? '' } : null}
              app={app}
              connection={conn}
              contactPrefs={viewerContactPrefs}
              externalDocLink={conn !== null ? (externalDocLink ?? null) : null}
              contribution={contributionsForUser[stage.id] ?? null}
              atCommitmentLimit={atCommitmentLimit}
              institutionBlocked={institutionBlocked}
              authorshipSummary={authorshipSummaryLine(coauthorshipOffer, authorshipOrder)}
            />
          ) : null}
        </div>
      </div>
    )
  }

  const stagesSection = (mode: 'listing' | 'manage' | 'contributor', title?: string) => (
    <>
      <div className="paper-detail__stages-title">
        {title ?? 'Contribution stages'}
        {stages.length > 0 && (
          <span className="paper-detail__stages-count">
            {openCount} open
          </span>
        )}
      </div>
      {stages.length === 0 ? (
        <p className="paper-detail__stages-empty">No contribution stages defined.</p>
      ) : (
        stages.map((stage) => renderStageCard(stage, mode))
      )}
    </>
  )

  // Abstract visibility rules:
  //   'public'       → show full abstract to anyone browsing
  //   'accepted_only'→ show full abstract only in the private (after-acceptance) section
  //   'teaser_only'  → never show the abstract to anyone; show teaser_description publicly instead
  const abstractIsPublic = abstractVisibility === 'public' && !!fullAbstract
  const abstractInPrivate = abstractVisibility === 'accepted_only' && !!fullAbstract

  const hasUnlockedExtras = !!externalDocLink || !!(accessTypeStr === 'institution' && allowedInstitutions?.length)
  const unlockedLabel = hasUnlockedExtras
    ? 'Full paper details unlocked'
    : fullTitle && abstractInPrivate
      ? 'Title & abstract unlocked'
      : fullTitle
        ? 'Title unlocked'
        : 'Abstract unlocked'

  const privateSection = (fullTitle || abstractInPrivate || externalDocLink || (accessTypeStr === 'institution' && allowedInstitutions?.length)) ? (
    <div className="paper-info-unlocked">
      <div className="paper-info-unlocked__label">
        <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
          <rect x="3" y="11" width="18" height="10" rx="2" />
          <path d="M7 11V8a5 5 0 0 1 9.9-1" />
        </svg>
        {unlockedLabel}
      </div>
      {fullTitle && (
        <div className="paper-info-unlocked__row">
          <span>Title</span><span>{fullTitle}</span>
        </div>
      )}
      {abstractInPrivate && (
        <div className="paper-info-unlocked__row paper-info-unlocked__row--block">
          <span>Abstract</span><span>{fullAbstract}</span>
        </div>
      )}
      {externalDocLink && (
        <div className="paper-info-unlocked__row">
          <span>Document</span>
          {/^https?:\/\//.test(externalDocLink ?? '') ? (
            <a href={externalDocLink} target="_blank" rel="noopener noreferrer" className="paper-info-unlocked__link">
              Open document
            </a>
          ) : (
            <span>{externalDocLink}</span>
          )}
        </div>
      )}
      {accessTypeStr === 'institution' && allowedInstitutions?.length && (
        <div className="paper-info-unlocked__row">
          <span>Institutions</span>
          <span>{allowedInstitutions.join(', ')}</span>
        </div>
      )}
    </div>
  ) : null

  return (
    <div className="paper-detail-page">
      <div className="paper-detail__topbar">
        <Link
          href={
            searchParams.from === 'notifications'
              ? ROUTES.notifications
              : searchParams.from === 'profile'
                ? ROUTES.profileMe
                : searchParams.from === 'my-papers'
                  ? ROUTES.workPapers
                  : searchParams.from === 'work' // legacy alias
                    ? ROUTES.workPapers
                    : searchParams.from === 'applicants'
                      ? ROUTES.workApplicants
                      : searchParams.from === 'applications'
                        ? ROUTES.workApplications
                        : ROUTES.discover
          }
          className="paper-detail__back"
        >
          {searchParams.from === 'notifications'
            ? '← Notifications'
            : searchParams.from === 'profile'
              ? '← Profile'
              : searchParams.from === 'my-papers' || searchParams.from === 'work'
                ? '← My papers'
                : searchParams.from === 'applicants'
                  ? '← Applicants'
                  : searchParams.from === 'applications'
                    ? '← My applications'
                    : '← Discover'}
        </Link>
        {user && !isOwner && <ReportButton targetType="paper" targetId={paper.id} />}
        {isOwner && (paper.status === 'draft' || paper.status === 'published') && (
          <DraftActions
            paperId={paper.id}
            status={paper.status as 'draft' | 'published'}
            needsContributors={paper.needs_contributors === 'no' ? 'no' : 'yes'}
          />
        )}
      </div>

      {isOwner && searchParams.published === '1' && (
        <PublishSuccessBanner paperId={paper.id} />
      )}

      <h1 className="paper-detail__title">{teaserTitle}</h1>
      {ownerBox}
      {metaParts.length > 0 && <p className="paper-detail__meta-line">{metaParts.join(' · ')}</p>}
      {postSubmissionSupport && (
        <p className="paper-detail__post-submission-note">Post-submission support may be needed</p>
      )}
      {description && <p className="paper-detail__desc">{description}</p>}

      {abstractIsPublic && (
        <div className="paper-detail__abstract">
          <div className="paper-detail__abstract-label">Abstract</div>
          <p className="paper-detail__abstract-body">{fullAbstract}</p>
        </div>
      )}
      {abstractVisibility === 'teaser_only' && publicSummary && (
        <p className="paper-detail__desc">{publicSummary}</p>
      )}

      {user && hasAuthorshipTerms && (
        <div className="paper-coauthorship-terms">
          <div className="paper-coauthorship-terms__label">Authorship</div>
          <div className="paper-coauthorship-terms__body">
            {coauthorshipOffer && (
              <div className="paper-terms-row">
                <span className="paper-terms-key">Credit</span>
                <span className="paper-terms-val">{AUTHORSHIP_OFFER_LABELS[coauthorshipOffer] ?? coauthorshipOffer}</span>
              </div>
            )}
            {authorshipOrder && (
              <div className="paper-terms-row">
                <span className="paper-terms-key">Author order</span>
                <span className="paper-terms-val">{AUTHORSHIP_ORDER_LABELS[authorshipOrder] ?? authorshipOrder}</span>
              </div>
            )}
            {targetJournal && (
              <div className="paper-terms-row">
                <span className="paper-terms-key">Journal</span>
                <span className="paper-terms-val">{targetJournal}</span>
              </div>
            )}
            {submissionTimeline && (
              <div className="paper-terms-row">
                <span className="paper-terms-key">Timeline</span>
                <span className="paper-terms-val">{formatDeliveryDate(submissionTimeline)}</span>
              </div>
            )}
            {/* Legacy free-text for papers created before the structured fields */}
            {coauthorshipTerms && !coauthorshipOffer && (
              <p className="paper-coauthorship-terms__text">{coauthorshipTerms}</p>
            )}
          </div>
        </div>
      )}

      {isOwner ? (
        <OwnerPaperTabs
          initialTab={searchParams.tab === 'manage' ? 'manage' : 'listing'}
          focusStageId={searchParams.stage}
          listing={stagesSection('listing', 'Contribution stages')}
          manage={(
            <>
              {privateSection}
              <div className="paper-detail__manage-inbox">
                <Link href={ROUTES.workApplicants} className="paper-detail__manage-inbox-link">
                  Review applicants
                </Link>
                <TrackerVisibilityToggle paperId={paper.id} initialVisible={trackerVisibleToContributors} />
              </div>
              {stagesSection('manage', 'Manage stages')}
            </>
          )}
        />
      ) : (
        <>
          <StageFocus stageId={searchParams.stage} />
          {stagesSection('contributor')}
        </>
      )}
    </div>
  )
}
