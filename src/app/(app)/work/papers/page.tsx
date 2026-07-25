import Link from 'next/link'
import { getServerUser } from '@/lib/firebase/session'
import { getOwnerPaperSummaries } from '@/lib/firestore/collaborations'
import type { PaperCardSummary, PaperStageSummary } from '@/lib/firestore/collaborations'
import { getUserApplications } from '@/lib/firestore/applications'
import type { UserApplication } from '@/lib/firestore/applications'
import { CONTRIBUTOR_COLLABORATION_STATUS_LABELS } from '@/lib/labels'
import { relativeTimeCalendar } from '@/lib/relative-time'
import { ROUTES } from '@/lib/routes'
import WorkCard, { type WorkCardStatusVariant } from '../WorkCard'

export const metadata = { title: 'My papers — Scholara' }

function stagePriority(stage: PaperStageSummary): number {
  if (stage.needsYou) return 0
  if (stage.pendingApplicantsCount > 0) return 1
  if (stage.contributorCount > 0 && !stage.completedOnly) return 2
  if (stage.stageOpen) return 3
  if (stage.completedOnly) return 4
  return 5
}

function stageBadgeVariant(stage: PaperStageSummary): string {
  if (stage.needsYou) return 'urgent'
  if (stage.pendingApplicantsCount > 0) return 'applicants'
  if (stage.completedOnly) return 'completed'
  if (!stage.stageOpen) return 'closed'
  if (stage.contributorCount > 0) return 'active'
  return 'open'
}

function stageBadgeLabel(stage: PaperStageSummary): string {
  if (stage.pendingApplicantsCount > 0 && !stage.needsYou) {
    return `${stage.pendingApplicantsCount} to review`
  }
  return stage.statusLabel
}

function paperHealth(paper: PaperCardSummary): string | null {
  if (paper.status === 'draft') {
    return paper.stageCount > 0
      ? `${paper.stageCount} stage${paper.stageCount === 1 ? '' : 's'} · not on Discover yet`
      : 'Add stages, then publish to invite contributors'
  }

  const parts: string[] = []
  if (paper.needsYouCount > 0) {
    parts.push(`${paper.needsYouCount} need${paper.needsYouCount === 1 ? 's' : ''} you`)
  }
  if (paper.pendingApplicantsCount > 0) {
    parts.push(`${paper.pendingApplicantsCount} applicant${paper.pendingApplicantsCount === 1 ? '' : 's'} waiting`)
  }
  if (paper.inProgressCount > 0) {
    parts.push(`${paper.inProgressCount} in progress`)
  }
  if (parts.length === 0 && paper.completedCount > 0) {
    parts.push(`${paper.completedCount} completed`)
  }
  if (parts.length === 0) {
    return paper.quietHint ?? 'Live on Discover'
  }
  return parts.join(' · ')
}

function attentionStatus(paper: PaperCardSummary): { label: string; variant: WorkCardStatusVariant } | null {
  if (paper.status === 'draft') return null
  if (paper.needsYouCount > 0) return { label: 'Needs you', variant: 'pending' }
  if (paper.pendingApplicantsCount > 0) return { label: 'Applicants waiting', variant: 'pending' }
  return null
}

