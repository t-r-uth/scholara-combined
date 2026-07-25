'use client'

import { useState, useTransition } from 'react'
import { setTrackerVisibility } from './actions'

export default function TrackerVisibilityToggle({
  paperId,
  initialVisible,
}: {
  paperId: string
  initialVisible: boolean
}) {
  const [visible, setVisible] = useState(initialVisible)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function handleChange(next: boolean) {
    setVisible(next)
    setError(null)
    startTransition(async () => {
      const result = await setTrackerVisibility(paperId, next)
      if (result.error) {
        setVisible(!next)
        setError(result.error)
      }
    })
  }

  return (
    <div className="tracker-visibility-toggle">
      <label className="profile-checkbox-label">
        <input
          type="checkbox"
          checked={visible}
          disabled={isPending}
          onChange={e => handleChange(e.target.checked)}
        />
        <span>Let accepted contributors see this paper&apos;s tracker</span>
      </label>
      {error && <p className="form-error form-error--compact">{error}</p>}
    </div>
  )
}
