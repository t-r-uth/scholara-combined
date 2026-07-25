'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import CopyButton from '@/components/CopyButton'
import { ROUTES } from '@/lib/routes'
import { COLLABORATION_OWNER_NEXT_STEPS } from '@/lib/labels'
import { markSubstantial, markNotSubstantial, requestRevision, shareDocument } from './actions'

const QUANT_LABELS = [
  { key: 'words_added',      label: 'Words added' },
  { key: 'words_removed',    label: 'Words removed' },
  { key: 'refs_added',       label: 'References added' },
  { key: 'tables_added',     label: 'Tables added' },
  { key: 'figures_added',    label: 'Figures added' },
  { key: 'code_files_added', label: 'Code files added' },
]

type Contribution = {
  id: string
  application_id: string
  status: 'in_progress' | 'interest_confirmed' | 'document_shared' | 'contribution_confirmed' | 'submitted' | 'substantial' | 'not_substantial' | 'revision_requested' | 'expired' | 'completed'
  revision_count: number
  author_decision: string | null
  contributor: {
    name?: string
    affiliation?: string
    email?: string
    orcid_id?: string | null
    orcid_verified?: boolean
  }
  summary: string | null
  submission_url: string | null
  quant_log: Record<string, number> | null
  revision_feedback: string | null
  author_note: string | null
  doc_share_link: string | null
}

