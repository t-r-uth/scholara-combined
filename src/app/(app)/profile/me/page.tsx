import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/firebase/session'
import { db } from '@/lib/firebase/admin'
import { getUserApplications } from '@/lib/firestore/applications'
import { JOB_TITLE_LABELS } from '@/lib/labels'
import { getProfileCompletion } from '@/lib/profile-completion'
import { ROUTES } from '@/lib/routes'
import UserAvatar from '@/components/UserAvatar'

export const metadata = { title: 'Your Profile — Scholara' }

async function getAuthorStats(paperIds: string[]) {
  if (paperIds.length === 0) return { applicationsReceived: 0, contributionsAccepted: 0, substantialContributions: 0 }

  const chunks: string[][] = []
  for (let i = 0; i < paperIds.length; i += 30) chunks.push(paperIds.slice(i, i + 30))

  const chunkResults = await Promise.all(
    chunks.map(chunk => Promise.all([
      db.collection('applications').where('paper_id', 'in', chunk).get(),
      db.collection('contributions').where('paper_id', 'in', chunk).get(),
    ]))
  )

  let applicationsReceived = 0
  let contributionsAccepted = 0
  let substantialContributions = 0

  for (const [appsSnap, contribsSnap] of chunkResults) {
    applicationsReceived += appsSnap.size
    contributionsAccepted += appsSnap.docs.filter(d => d.data().status === 'accepted').length
    substantialContributions += contribsSnap.docs.filter(d => d.data().coauthorship === 'granted').length
  }

  return { applicationsReceived, contributionsAccepted, substantialContributions }
}

function ReadField({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="profile-read-field">
      <div className="profile-read-field__label">{label}</div>
      {value ? (
        <div className="profile-read-field__value">{value}</div>
      ) : (
        <div className="profile-read-field__empty">Not set</div>
      )}
    </div>
  )
}

function AvatarCompletionRing({
  percent,
  children,
}: {
  percent: number
  children: React.ReactNode
}) {
  const size = 76
  const stroke = 3
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const offset = circumference * (1 - Math.min(100, Math.max(0, percent)) / 100)

  return (
    <div
      className="profile-avatar-ring"
      role="img"
      aria-label={`Profile ${percent}% complete`}
    >
      <svg
        className="profile-avatar-ring__svg"
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        aria-hidden
      >
        <circle
          className="profile-avatar-ring__track"
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
        />
        <circle
          className={`profile-avatar-ring__progress${percent === 100 ? ' profile-avatar-ring__progress--complete' : ''}`}
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </svg>
      <div className="profile-avatar-ring__inner">{children}</div>
      <span className="profile-avatar-ring__badge" aria-hidden>
        {percent}%
      </span>
    </div>
  )
}

