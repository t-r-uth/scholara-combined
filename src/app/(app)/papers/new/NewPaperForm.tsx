'use client'
import { useState, useTransition, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { createPaper, updatePaper } from './actions'
import {
  STUDY_TYPE_LABELS,
  CONTRIBUTIONS_BY_STUDY_TYPE,
  CONTRIBUTION_LABELS,
  STAGE_LABELS,
  CONTRIBUTION_PILL_CLASS,
  DATASET_SIZE_LABELS,
  AUTHORSHIP_OFFER_LABELS,
  AUTHORSHIP_OFFER_HINTS,
  AUTHORSHIP_ORDER_LABELS,
  CONTRIBUTION_HINTS,
  SCOPE_DETAIL_LABELS,
  ACCESS_LABELS,
  TRACKING_STAGES,
  TRACKING_STAGE_LABELS,
  type TrackingStage,
} from '@/lib/labels'

function formatDeliveryDate(value: string): string {
  if (!value) return ''
  const [year, month, day] = value.split('-').map(Number)
  if (!year || !month || !day) return value
  return new Date(year, month - 1, day).toLocaleDateString('en-GB', {
    day: 'numeric', month: 'long', year: 'numeric',
  })
}

type Stage = { type: string; description: string }

interface FormState {
  teaser_title: string
  full_title: string
  description: string
  full_abstract: string
  abstract_visibility: 'accepted_only' | 'public' | 'teaser_only'
  teaser_description: string
  external_doc_link: string
  scope: string
  study_type: string
  dataset_size: string
  access_type: 'open' | 'institution' | 'invite'
  allowed_institutions: string
  stages: Stage[]
  authorship_offer: string
  authorship_order: string
  target_journal: string
  submission_timeline: string
  additional_terms: string
  post_submission_support: boolean
  tracker_visible_to_contributors: boolean
  tracking_stage: TrackingStage
  needs_contributors: 'yes' | 'no'
}

const STUDY_TYPES = Object.entries(STUDY_TYPE_LABELS).map(([value, label]) => ({ value, label }))

const ALL_CONTRIBUTION_TYPES = Array.from(
  new Set(Object.values(CONTRIBUTIONS_BY_STUDY_TYPE).flat())
).map(value => ({ value, label: CONTRIBUTION_LABELS[value] ?? value }))

function getContributionTypes(studyType: string) {
  if (!studyType || !CONTRIBUTIONS_BY_STUDY_TYPE[studyType]) return ALL_CONTRIBUTION_TYPES
  return CONTRIBUTIONS_BY_STUDY_TYPE[studyType].map(value => ({
    value,
    label: CONTRIBUTION_LABELS[value] ?? value,
  }))
}


const SCOPES = [
  { value: 'global', label: 'Global' },
  { value: 'regional', label: 'Regional' },
  { value: 'country', label: 'Country-level' },
]

const DATASET_SIZES = [
  { value: 'small', label: 'Small (e.g. under 100 samples/records)' },
  { value: 'medium', label: 'Medium (e.g. 100–1,000 samples/records)' },
  { value: 'large', label: 'Large (e.g. 1,000–10,000 samples/records)' },
  { value: 'very_large', label: 'Very large (e.g. 10,000+ samples/records)' },
  { value: 'not_applicable', label: 'Not applicable' },
]

const STEPS = ['Paper', 'Stages', 'Access & visibility', 'Co-authorship', 'Private details', 'Preview']

const DEFAULT_AUTHORSHIP_ORDER = 'discussed'

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error'

type InitialPaper = FormState & { id: string; status: 'draft' | 'published' }

export default function NewPaperForm({ initial }: { initial?: InitialPaper }) {
  const router = useRouter()
  const isEditing = !!initial
  const isPublished = initial?.status === 'published'
  const [step, setStep] = useState(1)
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const draftId = useRef<string | null>(initial?.id ?? null)
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle')
  const [autoSaveError, setAutoSaveError] = useState<string | null>(null)
  const [disclaimerChecked, setDisclaimerChecked] = useState(false)
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const idleTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isSavingRef = useRef(false)
  const skipFirstAutosave = useRef(isEditing)

  const [form, setForm] = useState<FormState>(() => {
    if (initial) {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { id: _id, status: _status, ...rest } = initial
      return {
        ...rest,
        post_submission_support: rest.post_submission_support ?? false,
        tracker_visible_to_contributors: rest.tracker_visible_to_contributors ?? false,
        tracking_stage: rest.tracking_stage ?? 'idea',
        needs_contributors: rest.needs_contributors ?? (rest.stages?.length > 0 ? 'yes' : 'no'),
      }
    }
    return {
      teaser_title: '',
      full_title: '',
      description: '',
      full_abstract: '',
      abstract_visibility: 'accepted_only',
      teaser_description: '',
      external_doc_link: '',
      scope: '',
      study_type: '',
      dataset_size: '',
      access_type: 'open',
      allowed_institutions: '',
      stages: [],
      authorship_offer: '',
      authorship_order: '',
      target_journal: '',
      submission_timeline: '',
      additional_terms: '',
      post_submission_support: false,
      tracker_visible_to_contributors: false,
      tracking_stage: 'idea',
      needs_contributors: 'yes',
    }
  })

  useEffect(() => {
    if (skipFirstAutosave.current) {
      skipFirstAutosave.current = false
      return
    }
    if (!form.teaser_title.trim()) return
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    autoSaveTimer.current = setTimeout(async () => {
      if (isSavingRef.current) return
      isSavingRef.current = true
      setSaveStatus('saving')
      try {
        let result: { error?: string }
        if (draftId.current) {
          result = await updatePaper(draftId.current, { ...form })
        } else {
          const created = await createPaper({ ...form, status: 'draft' })
          if (created.id) draftId.current = created.id
          result = created
        }
        if (result.error) {
          setAutoSaveError(result.error)
          setSaveStatus('error')
        } else {
          setAutoSaveError(null)
          setSaveStatus('saved')
          if (idleTimer.current) clearTimeout(idleTimer.current)
          idleTimer.current = setTimeout(() => setSaveStatus('idle'), 2500)
        }
      } catch (e) {
        setAutoSaveError(e instanceof Error ? e.message : null)
        setSaveStatus('error')
      } finally {
        isSavingRef.current = false
      }
    }, 1500)
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
      if (idleTimer.current) clearTimeout(idleTimer.current)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form])

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    if (key === 'study_type' && typeof value === 'string') {
      const allowed = new Set(
        value && CONTRIBUTIONS_BY_STUDY_TYPE[value]
          ? CONTRIBUTIONS_BY_STUDY_TYPE[value]
          : ALL_CONTRIBUTION_TYPES.map(t => t.value),
      )
      setForm(f => ({
        ...f,
        study_type: value,
        stages: f.stages.filter(s => allowed.has(s.type)),
      }))
      return
    }
    if (key === 'authorship_offer' && typeof value === 'string') {
      setForm(f => ({
        ...f,
        authorship_offer: value,
        authorship_order: f.authorship_order || DEFAULT_AUTHORSHIP_ORDER,
      }))
      return
    }
    if (key === 'needs_contributors' && value === 'no') {
      // Not recruiting — clear the fields that only matter for finding contributors,
      // so nothing stale carries through if they flip back to "yes" later.
      setForm(f => ({
        ...f,
        needs_contributors: 'no',
        stages: [],
        authorship_offer: '',
        authorship_order: '',
        additional_terms: '',
      }))
      return
    }
    setForm(f => ({ ...f, [key]: value }))
  }

  function toggleStage(stageName: string) {
    setForm(f => {
      const exists = f.stages.some(s => s.type === stageName)
      return {
        ...f,
        stages: exists
          ? f.stages.filter(s => s.type !== stageName)
          : [...f.stages, { type: stageName, description: '' }],
      }
    })
  }

  function setStageDescription(stageName: string, description: string) {
    setForm(f => ({
      ...f,
      stages: f.stages.map(s => s.type === stageName ? { ...s, description } : s),
    }))
  }

  function validateStep(): string | null {
    const recruiting = form.needs_contributors === 'yes'
    if (step === 1) {
      if (!form.teaser_title.trim()) return 'Public title is required.'
      if (recruiting && !form.study_type) return 'Select a study type — it tailors the stages you can offer.'
    }
    if (step === 2 && recruiting && form.stages.length === 0) return 'Select at least one contribution stage.'
    if (step === 3 && form.access_type === 'institution' && !form.allowed_institutions.trim()) {
      return 'List at least one allowed institution.'
    }
    if (recruiting && (step === 4 || step === 5 || step === 6)) {
      if (!form.authorship_offer) return 'Choose how credit works.'
      if (!form.authorship_order) return 'Choose author order.'
    }
    if (step === 5 || step === 6) {
      if (!form.full_title.trim()) return 'Full title is required.'
      if (form.abstract_visibility !== 'teaser_only' && !form.full_abstract.trim()) return 'Abstract is required.'
    }
    return null
  }

  function goToStep(n: number) {
    setError(null)
    setStep(n)
  }

  function next() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError(null)
    setStep(s => s + 1)
  }

  // "I need contributors" / "Not right now" is the single source of truth for
  // public vs. private — no separate manual publish/draft choice.
  function submit() {
    const err = validateStep()
    if (err) { setError(err); return }
    setError(null)
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current)
    if (idleTimer.current) clearTimeout(idleTimer.current)
    const status = form.needs_contributors === 'no' ? 'draft' : 'published'
    startTransition(async () => {
      try {
        if (draftId.current) {
          const result = await updatePaper(draftId.current, { ...form, status })
          if (result.error) { setError(result.error); return }
          router.push(`/papers/${draftId.current}`)
        } else {
          const result = await createPaper({ ...form, status })
          if (result.error) { setError(result.error); return }
          router.push(`/papers/${result.id}`)
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Something went wrong. Please try again.')
      }
    })
  }

  return (
    <div className="paper-form-page">
      <p className="page-eyebrow">
        {isPublished ? 'Edit listing' : isEditing ? 'Edit draft' : 'New paper'}
      </p>
      <h1 className="page-title">
        {isPublished ? 'Edit paper' : isEditing ? 'Continue your draft' : 'Add a paper'}
      </h1>
      <p className="page-subtitle paper-form-page__intro">
        {isPublished
          ? 'Changes are saved to your live listing on Discover.'
          : isEditing
            ? "Private until you publish — update the details, then publish when you're ready for Discover."
            : "Track it privately on your own, or publish later to find collaborators — nothing is shown on Discover until you do."}
      </p>

      {saveStatus !== 'idle' && (
        <p className="paper-form-autosave">
          {saveStatus === 'saving' && (isPublished ? 'Saving…' : 'Saving draft…')}
          {saveStatus === 'saved' && (isPublished ? 'Saved' : 'Draft saved')}
          {saveStatus === 'error' && (autoSaveError ?? 'Auto-save failed')}
        </p>
      )}

      <div className="paper-form-stepper">
        {STEPS.map((label, idx) => {
          const n = idx + 1
          const isActive = step === n
          const isDone = step > n
          return (
            <div key={n} style={{ display: 'flex', alignItems: 'center', flex: n < STEPS.length ? '1' : undefined }}>
              <div className={`paper-form-step ${isActive ? 'paper-form-step--active' : ''} ${isDone ? 'paper-form-step--done' : ''}`}>
                <div className="paper-form-step__num">
                  {isDone ? '✓' : n}
                </div>
                <span className="paper-form-step__label">{label}</span>
              </div>
              {n < STEPS.length && <div className="paper-form-step__connector" />}
            </div>
          )
        })}
      </div>

      {/* ── Step 1: Paper ── */}
      {step === 1 && (
        <>
          <div className="paper-form-heading">About the paper</div>
          <p className="paper-form-sub">
            The basics researchers see on Discover. You&apos;ll set access and private details in later steps.
          </p>

          <div className="paper-form-card">
            <div className="paper-form-card__label">Listing details</div>
            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-teaser_title">
                Public title <span className="field-required">*</span>
              </label>
              <input
                id="np-teaser_title"
                className="profile-field__input"
                value={form.teaser_title}
                onChange={e => set('teaser_title', e.target.value)}
                placeholder="How this paper will appear in Discover"
                maxLength={200}
              />
            </div>
            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-description">
                Description <span className="field-optional">(optional)</span>
              </label>
              <textarea
                id="np-description"
                className="profile-field__textarea"
                rows={3}
                value={form.description}
                onChange={e => set('description', e.target.value)}
                placeholder="What the paper is about, and what help you need"
                maxLength={1500}
              />
            </div>
            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-study_type">
                Study type <span className="field-required">*</span>
              </label>
              <select
                id="np-study_type"
                className="field-select"
                value={form.study_type}
                onChange={e => set('study_type', e.target.value)}
              >
                <option value="">Select study type…</option>
                {STUDY_TYPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <p className="paper-form-help">Tailors the contribution stages you can offer next.</p>
            </div>
            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-scope">Geographic scope</label>
              <select
                id="np-scope"
                className="field-select"
                value={form.scope}
                onChange={e => set('scope', e.target.value)}
              >
                <option value="">Select scope…</option>
                {SCOPES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-dataset_size">Dataset size</label>
              <select
                id="np-dataset_size"
                className="field-select"
                value={form.dataset_size}
                onChange={e => set('dataset_size', e.target.value)}
              >
                <option value="">Select dataset size…</option>
                {DATASET_SIZES.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <label className="field-choice field-choice--checkbox">
              <input
                type="checkbox"
                className="field-choice__input"
                checked={form.post_submission_support}
                onChange={e => set('post_submission_support', e.target.checked)}
              />
              <span className="field-choice__body">
                <span className="field-choice__label">Post-submission support <span className="field-optional">(optional)</span></span>
                <span className="field-choice__hint">Tick if you may need help after the paper is submitted or under review</span>
              </span>
            </label>
          </div>

          <div className="paper-form-card">
            <div className="paper-form-card__label">Progress &amp; collaboration</div>
            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-tracking_stage">What stage is this paper at?</label>
              <select
                id="np-tracking_stage"
                className="field-select"
                value={form.tracking_stage}
                onChange={e => set('tracking_stage', e.target.value as FormState['tracking_stage'])}
              >
                {TRACKING_STAGES.map(s => <option key={s} value={s}>{TRACKING_STAGE_LABELS[s]}</option>)}
              </select>
              <p className="paper-form-help">This is where it&apos;ll sit on your Paper Tracker board — you can always drag it later.</p>
            </div>
            <div className="access-type-group">
              <label
                className={`access-type-option${form.needs_contributors === 'yes' ? ' access-type-option--active' : ''}`}
              >
                <input
                  type="radio"
                  name="needs_contributors"
                  checked={form.needs_contributors === 'yes'}
                  onChange={() => set('needs_contributors', 'yes')}
                />
                <div>
                  <div className="access-type-option__label">I need contributors</div>
                  <div className="access-type-option__desc">Define stages and terms, then publish to Discover so collaborators can find it</div>
                </div>
              </label>
              <label
                className={`access-type-option${form.needs_contributors === 'no' ? ' access-type-option--active' : ''}`}
              >
                <input
                  type="radio"
                  name="needs_contributors"
                  checked={form.needs_contributors === 'no'}
                  onChange={() => set('needs_contributors', 'no')}
                />
                <div>
                  <div className="access-type-option__label">Not right now</div>
                  <div className="access-type-option__desc">Stays completely private — skip stages and co-authorship for now</div>
                </div>
              </label>
            </div>
          </div>
        </>
      )}

      {/* ── Step 3: Access & visibility ── */}
      {step === 3 && (
        <>
          <div className="paper-form-heading">Access &amp; visibility</div>
          <p className="paper-form-sub">
            Decide who can apply, and how much of the paper they can see.
          </p>
          {form.needs_contributors === 'no' && (
            <p className="paper-form-help">
              You said you don&apos;t need contributors right now — none of this matters until you publish, so feel free to skip ahead.
            </p>
          )}

          {(() => {
            const willBePublic = form.needs_contributors === 'yes'
            const changing = isPublished !== willBePublic
            const pillStyle = changing
              ? { background: 'var(--bg-warning)', color: 'var(--text-warning)', borderColor: 'var(--border-warning)' }
              : undefined
            const pillClass = changing ? 'paper-pill' : `paper-pill ${willBePublic ? 'pill-open' : 'pill-inst'}`
            const label = changing
              ? (willBePublic ? 'Will publish when you finish' : 'Will become private when you save')
              : (willBePublic ? 'Published — visible on Discover' : 'Private — only you can see this')
            return (
              <div className="paper-form-card">
                <div className="paper-form-card__label">Visibility</div>
                <span className={pillClass} style={pillStyle}>{label}</span>
                <p className="paper-form-help">
                  This follows the choice on Step 1 — public whenever you need contributors, private the rest of the time.
                </p>
              </div>
            )
          })()}

          <div className="paper-form-card">
            <div className="paper-form-card__label">Who can apply?</div>
            <div className="access-type-group">
              {[
                { value: 'open', label: 'Open', desc: 'Any registered user can apply' },
                { value: 'institution', label: 'Institution-restricted', desc: 'Author specifies allowed institutions' },
                { value: 'invite', label: 'Invite only', desc: 'Author invites specific researchers by ORCID or name' },
              ].map(opt => (
                <label
                  key={opt.value}
                  className={`access-type-option${form.access_type === opt.value ? ' access-type-option--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="access_type"
                    value={opt.value}
                    checked={form.access_type === opt.value}
                    onChange={() => set('access_type', opt.value as FormState['access_type'])}
                  />
                  <div>
                    <div className="access-type-option__label">{opt.label}</div>
                    <div className="access-type-option__desc">{opt.desc}</div>
                  </div>
                </label>
              ))}
            </div>
            {form.access_type === 'institution' && (
              <div className="profile-field">
                <label className="profile-field__label" htmlFor="np-allowed_institutions">Allowed institutions</label>
                <textarea
                  id="np-allowed_institutions"
                  className="profile-field__textarea"
                  rows={3}
                  value={form.allowed_institutions}
                  onChange={e => set('allowed_institutions', e.target.value)}
                  placeholder={"Universiti Malaya\nUniversiti Teknologi Malaysia\nUniversiti Putra Malaysia"}
                />
                <p className="paper-form-help">One institution per line.</p>
              </div>
            )}
          </div>

          <div className="paper-form-card">
            <div className="paper-form-card__label">Abstract visibility</div>
            <div className="field-choice-list field-choice-list--compact">
              <label className="field-choice">
                <input
                  type="radio"
                  className="field-choice__input"
                  name="abstract_visibility"
                  value="public"
                  checked={form.abstract_visibility === 'public'}
                  onChange={() => set('abstract_visibility', 'public')}
                />
                <span>Show full abstract publicly — anyone logged in can read it</span>
              </label>
              <label className="field-choice">
                <input
                  type="radio"
                  className="field-choice__input"
                  name="abstract_visibility"
                  value="accepted_only"
                  checked={form.abstract_visibility === 'accepted_only'}
                  onChange={() => set('abstract_visibility', 'accepted_only')}
                />
                <span>Show full abstract to accepted contributors only</span>
              </label>
              <label className="field-choice">
                <input
                  type="radio"
                  className="field-choice__input"
                  name="abstract_visibility"
                  value="teaser_only"
                  checked={form.abstract_visibility === 'teaser_only'}
                  onChange={() => set('abstract_visibility', 'teaser_only')}
                />
                <span>Show teaser only — author writes a short public description, no abstract shown even to accepted contributors</span>
              </label>
            </div>
            {form.abstract_visibility === 'teaser_only' && (
              <div className="profile-field" style={{ marginTop: '10px' }}>
                <label className="profile-field__label" htmlFor="np-teaser_description">
                  Public teaser <span className="field-optional">(max 300 characters)</span>
                </label>
                <textarea
                  id="np-teaser_description"
                  className="profile-field__textarea"
                  rows={3}
                  value={form.teaser_description}
                  onChange={e => set('teaser_description', e.target.value)}
                  placeholder="Short description visible to all signed-in researchers"
                  maxLength={300}
                />
                <p className="paper-form-help">{300 - form.teaser_description.length} characters remaining</p>
              </div>
            )}
          </div>

          <div className="paper-form-card">
            <div className="paper-form-card__label">Paper tracker</div>
            <label className="field-choice field-choice--checkbox">
              <input
                type="checkbox"
                className="field-choice__input"
                checked={form.tracker_visible_to_contributors}
                onChange={e => set('tracker_visible_to_contributors', e.target.checked)}
              />
              <span className="field-choice__body">
                <span className="field-choice__label">Let accepted contributors see this paper's tracker <span className="field-optional">(optional)</span></span>
                <span className="field-choice__hint">Shows a read-only view of which pipeline stage the paper is currently in (e.g. Drafting, Submitted). Off by default.</span>
              </span>
            </label>
          </div>
        </>
      )}

      {/* ── Step 2: Stages ── */}
      {step === 2 && (
        <>
          <div className="paper-form-heading">Stages needed</div>
          <p className="paper-form-sub">
            Select the work you need done. One person per stage.
          </p>
          {form.needs_contributors === 'no' && (
            <p className="paper-form-help">
              You said you don&apos;t need contributors right now — this step is optional, skip ahead whenever you like.
            </p>
          )}

          <div className="paper-form-card">
            <div className="paper-form-card__label">
              Contribution stages
              {form.stages.length > 0 && (
                <span className="paper-form-card__label-count">
                  {form.stages.length} selected
                </span>
              )}
            </div>
            {!form.study_type && (
              <p className="paper-form-help">
                Set a study type on the Paper step to tailor this list, or browse all available stages below.
              </p>
            )}
            <div className="stage-checklist">
              {getContributionTypes(form.study_type).map(({ value, label }) => {
                const stage = form.stages.find(s => s.type === value)
                const checked = !!stage
                return (
                  <div key={value} className={`stage-check-item${checked ? ' stage-check-item--open' : ''}`}>
                    <label className="stage-check-label">
                      <input
                        type="checkbox"
                        className="stage-check-input"
                        checked={checked}
                        onChange={() => toggleStage(value)}
                      />
                      <span className="stage-check-name">{label}</span>
                    </label>
                    {checked && (
                      <>
                        {CONTRIBUTION_HINTS[value] && (
                          <p className="stage-check-hint">{CONTRIBUTION_HINTS[value]}</p>
                        )}
                        <textarea
                          className="stage-check-desc"
                          rows={2}
                          value={stage?.description ?? ''}
                          onChange={e => setStageDescription(value, e.target.value)}
                          placeholder="Anything applicants should know…"
                          maxLength={500}
                          aria-label={`Description for ${label}`}
                        />
                      </>
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </>
      )}

      {/* ── Step 4: Co-authorship terms ── */}
      {step === 4 && (
        <>
          <div className="paper-form-heading">Co-authorship terms</div>
          <p className="paper-form-sub">
            Visible to all signed-in researchers. Sets expectations before anyone applies.
          </p>
          {form.needs_contributors === 'no' && (
            <p className="paper-form-help">
              You said you don&apos;t need contributors right now — this step is optional, skip ahead whenever you like.
            </p>
          )}

          <div className="paper-form-card">
            <div className="paper-form-card__label">Credit & authorship</div>

            <div className="profile-field">
              <span className="profile-field__label" id="np-authorship_offer-label">
                Authorship offer <span className="field-required">*</span>
              </span>
              <div className="field-choice-list" role="radiogroup" aria-labelledby="np-authorship_offer-label">
                {Object.entries(AUTHORSHIP_OFFER_LABELS).map(([value, label]) => (
                  <label key={value} className="field-choice">
                    <input
                      type="radio"
                      className="field-choice__input"
                      name="authorship_offer"
                      value={value}
                      checked={form.authorship_offer === value}
                      onChange={() => set('authorship_offer', value)}
                    />
                    <span className="field-choice__body">
                      <span className="field-choice__label">{label}</span>
                      <span className="field-choice__hint">{AUTHORSHIP_OFFER_HINTS[value]}</span>
                    </span>
                  </label>
                ))}
              </div>
            </div>

            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-authorship_order">
                Authorship order <span className="field-required">*</span>
              </label>
              <select
                id="np-authorship_order"
                className="field-select"
                value={form.authorship_order}
                onChange={e => set('authorship_order', e.target.value)}
              >
                {!form.authorship_order && <option value="">Select…</option>}
                {Object.entries(AUTHORSHIP_ORDER_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>

            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-target_journal">
                Target journal <span className="field-optional">(optional)</span>
              </label>
              <input
                id="np-target_journal"
                className="profile-field__input"
                value={form.target_journal}
                onChange={e => set('target_journal', e.target.value)}
                placeholder="PLOS ONE, BMJ Open…"
                maxLength={200}
              />
            </div>

            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-submission_timeline">
                Delivery timeline <span className="field-required">*</span>
              </label>
              <input
                id="np-submission_timeline"
                type="date"
                className="profile-field__input profile-field__input--date"
                value={form.submission_timeline}
                onChange={e => set('submission_timeline', e.target.value)}
              />
            </div>

            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-additional_terms">
                Additional terms <span className="field-optional">(optional)</span>
              </label>
              <textarea
                id="np-additional_terms"
                className="profile-field__textarea"
                rows={3}
                value={form.additional_terms}
                onChange={e => set('additional_terms', e.target.value)}
                placeholder="ICMJE criteria, corresponding author, anything else applicants should know"
                maxLength={1000}
              />
            </div>
          </div>
        </>
      )}

      {/* ── Step 5: Private details ── */}
      {step === 5 && (
        <>
          <div className="paper-form-heading">Private details</div>
          <p className="paper-form-sub">
            Visible only to contributors you accept.
          </p>

          <div className="paper-form-card">
            <div className="paper-form-card__label">After acceptance only</div>

            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-full_title">
                Full title <span className="field-required">*</span>
              </label>
              <input
                id="np-full_title"
                className="profile-field__input"
                value={form.full_title}
                onChange={e => set('full_title', e.target.value)}
                placeholder="Full title as in the manuscript"
                maxLength={300}
              />
            </div>

            {form.abstract_visibility !== 'teaser_only' ? (
              <div className="profile-field">
                <label className="profile-field__label" htmlFor="np-full_abstract">
                  Abstract <span className="field-required">*</span>
                </label>
                <textarea
                  id="np-full_abstract"
                  className="profile-field__textarea"
                  rows={5}
                  value={form.full_abstract}
                  onChange={e => set('full_abstract', e.target.value)}
                  placeholder="Paste the abstract if you have one"
                  maxLength={3000}
                />
                {form.abstract_visibility === 'public' && (
                  <p className="paper-form-help">Visible to all signed-in researchers.</p>
                )}
                {form.abstract_visibility === 'accepted_only' && (
                  <p className="paper-form-help">Visible only to contributors you accept.</p>
                )}
              </div>
            ) : (
              <p className="paper-form-help">
                Abstract visibility is set to <strong>teaser only</strong> — no abstract is shown to anyone, including accepted contributors.
              </p>
            )}

            <div className="profile-field">
              <label className="profile-field__label" htmlFor="np-external_doc_link">
                Working document <span className="field-optional">(optional)</span>
              </label>
              <input
                id="np-external_doc_link"
                className="profile-field__input"
                value={form.external_doc_link}
                onChange={e => set('external_doc_link', e.target.value)}
                placeholder="Google Doc, Overleaf, Drive…"
                maxLength={500}
              />
              <p className="paper-form-help">
                If you add a link here, it&apos;s shared automatically the moment you accept a contributor.
                Leave it blank to share the document yourself, per contributor, from the Manage tab after accepting them.
              </p>
            </div>
          </div>
        </>
      )}

      {/* ── Step 6: Preview + publish ── */}
      {step === 6 && (
        <>
          <div className="paper-form-heading">Preview</div>
          <p className="paper-form-sub">
            Confirm how this appears on Discover. Use the links below to change anything.
          </p>

          <div className="paper-form-preview-edits">
            <button type="button" className="paper-form-preview-edits__link" onClick={() => goToStep(1)}>
              Edit paper
            </button>
            <button type="button" className="paper-form-preview-edits__link" onClick={() => goToStep(2)}>
              Edit stages
            </button>
            <button type="button" className="paper-form-preview-edits__link" onClick={() => goToStep(3)}>
              Edit access &amp; visibility
            </button>
            <button type="button" className="paper-form-preview-edits__link" onClick={() => goToStep(4)}>
              Edit co-authorship
            </button>
            <button type="button" className="paper-form-preview-edits__link" onClick={() => goToStep(5)}>
              Edit private details
            </button>
          </div>

          <p className="paper-form-preview-label">How applicants see this</p>
          <ListingPreview form={form} />

          {!isPublished && (
            <dl className="commit-summary commit-summary--publish">
              <div className="commit-summary__row">
                <dt className="commit-summary__key">Visibility</dt>
                <dd className="commit-summary__val">Listed publicly on Discover</dd>
              </div>
              <div className="commit-summary__row">
                <dt className="commit-summary__key">Who can apply</dt>
                <dd className="commit-summary__val">
                  {ACCESS_LABELS[form.access_type] ?? form.access_type}
                </dd>
              </div>
              <div className="commit-summary__row">
                <dt className="commit-summary__key">Contribution stages</dt>
                <dd className="commit-summary__val">
                  {form.stages.length} open {form.stages.length === 1 ? 'stage' : 'stages'}
                </dd>
              </div>
              <div className="commit-summary__row">
                <dt className="commit-summary__key">Abstract</dt>
                <dd className="commit-summary__val">
                  {form.abstract_visibility === 'public'
                    ? 'Shown to all signed-in researchers'
                    : form.abstract_visibility === 'teaser_only'
                      ? 'Hidden — teaser only'
                      : 'Shown only to accepted contributors'}
                </dd>
              </div>
            </dl>
          )}
        </>
      )}

      {step === 6 && !isPublished && form.needs_contributors === 'yes' && (
        <label className="publish-disclaimer">
          <input
            type="checkbox"
            className="publish-disclaimer__check"
            checked={disclaimerChecked}
            onChange={e => setDisclaimerChecked(e.target.checked)}
          />
          <span>
            I confirm that co-authorship is not guaranteed by contribution alone. I will determine
            whether each contribution is substantial, and any co-authorship arrangement will be agreed
            directly between myself and the contributor outside this platform. The co-authorship terms
            stated above are my current intention and are not legally binding.
          </span>
        </label>
      )}

      {error && <p className="paper-form-error">{error}</p>}

      <div className="paper-form-nav">
        <div>
          {step > 1 && (
            <button
              type="button"
              className="btn-ghost"
              onClick={() => { setError(null); setStep(s => s - 1) }}
              disabled={isPending}
            >
              ← Back
            </button>
          )}
        </div>
        <div className="paper-form-nav__right">
          {step < 6 ? (
            <button type="button" className="btn-primary" onClick={next}>
              Continue →
            </button>
          ) : isPublished ? (
            <button
              type="button"
              className="btn-publish"
              onClick={() => submit()}
              disabled={isPending}
            >
              {isPending
                ? 'Saving…'
                : form.needs_contributors === 'no' ? 'Save & make private' : 'Save changes'}
            </button>
          ) : (
            <>
              <p className="paper-form-publish-note">
                {form.needs_contributors === 'no'
                  ? "This paper stays private — nothing is published to Discover. Switch to \"I need contributors\" in Step 1 to publish it."
                  : 'Publishing lists this paper on Discover so contributors can find it.'}
              </p>
              <button
                type="button"
                className="btn-publish"
                onClick={() => submit()}
                disabled={isPending || (form.needs_contributors === 'yes' && !disclaimerChecked)}
              >
                {isPending
                  ? (form.needs_contributors === 'no' ? 'Saving…' : 'Publishing…')
                  : (form.needs_contributors === 'no' ? 'Save privately' : 'Publish')}
              </button>
            </>
          )}
        </div>
      </div>

    </div>
  )
}

// ─── Listing preview (Step 6) ─────────────────────────────────────────────────

function ListingPreview({ form }: { form: FormState }) {
  const hasAuthorship = !!(
    form.authorship_offer || form.authorship_order ||
    form.target_journal || form.submission_timeline || form.additional_terms
  )

  const metaParts = [
    form.scope && (SCOPE_DETAIL_LABELS[form.scope] ?? form.scope),
    form.study_type && (STUDY_TYPE_LABELS[form.study_type] ?? form.study_type),
    form.dataset_size && (DATASET_SIZE_LABELS[form.dataset_size] ?? form.dataset_size),
    form.access_type && (ACCESS_LABELS[form.access_type] ?? form.access_type),
  ].filter(Boolean) as string[]

  return (
    <div className="paper-form-preview" aria-label="Listing preview" aria-readonly="true">
      {form.teaser_title ? (
        <h2 className="paper-form-preview__title">{form.teaser_title}</h2>
      ) : (
        <p className="paper-form-preview__empty-title">Add a title in Step 1 to see it here.</p>
      )}

      <div className="paper-form-preview__owner">
        <span className="paper-form-preview__owner-name">You</span>
        <span className="paper-form-preview__owner-tag">Your paper</span>
      </div>

      {metaParts.length > 0 && (
        <p className="paper-detail__meta-line">{metaParts.join(' · ')}</p>
      )}
      {form.post_submission_support && (
        <p className="paper-detail__post-submission-note">Post-submission support may be needed</p>
      )}

      {form.description && (
        <p className="paper-detail__desc">{form.description}</p>
      )}

      {form.abstract_visibility === 'teaser_only' ? (
        form.teaser_description && (
          <p className="paper-detail__desc">{form.teaser_description}</p>
        )
      ) : form.full_abstract ? (
        <div className="paper-form-preview__abstract-note">
          {form.abstract_visibility === 'public'
            ? 'Abstract · visible to all signed-in researchers'
            : 'Abstract · visible to accepted contributors only'}
        </div>
      ) : null}

      {hasAuthorship && (
        <div className="paper-coauthorship-terms">
          <div className="paper-coauthorship-terms__label">Authorship</div>
          <div className="paper-coauthorship-terms__body">
            {form.authorship_offer && (
              <div className="paper-terms-row">
                <span className="paper-terms-key">Credit</span>
                <span className="paper-terms-val">{AUTHORSHIP_OFFER_LABELS[form.authorship_offer] ?? form.authorship_offer}</span>
              </div>
            )}
            {form.authorship_order && (
              <div className="paper-terms-row">
                <span className="paper-terms-key">Author order</span>
                <span className="paper-terms-val">{AUTHORSHIP_ORDER_LABELS[form.authorship_order] ?? form.authorship_order}</span>
              </div>
            )}
            {form.target_journal && (
              <div className="paper-terms-row">
                <span className="paper-terms-key">Journal</span>
                <span className="paper-terms-val">{form.target_journal}</span>
              </div>
            )}
            {form.submission_timeline && (
              <div className="paper-terms-row">
                <span className="paper-terms-key">Timeline</span>
                <span className="paper-terms-val">{formatDeliveryDate(form.submission_timeline)}</span>
              </div>
            )}
            {form.additional_terms && (
              <div className="paper-terms-row paper-terms-row--block">
                <span className="paper-terms-key">Notes</span>
                <span className="paper-terms-val">{form.additional_terms}</span>
              </div>
            )}
          </div>
        </div>
      )}

      <div className="paper-detail__stages-title">
        Contribution stages
        {form.stages.length > 0 && (
          <span className="paper-detail__stages-count">{form.stages.length} open</span>
        )}
      </div>

      {form.stages.length === 0 ? (
        <p className="paper-detail__stages-empty">No stages selected.</p>
      ) : (
        form.stages.map((stage) => {
          const label = CONTRIBUTION_LABELS[stage.type] ?? STAGE_LABELS[stage.type] ?? stage.type
          const pillClass = CONTRIBUTION_PILL_CLASS[stage.type] ?? 'pill-data'
          return (
            <div key={stage.type} className="paper-stage-card paper-stage-card--open">
              <div className="paper-stage-card__left">
                <div className={`paper-stage-card__pill ${pillClass}`}>{label}</div>
                {stage.description && (
                  <div className="paper-stage-card__desc">{stage.description}</div>
                )}
                <div className="paper-stage-card__status paper-stage-card__status--open">
                  Accepting applications
                </div>
              </div>
              <span className="paper-form-preview__stage-note">
                Applications open after publishing
              </span>
            </div>
          )
        })
      )}
    </div>
  )
}
