# Scholara

Academic research collaboration marketplace. Researchers post papers seeking contributors; contributors apply to specific stages. Built for Malaysian universities but open globally.

## Commands

```bash
npm run dev          # start dev server (localhost:3000)
npm run dev:clean    # clear .next cache then dev
npm run build        # production build
npm run lint         # ESLint
npx tsc --noEmit     # type-check without building
```

## Stack

- **Next.js 14 App Router** — RSC by default; client components only when state/events needed
- **Firebase Admin SDK** — Firestore + Auth on the server (`src/lib/firebase/admin.ts`)
- **Firebase Client SDK** — Auth only on the client (`src/lib/firebase/client.ts`)
- **Resend** — transactional email
- **No ORM** — raw Firestore queries throughout

## Project Structure

```
src/
  app/
    (app)/           # authenticated app routes (layout has auth guard)
      discover/      # public paper feed
      inbox/         # paper owner's incoming applications
      papers/
        new/         # create/edit paper form (NewPaperForm.tsx)
        [id]/        # paper detail + owner actions + contributor apply
      profile/
        me/          # own profile + settings
        [id]/        # public profile view
    api/
      auth/          # session cookie, register, ORCID link callback
    sign-in/         # email+Google sign-in page
    LandingClient.tsx  # landing page for logged-out visitors
  lib/
    firebase/
      admin.ts       # getAdminAuth(), getAdminDb(), batchGetByIds(), db proxy
      session.ts     # getServerUser() — reads session cookie
    labels.ts        # all human-readable label maps (STAGE_LABELS, CONTRIBUTION_LABELS, etc.)
    routes.ts        # all route path constants — use ROUTES.x instead of hardcoding strings
    orcid.ts         # ORCID OAuth token exchange
  components/        # shared UI (UserAvatar, Modal, ReportButton, etc.)
```

## Auth Model

- **Sign-in**: Google OAuth or email/password via Firebase Auth
- **Session**: Firebase session cookie (7-day) set via `/api/auth/session`
- **ORCID**: Verification only — linked to existing account via `/api/auth/orcid/link`, not used for sign-in
- **Server user**: always use `getServerUser()` from `src/lib/firebase/session.ts`

## Firestore Collections

| Collection | Key fields |
|---|---|
| `users` | `display_name`, `institution`, `field_of_study`, `bio`, `orcid_id`, `orcid_verified`, `contact_prefs`, `email` |
| `papers` | `owner_id`, `status` (draft/published), `teaser_title`, `full_title`, `description`, `full_abstract`, `teaser_description`, `abstract_visibility`, `study_type`, `scope`, `dataset_size`, `access_type`, `allowed_institutions`, `stage_types`, `authorship_offer`, `authorship_order`, `target_journal`, `submission_timeline`, `additional_terms`, `external_doc_link` |
| `stages` | `paper_id`, `type`, `status` (open/closed/filled), `description` |
| `applications` | `paper_id`, `stage_id`, `applicant_id`, `status` (interest_registered → accepted/rejected), `message`, `timeframe` |
| `contributions` | `paper_id`, `stage_id`, `contributor_id`, `status` (in_progress/submitted/completed), `coauthorship` (pending/granted/declined) |
| `notifications` | `user_id`, `type`, `payload`, `read`, `created_at` |

### Abstract visibility values
- `'public'` — shown to all logged-in users
- `'accepted_only'` — shown only after acceptance (private section)
- `'teaser_only'` — `teaser_description` shown publicly; full abstract never shown

### Firestore limits
- Batch writes: 400 docs per batch (Firestore max is 500; leave headroom)
- `where('field', 'in', ids)`: 30 IDs max per query — use `batchGetByIds()` for bulk reads

## Application Rules

- Status flow: `interest_registered` → `accepted` / `rejected`
- Max 3 active contributions (`status: 'in_progress'` or `'submitted'`) at once — enforced server-side
- Cannot apply to the same stage twice — checked inside a Firestore transaction
- Statement of intent minimum: 100 characters

## Design System

- **Fonts**: Bricolage Grotesque (display, `var(--font-display)`) + Hanken Grotesk (body)
- **Colors**: OKLCH throughout; blue-tinted neutrals (hue 250–255); trust-blue accent
- **ORCID green** (`#A6CE39`) — used only for ORCID badges, never as a general UI accent
- **Tokens**: `--surface-1/2/3`, `--text-primary/secondary/muted/accent`, `--border/border-strong/border-accent`, `--btn-bg/btn-fg`, `--radius` (8px), `--radius-lg` (14px), `--shadow-sm/md`, `--ease-out-quart`, `--ease-out-expo`
- **Semantic tokens**: `--bg-error/text-error/border-error`, `--bg-success/text-success/border-success`, `--bg-warning/text-warning/border-warning`
- All styles in `src/app/globals.css` — no CSS modules or Tailwind

## Conventions

- **Server components** by default; add `'use client'` only when needed
- **Server actions** in `actions.ts` colocated with the route — always call `getServerUser()` first and throw if null
- **Labels**: all display strings live in `src/lib/labels.ts` — don't hardcode labels in components
- **Firestore reads in RSC**: call `db.collection(...)` directly — `db` is the lazy proxy from `admin.ts`
- **Form fields**: use `profile-field` / `profile-field__label` / `profile-field__input` / `field-select` classes from globals.css
- **Buttons**: `btn-primary`, `btn-publish`, `btn-ghost`, `btn-primary--compact`, `btn-ghost--compact`
- **TypeScript**: no `any` — use explicit casts (`as string`) when reading Firestore data

## What NOT to do

- Don't add Tailwind or CSS modules — everything goes in `globals.css`
- Don't use `border-left` > 1px as a coloured accent stripe (design rule)
- Don't use gradient text (`background-clip: text`)
- Don't mock Firestore in tests — use real queries
- Don't commit `.env.local`
- Don't use `adminAuth` or `db` proxies for new code — use `getAdminAuth()` and `getAdminDb()` directly (proxies kept for backward compat only)
