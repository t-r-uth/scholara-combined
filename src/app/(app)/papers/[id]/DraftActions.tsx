'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import Modal from '@/components/Modal'
import { publishPaper, unpublishPaper, deletePaper } from '../new/actions'

export default function DraftActions({
  paperId,
  status,
  needsContributors,
}: {
  paperId: string
  status: 'draft' | 'published'
  needsContributors?: 'yes' | 'no'
}) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  const [deleteOpen, setDeleteOpen] = useState(false)
  const [deleteClosing, setDeleteClosing] = useState(false)
  const [reason, setReason] = useState('')
  const [deleteError, setDeleteError] = useState<string | null>(null)
  const [isDeleting, startDeleteTransition] = useTransition()

  function handlePublish() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await publishPaper(paperId)
        if (result.error) { setError(result.error); return }
        router.push(`/papers/${paperId}?published=1`)
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not publish.')
      }
    })
  }

  function handleUnpublish() {
    setError(null)
    startTransition(async () => {
      try {
        const result = await unpublishPaper(paperId)
        if (result.error) { setError(result.error); return }
        router.refresh()
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Could not make private.')
      }
    })
  }

  function closeDeleteModal() {
    setDeleteClosing(true)
    setTimeout(() => {
      setDeleteOpen(false)
      setDeleteClosing(false)
      setReason('')
      setDeleteError(null)
    }, 150)
  }

  function handleDelete() {
    setDeleteError(null)
    startDeleteTransition(async () => {
      try {
        const result = await deletePaper(paperId, reason)
        if (result.error) { setDeleteError(result.error); return }
        router.push('/work/papers')
      } catch (e) {
        setDeleteError(e instanceof Error ? e.message : 'Could not delete paper.')
      }
    })
  }

  const deleteModal = deleteOpen && (
    <Modal title="Delete this paper?" onClose={closeDeleteModal} isClosing={deleteClosing}>
      <div className="modal__body">
        <p className="modal-lead">
          This permanently deletes the paper and all its stages. If anyone has applied or is
          contributing, they&apos;ll be notified (in-app and by email) before anything is removed —
          add a short reason so they understand why.
        </p>
        <div className="profile-field">
          <label className="profile-field__label" htmlFor="delete-reason">
            Reason <span className="field-optional">(required if anyone has applied or is contributing)</span>
          </label>
          <textarea
            id="delete-reason"
            className="profile-field__textarea"
            rows={3}
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="e.g. Study cancelled, moving to a different platform, no longer proceeding…"
            maxLength={500}
            autoFocus
          />
        </div>
        {deleteError && <p className="form-error">{deleteError}</p>}
      </div>
      <div className="modal__footer">
        <button type="button" className="btn-ghost" onClick={closeDeleteModal} disabled={isDeleting}>
          Cancel
        </button>
        <button type="button" className="btn-primary" onClick={handleDelete} disabled={isDeleting}>
          {isDeleting ? 'Deleting…' : 'Delete paper'}
        </button>
      </div>
    </Modal>
  )

  if (status === 'published') {
    return (
      <div className="paper-draft-actions">
        <div className="paper-draft-actions__btns">
          <Link href={`/papers/new?edit=${paperId}`} className="btn-ghost btn-ghost--compact">
            Edit
          </Link>
          <button
            type="button"
            className="btn-ghost btn-ghost--compact"
            onClick={handleUnpublish}
            disabled={isPending}
          >
            {isPending ? 'Making private…' : 'Make private'}
          </button>
          <button
            type="button"
            className="btn-ghost btn-ghost--compact"
            style={{ color: 'var(--text-error)' }}
            onClick={() => setDeleteOpen(true)}
          >
            Delete
          </button>
        </div>
        {error && <p className="form-error form-error--compact">{error}</p>}
        {deleteModal}
      </div>
    )
  }

  return (
    <div className="paper-draft-actions">
      <span className="paper-pill pill-inst paper-detail__draft-badge">
        Draft — not visible in Discover
      </span>
      <div className="paper-draft-actions__btns">
        <Link href={`/papers/new?edit=${paperId}`} className="btn-ghost btn-ghost--compact">
          Edit draft
        </Link>
        {needsContributors !== 'no' && (
          <button
            type="button"
            className="btn-publish btn-primary--compact"
            onClick={handlePublish}
            disabled={isPending}
          >
            {isPending ? 'Publishing…' : 'Publish'}
          </button>
        )}
        <button
          type="button"
          className="btn-ghost btn-ghost--compact"
          style={{ color: 'var(--text-error)' }}
          onClick={() => setDeleteOpen(true)}
        >
          Delete
        </button>
      </div>
      {needsContributors === 'no' && (
        <p className="paper-form-help">
          Not seeking contributors right now, so this stays private. Edit the draft and switch to
          &quot;I need contributors&quot; to publish it.
        </p>
      )}
      {error && <p className="form-error form-error--compact">{error}</p>}
      {deleteModal}
    </div>
  )
}