export default async function ProfilePage() {
  const user = await getServerUser()
  if (!user) redirect(ROUTES.signIn)

  const [profileSnap, contribSnap, papersSnap, applications] = await Promise.all([
    db.collection('users').doc(user.id).get(),
    db.collection('contributions').where('contributor_id', '==', user.id).get(),
    db.collection('papers').where('owner_id', '==', user.id).get(),
    getUserApplications(user.id),
  ])

  const profile = profileSnap.data() ?? null

  const contribList = contribSnap.docs.map(d => d.data())
  const timesApplied = applications.length
  const timesAccepted = contribList.length
  const timesSubmitted = contribList.filter(c => c.status === 'submitted' || c.status === 'completed').length
  const timesSubstantial = contribList.filter(c => c.coauthorship === 'granted').length
  const missedCommitments = 0
  const contribCompletionRate = timesAccepted > 0
    ? Math.round((timesSubmitted / timesAccepted) * 100)
    : null

  const paperIds = papersSnap.docs.map(d => d.id)
  const papersPosted = paperIds.length
  const authorStats = await getAuthorStats(paperIds)

  const name = (profile?.display_name as string | undefined) || ''
  const avatarUrl = (profile?.avatar_url as string | undefined) ?? null
  const email = (profile?.email as string | undefined) || user.email
  const institution = (profile?.institution as string | undefined) || ''
  const jobTitleRaw = (profile?.job_title as string | undefined) || ''
  const jobTitle = jobTitleRaw ? (JOB_TITLE_LABELS[jobTitleRaw] ?? jobTitleRaw) : ''
  const emailNotifications = (profile?.email_notifications as boolean | undefined) ?? true
  const field = (profile?.field_of_study as string | undefined) || ''
  const bio = (profile?.bio as string | undefined) || ''
  const orcidId = (profile?.orcid_id as string | undefined) || ''
  const orcidVerified = (profile?.orcid_verified as boolean | undefined) ?? false
  const contactPrefs = (profile?.contact_prefs as {
    email?: boolean; whatsapp?: string; other?: string
  } | undefined) ?? null
  const subtitle = [institution, field].filter(Boolean).join(' · ')

  const completion = getProfileCompletion({
    display_name: name,
    institution,
    field_of_study: field,
    bio,
    orcid_id: orcidId,
    contact_prefs: contactPrefs,
  })

  const contactLines: string[] = []
  if (contactPrefs?.email) contactLines.push(`Email: ${email}`)
  if (contactPrefs?.whatsapp) contactLines.push(`WhatsApp: ${contactPrefs.whatsapp}`)
  if (contactPrefs?.other) contactLines.push(contactPrefs.other)

  return (
    <div className="profile-page">

      <section className="profile-hero">
        <div className="profile-hero__body">
          <AvatarCompletionRing percent={completion.percent}>
            <UserAvatar name={name || email} avatarUrl={avatarUrl} className="profile-hero__avatar" />
          </AvatarCompletionRing>
          <div className="profile-hero__info">
            <h1 className="profile-hero__name">{name || email}</h1>
            {subtitle && <div className="profile-hero__sub">{subtitle}</div>}
            {(name || subtitle) && <div className="profile-hero__email">{email}</div>}
            <div className="profile-hero__completion">
              {completion.percent === 100
                ? 'Profile complete'
                : `${completion.percent}% complete · add ${completion.missing.map((item) => item.label.toLowerCase()).join(', ')}`}
            </div>
          </div>
          <Link href={ROUTES.profileMeEdit} className="profile-hero__edit btn-ghost btn-ghost--compact">
            {completion.percent < 100 ? 'Complete profile' : 'Edit profile'}
          </Link>
        </div>

        {bio && <p className="profile-hero__bio">{bio}</p>}

        {orcidId && (
          <div className="profile-hero__orcid">
            <span className="profile-identity__orcid-badge">iD</span>
            <span className="profile-identity__orcid-id">
              orcid.org/{orcidId}
            </span>
            {orcidVerified
              ? <span className="profile-identity__orcid-verified">Verified</span>
              : <span className="profile-identity__orcid-unverified">Unverified</span>
            }
          </div>
        )}
      </section>

      <section className="profile-read">
        <h2 className="profile-read__heading">About you</h2>
        <div className="profile-read__grid">
          <ReadField label="Full name" value={name || null} />
          <ReadField label="Position" value={jobTitle || null} />
          <ReadField label="Institution" value={institution || null} />
          <ReadField label="Field of research" value={field || null} />
          <ReadField label="Bio" value={bio || null} />
          <ReadField
            label="ORCID iD"
            value={orcidId ? `${orcidId}${orcidVerified ? ' · Verified' : ''}` : null}
          />
          <ReadField
            label="Contact preferences"
            value={contactLines.length > 0 ? contactLines.join('\n') : null}
          />
          <ReadField
            label="Email notifications"
            value={emailNotifications ? 'On — emailed about updates' : 'Off'}
          />
        </div>
      </section>

      <section className="profile-stats-section">
        <div className="profile-stats-grid">
          <div className="profile-stats-col">
            <div className="profile-stats-col__heading">As author</div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{papersPosted}</span>
              <span className="profile-stat-row__label">Papers posted</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{authorStats.applicationsReceived}</span>
              <span className="profile-stat-row__label">Total applications received</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{authorStats.contributionsAccepted}</span>
              <span className="profile-stat-row__label">Contributions accepted</span>
            </div>
            <div className="profile-stat-row profile-stat-row--accent">
              <span className="profile-stat-row__num">{authorStats.substantialContributions}</span>
              <span className="profile-stat-row__label">Contributions marked substantial</span>
            </div>
          </div>

          <div className="profile-stats-col">
            <div className="profile-stats-col__heading">As contributor</div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{timesApplied}</span>
              <span className="profile-stat-row__label">Times applied</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{timesAccepted}</span>
              <span className="profile-stat-row__label">Times accepted</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{timesSubmitted}</span>
              <span className="profile-stat-row__label">Times submitted</span>
            </div>
            <div className="profile-stat-row profile-stat-row--accent">
              <span className="profile-stat-row__num">{timesSubstantial}</span>
              <span className="profile-stat-row__label">Times marked substantial</span>
            </div>
            <div className="profile-stat-row">
              <span className="profile-stat-row__num">{missedCommitments}</span>
              <span className="profile-stat-row__label">Missed commitments</span>
            </div>
            {contribCompletionRate !== null && (
              <div className="profile-stat-row">
                <span className="profile-stat-row__num">{contribCompletionRate}%</span>
                <span className="profile-stat-row__label">Completion rate</span>
              </div>
            )}
          </div>
        </div>
      </section>

    </div>
  )
}
