'use client'
import Link from 'next/link'
import { useTransition, useState, useEffect, useRef } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { ROUTES } from '@/lib/routes'
import { updateProfile } from './actions'

interface Profile {
  job_title?: string | null
  institution?: string | null
  field_of_study?: string | null
  bio?: string | null
  orcid_id?: string | null
  orcid_verified?: boolean
  contact_prefs?: {
    email?: boolean
    whatsapp?: string
    other?: string
  } | null
  email_notifications?: boolean
}

export default function ProfileForm({ name, profile }: { name: string; profile: Profile | null }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [saved, setSaved] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [isDirty, setIsDirty] = useState(false)
  const timerRef = useRef<ReturnType<typeof setTimeout>>()
  const searchParams = useSearchParams()
  const orcidParam = searchParams.get('orcid')
  const cp = profile?.contact_prefs ?? {}
  const orcidLocked = !!profile?.orcid_verified

  useEffect(() => {
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [])

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    setSaved(false)
    setSaveError(null)
    startTransition(async () => {
      try {
        await updateProfile(formData)
        setSaved(true)
        setIsDirty(false)
        router.push(ROUTES.profileMe)
        router.refresh()
      } catch (err: unknown) {
        setSaveError(err instanceof Error ? err.message : 'Failed to save. Please try again.')
      }
    })
  }

  return (
    <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)}>

      {/* ── Identity ── */}
      <div className="profile-section">
        <div className="profile-section__title">Identity</div>
        <div className="profile-section__body">
          <div className="profile-field">
            <label className="profile-field__label" htmlFor="display_name">Full name</label>
            <input
              id="display_name"
              name="display_name"
              defaultValue={name}
              className="profile-field__input"
              placeholder="Dr. Jane Smith"
              maxLength={120}
            />
          </div>

          <div className="profile-field">
            <label className="profile-field__label" htmlFor="job_title">Position</label>
            <select
              id="job_title"
              name="job_title"
              defaultValue={profile?.job_title ?? ''}
              className="field-select"
            >
              <option value="">Select position…</option>
              <option value="phd_candidate">PhD Candidate</option>
              <option value="postdoc">Postdoctoral Researcher</option>
              <option value="research_officer">Research Officer</option>
              <option value="lecturer">Lecturer</option>
              <option value="senior_lecturer">Senior Lecturer</option>
              <option value="associate_professor">Associate Professor</option>
              <option value="professor">Professor</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="profile-field">
            <label className="profile-field__label" htmlFor="orcid_id">
              ORCID iD{' '}
              <span className="field-optional">(optional)</span>
            </label>
            {orcidLocked ? (
              <div className="orcid-locked-row">
                <input
                  id="orcid_id"
                  className="profile-field__input profile-field__input--locked"
                  value={profile?.orcid_id ?? ''}
                  readOnly
                />
                <span className="orcid-locked-badge">✓ Verified via ORCID</span>
              </div>
            ) : (
              <>
                <div className="orcid-unverified-row">
                  <input
                    id="orcid_id"
                    name="orcid_id"
                    defaultValue={profile?.orcid_id ?? ''}
                    className="profile-field__input"
                    placeholder="0000-0000-0000-0000"
                    maxLength={19}
                    pattern="\d{4}-\d{4}-\d{4}-\d{3}[\dX]"
                  />
                  <a href="/api/auth/orcid/link" className="orcid-verify-btn">
                    Verify with ORCID
                  </a>
                </div>
                {orcidParam === 'error' && (
                  <div className="sign-in-error" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>
                      Verification failed.{' '}
                      <a href="/api/auth/orcid/link" className="orcid-error-retry">
                        Try connecting again →
                      </a>
                    </span>
                  </div>
                )}
                {orcidParam === 'conflict' && (
                  <div className="sign-in-error" role="alert">
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
                      <circle cx="12" cy="12" r="10" />
                      <line x1="12" y1="8" x2="12" y2="12" />
                      <line x1="12" y1="16" x2="12.01" y2="16" />
                    </svg>
                    <span>
                      This ORCID iD is already linked to another account. Sign in with ORCID directly to access that account.
                    </span>
                  </div>
                )}
                <p className="paper-form-help">
                  Paste your ORCID iD, or click <strong>Verify with ORCID</strong> to confirm it directly through the ORCID website.
                </p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── Profile details ── */}
      <div className="profile-section">
        <div className="profile-section__title">Profile details</div>
        <div className="profile-section__body">
          <div className="profile-field">
            <label className="profile-field__label" htmlFor="institution">Institution / affiliation</label>
            <input
              id="institution"
              name="institution"
              defaultValue={profile?.institution ?? ''}
              className="profile-field__input"
              placeholder="e.g. Universiti Malaya"
              maxLength={120}
            />
          </div>
          <div className="profile-field">
            <label className="profile-field__label" htmlFor="field_of_study">Field of research</label>
            <input
              id="field_of_study"
              name="field_of_study"
              defaultValue={profile?.field_of_study ?? ''}
              className="profile-field__input"
              placeholder="e.g. Educational Technology"
              maxLength={120}
            />
          </div>
          <div className="profile-field">
            <label className="profile-field__label" htmlFor="bio">Bio</label>
            <textarea
              id="bio"
              name="bio"
              defaultValue={profile?.bio ?? ''}
              rows={3}
              className="profile-field__textarea"
              placeholder="Short bio visible on your public profile"
              maxLength={500}
            />
          </div>
        </div>
      </div>

      {/* ── Notifications ── */}
      <div className="profile-section">
        <div className="profile-section__title">Notifications</div>
        <div className="profile-section__body">
          <div className="profile-field">
            <label className="profile-checkbox-label">
              <input
                type="checkbox"
                name="email_notifications"
                defaultChecked={profile?.email_notifications !== false}
              />
              Email me about updates to my posts, applications, and collaborations
            </label>
          </div>
        </div>
      </div>

      {/* ── Contact preferences ── */}
      <div className="profile-section">
        <div className="profile-section__title">Contact preferences</div>
        <div className="profile-section__body">
          <p className="profile-contact-note">
            These details pre-fill when you accept or are accepted as a collaborator. Your contact details are only shared once a collaboration is confirmed.
          </p>
          <div className="profile-field">
            <label className="profile-checkbox-label">
              <input type="checkbox" name="contact_email" defaultChecked={!!cp.email} />
              Share my email address
            </label>
          </div>
          <div className="profile-field">
            <label className="profile-field__label" htmlFor="contact_whatsapp">
              WhatsApp number <span className="field-optional">(optional)</span>
            </label>
            <input
              id="contact_whatsapp"
              name="contact_whatsapp"
              defaultValue={cp.whatsapp ?? ''}
              className="profile-field__input"
              placeholder="+60 12-345 6789"
              maxLength={30}
            />
          </div>
          <div className="profile-field">
            <label className="profile-field__label" htmlFor="contact_other">
              Other contact method <span className="field-optional">(optional)</span>
            </label>
            <input
              id="contact_other"
              name="contact_other"
              defaultValue={cp.other ?? ''}
              className="profile-field__input"
              placeholder="e.g. Telegram: @username"
              maxLength={120}
            />
          </div>
        </div>
      </div>

      {/* ── Actions ── */}
      <div className="profile-actions">
        <button
          type="submit"
          disabled={isPending || !isDirty}
          className="profile-save-btn"
        >
          {isPending ? 'Saving…' : 'Save profile'}
        </button>
        <Link href={ROUTES.profileMe} className="btn-ghost btn-ghost--compact">
          Cancel
        </Link>
        {saved && (
          <span className="profile-save-status profile-save-status--success">✓ Saved</span>
        )}
        {saveError && (
          <span className="profile-save-status profile-save-status--error">{saveError}</span>
        )}
      </div>

    </form>
  )
}
