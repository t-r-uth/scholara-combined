/**
 * Central route definitions for the Scholara app.
 * Use these instead of hardcoding path strings throughout the codebase.
 */

export const ROUTES = {
  // ── Public ──────────────────────────────────────────────────────────────────
  home:     '/',
  signIn:   '/sign-in',
  discover: '/discover',

  // ── App (requires auth) ──────────────────────────────────────────────────
  work:              '/work',
  workApplications:  '/work/applications',
  workApplicants:    '/work/applicants',
  workPapers:        '/work/papers',
  workTracking:      '/work/tracking',
  /** @deprecated use workApplicants — kept as alias for old links */
  inbox:             '/work/applicants',
  /** @deprecated use workApplications — kept as alias for old links */
  applications:      '/work/applications',
  notifications:     '/notifications',
  messages:          '/messages',
  message:           (applicationId: string) => `/messages/${applicationId}`,

  // ── Papers ──────────────────────────────────────────────────────────────────
  paperNew:    '/papers/new',
  paper:       (id: string)               => `/papers/${id}`,
  /** Owner Manage tab; optional stage scroll target. */
  paperManage: (id: string, stageId?: string) => {
    const base = `/papers/${id}?tab=manage`
    return stageId ? `${base}&stage=${stageId}` : base
  },
  paperEdit:   (id: string)               => `/papers/new?edit=${id}`,

  // ── Profile ─────────────────────────────────────────────────────────────────
  profileMe:     '/profile/me',
  profileMeEdit: '/profile/me/edit',
  profileMeOrcid: (status: 'verified' | 'error' | 'conflict') =>
    `/profile/me/edit?orcid=${status}`,
  profile: (id: string) => `/profile/${id}`,

  // ── API ─────────────────────────────────────────────────────────────────────
  api: {
    session:      '/api/auth/session',
    register:     '/api/auth/register',
    orcidLink:    '/api/auth/orcid/link',
    orcidCallback:'/api/auth/orcid/callback',
    navBadges:    '/api/nav-badges',
  },
} as const
