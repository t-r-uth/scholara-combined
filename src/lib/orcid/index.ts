function envOr(value: string | undefined, fallback: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

export const ORCID_BASE = envOr(process.env.ORCID_BASE_URL, 'https://sandbox.orcid.org')
export const ORCID_API_BASE = envOr(
  process.env.ORCID_API_BASE_URL,
  'https://pub.sandbox.orcid.org/v3.0'
)

export function getOrcidAuthUrl(state: string): string {
  const clientId = process.env.ORCID_CLIENT_ID?.trim()
  const redirectUri = process.env.ORCID_REDIRECT_URI?.trim()
  if (!clientId || !redirectUri) {
    throw new Error('ORCID_CLIENT_ID and ORCID_REDIRECT_URI must be set.')
  }

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: '/authenticate',
    redirect_uri: redirectUri,
    state,
  })
  return `${ORCID_BASE}/oauth/authorize?${params}`
}

export async function exchangeOrcidCode(code: string): Promise<{
  access_token: string
  orcid: string
  name: string
}> {
  const clientId = process.env.ORCID_CLIENT_ID?.trim()
  const clientSecret = process.env.ORCID_CLIENT_SECRET?.trim()
  const redirectUri = process.env.ORCID_REDIRECT_URI?.trim()
  if (!clientId || !clientSecret || !redirectUri) {
    throw new Error('ORCID_CLIENT_ID, ORCID_CLIENT_SECRET, and ORCID_REDIRECT_URI must be set.')
  }

  const res = await fetch(`${ORCID_BASE}/oauth/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
    },
    body: new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: 'authorization_code',
      code,
      redirect_uri: redirectUri,
    }),
  })
  if (!res.ok) {
    const body = await res.text()
    throw new Error(`ORCID token exchange failed ${res.status}: ${body}`)
  }
  return res.json()
}

export async function getOrcidRecord(orcidId: string, accessToken: string) {
  const res = await fetch(`${ORCID_API_BASE}/${orcidId}/record`, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
      Accept: 'application/vnd.orcid+json',
    },
  })
  if (!res.ok) return null
  return res.json()
}
