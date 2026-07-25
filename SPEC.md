# Scholara — Technical Specification & Build Plan

**Version:** 1.0 (MVP scope)
**Product summary:** A marketplace where researchers post papers that need help (writing, analysis, references, review) and other researchers discover, apply, and get matched to contribute — then take the actual collaboration off-platform (email/WhatsApp/etc). Think "Mudah/Craigslist for research collaboration," not "Google Docs for research collaboration."

---

## 1. Core product loop

1. **Post** — A researcher creates a listing for their paper: what it's about, what kind of help is needed, and who's allowed to apply (open to all / specific institutions / invite only).
2. **Discover** — Other researchers browse/search/filter open listings by field, help type, and scope.
3. **Apply** — An interested researcher applies to a specific contribution stage (e.g. "Data analysis") with a short message.
4. **Match** — The paper owner reviews applicants and accepts one (per stage).
5. **Connect** — Once accepted, both sides choose how they want to be contacted (email / WhatsApp / other) and that contact info is revealed to each other. Collaboration itself happens off-platform.
6. **Track** — The owner marks a stage as in-progress → completed, and can flag a contributor as a co-author. This builds each researcher's public track record (contributed / co-authored counts) on their profile.

**Explicitly out of scope for v1** (per decision): no document upload, no in-document markup/comments/suggested-edits, no in-app real-time editing. The paper's actual working document (Google Doc / Overleaf link) is never processed by Scholara — it's just referenced as a private link shared after connection, if the owner chooses to include one.

---

## 2. User roles

- **Owner** — posted the paper, manages applicants, decides matches and co-authorship.
- **Contributor** — applies to stages, gets matched, does the work off-platform, gets tracked on their profile.
- Every user can be both, on different papers. No separate "account type" — it's all one researcher profile.

---

## 3. Feature scope

### v1 (MVP — what we build first)
- ORCID OAuth login (identity verification)
- Researcher profile (institution, field, bio, ORCID badge, stats)
- Post a paper listing with 1+ contribution stages
- Discover feed: search + filter (help type, scope, access type)
- Paper detail page (stages, apply button)
- Apply to a stage (with message)
- Owner inbox: review & accept/reject applicants
- Connect step: contact-method exchange after acceptance
- Stage status tracking (open → filled → completed)
- Manual co-authorship flag by owner
- Email notifications (new applicant, application accepted/rejected, stage completed)

### v1.1 (fast follow, not launch-blocking)
- In-app saved searches / alerts ("notify me when a Data Analysis listing in Public Health opens")
- Institution allow-list verification (not just self-reported institution)
- Reporting / flagging a listing or user
- Public researcher search (find people, not just papers)

