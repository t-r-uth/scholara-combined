/**
 * Profile completeness for the owner's profile UI.
 * Counts core identity fields collaborators expect to see.
 */

export type ProfileCompletionInput = {
  display_name?: string | null
  institution?: string | null
  field_of_study?: string | null
  bio?: string | null
  orcid_id?: string | null
  contact_prefs?: {
    email?: boolean
    whatsapp?: string
    other?: string
  } | null
}

export type ProfileCompletionItem = {
  key: string
  label: string
  done: boolean
}

function hasText(value: string | null | undefined): boolean {
  return typeof value === 'string' && value.trim().length > 0
}

export function getProfileCompletion(profile: ProfileCompletionInput): {
  percent: number
  filled: number
  total: number
  items: ProfileCompletionItem[]
  missing: ProfileCompletionItem[]
} {
  const contact = profile.contact_prefs
  const hasContact =
    !!contact?.email ||
    hasText(contact?.whatsapp) ||
    hasText(contact?.other)

  const items: ProfileCompletionItem[] = [
    { key: 'display_name', label: 'Full name', done: hasText(profile.display_name) },
    { key: 'institution', label: 'Institution', done: hasText(profile.institution) },
    { key: 'field_of_study', label: 'Field of research', done: hasText(profile.field_of_study) },
    { key: 'bio', label: 'Bio', done: hasText(profile.bio) },
    { key: 'orcid', label: 'ORCID iD', done: hasText(profile.orcid_id) },
    { key: 'contact', label: 'Contact preference', done: hasContact },
  ]

  const filled = items.filter((item) => item.done).length
  const total = items.length
  const percent = Math.round((filled / total) * 100)

  return {
    percent,
    filled,
    total,
    items,
    missing: items.filter((item) => !item.done),
  }
}
