'use client'

import { useMemo, useState, useTransition } from 'react'
import Link from 'next/link'
import UserAvatar from '@/components/UserAvatar'
import { TRACKING_STAGES, TRACKING_STAGE_LABELS, TRACKING_STAGE_COLORS, type TrackingStage } from '@/lib/labels'
import { ROUTES } from '@/lib/routes'
import { updateTrackingStage } from './actions'

export type TrackingCoAuthor = { id: string; name: string; avatarUrl: string | null }

export type TrackingPaper = {
  id: string
  title: string
  tracking_stage: TrackingStage
  status: 'draft' | 'published'
  study_type?: string | null
  co_authors: TrackingCoAuthor[]
  due: { label: string; urgent: boolean } | null
}

/** A paper the viewer contributes to (not owns) whose author opted into tracker sharing. */
export type ContributingPaper = {
  id: string
  title: string
  tracking_stage: TrackingStage
  ownerName: string
}

type View = 'board' | 'table'
type Source = 'owned' | 'contributing'
type StatusFilter = '' | 'attention' | 'ontrack'
type SortKey = 'title' | 'stage' | 'status'

function attentionStatus(paper: TrackingPaper): 'attention' | 'ontrack' {
  return paper.due?.urgent ? 'attention' : 'ontrack'
}

function CoAuthorAvatars({ coAuthors, className }: { coAuthors: TrackingCoAuthor[]; className: string }) {
  if (coAuthors.length === 0) return null
  return (
    <div className={className}>
      {coAuthors.map(a => (
        <UserAvatar key={a.id} name={a.name} avatarUrl={a.avatarUrl} size="sm" />
      ))}
    </div>
  )
}

