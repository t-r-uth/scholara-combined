import Link from 'next/link'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { getServerUser } from '@/lib/firebase/session'
import { getAdminDb } from '@/lib/firebase/admin'
import { ROUTES } from '@/lib/routes'
import ProfileForm from '../ProfileForm'

export const metadata = { title: 'Edit profile — Scholara' }

export default async function EditProfilePage() {
  const user = await getServerUser()
  if (!user) redirect(ROUTES.signIn)

  const profileSnap = await getAdminDb().collection('users').doc(user.id).get()
  const profile = profileSnap.data() ?? null
  const name = (profile?.display_name as string | undefined) || ''

  return (
    <div className="profile-page">
      <Link href={ROUTES.profileMe} className="paper-detail__back">← Profile</Link>

      <div className="profile-settings profile-settings--edit">
        <h1 className="profile-settings__heading">Edit profile</h1>
        <p className="profile-settings__sub">
          Complete your details so collaborators know who you are and how to reach you.
        </p>
        <Suspense>
          <ProfileForm
            name={name}
            profile={{
              job_title:     (profile?.job_title     as string | null)  ?? null,
              institution:   (profile?.institution   as string | null)  ?? null,
              field_of_study:(profile?.field_of_study as string | null) ?? null,
              bio:           (profile?.bio           as string | null)  ?? null,
              orcid_id:      (profile?.orcid_id      as string | null)  ?? null,
              orcid_verified:(profile?.orcid_verified as boolean)       ?? false,
              contact_prefs: (profile?.contact_prefs as {
                email?: boolean; whatsapp?: string; other?: string
              } | null) ?? null,
              email_notifications: (profile?.email_notifications as boolean | undefined) ?? true,
            }}
          />
        </Suspense>
      </div>
    </div>
  )
}
