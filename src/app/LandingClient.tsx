'use client'

import Link from 'next/link'

const trustPoints = [
  {
    title: 'Verified researcher identities',
    desc: 'Link your ORCID iD to your profile for a globally recognised researcher identifier — visible to paper owners reviewing your application.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
        <polyline points="9 12 11 14 15 10"/>
      </svg>
    ),
  },
  {
    title: 'Specific contribution stages',
    desc: 'Papers list exactly what help they need — data analysis, writing, references, or peer review. Apply to the right task.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="12 2 2 7 12 12 22 7 12 2"/>
        <polyline points="2 17 12 22 22 17"/>
        <polyline points="2 12 12 17 22 12"/>
      </svg>
    ),
  },
  {
    title: 'Contact info revealed only after a match',
    desc: 'Your email and contact details are private until the paper owner accepts your application.',
    icon: (
      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round">
        <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
        <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
      </svg>
    ),
  },
]

export default function LandingClient({ error }: { error?: string }) {
  return (
    <div className="sign-in-page">

      {/* ── Left: brand panel ── */}
      <div className="sign-in-panel sign-in-panel--brand">
        <div className="sign-in-panel__inner">

          <Link href="/" className="sign-in-logo">
            Scho<span>lara</span>
          </Link>

          <p className="sign-in-eyebrow">Research collaboration</p>

          <h1 className="sign-in-headline">
            Where researchers find the right collaborators — and become one.
          </h1>

          <p className="sign-in-lead">
            Post a paper listing with the specific help you need. Discover open papers in your field. Apply, get matched, and connect with the right collaborators.
          </p>

          <ul className="sign-in-trust">
            {trustPoints.map((tp) => (
              <li key={tp.title} className="sign-in-trust__item">
                <div className="sign-in-trust__icon">{tp.icon}</div>
                <div>
                  <div className="sign-in-trust__title">{tp.title}</div>
                  <div className="sign-in-trust__desc">{tp.desc}</div>
                </div>
              </li>
            ))}
          </ul>

        </div>
      </div>

      {/* ── Right: form panel ── */}
      <div className="sign-in-panel sign-in-panel--form">
        <div className="sign-in-card">

          <h2 className="sign-in-card__title">Sign in</h2>
          <p className="sign-in-card__subtitle">
            Access your listings, applications, and contributions.
          </p>

          {error && (
            <div className="sign-in-error">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10"/>
                <line x1="12" y1="8" x2="12" y2="12"/>
                <line x1="12" y1="16" x2="12.01" y2="16"/>
              </svg>
              Authentication failed. Please try again.
            </div>
          )}

          <Link href="/sign-in" className="btn-primary" style={{ display: 'block', textAlign: 'center', textDecoration: 'none', padding: '10px 20px' }}>
            Sign in or create account
          </Link>

          <div className="sign-in-footer">
            <Link href="/discover" className="sign-in-footer__back">← Browse without signing in</Link>
            <p className="sign-in-footer__note">
              Contact details are only shared with matched collaborators — never publicly.
            </p>
          </div>

        </div>
      </div>

    </div>
  )
}