export default function TrackingBoard({
  papers: initial,
  contributingPapers = [],
}: {
  papers: TrackingPaper[]
  contributingPapers?: ContributingPaper[]
}) {
  const [papers, setPapers]   = useState(initial)
  const [source, setSource]   = useState<Source>('owned')
  const [view, setView]       = useState<View>('board')
  const [dragId, setDragId]   = useState<string | null>(null)
  const [overCol, setOverCol] = useState<TrackingStage | null>(null)
  const [isPending, startTransition] = useTransition()
  const [error, setError]     = useState<string | null>(null)

  // Table-view controls
  const [search, setSearch]           = useState('')
  const [stageFilter, setStageFilter] = useState<TrackingStage | ''>('')
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('')
  const [sortKey, setSortKey]         = useState<SortKey | null>(null)
  const [sortDir, setSortDir]         = useState<1 | -1>(1)

  function move(paperId: string, toStage: TrackingStage) {
    const prev = papers.find(p => p.id === paperId)?.tracking_stage
    if (!prev || prev === toStage) return

    // Optimistic update
    setPapers(ps => ps.map(p => p.id === paperId ? { ...p, tracking_stage: toStage } : p))

    startTransition(async () => {
      try {
        setError(null)
        await updateTrackingStage(paperId, toStage)
      } catch {
        // Revert
        setPapers(ps => ps.map(p => p.id === paperId ? { ...p, tracking_stage: prev } : p))
        setError('Could not update stage. Try again.')
      }
    })
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────
  function onDragStart(e: React.DragEvent, paperId: string) {
    setDragId(paperId)
    e.dataTransfer.effectAllowed = 'move'
  }

  function onDragEnd() {
    setDragId(null)
    setOverCol(null)
  }

  function onDragOver(e: React.DragEvent, col: TrackingStage) {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setOverCol(col)
  }

  function onDrop(e: React.DragEvent, col: TrackingStage) {
    e.preventDefault()
    if (dragId) move(dragId, col)
    setDragId(null)
    setOverCol(null)
  }

  // ── Table stage change ────────────────────────────────────────────────────
  function onStageChange(paperId: string, value: string) {
    if (TRACKING_STAGES.includes(value as TrackingStage)) {
      move(paperId, value as TrackingStage)
    }
  }

  function onSort(key: SortKey) {
    if (sortKey === key) setSortDir(d => (d === 1 ? -1 : 1))
    else { setSortKey(key); setSortDir(1) }
  }

  const filteredPapers = useMemo(() => {
    let list = papers
    const q = search.trim().toLowerCase()
    if (q) list = list.filter(p => p.title.toLowerCase().includes(q))
    if (stageFilter) list = list.filter(p => p.tracking_stage === stageFilter)
    if (statusFilter) list = list.filter(p => attentionStatus(p) === statusFilter)

    if (sortKey) {
      list = [...list].sort((a, b) => {
        let av: string, bv: string
        if (sortKey === 'title') { av = a.title; bv = b.title }
        else if (sortKey === 'stage') { av = TRACKING_STAGE_LABELS[a.tracking_stage]; bv = TRACKING_STAGE_LABELS[b.tracking_stage] }
        else { av = attentionStatus(a); bv = attentionStatus(b) }
        if (av < bv) return -1 * sortDir
        if (av > bv) return 1 * sortDir
        return 0
      })
    }
    return list
  }, [papers, search, stageFilter, statusFilter, sortKey, sortDir])

  const hasContributing = contributingPapers.length > 0

  const sourceToggle = hasContributing ? (
    <div className="tracker__source-toggle">
      <button
        type="button"
        className={`tracker__source-btn${source === 'owned' ? ' tracker__source-btn--active' : ''}`}
        aria-pressed={source === 'owned'}
        onClick={() => setSource('owned')}
      >
        My papers
      </button>
      <button
        type="button"
        className={`tracker__source-btn${source === 'contributing' ? ' tracker__source-btn--active' : ''}`}
        aria-pressed={source === 'contributing'}
        onClick={() => setSource('contributing')}
      >
        Contributing
      </button>
    </div>
  ) : null

  if (source === 'contributing') {
    return (
      <div className="tracker tracker--contributing">
        {sourceToggle}
        <ContributingTracker papers={contributingPapers} view={view} setView={setView} />
      </div>
    )
  }

  // ── Board view ────────────────────────────────────────────────────────────
  if (view === 'board') {
    return (
      <div className="tracker">
        {sourceToggle}
        <div className="tracker__header">
          <div className="tracker__view-toggle">
            <button
              type="button"
              className="tracker__view-btn tracker__view-btn--active"
              aria-pressed="true"
              onClick={() => setView('board')}
            >
              Board
            </button>
            <button
              type="button"
              className="tracker__view-btn"
              aria-pressed="false"
              onClick={() => setView('table')}
            >
              Table
            </button>
          </div>
          {error && <p className="tracker__error">{error}</p>}
        </div>

        <div className="tracker-board" aria-label="Paper tracking board">
          {TRACKING_STAGES.map(stage => {
            const cards = papers.filter(p => p.tracking_stage === stage)
            const isOver = overCol === stage
            return (
              <div
                key={stage}
                className={`tracker-col${isOver ? ' tracker-col--over' : ''}`}
                style={{ '--stage-color': TRACKING_STAGE_COLORS[stage] } as React.CSSProperties}
                onDragOver={e => onDragOver(e, stage)}
                onDrop={e => onDrop(e, stage)}
                onDragLeave={() => setOverCol(null)}
              >
                <div className="tracker-col__header">
                  <span className="tracker-col__label">{TRACKING_STAGE_LABELS[stage]}</span>
                  {cards.length > 0 && (
                    <span className="tracker-col__count">{cards.length}</span>
                  )}
                </div>

                <div className="tracker-col__cards">
                  {cards.map(paper => {
                    const status = attentionStatus(paper)
                    return (
                      <div
                        key={paper.id}
                        className={`tracker-card${dragId === paper.id ? ' tracker-card--dragging' : ''}${paper.status === 'draft' ? ' tracker-card--draft' : ''}`}
                        draggable
                        onDragStart={e => onDragStart(e, paper.id)}
                        onDragEnd={onDragEnd}
                        aria-grabbed={dragId === paper.id}
                      >
                        {paper.due && (
                          <span className={`tracker-card__tag tracker-card__tag--${status}`}>
                            {status === 'attention' ? 'Needs attention' : 'On track'}
                          </span>
                        )}
                        <Link
                          href={paper.status === 'draft' ? ROUTES.paperEdit(paper.id) : ROUTES.paperManage(paper.id)}
                          className="tracker-card__title"
                        >
                          {paper.title}
                        </Link>
                        {paper.status === 'draft' && (
                          <div className="tracker-card__draft-row">
                            <span className="tracker-card__draft-tag">Draft</span>
                            <Link href={ROUTES.paperEdit(paper.id)} className="tracker-card__recruit-btn">
                              Recruit co-authors →
                            </Link>
                          </div>
                        )}
                        <div className="tracker-card__meta">
                          <CoAuthorAvatars coAuthors={paper.co_authors} className="tracker-card__avatars" />
                          {paper.due && (
                            <span className={`tracker-card__due${paper.due.urgent ? ' tracker-card__due--urgent' : ''}`}>
                              {paper.due.label}
                            </span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )
          })}
        </div>
        {isPending && <p className="tracker__saving">Saving…</p>}
      </div>
    )
  }

  // ── Table view ────────────────────────────────────────────────────────────
  function sortArrow(key: SortKey) {
    if (sortKey !== key) return null
    return <span className="tracker-table__sort-arrow">{sortDir === 1 ? '▲' : '▼'}</span>
  }

  return (
    <div className="tracker">
      {sourceToggle}
      <div className="tracker__header">
        <div className="tracker__view-toggle">
          <button
            type="button"
            className="tracker__view-btn"
            aria-pressed="false"
            onClick={() => setView('board')}
          >
            Board
          </button>
          <button
            type="button"
            className="tracker__view-btn tracker__view-btn--active"
            aria-pressed="true"
            onClick={() => setView('table')}
          >
            Table
          </button>
        </div>
        {error && <p className="tracker__error">{error}</p>}
      </div>

      <div className="tracker-filter-row">
        <input
          type="text"
          className="tracker-filter-row__search"
          placeholder="Search paper titles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search paper titles"
        />
        <select
          className="tracker-filter-row__select"
          value={stageFilter}
          onChange={e => setStageFilter(e.target.value as TrackingStage | '')}
          aria-label="Filter by stage"
        >
          <option value="">All stages</option>
          {TRACKING_STAGES.map(s => (
            <option key={s} value={s}>{TRACKING_STAGE_LABELS[s]}</option>
          ))}
        </select>
        <select
          className="tracker-filter-row__select"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as StatusFilter)}
          aria-label="Filter by status"
        >
          <option value="">Any status</option>
          <option value="attention">Needs attention</option>
          <option value="ontrack">On track</option>
        </select>
      </div>

      <table className="tracker-table">
        <thead>
          <tr>
            <th className="tracker-table__th" onClick={() => onSort('title')}>Paper{sortArrow('title')}</th>
            <th className="tracker-table__th" onClick={() => onSort('stage')}>Stage{sortArrow('stage')}</th>
            <th className="tracker-table__th tracker-table__th--status" onClick={() => onSort('status')}>Status{sortArrow('status')}</th>
            <th className="tracker-table__th">Co-authors</th>
            <th className="tracker-table__th">Due</th>
          </tr>
        </thead>
        <tbody>
          {filteredPapers.map(paper => {
            const status = attentionStatus(paper)
            const stageColor = TRACKING_STAGE_COLORS[paper.tracking_stage]
            return (
              <tr key={paper.id} className="tracker-table__row">
                <td className="tracker-table__td tracker-table__td--title">
                  <div className="tracker-table__title-row">
                    <Link
                      href={paper.status === 'draft' ? ROUTES.paperEdit(paper.id) : ROUTES.paperManage(paper.id)}
                      className="tracker-table__link"
                    >
                      {paper.title}
                    </Link>
                    {paper.status === 'draft' && (
                      <>
                        <span className="tracker-table__tag tracker-table__tag--draft">Draft</span>
                        <Link href={ROUTES.paperEdit(paper.id)} className="tracker-table__recruit-link">
                          Recruit co-authors →
                        </Link>
                      </>
                    )}
                  </div>
                </td>
                <td className="tracker-table__td">
                  <select
                    className="tracker-table__select"
                    style={{ background: `${stageColor}22`, color: stageColor, borderColor: `${stageColor}55` }}
                    value={paper.tracking_stage}
                    onChange={e => onStageChange(paper.id, e.target.value)}
                    disabled={isPending}
                    aria-label={`Stage for ${paper.title}`}
                  >
                    {TRACKING_STAGES.map(s => (
                      <option key={s} value={s}>{TRACKING_STAGE_LABELS[s]}</option>
                    ))}
                  </select>
                </td>
                <td className="tracker-table__td tracker-table__td--status">
                  {paper.due && (
                    <span className={`tracker-table__tag tracker-table__tag--${status}`}>
                      {status === 'attention' ? 'Needs attention' : 'On track'}
                    </span>
                  )}
                </td>
                <td className="tracker-table__td">
                  <CoAuthorAvatars coAuthors={paper.co_authors} className="tracker-table__avatars" />
                  {paper.co_authors.length === 0 && '—'}
                </td>
                <td className={`tracker-table__td${paper.due?.urgent ? ' tracker-table__due--urgent' : ''}`}>
                  {paper.due?.label ?? '—'}
                </td>
              </tr>
            )
          })}
          {filteredPapers.length === 0 && (
            <tr>
              <td className="tracker-table__empty" colSpan={5}>No papers match your filters</td>
            </tr>
          )}
        </tbody>
      </table>
      {isPending && <p className="tracker__saving">Saving…</p>}
    </div>
  )
}

// ─── Contributing view — read-only, single-column-of-truth per paper ──────────

function ContributingTracker({
  papers,
  view,
  setView,
}: {
  papers: ContributingPaper[]
  view: View
  setView: (v: View) => void
}) {
  const [search, setSearch] = useState('')

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return q ? papers.filter(p => p.title.toLowerCase().includes(q)) : papers
  }, [papers, search])

  if (view === 'board') {
    return (
      <>
        <div className="tracker__header">
          <div className="tracker__view-toggle">
            <button type="button" className="tracker__view-btn tracker__view-btn--active" aria-pressed="true" onClick={() => setView('board')}>Board</button>
            <button type="button" className="tracker__view-btn" aria-pressed="false" onClick={() => setView('table')}>Table</button>
          </div>
          <p className="tracker__readonly-note">Read-only — the author controls this paper&apos;s stage.</p>
        </div>

        <div className="tracker-board" aria-label="Papers you're contributing to (read-only)">
          {TRACKING_STAGES.map(stage => {
            const cards = papers.filter(p => p.tracking_stage === stage)
            return (
              <div
                key={stage}
                className="tracker-col"
                style={{ '--stage-color': TRACKING_STAGE_COLORS[stage] } as React.CSSProperties}
              >
                <div className="tracker-col__header">
                  <span className="tracker-col__label">{TRACKING_STAGE_LABELS[stage]}</span>
                  {cards.length > 0 && <span className="tracker-col__count">{cards.length}</span>}
                </div>
                <div className="tracker-col__cards">
                  {cards.map(paper => (
                    <div key={paper.id} className="tracker-card tracker-card--readonly">
                      <Link href={ROUTES.paperManage(paper.id)} className="tracker-card__title">
                        {paper.title}
                      </Link>
                      <span className="tracker-card__owner">by {paper.ownerName}</span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </>
    )
  }

  return (
    <>
      <div className="tracker__header">
        <div className="tracker__view-toggle">
          <button type="button" className="tracker__view-btn" aria-pressed="false" onClick={() => setView('board')}>Board</button>
          <button type="button" className="tracker__view-btn tracker__view-btn--active" aria-pressed="true" onClick={() => setView('table')}>Table</button>
        </div>
        <p className="tracker__readonly-note">Read-only — the author controls this paper&apos;s stage.</p>
      </div>

      <div className="tracker-filter-row">
        <input
          type="text"
          className="tracker-filter-row__search"
          placeholder="Search paper titles…"
          value={search}
          onChange={e => setSearch(e.target.value)}
          aria-label="Search paper titles"
        />
      </div>

      <table className="tracker-table">
        <thead>
          <tr>
            <th className="tracker-table__th">Paper</th>
            <th className="tracker-table__th">Stage</th>
            <th className="tracker-table__th">Author</th>
          </tr>
        </thead>
        <tbody>
          {filtered.map(paper => {
            const stageColor = TRACKING_STAGE_COLORS[paper.tracking_stage]
            return (
              <tr key={paper.id} className="tracker-table__row">
                <td className="tracker-table__td tracker-table__td--title">
                  <Link href={ROUTES.paperManage(paper.id)} className="tracker-table__link">
                    {paper.title}
                  </Link>
                </td>
                <td className="tracker-table__td">
                  <span
                    className="tracker-table__tag"
                    style={{ background: `${stageColor}22`, color: stageColor }}
                  >
                    {TRACKING_STAGE_LABELS[paper.tracking_stage]}
                  </span>
                </td>
                <td className="tracker-table__td">{paper.ownerName}</td>
              </tr>
            )
          })}
          {filtered.length === 0 && (
            <tr>
              <td className="tracker-table__empty" colSpan={3}>No papers match your filters</td>
            </tr>
          )}
        </tbody>
      </table>
    </>
  )
}
