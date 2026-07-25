import { redirect } from 'next/navigation'
import { getServerUser } from '@/lib/firebase/session'
import { getNavBadgeCounts } from '@/lib/firestore/nav-badges'
import { ROUTES } from '@/lib/routes'
import WorkTabs from './WorkTabs'

export default async function WorkLayout({ children }: { children: React.ReactNode }) {
  const user = await getServerUser()
  if (!user) redirect(ROUTES.signIn)

  const { pendingCount, applicationsCount } = await getNavBadgeCounts(user.id)

  return (
    <div className="work-page scholara-work">
      <div className="work-header mb-4">
        <h1 className="page-title">My work</h1>
        <p className="page-subtitle">
          Applications you sent, people asking to join your papers, and papers you own.
        </p>
      </div>

      <WorkTabs
        pendingCount={pendingCount}
        applicationsCount={applicationsCount}
      />

      <div className="work-panel">{children}</div>
    </div>
  )
}
