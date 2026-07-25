# Scholara — Combined Application

This workspace merges two repositories into one cohesive Next.js app:

| Source repo | Role in combined app |
|---|---|
| [t-r-uth/rs-app](https://github.com/t-r-uth/rs-app) | **Backend & auth** — ORCID login, Firebase/Firestore, API routes, paper/application workflows |
| [t-r-uth/scholara-google-stitch-try](https://github.com/t-r-uth/scholara-google-stitch-try) | **UI/UX** — Sidebar, header, discover feed styling, Google Drive sharing UX |

## Architecture

```
Next.js 14 (rs-app base)
├── Auth: ORCID OAuth → Firebase session cookie
├── Data: Firestore (papers, stages, applications, contributions)
├── API: /api/auth/*, /api/nav-badges, cron jobs
└── UI shell: Scholara components (from scholara-google-stitch-try)
    ├── Sidebar + Header + Mobile nav
    ├── Discover feed (wired to Firestore)
    └── Google Drive connection badge (UI preference)
```

## What came from where

### From rs-app (kept as-is)
- All authentication (`/sign-in`, ORCID OAuth, session management)
- Firestore data layer and server actions
- Paper creation, applications, inbox, tracking, messages, notifications
- Profile management
- `external_doc_link` field for Google Doc/Drive URLs on papers

### From scholara-google-stitch-try (ported)
- Visual design: navy `#233242`, accent green `#8CC63F`, Material Symbols icons
- `Sidebar`, `Header`, mobile bottom navigation
- Discover page card layout and filter bar styling
- Google Drive connection badge in header (UI state)
- Original UI components preserved in `src/components/scholara-ui/` for reference

### New integration layer (`src/components/scholara/`)
- `ScholaraShell.tsx` — server wrapper fetching user profile + badge counts
- `ScholaraShellClient.tsx` — layout shell replacing old top NavBar
- `DiscoverFeed.tsx` — scholara-styled cards linked to rs-app paper routes
- `DiscoverFilters.tsx` — scholara-styled filters wired to discover query params
- `src/lib/scholara-routes.ts` — maps sidebar tabs to rs-app routes
- `src/lib/google-drive.ts` — localStorage preference for Drive badge

## How to run

### 1. Install dependencies

```bash
npm install
```

### 2. Configure environment

Copy `.env.example` to `.env.local` and fill in:

- **Firebase** — client + admin credentials
- **ORCID** — sandbox client ID/secret (defaults to sandbox)
- **Resend** — for email notifications (optional for local dev)
- `NEXT_PUBLIC_BASE_URL=http://localhost:3000`

### 3. Start dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). You'll land on Discover. Sign in via **Sign in with ORCID** (top right or `/sign-in`).

### 4. Build for production

```bash
npm run build
npm start
```

## Firebase & ORCID setup (step-by-step)

Use this checklist for **local** (`.env.local`) and **Vercel** (Project → Settings → Environment Variables). Values must match between Firebase, ORCID, and your app URL.

### A. Firebase project

1. Open [Firebase Console](https://console.firebase.google.com/) → **Create a project** (or reuse an existing one such as `rsproject-4a335` if you already use the rs-app Firestore data).
2. **Build → Firestore Database → Create database** (production mode is fine; this repo includes `firestore.rules` and `firestore.indexes.json`).
3. **Build → Authentication → Get started**. You do not need to enable Google/email providers for ORCID sign-in; the app signs users in with **custom tokens** from the Admin SDK after ORCID OAuth.
4. **Client SDK config** (Project settings → General → *Your apps* → Web app → Config):
   | Env var | Firebase console field |
   |---|---|
   | `NEXT_PUBLIC_FIREBASE_API_KEY` | `apiKey` |
   | `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | `authDomain` (e.g. `your-project.firebaseapp.com`) |
   | `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | `projectId` |
5. **Admin SDK / service account** (Project settings → **Service accounts** → *Firebase Admin SDK* → **Generate new private key** → download JSON):
   | Env var | JSON field |
   |---|---|
   | `FIREBASE_PROJECT_ID` | `project_id` |
   | `FIREBASE_CLIENT_EMAIL` | `client_email` |
   | `FIREBASE_PRIVATE_KEY` | `private_key` (paste PEM; on Vercel you can use literal `\n` newlines — the app normalizes them) |
6. **Authorized domains** (Authentication → Settings → **Authorized domains**): add `localhost`, your Vercel hostname (`*.vercel.app` is not supported as a wildcard — add the exact preview/production hostnames), and any custom domain.
7. **Deploy Firestore rules/indexes** (from this repo, with [Firebase CLI](https://firebase.google.com/docs/cli) logged in):

   ```bash
   npm i -g firebase-tools
   firebase login
   firebase use rsproject-4a335   # or: firebase use --add
   firebase deploy --only firestore
   ```

   Update `.firebaserc` `projects.default` if your project ID differs.

### B. ORCID OAuth (sandbox for dev)

1. Create a sandbox user at [sandbox.orcid.org](https://sandbox.orcid.org/register).
2. Sign in → **Developer tools** → **Register for the ORCID API** → create a **Web application**.
3. **Redirect URI** (must match `ORCID_REDIRECT_URI` **character-for-character**):
   - Local: `http://localhost:3000/api/auth/orcid/callback`
   - Production: `https://<your-vercel-domain>/api/auth/orcid/callback`
   - Register **both** if you test locally and on Vercel (ORCID allows multiple redirect URIs).
4. Copy **Client ID** and **Client secret** into:
   | Env var | Source |
   |---|---|
   | `ORCID_CLIENT_ID` | ORCID app Client ID |
   | `ORCID_CLIENT_SECRET` | ORCID app Client secret |
   | `ORCID_REDIRECT_URI` | One registered redirect URI for the environment you are running |
5. Leave `ORCID_BASE_URL` and `ORCID_API_BASE_URL` **unset** for sandbox (defaults: `https://sandbox.orcid.org` and `https://pub.sandbox.orcid.org/v3.0`). For production ORCID, set `ORCID_BASE_URL=https://orcid.org` and `ORCID_API_BASE_URL=https://pub.orcid.org/v3.0` and register a production ORCID API app at [orcid.org](https://orcid.org/developer-tools).
6. Set `NEXT_PUBLIC_BASE_URL` to the same origin users see (`http://localhost:3000` locally, `https://your-app.vercel.app` in production). Email links and post-OAuth redirects use this value.

### C. Optional: email (Resend)

1. [Resend](https://resend.com/) → API Keys → create key → `RESEND_API_KEY`.
2. Verify a sending domain or use Resend’s test domain; set `EMAIL_FROM` (default in code: `Scholara <noreply@scholara.app>`).

### D. Production-only: Vercel Cron

1. Generate a long random string → `CRON_SECRET`.
2. Add it in Vercel env vars; scheduled routes in `vercel.json` expect `Authorization: Bearer <CRON_SECRET>`.

### E. After first Vercel deploy

1. Note the deployment URL (e.g. `https://scholara-combined.vercel.app`).
2. Set `NEXT_PUBLIC_BASE_URL` and `ORCID_REDIRECT_URI` to that URL (no trailing slash on base URL).
3. Add the same callback URL in the ORCID app redirect list → **Redeploy** on Vercel.
4. Add the Vercel hostname under Firebase **Authorized domains** → test `/sign-in` → ORCID → return to `/discover`.

## Deploy to Vercel

### Prerequisites

- A [Firebase](https://console.firebase.google.com/) project with Firestore enabled
- An [ORCID sandbox](https://sandbox.orcid.org/developer-tools) or production OAuth app
- (Optional) [Resend](https://resend.com/) API key for transactional email

### Environment variables

Set these in **Vercel → Project → Settings → Environment Variables** (Production, Preview, and Development as needed). Copy from `.env.example`.

| Variable | Required | Notes |
|---|---|---|
| `NEXT_PUBLIC_FIREBASE_API_KEY` | Yes | Firebase web app config |
| `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN` | Yes | e.g. `your-project.firebaseapp.com` |
| `NEXT_PUBLIC_FIREBASE_PROJECT_ID` | Yes | Same as Firebase project ID |
| `FIREBASE_PROJECT_ID` | Yes | Admin SDK service account |
| `FIREBASE_CLIENT_EMAIL` | Yes | Admin SDK service account |
| `FIREBASE_PRIVATE_KEY` | Yes | Paste full PEM; keep `\n` newlines or real line breaks |
| `ORCID_CLIENT_ID` | Yes | ORCID OAuth client |
| `ORCID_CLIENT_SECRET` | Yes | ORCID OAuth secret |
| `ORCID_REDIRECT_URI` | Yes | `https://<your-domain>/api/auth/orcid/callback` |
| `NEXT_PUBLIC_BASE_URL` | Yes | `https://<your-domain>` (no trailing slash) |
| `CRON_SECRET` | Yes (prod) | Random string; Vercel cron routes verify this bearer token |
| `RESEND_API_KEY` | No | Email notifications |
| `EMAIL_FROM` | No | Default: `Scholara <noreply@scholara.app>` |
| `ORCID_BASE_URL` | No | Set only for production ORCID (`https://orcid.org`) |
| `ORCID_API_BASE_URL` | No | Set only for production ORCID API |

**Firebase private key on Vercel:** paste the key with literal `\n` characters, or use multiline value. Do not wrap in extra quotes unless your PEM already includes them.

**ORCID redirect:** register the production callback URL in your ORCID developer app before testing sign-in.

### Deploy via GitHub (recommended)

1. Push this repo to GitHub (e.g. `t-r-uth/scholara`):

   ```bash
   git init   # if not already initialized
   git add .
   git commit -m "Initial Scholara combined app"
   git remote add origin git@github.com:t-r-uth/<repo-name>.git
   git push -u origin main
   ```

2. In [Vercel](https://vercel.com/new), **Import** the GitHub repository.
3. Framework preset: **Next.js** (auto-detected). Root directory: `.`
4. Add all environment variables above, then **Deploy**.
5. After the first deploy, set `NEXT_PUBLIC_BASE_URL` and `ORCID_REDIRECT_URI` to your Vercel URL (or custom domain), redeploy, and update the ORCID app redirect URI to match.

Cron jobs in `vercel.json` run automatically on Vercel Pro (or with cron enabled on your plan).

### Deploy via Vercel CLI

```bash
npm i -g vercel   # if not installed
vercel login
vercel            # link project, follow prompts
vercel env add    # add each variable interactively
vercel --prod
```

### Post-deploy checklist

- [ ] ORCID developer app redirect URI matches `ORCID_REDIRECT_URI`
- [ ] Firebase Auth authorized domains include your Vercel domain
- [ ] Firestore rules/indexes deployed (`firebase deploy --only firestore`)
- [ ] Sign-in flow: `/sign-in` → ORCID → `/discover`
- [ ] Cron routes return 401 without `CRON_SECRET` bearer (smoke test)

## Key user flows

| Flow | Route | Backend |
|---|---|---|
| Browse papers | `/discover` | Firestore `papers` collection |
| Sign in | `/sign-in` → ORCID OAuth | `/api/auth/orcid/*` |
| Post paper | Sidebar "Submit Paper" → `/papers/new` | Server actions + Firestore |
| My papers | Sidebar "My Papers" → `/work/papers` | Owner's papers |
| Applications | Sidebar "Applied" → `/work/applications` | Applicant view |
| Tracker | Sidebar "Tracker" → `/work/tracking` | Contribution tracking |
| Profile | Sidebar "Settings" → `/profile/me` | User profile + ORCID |

## Google Drive sharing

**Status: Partially integrated (link-based, not OAuth API)**

The scholara prototype had a UI-only Google Drive toggle. The combined app:

1. **Header badge** — Click "Connect Google Drive" to mark your workspace as Drive-ready (stored in `localStorage`). This is a UX indicator, not a Google OAuth integration.
2. **Paper links** — When posting a paper at `/papers/new`, use the **External doc link** field to paste a Google Docs/Drive URL (`external_doc_link` in Firestore).
3. **After matching** — Paper owners share Google Doc links with accepted contributors via the Manage tab on `/papers/[id]` (existing rs-app flow).

There is **no** Google Drive OAuth API integration — manuscripts are referenced by shared links only, matching the rs-app spec ("no document upload, link shared after connection").

To add real Google OAuth later, you would need:
- Google Cloud OAuth client with `drive.file` scope
- New API route (e.g. `/api/auth/google/callback`)
- Token storage in Firestore user profile

## Remaining gaps / manual steps

1. **Firebase project required** — App won't fetch data without valid Firebase credentials
2. **ORCID sandbox account** — Register at [sandbox.orcid.org](https://sandbox.orcid.org) for local auth testing
3. **Work/profile pages** — Still use rs-app's functional UI inside the scholara shell (not fully restyled like Discover)
4. **Discussion/tracker mock views** — scholara's `PaperDiscussionView`, `TrackerView` etc. are in `scholara-ui/` but not wired (rs-app uses real messaging/tracking instead)
5. **Production env vars** — Firebase, ORCID redirect URI, and `CRON_SECRET` must be set on Vercel before sign-in works in production

## File changes summary

| Action | Path |
|---|---|
| Created | `src/components/scholara/*` (shell, sidebar, header, discover) |
| Created | `src/lib/scholara-routes.ts`, `src/lib/google-drive.ts` |
| Copied (reference) | `src/components/scholara-ui/*` |
| Modified | `src/app/(app)/layout.tsx` — uses ScholaraShell |
| Modified | `src/app/(app)/discover/page.tsx` — scholara discover feed |
| Modified | `src/app/layout.tsx` — Material Symbols + Source Serif font |
| Modified | `src/app/globals.css` — scholara shell styles |
| Modified | `src/app/(app)/work/layout.tsx` — minor shell compatibility |