function PaperCardItem({ paper }: { paper: PaperCardSummary }) {
  const isDraft = paper.status === 'draft'
  const manageHref = isDraft
    ? `${ROUTES.paper(paper.paperId)}?from=my-papers`
    : `${ROUTES.paperManage(paper.paperId)}&from=my-papers`

  const dateLabel = paper.postedAt
    ? `${isDraft ? 'Saved' : 'Posted'} ${relativeTimeCalendar(new Date(paper.postedAt))}`
    : 'Not saved yet'

  const status = attentionStatus(paper)
  const needsAttention = Boolean(status)
  const stages = isDraft
    ? []
    : [...paper.stages].sort((a, b) => stagePriority(a) - stagePriority(b))

  return (
    <WorkCard
      title={paper.title}
      titleHref={manageHref}
      meta={paperHealth(paper)}
      status={status}
      footerDate={dateLabel}
      footerHref={manageHref}
      footerLabel={isDraft ? 'Open draft' : needsAttention ? 'Take action' : 'Manage'}
      footerEmphasis={needsAttention}
      attention={needsAttention}
    >
      {stages.length > 0 && (
        <ul className="work-card__rows" aria-label="Contribution stages">
          {stages.map((stage) => (
            <li
              key={stage.stageId}
              className={`work-card__row${stage.needsYou || stage.pendingApplicantsCount > 0 ? ' work-card__row--active' : ''}`}
            >
              <span className="work-card__row-label">{stage.stageLabel}</span>
              <div className="work-card__row-badges">
                {stage.pendingApplicantsCount > 0 && stage.needsYou && (
                  <span className="work-card__badge work-card__badge--applicants">
                    {stage.pendingApplicantsCount} to review
                  </span>
                )}
                <span className={`work-card__badge work-card__badge--${stageBadgeVariant(stage)}`}>
                  {stageBadgeLabel(stage)}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}
    </WorkCard>
  )
}

function contributorNextStep(app: UserApplication): string {
  const c = app.contribution_status
  if (!c) return 'Waiting for the author to share next steps.'
  if (c === 'in_progress') return "Confirm you'd like to proceed with this stage."
  if (c === 'interest_confirmed') return 'Waiting for the author to share a working document.'
  if (c === 'document_shared') return 'Confirm that you received the document and can contribute.'
  if (c === 'contribution_confirmed') return 'Do the work, then submit it for review.'
  if (c === 'revision_requested') return 'The author asked for changes — revise and resubmit.'
  if (c === 'submitted') return 'Your work is with the author for review.'
  if (c === 'expired') return 'This collaboration expired before it was finished.'
  return 'This collaboration is complete.'
}

function ContributorCard({ app }: { app: UserApplication }) {
  const paperHref = `${ROUTES.paper(app.paper_id)}?from=my-papers`
  const c = app.contribution_status
  const needsAction = Boolean(c && ['in_progress', 'document_shared', 'contribution_confirmed', 'revision_requested'].includes(c))
  const footerLabel = c === 'in_progress' ? 'Confirm to proceed' :
    c === 'document_shared' ? 'Confirm role' :
    (c === 'contribution_confirmed' || c === 'revision_requested') ? 'Submit work' : 'View paper'

  return (
    <WorkCard
      title={app.paper_title}
      titleHref={paperHref}
      pill={`Contributor · ${app.stage_label}`}
      status={{ label: CONTRIBUTOR_COLLABORATION_STATUS_LABELS[app.contribution_status ?? ''] ?? 'Accepted', variant: needsAction ? 'pending' : 'accepted' }}
      nextStep={contributorNextStep(app)}
      footerDate={`Applied ${relativeTimeCalendar(app.created_at)}`}
      footerHref={paperHref}
      footerLabel={footerLabel}
      footerEmphasis={needsAction}
      attention={needsAction}
    />
  )
}

export default async function WorkPapersPage() {
  const user = await getServerUser()
  if (!user) return null

  const [summaries, applications] = await Promise.all([
    getOwnerPaperSummaries(user.id),
    getUserApplications(user.id),
  ])

  const acceptedApps = applications.filter((a) => a.status === 'accepted')

  if (summaries.length === 0 && acceptedApps.length === 0) {
    return (
      <div className="work-empty">
        <div className="work-empty__title">Papers you&apos;re involved in appear here</div>
        <p className="work-empty__text">Post a paper to invite contributors, or apply to someone else&apos;s paper to collaborate. All your active research — as author or contributor — shows up here.</p>
        <Link href={ROUTES.paperNew} className="btn-publish work-empty__cta">Post a paper</Link>
      </div>
    )
  }

  const needsAttention = summaries.filter(
    (p) => p.status === 'published' && (p.needsYouCount > 0 || p.pendingApplicantsCount > 0),
  )
  const attentionIds = new Set(needsAttention.map((p) => p.paperId))
  const published = summaries.filter((p) => p.status === 'published' && !attentionIds.has(p.paperId))
  const drafts = summaries.filter((p) => p.status === 'draft')

  const hasOwned = summaries.length > 0

  return (
    <div className="work-tab">
      <header className="work-tab__intro">
        <p className="work-tab__role">Your role: paper owner &amp; contributor</p>
        <h2 className="work-tab__heading">My papers</h2>
        <p className="work-tab__help">Papers you own and papers you&apos;re actively contributing to, in one place.</p>
      </header>
      {hasOwned && needsAttention.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">
            <span className="work-tab__section-role work-tab__section-role--owner">Owner</span>
            Needs attention ({needsAttention.length})
          </h3>
          <div className="work-tab__list">
            {needsAttention.map((paper) => (
              <PaperCardItem key={paper.paperId} paper={paper} />
            ))}
          </div>
        </section>
      )}

      {hasOwned && published.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">
            <span className="work-tab__section-role work-tab__section-role--owner">Owner</span>
            Published ({published.length})
          </h3>
          <div className="work-tab__list">
            {published.map((paper) => (
              <PaperCardItem key={paper.paperId} paper={paper} />
            ))}
          </div>
        </section>
      )}

      {hasOwned && drafts.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">
            <span className="work-tab__section-role work-tab__section-role--owner">Owner</span>
            Drafts ({drafts.length})
          </h3>
          <div className="work-tab__list">
            {drafts.map((paper) => (
              <PaperCardItem key={paper.paperId} paper={paper} />
            ))}
          </div>
        </section>
      )}

      {acceptedApps.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">
            <span className="work-tab__section-role work-tab__section-role--contributor">Contributor</span>
            Contributing to ({acceptedApps.length})
          </h3>
          <div className="work-tab__list">
            {acceptedApps.map((app) => (
              <ContributorCard key={app.id} app={app} />
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
