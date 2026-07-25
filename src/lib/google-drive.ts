const STORAGE_KEY = 'scholara_google_drive_connected'

/** UI preference for Google Drive workspace — link sharing uses external_doc_link from rs-app backend. */
export function getGoogleDriveConnected(): boolean {
  if (typeof window === 'undefined') return false
  return localStorage.getItem(STORAGE_KEY) === 'true'
}

export function setGoogleDriveConnected(connected: boolean): void {
  if (typeof window === 'undefined') return
  localStorage.setItem(STORAGE_KEY, connected ? 'true' : 'false')
}
