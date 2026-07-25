'use server'
import { db } from '@/lib/firebase/admin'
import { getServerUser } from '@/lib/firebase/session'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

const ORCID_PATTERN = /^\d{4}-\d{4}-\d{4}-\d{3}[\dX]$/

export async function updateProfile(formData: FormData) {
  const user = await getServerUser()
  if (!user) redirect('/')

  const orcidRaw = (formData.get('orcid_id') as string)?.trim() || null

  // Validate ORCID format if provided
  if (orcidRaw && !ORCID_PATTERN.test(orcidRaw)) {
    throw new Error('Invalid ORCID iD format. Use 0000-0000-0000-0000.')
  }

  const contactPrefs: Record<string, string | boolean> = {}
  if (formData.get('contact_email')) contactPrefs.email = true
  const whatsapp = formData.get('contact_whatsapp') as string
  if (whatsapp?.trim()) contactPrefs.whatsapp = whatsapp.trim()
  const other = formData.get('contact_other') as string
  if (other?.trim()) contactPrefs.other = other.trim()

  // Fetch existing profile to check if ORCID is already verified via OAuth
  const existingSnap = await db.collection('users').doc(user.id).get()
  const existing = existingSnap.data()
  const orcidVerified = existing?.orcid_verified as boolean | undefined

  const displayName = (formData.get('display_name') as string)?.trim() || null
  const institution = (formData.get('institution') as string)?.trim() || null

  const update: Record<string, unknown> = {
    email: user.email,
    display_name: displayName,
    job_title: (formData.get('job_title') as string)?.trim() || null,
    institution,
    field_of_study: (formData.get('field_of_study') as string)?.trim() || null,
    bio: (formData.get('bio') as string)?.trim() || null,
    contact_prefs: contactPrefs,
    email_notifications: !!formData.get('email_notifications'),
  }

  // Only allow manual ORCID iD if not already verified via OAuth
  if (!orcidVerified) {
    update.orcid_id = orcidRaw
  }

  await db.collection('users').doc(user.id).set(update, { merge: true })

  // Keep denormalized owner fields on papers in sync for search
  const papersSnap = await db.collection('papers').where('owner_id', '==', user.id).get()
  if (!papersSnap.empty) {
    const batch = db.batch()
    for (const doc of papersSnap.docs) {
      batch.update(doc.ref, {
        owner_name: displayName,
        owner_institution: institution,
      })
    }
    await batch.commit()
  }

  revalidatePath('/profile/me')
  revalidatePath('/profile/me/edit')
  revalidatePath('/discover')
}
