import { notFound } from 'next/navigation'
import Link from 'next/link'
import { getServerUser } from '@/lib/firebase/session'
import { db } from '@/lib/firebase/admin'
import { ROUTES } from '@/lib/routes'
import UserAvatar from '@/components/UserAvatar'
import ReportButton from '@/components/ReportButton'
import { JOB_TITLE_LABELS } from '@/lib/labels'

function ProfileSignInGate() {
  return (
    <div className="profile-page">
      <Link href={ROUTES.discover} className="paper-detail__back">← Discover</Link>

      <div className="auth-gate">
        <div className="auth-gate__icon" aria-hidden>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21a8 8 0 0 0-16 0" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <h1 className="auth-gate__title">Sign in to view this profile</h1>
        <p className="auth-gate__text">
          Researcher profiles show affiliation, ORCID verification, and contribution history — available to signed-in members.
        </p>
        <div className="auth-gate__actions">
          <Link href={ROUTES.signIn} className="btn-primary auth-gate__cta">
            Sign in
          </Link>
          <Link href={ROUTES.discover} className="btn-ghost auth-gate__secondary">
            Browse papers
          </Link>
        </div>
      </div>
    </div>
  )
}

async function getProfileStats(userId: string) {
  const [contribSnap, papersSnap, appsAsContributorSnap] = await Promise.all([
    db.collection('contributions').where('contributor_id', '==', userId).get(),
    db.collection('papers').where('owner_id', '==', userId).get(),
    db.collection('applications').where('applicant_id', '==', userId).get(),
  ])
  const contribList = contribSnap.docs.map(d => d.data())
  const paperIds = papersSnap.docs.map(d => d.id)

  let applicationsReceived = 0
  let contributionsAccepted = 0
  let substantialAsAuthor = 0

  if (paperIds.length > 0) {
    const chunks: string[][] = []
    for (let i = 0; i < paperIds.length; i += 30) chunks.push(paperIds.slice(i, i + 30))

    const chunkResults = await Promise.all(
      chunks.map(chunk => Promise.all([
        db.collection('applications').where('paper_id', 'in', chunk).get(),
        db.collection('contributions').where('paper_id', 'in', chunk).get(),
      ]))
    )

    for (const [appsSnap, cSnap] of chunkResults) {
      applicationsReceived += appsSnap.size
      contributionsAccepted += appsSnap.docs.filter(d => d.data().status === 'accepted').length
      substantialAsAuthor += cSnap.docs.filter(d => d.data().coauthorship === 'granted').length
    }
  }

  const timesAccepted = contribList.length
  const timesSubmitted = contribList.filter(c => c.status === 'submitted' || c.status === 'completed').length
  const completionRate = timesAccepted > 0 ? Math.round((timesSubmitted / timesAccepted) * 100) : null

  return {
    papersPosted: papersSnap.size,
    applicationsReceived,
    contributionsAccepted,
    substantialAsAuthor,
    timesApplied: appsAsContributorSnap.size,
    timesAccepted,
    timesSubmitted,
    timesSubstantial: contribList.filter(c => c.coauthorship === 'granted').length,
    completionRate,
  }
}

export default async function PublicProfilePage({ params }: { params: { id: string } }) {
  const viewer = await getServerUser()
  if (!viewer) {
    return <ProfileSignInGate />
  }

  const profileSnap = await db.collection('users').doc(params.id).get()
  if (!profileSnap.exists) notFound()
  const profile = profileSnap.data()!

  const isSelf = viewer?.id === params.id

  if (isSelf) {
    return (
      <div className="profile-page profile-self-redirect">
        <p className="profile-self-redirect__text">This is your profile.</p>
        <Link href="/profile/me" className="btn-publish" style={{ textDecoration: 'none', display: 'inline-block' }}>
          Go to your profile
        </Link>
      </div>
    )
  }

  const stats = await getProfileStats(params.id)

  const name      = (profile.display_name as string | undefined) ?? 'Researcher'
  const avatarUrl = (profile.avatar_url   as string | undefined) ?? null
  const institution  = profile.institution  as string | undefined
  const field = profile.field_of_study as string | undefined
  const jobTitleRaw = profile.job_title as string | undefined
  const jobTitle = jobTitleRaw ? (JOB_TITLE_LABELS[jobTitleRaw] ?? jobTitleRaw) : undefined

  return (
    <div className="profile-page">
      <div className="profile-topbar">
        <Link href="/discover" className="paper-detail__back">← Discover</Link>
        {viewer && <ReportButton targetType="user" targetId={params.id} />}
      </div>

      {/* Identity card */}
      <div className="profile-identity">
        <div className="profile-identity__header">
          <UserAvatar name={name} avatarUrl={avatarUrl} className="profile-identity__avatar" size="lg" />
          <div>
            <div className="profile-identity__name">{name}</div>
            <div className="profile-identity__email">
              {[jobTitle, institution, field].filter(Boolean).join(' · ') || 'Researcher'}
            </div>
          </div>
        </div>

        {profile.orcid_id && (
          <div className="profile-identity__orcid">
            <span className="profile-identity__orcid-badge">iD</span>
            <span className="profile-identity__orcid-id">orcid.org/{profile.orcid_id as string}</span>
            {profile.orcid_verified
              ? <span className="profile-identity__orcid-verified">Verified</span>
              : <span className="profile-identity__orcid-unverified">Unverified</span>
            }
          </div>
        )}
      </div>

      {/* Bio */}
      {profile.bio && (
        <div className="profile-section">
          <div className="profile-section__title">About</div>
          <div className="profile-section__body">
            <p className="profile-bio">{profile.bio as string}</p>
          </div>
        </div>
      )}

      {/* Contribution history stats */}
      <section className="profile-stats-section">
        <div className="profile-stats-grid">
          <div className="profile-stats-col">
            <div className="profile-stats-col__heading">As author</div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{stats.papersPosted}</span>
              <span className="profile-stat-row__label">Papers posted</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{stats.applicationsReceived}</span>
              <span className="profile-stat-row__label">Total applications received</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{stats.contributionsAccepted}</span>
              <span className="profile-stat-row__label">Contributions accepted</span>
            </div>
            <div className="profile-stat-row profile-stat-row--accent">
              <span className="profile-stat-row__num">{stats.substantialAsAuthor}</span>
              <span className="profile-stat-row__label">Contributions marked substantial</span>
            </div>
          </div>

          <div className="profile-stats-col">
            <div className="profile-stats-col__heading">As contributor</div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{stats.timesApplied}</span>
              <span className="profile-stat-row__label">Times applied</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{stats.timesAccepted}</span>
              <span className="profile-stat-row__label">Times accepted</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{stats.timesSubmitted}</span>
              <span className="profile-stat-row__label">Times submitted</span>
            </div>
            <div className="profile-stat-row profile-stat-row--accent">
              <span className="profile-stat-row__num">{stats.timesSubstantial}</span>
              <span className="profile-stat-row__label">Times marked substantial</span>
            </div>
            {stats.completionRate !== null && (
              <div className="profile-stat-row">
                <span className="profile-stat-row__num">{stats.completionRate}%</span>
                <span className="profile-stat-row__label">Completion rate</span>
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  )
}
