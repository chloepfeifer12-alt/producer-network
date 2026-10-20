# Producer Network — prototype

**The professional home of the insurance industry. An industry network first; a career marketplace second.**

Five destinations, plus one signature feature:

| Destination | Route | What it is |
|---|---|---|
| **The Network** | `/network` | Member headquarters and default home after sign-in: personal briefing, Insider stories, opportunities with reasons, people and mentors, conversations, events, and a quiet desk for saved items and applications |
| **Discover** | `/discover` · `/organizations` · `/organizations/[slug]` · `/organizations/compare` | Editorial directory of agencies, IMOs, FMOs, carrier programs, advisory firms and bank programs, with collections, follow, compare and rich company profiles |
| **Opportunities** | `/opportunities` · `/opportunities/[slug]` | Career marketplace: W-2 jobs vs. 1099 affiliations always distinct, transparent "Best match" with reasons, consent-based applications |
| **People** | `/people` · `/people/[id]` | Professional portfolios, mentors (request mentorship), directory, connections |
| **The Insider** | `/insider` · `/insider/[slug]` · `/insider/section/[section]` | Editorial hub: insights, career guides, leadership, interviews, education, emerging opportunities, events, spotlights (all fictional demo content) |
| **Your Industry Fit** | `/fit` | 8-question career discovery with deterministic, explainable matching to organizations and opportunities |

Also: New Producer Portal (`/launch`), employer recruiting workspace (`/org`), admin console (`/admin`).

