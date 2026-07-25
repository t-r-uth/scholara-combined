'use client'

import Link from 'next/link'
import { Suspense } from 'react'
import { useSearchParams } from 'next/navigation'

function SignInError() {
  const searchParams = useSearchParams()
  const error = searchParams.get('error')

  if (!error) return null

  return (
    <div className="sign-in-error" role="alert">
      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden>
        <circle cx="12" cy="12" r="10" />
        <line x1="12" y1="8" x2="12" y2="12" />
        <line x1="12" y1="16" x2="12.01" y2="16" />
      </svg>
      Sign-in failed. Please try again.
    </div>
  )
}

export default function SignInClient() {
  return (
    <div className="sign-in-page">
      <div className="sign-in-panel sign-in-panel--brand">
        <div className="sign-in-panel__inner">
          <Link href="/discover" className="sign-in-logo">
            Scho<span>lara</span>
          </Link>

          <div className="sign-in-hero">
            <p className="sign-in-eyebrow">For university researchers</p>
            <h1 className="sign-in-headline">
              Research collaboration, built on verified identity.
            </h1>
            <p className="sign-in-lead">
              Scholara connects academics through their ORCID record — so you always know who you are working with before you commit.
            </p>
          </div>

          <ul className="sign-in-trust">
            <li className="sign-in-trust__item">
              <span className="sign-in-trust__num" aria-hidden>iD</span>
              <div>
                <div className="sign-in-trust__title">Verified researcher identity</div>
                <div className="sign-in-trust__desc">Every profile is anchored to an ORCID iD — no anonymous accounts.</div>
              </div>
            </li>
            <li className="sign-in-trust__item">
              <span className="sign-in-trust__num" aria-hidden>·</span>
              <div>
                <div className="sign-in-trust__title">You control access</div>
                <div className="sign-in-trust__desc">Publish openly, restrict to institutions, or invite by name. Contact details are shared only when you accept.</div>
              </div>
            </li>
            <li className="sign-in-trust__item">
              <span className="sign-in-trust__num" aria-hidden>·</span>
              <div>
                <div className="sign-in-trust__title">A record of contribution</div>
                <div className="sign-in-trust__desc">Authorship terms are stated upfront, and every contribution is documented.</div>
              </div>
            </li>
          </ul>
        </div>
      </div>

      <div className="sign-in-panel sign-in-panel--form">
        <div className="sign-in-card">
          <div className="sign-in-card__header">
            <h2 className="sign-in-card__title">Sign in</h2>
            <p className="sign-in-card__subtitle">
              Access your listings, applications, and contributions with your ORCID iD.
            </p>
          </div>

          <Suspense fallback={null}>
            <SignInError />
          </Suspense>

          <a href="/api/auth/orcid/signin" className="btn-primary sign-in-submit" style={{ display: 'block', textAlign: 'center', textDecoration: 'none' }}>
            Sign in with ORCID iD
          </a>

          <div className="sign-in-footer">
            <Link href="/discover" className="sign-in-footer__back">← Browse without signing in</Link>
          </div>
        </div>
      </div>
    </div>
  )
}