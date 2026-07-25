import Link from 'next/link'
import { getServerUser } from '@/lib/firebase/session'
import { getUserApplications } from '@/lib/firestore/applications'
import { CONTRIBUTOR_APPLICATION_STATUS_LABELS, CONTRIBUTOR_COLLABORATION_STATUS_LABELS } from '@/lib/labels'
import { relativeTimeCalendar } from '@/lib/relative-time'
import { ROUTES } from '@/lib/routes'
import WorkCard, { type WorkCardStatusVariant } from '../WorkCard'

export const metadata = { title: 'Applied — Scholara' }

type AppItem = Awaited<ReturnType<typeof getUserApplications>>[number]

const PROGRESS_STEPS = ['Accepted', 'Confirmed', 'Document', 'Working', 'Submitted'] as const

function applicationStatusVariant(status: string): WorkCardStatusVariant {
  if (status === 'accepted') return 'accepted'
  if (status === 'rejected') return 'rejected'
  return 'pending'
}

function contributionStepIndex(status: string): number {
  if (status === 'in_progress') return 1
  if (status === 'interest_confirmed') return 2
  if (status === 'document_shared') return 3
  if (status === 'contribution_confirmed' || status === 'revision_requested') return 4
  return 5
}

function ContributionProgress({ status }: { status: string }) {
  const isDone = status === 'substantial' || status === 'not_substantial' || status === 'completed' || status === 'expired'
  const active = isDone ? PROGRESS_STEPS.length : contributionStepIndex(status)
  return (
    <div className="work-card__progress">
      {PROGRESS_STEPS.map((label, i) => {
        const done = isDone || i < active
        const current = !isDone && i === active
        return (
          <span
            key={label}
            className={`progress-steps__step${done ? ' progress-steps__step--done' : current ? ' progress-steps__step--active' : ' progress-steps__step--pending'}`}
          >
            {label}
          </span>
        )
      })}
    </div>
  )
}

function nextStepForApp(app: AppItem): string {
  if (app.status === 'rejected') return 'This application was not selected. You can browse other papers.'
  if (app.status !== 'accepted') return 'Waiting for the paper author to accept or decline.'

  const c = app.contribution_status
  if (!c) return 'You were accepted. Open the paper to see next steps.'
  if (c === 'in_progress') return "Confirm you'd like to proceed with this stage."
  if (c === 'interest_confirmed') return 'Waiting for the author to share a working document.'
  if (c === 'document_shared') return 'Confirm that you received the document and can contribute.'
  if (c === 'contribution_confirmed') return 'Do the work, then submit it for review.'
  if (c === 'revision_requested') return 'The author asked for changes — revise and resubmit.'
  if (c === 'submitted') return 'Your work is with the author for review.'
  if (c === 'expired') return 'This collaboration expired before it was finished.'
  return 'This collaboration is complete.'
}

function footerForApp(app: AppItem): { label: string; emphasis: boolean } {
  if (app.status === 'rejected') return { label: 'View paper', emphasis: false }
  if (app.status !== 'accepted') return { label: 'View paper', emphasis: false }

  const c = app.contribution_status
  if (c === 'in_progress') return { label: 'Confirm to proceed', emphasis: true }
  if (c === 'document_shared') return { label: 'Confirm role', emphasis: true }
  if (c === 'contribution_confirmed' || c === 'revision_requested') return { label: 'Submit work', emphasis: true }
  if (c === 'interest_confirmed' || c === 'submitted') return { label: 'View progress', emphasis: false }
  return { label: 'Open paper', emphasis: true }
}

function ApplicationCard({ app }: { app: AppItem }) {
  const paperHref = `${ROUTES.paper(app.paper_id)}?from=applications`
  const footer = footerForApp(app)

  return (
    <WorkCard
      title={app.paper_title}
      titleHref={paperHref}
      pill={`You applied for: ${app.stage_label}`}
      status={{
        label: CONTRIBUTOR_APPLICATION_STATUS_LABELS[app.status] ?? app.status,
        variant: applicationStatusVariant(app.status),
      }}
      nextStep={nextStepForApp(app)}
      footerDate={`Sent ${relativeTimeCalendar(app.created_at)}`}
      footerHref={paperHref}
      footerLabel={footer.label}
      footerEmphasis={footer.emphasis}
      attention={app.status === 'accepted' && Boolean(app.contribution_status && ['in_progress', 'document_shared', 'contribution_confirmed', 'revision_requested'].includes(app.contribution_status))}
    >
      {app.contribution_status && app.status === 'accepted' && (
        <div className="work-card__extra">
          <ContributionProgress status={app.contribution_status} />
          <span className="work-card__extra-label">
            {CONTRIBUTOR_COLLABORATION_STATUS_LABELS[app.contribution_status] ?? app.contribution_status}
          </span>
        </div>
      )}

      {app.message && (
        <details className="work-card__details">
          <summary className="work-card__details-label">Your message</summary>
          <p className="work-card__details-body">&ldquo;{app.message}&rdquo;</p>
        </details>
      )}
    </WorkCard>
  )
}

export default async function WorkApplicationsPage() {
  const user = await getServerUser()
  if (!user) return null

  const applications = await getUserApplications(user.id)

  if (applications.length === 0) {
    return (
      <div className="work-empty">
        <div className="work-empty__title">Your applications appear here</div>
        <p className="work-empty__text">When you apply to a paper, your progress tracker appears here — see whether the author replied, confirm your role when accepted, and submit your work when ready.</p>
        <Link href={ROUTES.discover} className="btn-primary work-empty__cta">Browse papers</Link>
      </div>
    )
  }

  const waiting = applications.filter((a) => a.status !== 'accepted' && a.status !== 'rejected')
  const active = applications.filter((a) => a.status === 'accepted')
  const closed = applications.filter((a) => a.status === 'rejected')

  return (
    <div className="work-tab">
      <header className="work-tab__intro">
        <p className="work-tab__role">Your role: contributor</p>
        <h2 className="work-tab__heading">Applications you&apos;ve sent</h2>
        <p className="work-tab__help">These are papers you asked to join. Track whether the author replied, and what to do next if you&apos;re accepted.</p>
      </header>
      {waiting.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">Waiting for a reply ({waiting.length})</h3>
          <div className="work-tab__list">
            {waiting.map((app) => <ApplicationCard key={app.id} app={app} />)}
          </div>
        </section>
      )}

      {active.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">Accepted — next steps ({active.length})</h3>
          <div className="work-tab__list">
            {active.map((app) => <ApplicationCard key={app.id} app={app} />)}
          </div>
        </section>
      )}

      {closed.length > 0 && (
        <section className="work-tab__section">
          <h3 className="work-tab__section-title">Not selected ({closed.length})</h3>
          <div className="work-tab__list">
            {closed.map((app) => <ApplicationCard key={app.id} app={app} />)}
          </div>
        </section>
      )}
    </div>
  )
}
