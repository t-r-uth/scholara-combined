'use client'
import { useState, useTransition } from 'react'
import Modal from '@/components/Modal'
import { submitReport } from '@/app/(app)/papers/[id]/actions'

interface Props {
  targetType: 'paper' | 'user'
  targetId: string
}

export default function ReportButton({ targetType, targetId }: Props) {
  const [open, setOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [reason, setReason] = useState('')
  const [done, setDone] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function closeModal() {
    setIsClosing(true)
    setTimeout(() => {
      setOpen(false)
      setIsClosing(false)
      setDone(false)
      setReason('')
    }, 150)
  }

  function submit() {
    setError(null)
    startTransition(async () => {
      try {
        await submitReport(targetType, targetId, reason)
        setDone(true)
        setTimeout(() => closeModal(), 1500)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to submit.')
      }
    })
  }

  return (
    <>
      <button type="button" className="report-btn" onClick={() => setOpen(true)}>
        Flag
      </button>

      {open && (
        <Modal
          title={`Report ${targetType}`}
          onClose={closeModal}
          isClosing={isClosing}
          footer={done ? undefined : (
            <div className="modal__footer">
              <button type="button" className="btn-ghost" onClick={closeModal} disabled={isPending}>Cancel</button>
              <button type="button" className="btn-primary" onClick={submit} disabled={isPending || !reason.trim()}>
                {isPending ? 'Submitting…' : 'Submit report'}
              </button>
            </div>
          )}
        >
          {done ? (
            <div className="modal__body modal__body--center">
              <div className="modal-success-icon">✓</div>
              <p className="modal-success-text">Report submitted. Thank you.</p>
            </div>
          ) : (
            <div className="modal__body">
              <p className="modal-lead">
                Help keep Scholara trustworthy. Briefly describe the issue.
              </p>
              <div className="profile-field">
                <label className="profile-field__label" htmlFor="report-reason">Reason</label>
                <textarea
                  id="report-reason"
                  className="profile-field__textarea"
                  rows={3}
                  value={reason}
                  onChange={e => setReason(e.target.value)}
                  placeholder="Spam, misleading content, inappropriate behaviour…"
                  maxLength={500}
                  autoFocus
                />
              </div>
              {error && <p className="form-error">{error}</p>}
            </div>
          )}
        </Modal>
      )}
    </>
  )
}