export default function ContributionManager({
  contribution,
}: {
  contribution: Contribution
}) {
  const [status, setStatus]         = useState(contribution.status)
  const [revisionCount, setRevisionCount] = useState(contribution.revision_count)
  const [isPending, startTransition] = useTransition()
  const [error, setError]           = useState<string | null>(null)

  // Decision panel state
  const [decision, setDecision]     = useState<'substantial' | 'not_substantial' | 'revision' | null>(null)
  const [notSubNote, setNotSubNote] = useState('')
  const [revisionNote, setRevisionNote] = useState('')

  // Doc share state
  const [docLink, setDocLink]       = useState(contribution.doc_share_link ?? '')
  const [docChecked, setDocChecked] = useState(false)
  const [docError, setDocError]     = useState<string | null>(null)

  const awaitingInterest = status === 'in_progress'  // contributor hasn't confirmed interest yet
  const canShareDoc = status === 'interest_confirmed'  // contributor confirmed — ready for the doc
  const docShared = !awaitingInterest && !canShareDoc  // doc is shared once status advances past that

  const name  = contribution.contributor.name ?? 'Contributor'
  const email = contribution.contributor.email
  const initials = name.split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase() || '?'

  function handleShareDoc() {
    setDocError(null)
    if (!docLink.trim()) { setDocError('Paste a Google Doc link.'); return }
    if (!docChecked)     { setDocError('Tick the checkbox to confirm you\'ve shared the document.'); return }
    startTransition(async () => {
      try {
        await shareDocument(contribution.id, docLink)
        setStatus('document_shared')
      } catch (e) {
        setDocError(e instanceof Error ? e.message : 'Could not save.')
      }
    })
  }

  function handleMarkSubstantial() {
    setError(null)
    startTransition(async () => {
      try {
        await markSubstantial(contribution.id)
        setStatus('substantial')
        setDecision(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save.')
      }
    })
  }

  function handleMarkNotSubstantial() {
    setError(null)
    startTransition(async () => {
      try {
        await markNotSubstantial(contribution.id, notSubNote)
        setStatus('not_substantial')
        setDecision(null)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not save.')
      }
    })
  }

  function handleRequestRevision() {
    if (!revisionNote.trim()) { setError('Add a note explaining what still needs to be done.'); return }
    setError(null)
    startTransition(async () => {
      try {
        await requestRevision(contribution.id, revisionNote)
        setStatus('revision_requested')
        setRevisionCount(r => r + 1)
        setDecision(null)
        setRevisionNote('')
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not request revision.')
      }
    })
  }

  return (
    <div className="contribution-manager">

      {/* Contributor header */}
      <div className="contribution-manager__contributor">
        <div className="contribution-manager__avatar">{initials}</div>
        <div>
          <div className="contribution-manager__name">{name}</div>
          {contribution.contributor.affiliation && (
            <div className="contribution-manager__inst">{contribution.contributor.affiliation}</div>
          )}
          {contribution.contributor.orcid_id ? (
            <div className="contribution-manager__orcid">
              ORCID {contribution.contributor.orcid_id}
              {contribution.contributor.orcid_verified
                ? <span className="profile-identity__orcid-verified">Verified</span>
                : <span className="profile-identity__orcid-unverified">Unverified</span>
              }
            </div>
          ) : (
            <div className="contribution-manager__orcid contribution-manager__orcid--missing">No ORCID linked</div>
          )}
        </div>
      </div>

      {/* Step 5 — share Google Doc with this contributor */}
      {awaitingInterest ? (
        <div className="doc-share-panel">
          <p className="doc-share-panel__instruction">
            Waiting for the contributor to confirm they&apos;d like to proceed. You&apos;ll be able to share the working document once they do.
          </p>
        </div>
      ) : docShared ? (
        <div className="doc-share-panel doc-share-panel--shared">
          <div className="doc-share-panel__shared-label">✓ Working document shared</div>
          {email && (
            <div className="doc-share-panel__recipient">
              <span className="doc-share-panel__recipient-label">Grant access to</span>
              <span className="doc-share-panel__recipient-email">{email}</span>
              <CopyButton text={email} />
            </div>
          )}
          <a
            href={contribution.doc_share_link ?? docLink}
            target="_blank"
            rel="noopener noreferrer"
            className="doc-share-panel__link"
          >
            Open document →
          </a>
          <div className="next-step-panel next-step-panel--compact">
            <p className="next-step-panel__text">{COLLABORATION_OWNER_NEXT_STEPS.afterDocShare}</p>
          </div>
        </div>
      ) : (
        <div className="doc-share-panel">
          {email && (
            <div className="doc-share-panel__recipient">
              <span className="doc-share-panel__recipient-label">Share with</span>
              <span className="doc-share-panel__recipient-email">{email}</span>
              <CopyButton text={email} />
            </div>
          )}
          <p className="doc-share-panel__instruction">
            Share your Google Doc with this contributor&apos;s email in Google Drive (set to Can view or Can comment), then paste the link below.
          </p>
          <label className="profile-field__label" htmlFor={`doc-share-link-${contribution.id}`}>
            Shared document link
          </label>
          <input
            id={`doc-share-link-${contribution.id}`}
            className="profile-field__input doc-share-panel__input"
            type="url"
            value={docLink}
            onChange={e => setDocLink(e.target.value)}
            placeholder="https://docs.google.com/…"
          />
          <label className="doc-share-panel__check-row">
            <input
              type="checkbox"
              checked={docChecked}
              onChange={e => setDocChecked(e.target.checked)}
            />
            <span>I have shared the document with this contributor in Google Drive</span>
          </label>
          {docError && <p className="form-error form-error--compact">{docError}</p>}
          <button
            type="button"
            className="btn-primary btn-primary--compact"
            onClick={handleShareDoc}
            disabled={isPending}
          >
            {isPending ? 'Saving…' : 'Save & notify contributor'}
          </button>
        </div>
      )}

      {/* Waiting for contributor to confirm */}
      {status === 'document_shared' && (
        <div className="contrib-state__waiting">
          Waiting for contributor to confirm their role
        </div>
      )}

      {/* In progress (working) */}
      {status === 'contribution_confirmed' && (
        <div className="contrib-state">
          <div className="contrib-state__active">In progress</div>
        </div>
      )}

      {/* Revision requested — awaiting resubmission */}
      {status === 'revision_requested' && (
        <div className="contrib-state">
          <div className="contrib-state__revision-pending">
            Revision requested · awaiting resubmission
          </div>
          <div className="contrib-state__revision-count">
            {revisionCount} / 2 revisions used
          </div>
        </div>
      )}

      {/* Submitted — three-decision review panel */}
      {status === 'submitted' && (
        <div className="contrib-state">
          <div className="contrib-state__submitted">Submission received</div>

          {/* Contribution doc link */}
          {contribution.submission_url && (
            <div className="contrib-state__submission-note">
              <span className="contrib-state__submission-label">Link</span>
              <a
                href={contribution.submission_url}
                target="_blank"
                rel="noopener noreferrer"
                className="contrib-state__submission-link"
              >
                Open contribution doc →
              </a>
            </div>
          )}

          {/* Summary */}
          {contribution.summary && (
            <div className="contrib-state__submission-note">
              <span className="contrib-state__submission-label">Summary</span>
              <span>{contribution.summary}</span>
            </div>
          )}

          {/* Quantitative log */}
          {contribution.quant_log && Object.keys(contribution.quant_log).length > 0 && (
            <div className="contrib-state__quant-log">
              <div className="contrib-state__submission-label">Quantitative log</div>
              <div className="contrib-state__quant-grid">
                {QUANT_LABELS.filter(f => (contribution.quant_log![f.key] ?? 0) > 0).map(f => (
                  <div key={f.key} className="contrib-state__quant-item">
                    <span className="contrib-state__quant-value">{contribution.quant_log![f.key]}</span>
                    <span className="contrib-state__quant-label">{f.label}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decision panel */}
          {decision === null && (
            <div className="review-decision">
              <div className="review-decision__label">Your decision</div>
              <div className="review-decision__actions">
                <button
                  type="button"
                  className="review-decision__btn review-decision__btn--substantial"
                  onClick={() => setDecision('substantial')}
                  disabled={isPending}
                >
                  Mark as substantial
                </button>
                <button
                  type="button"
                  className="review-decision__btn review-decision__btn--not-substantial"
                  onClick={() => setDecision('not_substantial')}
                  disabled={isPending}
                >
                  Mark as not substantial
                </button>
                <button
                  type="button"
                  className={`review-decision__btn review-decision__btn--revision${revisionCount >= 2 ? ' review-decision__btn--disabled' : ''}`}
                  onClick={() => revisionCount < 2 && setDecision('revision')}
                  disabled={isPending || revisionCount >= 2}
                  title={revisionCount >= 2 ? 'Maximum 2 revisions allowed' : undefined}
                >
                  Request revision
                  {revisionCount > 0 && <span className="review-decision__revision-count">{revisionCount}/2</span>}
                </button>
              </div>
            </div>
          )}

          {/* Substantial confirmation */}
          {decision === 'substantial' && (
            <div className="review-confirm review-confirm--substantial">
              <p className="review-confirm__text">
                This will notify both you and the contributor that the contribution has been marked as substantial. Co-authorship should be discussed directly — this platform does not mediate authorship agreements.
              </p>
              <div className="review-confirm__actions">
                <button type="button" className="btn-ghost btn-ghost--compact" onClick={() => setDecision(null)} disabled={isPending}>Cancel</button>
                <button type="button" className="btn-publish btn-primary--compact" onClick={handleMarkSubstantial} disabled={isPending}>
                  {isPending ? 'Saving…' : 'Confirm — mark as substantial'}
                </button>
              </div>
            </div>
          )}

          {/* Not substantial panel */}
          {decision === 'not_substantial' && (
            <div className="review-confirm review-confirm--not-substantial">
              <div className="profile-field">
                <label className="profile-field__label" htmlFor={`not-sub-note-${contribution.id}`}>
                  Note for contributor <span className="field-optional">(optional)</span>
                </label>
                <textarea
                  id={`not-sub-note-${contribution.id}`}
                  className="profile-field__textarea"
                  rows={2}
                  value={notSubNote}
                  onChange={e => setNotSubNote(e.target.value)}
                  placeholder="Explain why the contribution wasn't substantial, or what was missing…"
                  maxLength={500}
                  autoFocus
                />
              </div>
              <div className="review-confirm__actions">
                <button type="button" className="btn-ghost btn-ghost--compact" onClick={() => setDecision(null)} disabled={isPending}>Cancel</button>
                <button type="button" className="btn-primary btn-primary--compact" onClick={handleMarkNotSubstantial} disabled={isPending}>
                  {isPending ? 'Saving…' : 'Confirm — not substantial'}
                </button>
              </div>
            </div>
          )}

          {/* Revision request panel */}
          {decision === 'revision' && (
            <div className="review-confirm review-confirm--revision">
              <div className="profile-field">
                <label className="profile-field__label" htmlFor={`revision-note-${contribution.id}`}>
                  What still needs to be done?
                </label>
                <textarea
                  id={`revision-note-${contribution.id}`}
                  className="profile-field__textarea"
                  rows={3}
                  value={revisionNote}
                  onChange={e => setRevisionNote(e.target.value)}
                  placeholder="Be specific — the contributor needs clear guidance to resubmit successfully…"
                  maxLength={500}
                  autoFocus
                />
              </div>
              <p className="review-confirm__hint">The contributor&apos;s 30-day window resets from today. ({revisionCount + 1} / 2 revisions)</p>
              <div className="review-confirm__actions">
                <button type="button" className="btn-ghost btn-ghost--compact" onClick={() => setDecision(null)} disabled={isPending}>Cancel</button>
                <button type="button" className="btn-primary btn-primary--compact" onClick={handleRequestRevision} disabled={isPending || !revisionNote.trim()}>
                  {isPending ? 'Sending…' : 'Send revision request'}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Completed — substantial */}
      {status === 'substantial' && (
        <div className="contrib-state">
          <div className="contrib-state__completed">✓ Substantial contribution</div>
          <p className="contrib-state__coauth-note">
            Co-authorship flagged — to be agreed directly between both parties.
          </p>
        </div>
      )}

      {/* Completed — not substantial */}
      {status === 'not_substantial' && (
        <div className="contrib-state">
          <div className="contrib-state__completed">✓ Contribution received</div>
          <div className="contrib-state__declined">Not substantial</div>
          {contribution.author_note && (
            <p className="contrib-state__coauth-note">{contribution.author_note}</p>
          )}
        </div>
      )}

      {/* Expired */}
      {status === 'expired' && (
        <div className="contrib-state">
          <div className="contrib-state__expired">Slot expired — contributor did not submit in time</div>
        </div>
      )}

      {error && <p className="contrib-state__error">{error}</p>}

      <Link href={ROUTES.message(contribution.application_id)} className="messages-open-link">
        Open messages →
      </Link>
    </div>
  )
}
