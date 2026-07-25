/** Trim env value; treat blank as unset so Vercel empty strings fall back to defaults. */
function envOr(value: string | undefined, fallback: string) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : fallback
}

const PLACEHOLDER_PATTERN = /^\[(?:SENSITIVE|REDACTED|SECRET|REMOVED)\]$/i

function cleanEnv(value: string | undefined): string | undefined {
  const trimmed = value?.replace(/^\uFEFF/, '').trim().replace(/^['"]+|['"]+$/g, '')
  if (!trimmed || PLACEHOLDER_PATTERN.test(trimmed)) return undefined
  return trimmed
}

function requireEnv(name: string, value: string | undefined): string {
  const cleaned = cleanEnv(value)
  if (!cleaned) {
    throw new Error(
      `${name} is missing or set to a placeholder like [SENSITIVE]. ` +
        'Copy the real value from your rs-app Vercel project or ORCID developer account.',
    )
  }
  return cleaned
}

function cleanEnvUrl(value: string | undefined): string | undefined {
  return cleanEnv(value)
}

/** Ensure ORCID host env vars are absolute https URLs. */
function resolveOrcidUrl(
  value: string | undefined,
  fallback: string,
  originOnly: boolean,
): string {
  for (const candidate of [cleanEnvUrl(value), fallback]) {
    if (!candidate) continue
    let raw = candidate
    if (!/^https?:\/\//i.test(raw)) {
      raw = `https://${raw}`
    }
    try {
      const parsed = new URL(raw)
      if (!parsed.hostname || parsed.hostname.includes('[')) continue
      if (originOnly) {
        return `${parsed.protocol}//${parsed.host}`
      }
      const path = parsed.pathname.replace(/\/+$/, '')
      return `${parsed.protocol}//${parsed.host}${path}`
    } catch {
      continue
    }
  }
  return originOnly ? 'https://sandbox.orcid.org' : 'https://pub.sandbox.orcid.org/v3.0'
}

export const ORCID_BASE = resolveOrcidUrl(
  process.env.ORCID_BASE_URL,
  'https://sandbox.orcid.org',
  true,
)
export const ORCID_API_BASE = resolveOrcidUrl(
  process.env.ORCID_API_BASE_URL,
  'https://pub.sandbox.orcid.org/v3.0',
  false,
)

export function getOrcidAuthUrl(state: string): string {
  const clientId = requireEnv('ORCID_CLIENT_ID', process.env.ORCID_CLIENT_ID)
  const redirectUri = requireEnv('ORCID_REDIRECT_URI', process.env.ORCID_REDIRECT_URI)

  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'code',
    scope: '/authenticate',
    redirect_uri: redirectUri,
    state,
  })
  const authorizeUrl = new URL('/oauth/authorize', `${ORCID_BASE}/`)
  authorizeUrl.search = params.toString()
  return authorizeUrl.toString()
}

export async function exchangeOrcidCode(code: string): Promise<{
  access_token: string
  orcid: string
  name: string
}> {
  const clientId = requireEnv('ORCID_CLIENT_ID', process.env.ORCID_CLIENT_ID)
  const clientSecret = requireEnv('ORCID_CLIENT_SECRET', process.env.ORCID_CLIENT_SECRET)
  const redirectUri = requireEnv('ORCID_REDIRECT_URI', process.env.ORCID_REDIRECT_URI)

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
