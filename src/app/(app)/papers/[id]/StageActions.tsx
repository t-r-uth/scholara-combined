'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import Modal from '@/components/Modal'
import CopyButton from '@/components/CopyButton'
import { contactFromPrefs, type ContactPrefs } from '@/lib/contact'
import { ROUTES } from '@/lib/routes'
import { applyToStage, saveContributorContact, confirmInterest, confirmCommitment, submitContribution } from './actions'

// ─── Progress steps ───────────────────────────────────────────────────────────

const PROGRESS_STEPS = ['Accepted', 'Confirmed', 'Document', 'Working', 'Submitted'] as const

function activeStepIndex(status: string): number {
  if (status === 'in_progress') return 1
  if (status === 'interest_confirmed') return 2
  if (status === 'document_shared') return 3
  if (status === 'contribution_confirmed' || status === 'revision_requested') return 4
  return 5 // submitted, substantial, not_substantial, completed, expired
}

function ProgressSteps({ status }: { status: string }) {
  const active = activeStepIndex(status)
  const allDone = status === 'substantial' || status === 'not_substantial' || status === 'completed'
  return (
    <div className="progress-steps">
      {PROGRESS_STEPS.map((label, i) => {
        const done = allDone || i < active
        const current = !allDone && i === active
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

type Contact = { email?: string; whatsapp?: string; other?: string }
type UserApp = { id: string; status: string } | null
type UserConn = {
  id: string
  application_id: string
  owner_contact: Contact | null
  contributor_contact: Contact | null
} | null
type UserContribution = {
  id: string
  status: 'in_progress' | 'interest_confirmed' | 'document_shared' | 'contribution_confirmed' | 'submitted' | 'substantial' | 'not_substantial' | 'revision_requested' | 'expired' | 'completed'
  confirmed_at_ms: number | null
  summary: string | null
  submission_url: string | null
  revision_feedback: string | null
  doc_share_link: string | null
} | null

interface Props {
  stageId: string
  stageLabel: string
  stageStatus: string
  isOwner: boolean
  user: { id: string; email: string } | null
  app: UserApp
  connection: UserConn
  contactPrefs?: ContactPrefs
  externalDocLink: string | null
  contribution: UserContribution
  atCommitmentLimit: boolean
  institutionBlocked?: boolean
  authorshipSummary?: string | null
}

export default function StageActions({
  stageId, stageLabel, stageStatus, isOwner, user,
  app, connection, contactPrefs, externalDocLink, contribution,
  atCommitmentLimit, institutionBlocked, authorshipSummary,
}: Props) {
  const [showApply, setShowApply] = useState(false)
  const [applied, setApplied] = useState(false)
  const [committed, setCommitted] = useState(false)
  const [localSubStatus, setLocalSubStatus] = useState<string | null>(null)
  const [showSubmitModal, setShowSubmitModal] = useState(false)

  if (isOwner) return null

  if (!user) {
    return (
      <Link href="/sign-in" className="paper-stage-signin-link">
        Sign in to apply
      </Link>
    )
  }

  if (stageStatus !== 'open' && !app && !applied) {
    return (
      <span className="paper-stage-status-label">
        {stageStatus === 'filled' ? 'Position filled' : 'Completed'}
      </span>
    )
  }

  if (!app && !applied) {
    if (institutionBlocked) {
      return (
        <span className="stage-actions__limit-text">
          This paper is restricted to specific institutions. Update your profile institution to apply.
        </span>
      )
    }
    if (atCommitmentLimit) {
      return (
        <span className="stage-actions__limit-text">
          You have 3 active commitments. Complete your current work before applying to new stages.
        </span>
      )
    }
    return (
      <>
        <button
          type="button"
          className="paper-stage-apply-btn"
          onClick={() => setShowApply(true)}
        >
          Apply
        </button>
        {showApply && (
          <ApplyModal
            stageId={stageId}
            stageLabel={stageLabel}
            authorshipSummary={authorshipSummary}
            onClose={() => setShowApply(false)}
            onSuccess={() => { setShowApply(false); setApplied(true) }}
          />
        )}
      </>
    )
  }

  if (applied || app?.status === 'interest_registered' || app?.status === 'pending') {
    return (
      <div className="stage-actions__pending">
        <span className="app-status app-status--pending">Interest registered</span>
        <span className="stage-actions__pending-note">You&apos;ll be notified when the author responds.</span>
      </div>
    )
  }

  if (app?.status === 'rejected') {
    return <span className="app-status app-status--rejected">Not selected</span>
  }

  if (app?.status === 'accepted' && connection) {
    const subStatus = localSubStatus ?? contribution?.status ?? 'in_progress'
    const docShareLink = contribution?.doc_share_link ?? null

    let stateContent: React.ReactNode

    if (subStatus === 'expired') {
      stateContent = (
        <div className="expired-card">
          <div className="expired-card__badge">Slot expired</div>
          <p className="expired-card__desc">
            The 30-day window to submit your contribution has passed. This slot has reopened for new applicants.
          </p>
        </div>
      )
    } else if (subStatus === 'substantial') {
      stateContent = (
        <div className="role-done-card">
          <div className="role-done-card__badge">✓ Contribution complete</div>
          <div className="role-done-card__coauth role-done-card__coauth--granted">
            Substantial — co-authorship to be agreed directly with the author
          </div>
        </div>
      )
    } else if (subStatus === 'not_substantial') {
      stateContent = (
        <div className="role-done-card">
          <div className="role-done-card__badge">✓ Contribution complete</div>
          <div className="role-done-card__coauth role-done-card__coauth--declined">
            Not substantial
          </div>
        </div>
      )
    } else if (subStatus === 'submitted') {
      const submittedDocLink = (contribution?.doc_share_link && /^https?:\/\//.test(contribution.doc_share_link))
        ? contribution.doc_share_link
        : (externalDocLink && /^https?:\/\//.test(externalDocLink))
        ? externalDocLink
        : null
      stateContent = (
        <div className="submission-status-card">
          <ProgressSteps status={subStatus} />
          <div className="submission-status-card__badge">Under review</div>
          <p className="submission-status-card__note">
            The author will mark your work as substantial, not substantial, or request a revision.
          </p>
          {submittedDocLink && (
            <a href={submittedDocLink} target="_blank" rel="noopener noreferrer" className="connected-card__doc-link">
              Open working document →
            </a>
          )}
          <Link href={ROUTES.message(app.id)} className="btn-ghost btn-ghost--compact submission-status-card__msg">
            Message author
          </Link>
          {connection.owner_contact && (
            <OwnerContactMini contact={connection.owner_contact} />
          )}
        </div>
      )
    } else if (subStatus === 'contribution_confirmed' || subStatus === 'revision_requested') {
      // Working phase — can submit
      stateContent = (
        <div className="active-contributor-view">
          <ConnectedView
            connection={connection}
            userEmail={user.email}
            contactPrefs={contactPrefs}
            externalDocLink={externalDocLink}
            docShareLink={docShareLink}
            confirmedAtMs={contribution?.confirmed_at_ms ?? null}
            revisionFeedback={contribution?.revision_feedback ?? null}
            status={subStatus}
            onSubmit={() => setShowSubmitModal(true)}
          />
          {showSubmitModal && (
            <SubmitContributionModal
              contributionId={contribution?.id ?? ''}
              ownerEmail={connection?.owner_contact?.email ?? null}
              onClose={() => setShowSubmitModal(false)}
              onSuccess={() => { setShowSubmitModal(false); setLocalSubStatus('submitted') }}
            />
          )}
        </div>
      )
    } else if (subStatus === 'in_progress') {
      stateContent = (
        <ConfirmInterestCard
          contributionId={contribution?.id ?? ''}
          onConfirm={() => setLocalSubStatus('interest_confirmed')}
        />
      )
    } else if (subStatus === 'interest_confirmed') {
      stateContent = <AwaitingDocumentCard />
    } else {
      // document_shared — author has shared the document, can confirm commitment
      stateContent = (
        <CommitmentCard
          contributionId={contribution?.id ?? ''}
          connection={connection}
          docShareLink={docShareLink}
          onConfirm={() => setCommitted(true)}
        />
      )
    }

    if (committed) {
      // Optimistic: contributor just confirmed, show working state
      const docShareLinkForConfirmed = contribution?.doc_share_link ?? null
      stateContent = (
        <div className="active-contributor-view">
          <ConnectedView
            connection={connection}
            userEmail={user.email}
            contactPrefs={contactPrefs}
            externalDocLink={externalDocLink}
            docShareLink={docShareLinkForConfirmed}
            confirmedAtMs={contribution?.confirmed_at_ms ?? Date.now()}
            revisionFeedback={null}
            status="contribution_confirmed"
            onSubmit={() => setShowSubmitModal(true)}
          />
          {showSubmitModal && (
            <SubmitContributionModal
              contributionId={contribution?.id ?? ''}
              ownerEmail={connection?.owner_contact?.email ?? null}
              onClose={() => setShowSubmitModal(false)}
              onSuccess={() => { setShowSubmitModal(false); setLocalSubStatus('submitted') }}
            />
          )}
        </div>
      )
    }

    return (
      <div className="stage-actions__accepted-wrapper">
        {stateContent}
      </div>
    )
  }

  return null
}

// ─── Confirm interest card (before the document is shared) ────────────────────

function ConfirmInterestCard({
  contributionId,
  onConfirm,
}: {
  contributionId: string
  onConfirm: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      try {
        await confirmInterest(contributionId)
        onConfirm()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <div className="commitment-card">
      <ProgressSteps status="in_progress" />
      <div className="commitment-card__title">You&apos;ve been selected</div>
      <p className="commitment-card__explainer">
        The author has chosen you for this stage, and the full title and abstract are now visible above.
        Confirm you&apos;d like to proceed and the author will share the working document with you next.
        You can withdraw by messaging the author instead.
      </p>
      {error && <p className="form-error form-error--compact">{error}</p>}
      <button
        type="button"
        className="commitment-card__btn"
        onClick={handleConfirm}
        disabled={isPending}
      >
        {isPending ? 'Confirming…' : "Yes, I'd like to proceed"}
      </button>
    </div>
  )
}

// ─── Awaiting document card ────────────────────────────────────────────────────

function AwaitingDocumentCard() {
  return (
    <div className="commitment-card">
      <ProgressSteps status="interest_confirmed" />
      <div className="commitment-card__title">Confirmed — accepted</div>
      <p className="commitment-card__waiting-doc">
        Waiting for the author to share the paper document. You&apos;ll be notified as soon as it&apos;s ready.
      </p>
    </div>
  )
}

// ─── Commitment card (after the document has been shared) ─────────────────────

function CommitmentCard({
  contributionId,
  connection,
  docShareLink,
  onConfirm,
}: {
  contributionId: string
  connection: NonNullable<UserConn>
  docShareLink: string | null
  onConfirm: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const ownerContact = connection.owner_contact

  function handleConfirm() {
    setError(null)
    startTransition(async () => {
      try {
        await confirmCommitment(contributionId)
        onConfirm()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <div className="commitment-card">
      <ProgressSteps status="document_shared" />
      <div className="commitment-card__title">You&apos;ve been selected</div>
      <p className="commitment-card__explainer">
        The author has chosen you for this stage. Once you confirm, you&apos;ll have 30 days to complete and submit your contribution. You can withdraw by messaging the author before confirming.
      </p>

      {docShareLink && /^https?:\/\//.test(docShareLink) && (
        <div className="commitment-card__section">
          <div className="commitment-card__section-label">Paper document</div>
          <a
            href={docShareLink}
            target="_blank"
            rel="noopener noreferrer"
            className="commitment-card__doc-link"
          >
            Open document →
          </a>
        </div>
      )}

      {ownerContact && (ownerContact.email || ownerContact.whatsapp || ownerContact.other) && (
        <div className="commitment-card__section">
          <div className="commitment-card__section-label">Author contact</div>
          {ownerContact.email && (
            <div className="commitment-card__contact-row">
              <span>{ownerContact.email}</span>
              <CopyButton text={ownerContact.email} />
            </div>
          )}
          {ownerContact.whatsapp && (
            <div className="commitment-card__contact-row">
              <span>{ownerContact.whatsapp}</span>
            </div>
          )}
          {ownerContact.other && (
            <div className="commitment-card__contact-row">
              <span>{ownerContact.other}</span>
            </div>
          )}
        </div>
      )}

      <p className="commitment-card__desc">
        Once you confirm, you have 30 days to submit your contribution.
      </p>
      {error && <p className="form-error form-error--compact">{error}</p>}
      <button
        type="button"
        className="commitment-card__btn"
        onClick={handleConfirm}
        disabled={isPending}
      >
        {isPending ? 'Confirming…' : 'I confirm I will contribute to this stage'}
      </button>
    </div>
  )
}

// ─── Apply modal ──────────────────────────────────────────────────────────────

function ApplyModal({
  stageId,
  stageLabel,
  authorshipSummary,
  onClose,
  onSuccess,
}: {
  stageId: string
  stageLabel: string
  authorshipSummary?: string | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [intent, setIntent] = useState('')
  const [timeframe, setTimeframe] = useState('')
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  const intentLength = intent.trim().length
  const canSubmit = intentLength >= 100 && timeframe.trim().length > 0 && disclaimerChecked && !isPending

  function closeModal() {
    setIsClosing(true)
    setTimeout(() => { onClose() }, 150)
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      try {
        await applyToStage(stageId, intent, timeframe)
        onSuccess()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <Modal
      title="Apply"
      onClose={closeModal}
      isClosing={isClosing}
      footer={(
        <div className="modal__footer">
          <button type="button" className="btn-ghost" onClick={closeModal} disabled={isPending}>Cancel</button>
          <button type="button" className="btn-primary" onClick={submit} disabled={!canSubmit}>
            {isPending ? 'Sending…' : 'Send'}
          </button>
        </div>
      )}
    >
      <div className="modal__body">
        <div className="modal-field-group">
          <div className="modal-field-group__label">For</div>
          <div className="modal-field-group__value">{stageLabel}</div>
        </div>
        {authorshipSummary && (
          <p className="apply-authorship-summary">
            Authorship on this paper: {authorshipSummary}
          </p>
        )}
        <div className="profile-field">
          <label className="profile-field__label" htmlFor="apply-intent">
            Your note
          </label>
          <textarea
            id="apply-intent"
            className="profile-field__textarea"
            rows={5}
            value={intent}
            onChange={e => setIntent(e.target.value)}
            placeholder="What you can do for this stage, and any relevant experience"
            maxLength={2000}
            autoFocus
          />
          <div className={`apply-intent-count ${intentLength >= 100 ? 'apply-intent-count--ok' : ''}`}>
            {intentLength < 100 ? `${100 - intentLength} more needed` : `${intentLength} characters`}
          </div>
        </div>
        <div className="profile-field">
          <label className="profile-field__label" htmlFor="apply-timeframe">
            Estimated completion by
          </label>
          <input
            id="apply-timeframe"
            className="profile-field__input profile-field__input--date"
            type="date"
            value={timeframe}
            onChange={e => setTimeframe(e.target.value)}
            min={new Date().toISOString().split('T')[0]}
          />
        </div>
        <label className="apply-disclaimer">
          <input
            type="checkbox"
            className="apply-disclaimer__check"
            checked={disclaimerChecked}
            onChange={e => setDisclaimerChecked(e.target.checked)}
          />
          <span>
            I understand co-authorship is not guaranteed and is determined solely by the author. I confirm I intend to contribute if accepted and understand that failing to deliver after acceptance will be recorded on my profile.
          </span>
        </label>
        {error && <p className="form-error">{error}</p>}
      </div>
    </Modal>
  )
}

// ─── Submit contribution modal ────────────────────────────────────────────────

type QuantField = { key: string; label: string }
const QUANT_FIELDS: QuantField[] = [
  { key: 'words_added',      label: 'Words added' },
  { key: 'words_removed',    label: 'Words removed' },
  { key: 'refs_added',       label: 'References added' },
  { key: 'tables_added',     label: 'Tables added' },
  { key: 'figures_added',    label: 'Figures added' },
  { key: 'code_files_added', label: 'Code files added' },
]

function SubmitContributionModal({
  contributionId,
  ownerEmail,
  onClose,
  onSuccess,
}: {
  contributionId: string
  ownerEmail: string | null
  onClose: () => void
  onSuccess: () => void
}) {
  const [note, setNote] = useState('')
  const [url, setUrl] = useState('')
  const [checked, setChecked] = useState(false)
  const [quant, setQuant] = useState<Record<string, string>>({})
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  function closeModal() {
    setIsClosing(true)
    setTimeout(() => { onClose() }, 150)
  }

  function submit() {
    if (isPending) return
    if (!note.trim()) { setError('Add a contribution summary.'); return }
    if (!url.trim())  { setError('Paste your contribution document link.'); return }
    if (!checked)     { setError('Tick the checkbox to confirm you\'ve shared the document.'); return }
    setError(null)
    startTransition(async () => {
      try {
        const quantLog: Record<string, number> = {}
        for (const f of QUANT_FIELDS) {
          const v = parseInt(quant[f.key] ?? '', 10)
          if (!isNaN(v) && v > 0) quantLog[f.key] = v
        }
        await submitContribution(contributionId, note, url, quantLog)
        onSuccess()
      } catch (e) {
        const message = e instanceof Error ? e.message : 'Something went wrong.'
        // Production digests hide the real message — treat known retry case as success.
        if (/awaiting review|already submitted|digest/i.test(message)) {
          onSuccess()
          return
        }
        setError(message.includes('digest') || message.includes('Server Components')
          ? 'Could not confirm submission. Refresh the page — if it shows Under review, you are done.'
          : message)
      }
    })
  }

  return (
    <Modal
      title="Submit your contribution"
      onClose={closeModal}
      isClosing={isClosing}
      footer={(
        <div className="modal__footer">
          <button type="button" className="btn-ghost" onClick={closeModal} disabled={isPending}>Cancel</button>
          <button type="button" className="btn-primary" onClick={submit} disabled={isPending}>
            {isPending ? 'Submitting…' : 'Submit for review'}
          </button>
        </div>
      )}
    >
      <div className="modal__body">
        {ownerEmail && (
          <div className="submit-doc-instruction">
            <p className="submit-doc-instruction__text">
              Share your contribution document with the author&apos;s email in Google Drive, then paste the link below.
            </p>
            <div className="submit-doc-instruction__email">
              <span>{ownerEmail}</span>
              <CopyButton text={ownerEmail} />
            </div>
          </div>
        )}

        <div className="profile-field">
          <label className="profile-field__label" htmlFor="submit-url">
            Contribution document link
          </label>
          <input
            id="submit-url"
            className="profile-field__input"
            type="url"
            value={url}
            onChange={e => setUrl(e.target.value)}
            placeholder="https://docs.google.com/…"
            autoFocus
          />
        </div>

        <label className="apply-disclaimer">
          <input
            type="checkbox"
            className="apply-disclaimer__check"
            checked={checked}
            onChange={e => setChecked(e.target.checked)}
          />
          <span>I have shared my contribution with the author in Google Drive</span>
        </label>

        <div className="profile-field">
          <label className="profile-field__label" htmlFor="submit-note">
            Contribution summary
          </label>
          <textarea
            id="submit-note"
            className="profile-field__textarea"
            rows={4}
            value={note}
            onChange={e => setNote(e.target.value)}
            placeholder="What did you do? Describe your contribution, any caveats, or what the author should look for…"
            maxLength={1500}
          />
        </div>

        <div className="submit-quant-log">
          <div className="submit-quant-log__label">
            Quantitative log <span className="field-optional">(optional)</span>
          </div>
          <div className="submit-quant-log__grid">
            {QUANT_FIELDS.map(f => (
              <div key={f.key} className="submit-quant-log__field">
                <label className="submit-quant-log__field-label" htmlFor={`quant-${f.key}`}>
                  {f.label}
                </label>
                <input
                  id={`quant-${f.key}`}
                  className="profile-field__input submit-quant-log__input"
                  type="number"
                  min="0"
                  value={quant[f.key] ?? ''}
                  onChange={e => setQuant(q => ({ ...q, [f.key]: e.target.value }))}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
        </div>

        {error && <p className="form-error">{error}</p>}
      </div>
    </Modal>
  )
}

// ─── Connected view (contact exchange) ───────────────────────────────────────

function daysRemaining(confirmedAtMs: number): number {
  const elapsed = Date.now() - confirmedAtMs
  return Math.max(0, 30 - Math.floor(elapsed / 86_400_000))
}

function ConnectedView({
  connection,
  userEmail,
  contactPrefs,
  externalDocLink,
  docShareLink,
  confirmedAtMs,
  revisionFeedback,
  status,
  onSubmit,
}: {
  connection: NonNullable<UserConn>
  userEmail: string
  contactPrefs?: ContactPrefs
  externalDocLink: string | null
  docShareLink: string | null
  confirmedAtMs: number | null
  revisionFeedback: string | null
  status: string
  onSubmit: () => void
}) {
  const defaults = contactFromPrefs(contactPrefs, userEmail)
  const [email, setEmail] = useState(defaults.email)
  const [whatsapp, setWhatsapp] = useState(defaults.whatsapp)
  const [other, setOther] = useState(defaults.other)
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(!!connection.contributor_contact)
  const [error, setError] = useState<string | null>(null)

  const ownerContact = connection.owner_contact

  function submitContact() {
    if (!email.trim() && !whatsapp.trim() && !other.trim()) {
      setError('Add at least one contact method.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const contact: Contact = {}
        if (email.trim()) contact.email = email.trim()
        if (whatsapp.trim()) contact.whatsapp = whatsapp.trim()
        if (other.trim()) contact.other = other.trim()
        await saveContributorContact(connection.id, contact)
        setSaved(true)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to save.')
      }
    })
  }

  const days = confirmedAtMs !== null ? daysRemaining(confirmedAtMs) : null

  const docLink = (docShareLink && /^https?:\/\//.test(docShareLink)) ? docShareLink
    : (!docShareLink && externalDocLink && /^https?:\/\//.test(externalDocLink)) ? externalDocLink
    : null

  return (
    <div className="connected-card">
      <ProgressSteps status={status} />

      {revisionFeedback && (
        <div className="connected-card__revision-feedback">
          <div className="connected-card__revision-label">↩ Revision requested</div>
          <p className="connected-card__revision-text">{revisionFeedback}</p>
        </div>
      )}

      {days !== null && (
        <div className={`connected-card__deadline${days <= 7 ? ' connected-card__deadline--urgent' : ''}`}>
          {days === 0 ? 'Deadline: today' : `${days} day${days === 1 ? '' : 's'} remaining`}
        </div>
      )}

      {saved ? (
        <>
          <button
            type="button"
            className="connected-card__action-btn"
            onClick={onSubmit}
          >
            Submit my contribution
          </button>

          {docLink && (
            <div className="connected-card__section connected-card__section--secondary">
              <div className="connected-card__section-title">Paper document</div>
              <a href={docLink} target="_blank" rel="noopener noreferrer" className="connected-card__doc-link">
                Open document →
              </a>
            </div>
          )}

          {ownerContact && (ownerContact.email || ownerContact.whatsapp || ownerContact.other) && (
            <div className="connected-card__section connected-card__section--secondary">
              <div className="connected-card__section-title">Author contact</div>
              {ownerContact.email && (
                <div className="connected-card__row">
                  <span>Email</span>
                  <span className="connected-card__contact-val">
                    {ownerContact.email}
                    <CopyButton text={ownerContact.email} />
                  </span>
                </div>
              )}
              {ownerContact.whatsapp && (
                <div className="connected-card__row"><span>WhatsApp</span><span>{ownerContact.whatsapp}</span></div>
              )}
              {ownerContact.other && (
                <div className="connected-card__row"><span>Other</span><span>{ownerContact.other}</span></div>
              )}
            </div>
          )}
        </>
      ) : (
        <>
          {docLink && (
            <div className="connected-card__section">
              <div className="connected-card__section-title">Paper document</div>
              <a href={docLink} target="_blank" rel="noopener noreferrer" className="connected-card__doc-link">
                Open document →
              </a>
            </div>
          )}

          {ownerContact ? (
            <div className="connected-card__section">
              <div className="connected-card__section-title">Author contact</div>
              {ownerContact.email && (
                <div className="connected-card__row">
                  <span>Email</span>
                  <span className="connected-card__contact-val">
                    {ownerContact.email}
                    <CopyButton text={ownerContact.email} />
                  </span>
                </div>
              )}
              {ownerContact.whatsapp && (
                <div className="connected-card__row"><span>WhatsApp</span><span>{ownerContact.whatsapp}</span></div>
              )}
              {ownerContact.other && (
                <div className="connected-card__row"><span>Other</span><span>{ownerContact.other}</span></div>
              )}
            </div>
          ) : (
            <p className="connected-card__waiting">Waiting for the author to share their contact details.</p>
          )}

          <div className="connected-card__contact-form">
            <div className="connected-card__section-title">How can the author reach you?</div>
            {(defaults.email || defaults.whatsapp || defaults.other) && (
              <p className="connected-card__prefill-note">Pre-filled from your profile — edit if needed.</p>
            )}
            <div className="profile-field">
              <label className="profile-field__label" htmlFor={`contact-email-${connection.id}`}>Email</label>
              <input
                id={`contact-email-${connection.id}`}
                className="profile-field__input connected-card__input"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                autoComplete="email"
              />
            </div>
            <div className="profile-field">
              <label className="profile-field__label" htmlFor={`contact-whatsapp-${connection.id}`}>
                WhatsApp <span className="field-optional">(optional)</span>
              </label>
              <input
                id={`contact-whatsapp-${connection.id}`}
                className="profile-field__input connected-card__input"
                type="tel"
                value={whatsapp}
                onChange={e => setWhatsapp(e.target.value)}
                autoComplete="tel"
              />
            </div>
            <div className="profile-field">
              <label className="profile-field__label" htmlFor={`contact-other-${connection.id}`}>
                Other <span className="field-optional">(optional)</span>
              </label>
              <input
                id={`contact-other-${connection.id}`}
                className="profile-field__input connected-card__input"
                value={other}
                onChange={e => setOther(e.target.value)}
              />
            </div>
            {error && <p className="form-error form-error--compact">{error}</p>}
            <button
              type="button"
              className="btn-primary connected-card__submit"
              onClick={submitContact}
              disabled={isPending}
            >
              {isPending ? 'Saving…' : 'Share my contact'}
            </button>
          </div>
        </>
      )}
    </div>
  )
}

// ─── Owner contact mini (for submitted state) ─────────────────────────────────

function OwnerContactMini({ contact }: { contact: Contact }) {
  if (!contact.email && !contact.whatsapp && !contact.other) return null
  return (
    <div className="connected-card__section connected-card__section--spaced">
      <div className="connected-card__section-title">Author contact</div>
      {contact.email && (
        <div className="connected-card__row"><span>Email</span><span>{contact.email}</span></div>
      )}
      {contact.whatsapp && (
        <div className="connected-card__row"><span>WhatsApp</span><span>{contact.whatsapp}</span></div>
      )}
      {contact.other && (
        <div className="connected-card__row"><span>Other</span><span>{contact.other}</span></div>
      )}
    </div>
  )
}