### v2+ (explicitly deferred)
- In-app messaging (currently: contact info hand-off instead)
- Native document viewer / collaborative markup (currently: out of scope entirely, per your call — sensitive data risk)
- Reputation/rating system between collaborators
- Institutional admin dashboards (e.g. a university seeing all its researchers' listings)

---

## 4. Data model (Postgres via Supabase)

```sql
-- Users (extends Supabase auth.users)
users
  id                uuid PK (= auth.users.id)
  orcid_id          text unique          -- e.g. 0000-0003-9876-5432
  orcid_verified    boolean default true -- true once ORCID OAuth completes
  display_name      text
  email             text
  institution       text
  field_of_study    text
  bio               text
  avatar_url        text
  contact_prefs     jsonb   -- e.g. {"email": true, "whatsapp": "+60...", "other": "..."}
  created_at        timestamptz

-- Paper listings
papers
  id                  uuid PK
  owner_id            uuid FK -> users.id
  teaser_title        text        -- shown publicly in feed
  full_title          text        -- shown only to accepted contributors
  description         text
  scope               text        -- 'global' | 'regional' | 'country'
  study_type          text        -- 'systematic_review' | 'mixed_methods' | 'framework' | ...
  dataset_size        text        -- 'none' | 'small' | 'medium' | 'large'
  access_type         text        -- 'open' | 'institution' | 'invite'
  allowed_institutions text[]     -- used when access_type = 'institution'
  status              text        -- 'draft' | 'published' | 'closed'
  external_doc_link   text        -- optional, revealed only after match
  created_at          timestamptz
  updated_at          timestamptz

-- Contribution stages within a paper
contribution_stages
  id            uuid PK
  paper_id      uuid FK -> papers.id
  type          text     -- 'writing' | 'references' | 'data_analysis' | 'review' | 'has_data'
  description   text
  status        text     -- 'open' | 'filled' | 'completed'
  created_at    timestamptz

-- Applications to a stage
applications
  id             uuid PK
  stage_id       uuid FK -> contribution_stages.id
  applicant_id   uuid FK -> users.id
  message        text
  status         text    -- 'pending' | 'accepted' | 'rejected' | 'withdrawn'
  created_at     timestamptz
  decided_at     timestamptz

-- Revealed once an application is accepted
connections
  id                uuid PK
  application_id    uuid FK -> applications.id unique
  owner_contact     jsonb   -- snapshot of owner's chosen contact method + value
  contributor_contact jsonb -- snapshot of contributor's chosen contact method + value
  created_at        timestamptz

-- Co-authorship / completion tracking
contributions
  id                uuid PK
  stage_id          uuid FK -> contribution_stages.id
  contributor_id    uuid FK -> users.id
  status            text    -- 'in_progress' | 'completed'
  coauthorship      text    -- 'not_decided' | 'granted' | 'declined'
  completed_at      timestamptz

-- Notifications
notifications
  id          uuid PK
  user_id     uuid FK -> users.id
  type        text    -- 'new_applicant' | 'application_accepted' | 'application_rejected' | 'stage_completed' | 'coauthor_decision'
  payload     jsonb
  read        boolean default false
  created_at  timestamptz
```

**Row-level security (Supabase RLS) notes:**
- `full_title`, `external_doc_link`, and `allowed_institutions` on `papers` should only be fully readable by the owner and accepted contributors (via a Postgres function checking `connections`/`contributions`), not the public feed.
- `applications.message` readable only by the applicant and the paper owner.
- `connections` readable only by the two parties involved.

---

## 5. Authentication: ORCID OAuth

ORCID supports standard OAuth 2.0 (authorization code flow) via their public API.

- Register an app at ORCID (sandbox first: `sandbox.orcid.org`, then production `orcid.org`) to get a `client_id`/`client_secret`.
- Supabase Auth supports custom OAuth providers — if ORCID isn't natively listed, implement it as a generic OAuth provider or handle the exchange in a Next.js API route (`/api/auth/orcid/callback`) and mint a Supabase session token afterward.
- On first login: pull `orcid-id`, name, and (optionally) public employment/affiliation data from ORCID's public API to prefill `institution` and `display_name`.
- Store `orcid_verified = true` once this flow completes — this becomes the trust badge shown across the product (the little green "iD" badge from your mockup).

---

## 6. Application architecture

**Stack:** Next.js (App Router) + Supabase (Postgres + Auth + Storage if ever needed) + Vercel (hosting) + Resend or Supabase's email hooks (transactional email).

```
/app
  /(marketing)/            -- public landing page, not gated
  /(app)/
    /discover/              -- feed + filters (Server Component, paginated)
    /papers/[id]/           -- paper detail + stages + apply
    /papers/new/            -- post-a-paper form
    /profile/[id]/          -- public profile
    /profile/me/            -- own profile + pending decisions
    /inbox/                 -- applicant review queue (owner side)
  /api/
    /auth/orcid/callback/
    /webhooks/notifications/
/components/
  /ui/                     -- shared design system pieces (cards, pills, buttons — reuse your mockup's visual language)
/lib/
  /supabase/               -- client + server helpers
  /orcid/                  -- ORCID API helpers
  /email/                  -- notification templates
/supabase/
  /migrations/             -- SQL migrations for the schema above
```

**Key server actions / API routes:**
- `createPaper`, `updatePaper`, `publishPaper`
- `applyToStage`, `withdrawApplication`
- `acceptApplication`, `rejectApplication` (writes to `applications`, `connections`, triggers notification)
- `completeStage`, `decideCoauthorship`
- `getDiscoverFeed(filters)` — server-side filtered query, paginated

**Design system:** Your mockup's CSS (pill colors per stage type, card style, `--surface`/`--text` CSS variables) is a genuinely solid starting design language — reuse it directly as your Tailwind theme tokens rather than redesigning from scratch.

---

## 7. Mockup screen → real route mapping

| Mockup screen | Real route | Notes |
|---|---|---|
| Discover | `/discover` | Server-rendered feed, filters as query params for shareable/bookmarkable searches |
| Paper detail | `/papers/[id]` | Stages + "Apply to contribute" now opens an application modal (message field) instead of instant action |
| Documents & markups | *(removed from v1)* | Superseded by the Connect step — see below |
| Post paper | `/papers/new` | Multi-step form; drafts saved to `status = 'draft'` |
| Profile | `/profile/me` | Pending decisions section becomes "Applications awaiting your review" + "Co-authorship decisions pending" |

**New screen needed (replacing "Documents & markups"): Connect / Applicant review**
- Owner side: list of applicants per stage, each with profile snippet + message + Accept/Reject buttons.
- On accept: modal asking "How should they reach you?" (email pre-filled from account, optional WhatsApp/other), then shows the contributor's chosen contact method back to the owner.
- Contributor side: once accepted, a simple "You're connected" card showing the owner's chosen contact info + any external doc link the owner chose to share.

---

## 8. Trust & safety considerations

- ORCID verification is a strong first layer, but consider a lightweight **report listing / report user** action from day one — low effort, high value once real people are on it.
- Rate-limit applications per user per day to reduce spam applications.
- Since contact info is being exchanged, be explicit in the UI that Scholara isn't responsible for what happens after the connect step (simple terms-of-service note).

---

## 9. Build phases

**Phase 1 — Foundation (week 1–2)**
- Supabase project + schema migrations + RLS policies
- ORCID OAuth login working end-to-end
- Profile create/edit page

**Phase 2 — Core marketplace (week 2–4)**
- Post a paper (form → draft → publish)
- Discover feed with filters
- Paper detail page

**Phase 3 — Matching (week 4–5)**
- Apply flow
- Owner applicant-review inbox
- Accept/reject + Connect (contact exchange) flow

**Phase 4 — Tracking & polish (week 5–6)**
- Stage status + completion
- Co-authorship decision flow
- Profile stats (contributed / in progress / co-authored)
- Email notifications

**Phase 5 — Launch prep**
- Basic report/flag mechanism
- Terms of service + privacy policy (contact-info handling is the sensitive bit)
- Seed with a small real cohort (your own network) before public launch

---

## 10. Open questions for the follow-up build session

1. Do you want papers to be **discoverable by search engines** (public SEO-friendly listing pages) or logged-in-only?
2. Should **institutions** be a fixed list you curate (e.g. Malaysian universities to start) or free-text?
3. Any preference on **email provider** (Resend, Supabase's built-in SMTP, Postmark)?
4. Do you want a **single global launch** or **Malaysia-first** (matches your mockup's UM/UTM/UPM example) before expanding scope?

---

*Next step: once you're ready, we scaffold the actual Next.js + Supabase project, starting with Phase 1.*

---

## 11. Build command (copy-paste into Claude Code or another coding agent)

Save this spec file into your project repo (e.g. as `SPEC.md`) before running the agent — the command below assumes it can read that file. Run phases one at a time; don't ask for the whole app in one shot.

### Phase 1 — Foundation

```
Read SPEC.md in this repo before doing anything else — it's the full technical spec for "Scholara," a research-collaboration marketplace.

Set up Phase 1 (Foundation) from the spec:

1. Scaffold a new Next.js 14+ App Router project with TypeScript and Tailwind CSS.
2. Set up a Supabase project connection (assume env vars NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY will be provided in .env.local — create a .env.example with these keys).
3. Write SQL migrations under /supabase/migrations implementing the full schema in section 4 of SPEC.md (users, papers, contribution_stages, applications, connections, contributions, notifications), including reasonable indexes and the RLS policies described (owner/contributor-only visibility for full_title, external_doc_link, allowed_institutions, application messages, and connections).
4. Implement ORCID OAuth login per section 5 of SPEC.md: an API route at /api/auth/orcid/callback that completes the OAuth code exchange, pulls the ORCID iD (and public name/affiliation if available), creates/updates a row in `users`, sets orcid_verified = true, and establishes a Supabase session. Use sandbox.orcid.org endpoints for now and make the ORCID/production base URL swappable via an env var.
5. Build a profile create/edit page at /profile/me where a logged-in user can set institution, field_of_study, bio, avatar_url, and contact_prefs (email/WhatsApp/other).
6. Reuse the visual language (card styles, pill colors per contribution-stage type, CSS variables for surface/text/border) from the attached mockup file scholara_dashboard_overview.html as the base Tailwind theme — don't redesign from scratch.

Stop after Phase 1 is working end-to-end (login → profile page) and give me a summary of what you built plus any decisions you made that I should know about.
```

### Phase 2 — Core marketplace

```
Read SPEC.md. Phase 1 (auth + profile) is done. Now build Phase 2:

1. Post-a-paper flow at /papers/new: multi-step form covering teaser_title, full_title, description, scope, study_type, dataset_size, access_type (+ allowed_institutions when access_type = 'institution'), and one or more contribution_stages (type + description each). Support saving as draft (status = 'draft') and publishing (status = 'published').
2. Discover feed at /discover: server-rendered, paginated list of published papers, with filters for help type (contribution stage type), scope, and access type, as query params so results are shareable/bookmarkable. Only show teaser_title publicly — never full_title, external_doc_link, or allowed_institutions to non-owners/non-contributors.
3. Paper detail page at /papers/[id]: shows teaser info to everyone, and full details (full_title, external_doc_link, allowed_institutions) only to the owner or accepted contributors per the RLS rules. Show each contribution stage with an "Apply to contribute" action (stub is fine for now, full apply flow comes in Phase 3).

Stop after Phase 2 and summarize what's built plus anything from SPEC.md you had to make a judgment call on.
```

### Phase 3 — Matching

```
Read SPEC.md. Phases 1–2 are done. Now build Phase 3 (Matching):

1. Real "Apply to contribute" flow: modal with a message field, writes to `applications` (status = 'pending').
2. Owner-side applicant review inbox at /inbox: lists pending applications across the owner's papers, grouped by paper/stage, each showing applicant profile snippet + message, with Accept/Reject actions.
3. On accept: mark stage status = 'filled', reject any other pending applications for that same stage, and trigger the Connect flow — a modal asking the owner "how should they reach you?" (email prefilled, optional WhatsApp/other), write the result into `connections`, and show the contributor's chosen contact info back once they've also completed their side (contributor sees a prompt to set their preferred contact method on acceptance).
4. Contributor-side view: once accepted, show a "You're connected" card with the owner's contact info + external_doc_link if the owner provided one.
5. Trigger notifications (insert into `notifications`) for: new_applicant, application_accepted, application_rejected.

Stop after Phase 3 and summarize what's built.
```

### Phase 4 — Tracking & polish

```
Read SPEC.md. Phases 1–3 are done. Now build Phase 4:

1. Stage completion: owner can mark a stage's contribution as status = 'completed' in `contributions`.
2. Co-authorship decision: owner can set coauthorship to 'granted' or 'declined' on a completed contribution; notify the contributor either way.
3. Profile stats on /profile/[id] and /profile/me: counts for contributed / in_progress / co-authored, computed from `contributions`.
4. Wire up real email notifications (pick Resend unless SPEC.md's open questions say otherwise) for: new_applicant, application_accepted, application_rejected, stage_completed, coauthor_decision.
5. Basic report/flag action on a listing or user (writes to a new simple `reports` table: id, reporter_id, target_type, target_id, reason, created_at).

Stop after Phase 4 and summarize what's built, and flag anything in SPEC.md's "open questions" section (10) that's now blocking you.
```

Run these in order, reviewing the agent's output between each phase before moving to the next — don't queue all four at once.

