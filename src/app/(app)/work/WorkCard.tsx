import Link from 'next/link'

export type WorkCardStatusVariant =
  | 'pending'
  | 'accepted'
  | 'rejected'
  | 'draft'
  | 'published'
  | 'neutral'

type WorkCardProps = {
  title: string
  titleHref?: string
  pill?: string | null
  status?: { label: string; variant: WorkCardStatusVariant } | null
  meta?: string | null
  nextStep?: string | null
  footerDate: string
  footerHref?: string
  footerLabel?: string
  footerEmphasis?: boolean
  footerActions?: React.ReactNode
  attention?: boolean
  children?: React.ReactNode
}

export default function WorkCard({
  title,
  titleHref,
  pill,
  status,
  meta,
  nextStep,
  footerDate,
  footerHref,
  footerLabel,
  footerEmphasis,
  footerActions,
  attention,
  children,
}: WorkCardProps) {
  return (
    <article className={`work-card${attention ? ' work-card--attention' : ''}`}>
      <div className="work-card__header">
        <div className="work-card__identity">
          {titleHref ? (
            <Link href={titleHref} className="work-card__title work-card__title--link">
              {title}
            </Link>
          ) : (
            <h2 className="work-card__title">{title}</h2>
          )}
          {pill ? <span className="work-card__pill">{pill}</span> : null}
          {meta ? <p className="work-card__meta">{meta}</p> : null}
        </div>
        {status ? (
          <span className={`app-status app-status--${status.variant}`}>{status.label}</span>
        ) : null}
      </div>

      {nextStep ? <p className="work-card__next">{nextStep}</p> : null}

      {children}

      <div className="work-card__footer">
        <span className="work-card__date">{footerDate}</span>
        {footerActions ?? (footerHref && footerLabel ? (
          <Link
            href={footerHref}
            className={`work-card__link${footerEmphasis ? ' work-card__link--emphasis' : ''}`}
          >
            {footerLabel}
          </Link>
        ) : null)}
      </div>
    </article>
  )
}