> **Prototype status.** Everything here runs on synthetic data inside your browser. All people, companies, listings, metrics and prices are fictional. The demo role switcher is **not authentication**. Nothing is production-ready — see [Before production](#before-production).

This project is fully standalone. It was created in its own directory (`/home/user/producer-network`) and shares no code, data or configuration with any other project. The workspace contained no other codebase when the project was created, so nothing else was touched.

---

## Viewing the running app

This repository runs anywhere Node.js runs. If you are reviewing work done in a remote/cloud environment, `localhost` there is **not** reachable from your computer and that environment blocks public tunnels. Use one of these:

1. **Run locally** (recommended) — steps below; open http://localhost:3000.
2. **Deploy a preview** — push the repo to GitHub and import it in Vercel (zero config for Next.js) to get a shareable URL. No environment variables are required.
3. **Single-file preview (Claude Artifact)** — `npm run preview:artifact` builds the whole prototype into one self-contained HTML page at `preview/dist/producer-network.html` (no server needed). It uses the same pages and components; `preview/shims/` swaps `next/link`, `next/navigation` and `next/font` for an in-memory router, and `preview/main.tsx` maps `src/app/**/page.tsx` to routes. The page's address doesn't change as you click (artifact frames can't), but the browser Back button works, and a `#discover`-style link opens that destination. Demo data lives in that viewer's browser storage.

## Run it locally

Requirements: Node.js 20+ (tested with Node 22) and npm.

```bash
cd producer-network
npm install
npm run dev            # http://localhost:3000
```

Open **http://localhost:3000** in your browser.

Production build:

```bash
npm run build
npm start              # http://localhost:3000
```

To run a production build alongside `npm run dev`, use a separate output folder: `NEXT_DIST_DIR=.next-build npm run build && NEXT_DIST_DIR=.next-build npx next start -p 3200`.

Quality checks:

```bash
npm run typecheck      # TypeScript
npm run lint           # ESLint
npm run build          # Next.js production build
npm run test:e2e       # Playwright journeys (run `npm run build` first; starts `next start` on :3200)
```

If Playwright can't find a browser, either run `npx playwright install chromium` or point it at an existing Chromium binary: `PW_CHROMIUM_PATH=/path/to/chromium npm run test:e2e`.

### Exploring as different people

Use **"Demo role"** in the dark bar at the top of every page to become a fictional persona:

| Persona | What to try |
|---|---|
| **Maya Okafor** — experienced commercial producer | My jobs, résumé-style profile with self-reported licenses, privacy & consent center, network feed |
| **Jordan Reyes** — newly licensed life & health producer | "Jobs for you" recommendations, apply to a job, New Producer Portal introductions, interview tracking |
| **Priya Natarajan** — aspiring producer (career changer) | Licensing-journey guidance, career paths, saved jobs |
| **Daniel Whitfield** — Kestrelwood Insurance Partners (independent agency) | Post a job, pipeline board, candidate review, talent discovery, portal inbox, analytics, billing preview |
| **Renée Castillo** — Lanternway Financial Group (IMO) | Independent-contracting (affiliation) listings and pipeline |
| **Morgan Ellery** — platform administrator | Organization approvals, listing moderation, reports, sponsored placements, users, consent, audit log |

You can also **create your own account** at `/join` (member) or `/join/organization` (employer, starts in "pending approval").

Data persists in your browser's `localStorage`. To start over, use **Demo role → Reset demo data**, or the button on `/about#prototype`. Two browser tabs stay in sync, so you can run a producer and an employer side by side.

### Suggested end-to-end walkthrough

1. **Producer**: as a visitor, go to `/join` → create a producer profile → browse **Companies** → open a company → **Find jobs** → save a job → **Apply now**. Choose exactly what to share → see the confirmation → **My jobs** shows the application.
2. **Employer**: switch to **Daniel** → **Opportunities → New opportunity**. Watch the live compliance pre-check, then **Save & publish** → switch to **Jordan** and apply → switch back → **Pipeline**: move the candidate, open the review page, schedule an interview, add an internal note, message the candidate → as Jordan, see the status update.
3. **New Producer Portal**: as **Jordan**, open `/launch` → tap *I'm interested* on several companies → **Express interest** → as **Daniel**, open **New Producer Portal** in the sidebar → **Respond** → Jordan sees "Company responded".
4. **Admin**: switch to **Morgan** → approve *Wrenfield Agency Partners* → open **Listing moderation** and reject the flagged *"Six Figures Your First Year!"* listing → approve Kestrelwood's sponsored-placement request → check the **Audit log**.

---

## What's implemented

All of the following work against one shared local dataset, so actions in one role show up in the others.

**Public product**
- Search-first homepage: "What / Where" search, popular searches, latest jobs, New Producer Portal band, career paths for both sectors, companies hiring, employer section, community preview.
- **Find jobs** (`/opportunities`): Indeed-style split view (list + full posting). Pill filters cover category (grouped Insurance / Financial services), employment vs. contracting, work arrangement, experience, compensation type, training, leads policy and career category. URL-synced filters, sort, sponsored results kept clearly separate, and a mobile filter drawer.
- **Job detail** with full posting, licensing and training, leads policy, compensation as disclosed (plus disclaimer), company overview, related jobs, report-a-listing, and a working **apply flow** with per-field consent.
- **Companies** directory with filters, a separate sponsored band, **side-by-side compare** (up to 3), and rich company profiles.
- **New Producer Portal** (`/launch`): curated company showcases for new producers. Members express interest in several companies at once and choose what to share; they can track and withdraw introductions.
- Career paths (17 categories: 12 insurance + 5 financial services), resources library and reader, community overview, for-employers page, pricing concept, about (with prototype notes), support/FAQ, and six legal **placeholders**.
- Member and employer **sign-up wizards** that create real (local) accounts.

**Your Industry Fit** (`/fit`) — deterministic preference matching (`src/lib/services/fit.ts`): every point awarded is shown as a reason, gaps as considerations, and the point table is published on the results page. No AI, no protected characteristics, not an employment decision, licenses not verified. Members can save answers; the Network, Discover and Opportunities ("Best match") then explain recommendations with them.

**Producer / aspiring producer workspace** (`/me`, reached from the account menu)
- Job-seeker home: search, "Jobs for you" with transparent match reasons, My jobs summary, employer introductions, aspiring-producer pathway, events, resources.
- **My jobs**: Saved / Applied / Interviewing / Archived; application detail with timeline, interview, messages, "what you shared", withdraw.
- Résumé-style **profile** with section editors, licenses & registrations (always *Self-reported — Not verified*), masked NPN, portfolio, and **Preview as** (public / member / employer).
- **Privacy & consent** center: visibility, directory listing, recruiter contact, license visibility, NPN sharing, plus a per-application sharing history.

**Employer workspace** (`/org`)
- Dashboard, opportunity list (publish / archive / duplicate / restore), opportunity editor with a **live compliance pre-check** and card preview.
- **Pipeline** board and list (New → Under Review → Interview → Offer / Contract Discussion → Hired / Affiliated → Closed) with drag-and-drop and stage selects.
- Candidate review limited to **consented fields**, internal notes, messages, interview scheduling.
- Consent-based **talent discovery** and introductions; **New Producer Portal** inbox and showcase editor.
- Analytics (labeled demonstration data), public profile editor, plan & billing preview, sponsored-placement requests.

**Professional network** (`/network`)
- Discussion feed with topics, posts, likes, comments, reporting; client-data guardrail.
- Member directory (respects privacy), member profiles, connection requests and connections, groups with group feeds, events with RSVP.

**Admin console** (`/admin`)
- Overview queues, organization approvals with a review checklist, listing moderation with flagged-phrase highlighting and reason codes, reported-content review, sponsored-placement management, users (suspend/reactivate), consent overview, role × permission matrix, illustrative plan configuration, platform analytics, audit log.

**Trust & compliance built into the prototype**
- License and registration records are **always self-reported and unverified**. No NIPR/FINRA connection or scraping.
- Compensation is shown only as the employer disclosed it, with disclaimers. No projections or income claims.
- The automated pre-screen flags income claims, guarantee language, undisclosed producer costs and promotional titles, and routes them to human review.
- Employment (W-2) and contracting (1099) are always visually distinct and validated.
- Sponsored placements are always labeled and never change organic ranking.
- Producer data reaches an employer **only** through an application or portal introduction, limited to the fields the producer chose, or via explicit recruiter-contact consent for talent discovery.
- No insurance sales, quoting, binding, commissions or investment advice anywhere.

---

## Prototype placeholders (not real)

| Area | Status |
|---|---|
| Authentication | Demo role switcher only. No passwords, sessions or MFA. |
| Backend / database | Browser `localStorage` via a typed local store. `db/schema.sql` documents the intended PostgreSQL model. |
| Email / notifications | In-app notifications only. Nothing is emailed or sent. |
| Payments | Illustrative plans, upgrades and invoices. No processor connected. |
| License/registration verification | Not implemented by design. Every record is self-reported. |
| Legal documents | Placeholders that require review by qualified counsel. |
| Direct messaging between connections | Explained as a future feature. Applicant ↔ employer messages work. |
| Analytics trends | Totals derive from real demo records; daily trend lines are deterministic synthetic distributions. |
| Account deletion / data export | Shown as "Not available in prototype". |
| File uploads (logos, résumés, photos) | Generated geometric logos and initials avatars only. |

---

## Architecture

Next.js 15 (App Router) · React 19 · TypeScript (strict) · Tailwind CSS v4 · Zustand + Immer (local store) · lucide-react · Playwright.

```
src/
  app/
    (public)/          Public site: home, opportunities, organizations, launch, explore, resources, legal, join…
    me/                Producer & aspiring-producer workspace (role-guarded)
    network/           Professional network (role-guarded)
    org/               Employer recruiting workspace (role-guarded)
    admin/             Admin console (admin roles only)
  components/
    ui/                Design-system primitives (button, form, dialog, tabs, charts…)
    domain/            Shared domain components (opportunity/org cards, badges, disclaimers)
    layout/            Header, footer, app shell, demo banner, role switcher, route guards
    brand/             Wordmark and generated fictional logos
    discovery/ member/ org/ network/ admin/ marketing/ portal/ home/   Feature components
  config/              brand.ts (rename the product here), navigation.ts
  lib/
    data/types.ts      Domain model (maps 1:1 to db/schema.sql)
    data/taxonomy.ts   Career categories, labels, states
    data/seed/         Synthetic seed data
    store/db-store.ts  Local persisted "database" (swap for an API client)
    auth/              Demo session (NOT auth) and RBAC permission rules
    services/          Business logic: queries + commands (permission checks, validation, audit, notifications)
    utils/
db/schema.sql          Target PostgreSQL schema with row-level-security sketches
docs/                  CONVENTIONS.md, PRODUCTION-READINESS.md
tests/e2e/             Playwright journeys
```

**How data flows:** UI → `services/*` command (permission check → validation → `commit()` to the store → audit + notifications) → components re-render from `useDb()`. To move to production, replace `lib/store` with an API client and implement the same service contracts server-side against PostgreSQL. The permission rules in `lib/auth/permissions.ts` and the consent rules in `lib/services/privacy.ts` describe exactly what the server must enforce.

**Renaming the product:** edit `src/config/brand.ts`. Colors and typography live as tokens in `src/app/globals.css`.

### Key assumptions & decisions

- **Indeed-style, search-first** job marketplace for **insurance + financial services**. The New Producer Portal is an original take on a curated "graduation portal".
- Categories are a **discovery taxonomy**, not a legal classification of licenses, lines of authority or registrations.
- Introductions and applications are **consent-scoped**: each records exactly what was shared, and NPN sharing also requires the member's global NPN setting.
- New members default to **recruiter contact OFF** (privacy by default).
- New organizations start **pending**; their listings are held for review until approved.
- Pricing is illustrative: Directory (free), Growth ($349/mo), Premier ($899/mo). No commission sharing, premium-based fees, or unreviewed placement fees.

---

## Testing performed

- `npm run typecheck`: passes with 0 errors.
- `npm run lint`: passes with 0 errors.
- `npm run build`: succeeds; 55 page templates (80+ routes once career-path, legal and resource pages are generated).
- Route crawl of every page as visitor, producer, aspiring producer, employer and admin: no runtime or console errors; wrong-role access shows the access panel.
- Playwright (`tests/e2e`), **13/13 passing**:
  1. Producer: create account → browse companies → save → apply with consent → see it in My jobs.
  2. Access control: producer blocked from `/admin` and `/org`.
  3. Licenses always show "Self-reported — Not verified", never "Verified".
  4. Employer: create & publish a job → producer applies → employer moves pipeline stage → reviews (consented fields) → moves to Interview → producer sees "Interviewing".
  5. Consent: employer can't see an NPN that wasn't shared.
  6. New Producer Portal: express interest in multiple companies → employer responds → producer sees the response.
  7. Admin: approve an organization (it becomes public), approve a sponsored request, reject the misleading-income listing, verify in the audit log.
  8. Members land on their Network headquarters from `/`.
  9. Old `/network/members/*` links redirect to People.
  10. Discover: follow an organization.
  11. People: request mentorship from a mentor.
  12. The Insider: open a story.
  13. Your Industry Fit: answer the questions, see explainable results, save to profile.

Visual review was done at desktop (1440px) and mobile (390px) widths for key screens. Not every screen has been reviewed at every breakpoint.

---

## Before production

See **[docs/PRODUCTION-READINESS.md](docs/PRODUCTION-READINESS.md)** for the full checklist. Highlights:

1. Real authentication (OIDC/SSO, MFA for employers and admins), server sessions, and removal of the demo switcher.
2. Server-side API + PostgreSQL with row-level security enforcing the RBAC and consent rules; encrypted NPN storage.
3. Legal review of every policy, consent flow, advertising and recruiting standard, plus state/FINRA advertising and recruiting rules.
4. Organization verification process; any license/registration verification only through an authorized provider and explicit consent.
5. Payments via a processor (e.g., Stripe) with tax handling, after legal review of the monetization model.
6. Human moderation operations, appeals, and abuse/spam controls.
7. Security review, privacy program (CCPA/state laws, data retention, export/delete), accessibility audit (WCAG 2.2 AA), observability, backups.
