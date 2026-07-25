'use client'
import { useState, useTransition } from 'react'
import Link from 'next/link'
import Modal from '@/components/Modal'
import CopyButton from '@/components/CopyButton'
import { contactFromPrefs, type ContactPrefs } from '@/lib/contact'
import { ROUTES } from '@/lib/routes'
import { rejectApplication, acceptApplication } from './actions'

interface Props {
  applicationId: string
  applicantName: string
  applicantEmail?: string
  userEmail: string
  paperId: string
  paperTitle: string
  stageId: string
  stageLabel: string
  contactPrefs?: ContactPrefs
}

export default function InboxActions({
  applicationId,
  applicantName,
  applicantEmail,
  userEmail,
  paperId,
  stageId,
  stageLabel,
  paperTitle,
  contactPrefs,
}: Props) {
  const [showConnect, setShowConnect] = useState(false)
  const [showReject, setShowReject] = useState(false)
  const [accepted, setAccepted] = useState(false)
  const [rejected, setRejected] = useState(false)

  if (rejected) {
    return <span className="app-status app-status--rejected">Not selected</span>
  }

  if (accepted) {
    const manageHref = ROUTES.paperManage(paperId, stageId)
    return (
      <div className="inbox-outcome--compact">
        <span className="app-status app-status--accepted">Accepted</span>
        {applicantEmail && (
          <div className="inbox-outcome__email">
            <span>{applicantEmail}</span>
            <CopyButton text={applicantEmail} />
          </div>
        )}
        <div className="inbox-outcome__links">
          <Link href={manageHref} className="work-card__link">Share document</Link>
          <Link href={ROUTES.message(applicationId)} className="work-card__link">Message</Link>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="inbox-app-actions">
        <button
          type="button"
          className="btn-ghost btn-ghost--compact"
          onClick={() => setShowReject(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" aria-hidden="true">
            <path d="M2 2 L10 10 M10 2 L2 10"/>
          </svg>
          Decline
        </button>
        <button
          type="button"
          className="btn-primary btn-primary--compact"
          onClick={() => setShowConnect(true)}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 12 12" width="12" height="12" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M1.5 6 L5 9.5 L10.5 3"/>
          </svg>
          Accept
        </button>
      </div>
      {showReject && (
        <RejectModal
          applicationId={applicationId}
          applicantName={applicantName}
          onClose={() => setShowReject(false)}
          onSuccess={() => { setShowReject(false); setRejected(true) }}
        />
      )}
      {showConnect && (
        <ConnectModal
          applicationId={applicationId}
          applicantName={applicantName}
          userEmail={userEmail}
          paperTitle={paperTitle}
          stageLabel={stageLabel}
          contactPrefs={contactPrefs}
          onClose={() => setShowConnect(false)}
          onSuccess={() => { setShowConnect(false); setAccepted(true) }}
        />
      )}
    </>
  )
}

function RejectModal({
  applicationId,
  applicantName,
  onClose,
  onSuccess,
}: {
  applicationId: string
  applicantName: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  function closeModal() {
    setIsClosing(true)
    setTimeout(() => { onClose() }, 150)
  }

  function confirmReject() {
    setError(null)
    startTransition(async () => {
      try {
        await rejectApplication(applicationId)
        onSuccess()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not decline.')
      }
    })
  }

  return (
    <Modal
      title="Decline application"
      onClose={closeModal}
      isClosing={isClosing}
      footer={(
        <div className="modal__footer">
          <button type="button" className="btn-ghost" onClick={closeModal} disabled={isPending}>Keep</button>
          <button type="button" className="btn-primary" onClick={confirmReject} disabled={isPending}>
            {isPending ? 'Declining…' : 'Decline'}
          </button>
        </div>
      )}
    >
      <div className="modal__body">
        <p className="modal-lead">
          Decline {applicantName}? They&apos;ll be notified. This can&apos;t be undone — the stage stays open for other applicants.
        </p>
        {error && <p className="form-error">{error}</p>}
      </div>
    </Modal>
  )
}

function ConnectModal({
  applicationId,
  applicantName,
  userEmail,
  paperTitle,
  stageLabel,
  contactPrefs,
  onClose,
  onSuccess,
}: {
  applicationId: string
  applicantName: string
  userEmail: string
  paperTitle: string
  stageLabel: string
  contactPrefs?: ContactPrefs
  onClose: () => void
  onSuccess: () => void
}) {
  const defaults = contactFromPrefs(contactPrefs, userEmail)
  const [email, setEmail] = useState(defaults.email)
  const [whatsapp, setWhatsapp] = useState(defaults.whatsapp)
  const [other, setOther] = useState(defaults.other)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [isClosing, setIsClosing] = useState(false)

  function closeModal() {
    setIsClosing(true)
    setTimeout(() => { onClose() }, 150)
  }

  function submit() {
    if (!email.trim() && !whatsapp.trim() && !other.trim()) {
      setError('Add at least one way they can reach you.')
      return
    }
    setError(null)
    startTransition(async () => {
      try {
        const contact: { email?: string; whatsapp?: string; other?: string } = {}
        if (email.trim()) contact.email = email.trim()
        if (whatsapp.trim()) contact.whatsapp = whatsapp.trim()
        if (other.trim()) contact.other = other.trim()
        await acceptApplication(applicationId, contact)
        onSuccess()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong.')
      }
    })
  }

  return (
    <Modal
      title={`Accept ${applicantName}`}
      onClose={closeModal}
      isClosing={isClosing}
      footer={(
        <div className="modal__footer">
          <button type="button" className="btn-ghost" onClick={closeModal} disabled={isPending}>Cancel</button>
          <button type="button" className="btn-primary" onClick={submit} disabled={isPending}>
            {isPending ? 'Accepting…' : 'Accept & share contact'}
          </button>
        </div>
      )}
    >
      <div className="modal__body">
        <dl className="commit-summary">
          <div className="commit-summary__row">
            <dt className="commit-summary__key">Accepting</dt>
            <dd className="commit-summary__val">{applicantName}</dd>
          </div>
          <div className="commit-summary__row">
            <dt className="commit-summary__key">For</dt>
            <dd className="commit-summary__val">{stageLabel} · {paperTitle}</dd>
          </div>
          <div className="commit-summary__row">
            <dt className="commit-summary__key">You'll share</dt>
            <dd className="commit-summary__val">
              {[
                email.trim() && 'email',
                whatsapp.trim() && 'WhatsApp',
                other.trim() && 'other contact',
              ].filter(Boolean).join(', ') || 'contact details below'}
            </dd>
          </div>
        </dl>
        <p className="modal-lead">
          {applicantName} will see your contact details and can start straight away. This stage stays open — you can accept other applicants too.
        </p>
        {(defaults.email || defaults.whatsapp || defaults.other) && (
          <p className="modal-prefill-note">Pre-filled from your profile — edit if needed.</p>
        )}
        <div className="profile-field">
          <label className="profile-field__label" htmlFor="connect-email">Email</label>
          <input id="connect-email" className="profile-field__input" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" type="email" />
        </div>
        <div className="profile-field">
          <label className="profile-field__label" htmlFor="connect-whatsapp">
            WhatsApp <span className="field-optional">(optional)</span>
          </label>
          <input id="connect-whatsapp" className="profile-field__input" value={whatsapp} onChange={e => setWhatsapp(e.target.value)} placeholder="+60 12 345 6789" />
        </div>
        <div className="profile-field">
          <label className="profile-field__label" htmlFor="connect-other">
            Other <span className="field-optional">(optional)</span>
          </label>
          <input id="connect-other" className="profile-field__input" value={other} onChange={e => setOther(e.target.value)} placeholder="Telegram, LinkedIn, etc." />
        </div>
        {error && <p className="form-error">{error}</p>}
      </div>
    </Modal>
  )
}
