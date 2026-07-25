export type ContactPrefs = {
  email?: boolean
  whatsapp?: string
  other?: string
} | null | undefined

export type ContactFields = {
  email: string
  whatsapp: string
  other: string
}

/** Pre-fill contact fields from saved profile preferences. */
export function contactFromPrefs(prefs: ContactPrefs, authEmail: string): ContactFields {
  const shareEmail = prefs?.email !== false
  return {
    email: shareEmail ? authEmail : '',
    whatsapp: prefs?.whatsapp?.trim() ?? '',
    other: prefs?.other?.trim() ?? '',
  }
}
