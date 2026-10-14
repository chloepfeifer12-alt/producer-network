# Production readiness checklist

The prototype demonstrates product behavior. None of the items below is done. Each must be addressed before real people or real organizations use the platform.

## 1. Identity & access
- [ ] Replace the demo role switcher (`src/lib/auth/session.ts`, `components/layout/role-switcher.tsx`) with a real identity provider (OIDC; SSO for employers; passkeys/MFA).
- [ ] Mandatory MFA for organization owners and all platform admins; short admin sessions; IP/device controls for admin.
- [ ] Server-side authorization for every route and API, mirroring `src/lib/auth/permissions.ts`. Client guards (`components/layout/guards.tsx`) are UX only.
- [ ] Organization membership management (invites, seat limits, role changes, offboarding).
- [ ] Email verification and account recovery.

## 2. Data & backend
- [ ] Implement the service contracts in `src/lib/services/*` as server APIs backed by PostgreSQL (`db/schema.sql`).
- [ ] Row-level security for applications, notes, licenses, profiles and introductions; review the policy sketches in `db/schema.sql` with security engineering.
- [ ] Encrypt NPN and other sensitive fields at rest; restrict them with column-level privileges and never return them in public payloads.
- [ ] Versioned consent records captured with each application and introduction (the prototype re-checks the member's current NPN setting).
- [ ] Append-only, tamper-evident audit log; log admin views of personal data.
- [ ] Migrations, backups, point-in-time recovery, data-retention schedules.
- [ ] Search infrastructure (e.g., Postgres full-text or a search service) for jobs, companies and members.

## 3. Legal, regulatory & policy
- [ ] Qualified counsel to draft: Terms of Service, Privacy Policy, Producer Consent, Organization Terms, Advertising Agreement, Community Guidelines (placeholders exist under `/legal`).
- [ ] Review of recruiting-advertising content standards: income claims, earnings disclosures, independent-contractor vs. employee representations, and FTC rules on business-opportunity and earnings claims.
- [ ] Review state insurance-department rules and FINRA/SEC communications rules as they relate to recruiting ads for licensed/registered roles. Confirm the platform's posture is that of a technology/advertising platform, not a producer, agency, recruiter, broker-dealer or investment adviser.
- [ ] Employment-law review: fair-hiring rules, pay-transparency laws by state, background-check consent (FCRA) if ever introduced.
- [ ] Privacy compliance (CCPA/CPRA and other state laws): notices, opt-outs, data subject requests, processor agreements.
- [ ] Monetization review: confirm no commission sharing, premium-based or per-placement fees that could implicate producer-compensation or referral rules.

## 4. Verification & trust
- [ ] Organization verification workflow (business registration, domain/email verification, authorized representative).
- [ ] License/registration verification **only** via an authorized data provider with explicit member consent. Until then every record stays "Self-reported — Not verified".
- [ ] Human moderation operations: queues, SLAs, reviewer guidelines, appeals, repeat-offender handling. The automated pre-screen (`services/moderation-rules.ts`) is advisory.
- [ ] Spam, scraping, fake-account and harassment defenses; rate limiting; report abuse handling.

## 5. Monetization
- [ ] Payment processor integration (subscriptions, invoices, tax, dunning, refunds) replacing `services/billing.ts` demo logic.
- [ ] Sponsored-placement contracts, labeling standards and reporting; ensure organic ranking stays independent of payment.

## 6. Communications
- [ ] Transactional email and in-app notification infrastructure with preferences and unsubscribe.
- [ ] Secure messaging between applicants and employers (and between connections), with moderation and retention policies.
- [ ] Calendar invites for interviews.

## 7. Security & operations
- [ ] Threat model and penetration test; dependency and secret scanning; CSP and security headers.
- [ ] Observability (logging, metrics, tracing, error reporting), uptime monitoring, incident response.
- [ ] Environments (dev/staging/prod), CI/CD with typecheck, lint, unit and e2e tests.
- [ ] File uploads (logos, résumés, photos) with malware scanning and image processing.

## 8. Product quality
- [ ] Full WCAG 2.2 AA accessibility audit (keyboard menus for filter popovers, screen-reader review of dialogs and drag-and-drop pipeline alternatives).
- [ ] Cross-browser and device QA at all breakpoints.
- [ ] Unit tests for services (permissions, consent, moderation rules) in addition to e2e journeys.
- [ ] Performance budgets, pagination for large datasets, server-side rendering of public pages with real data for SEO (remove `robots: noindex`).
- [ ] Real analytics (privacy-respecting) replacing the synthetic trend lines.
- [ ] Content: real company onboarding, editorial resources reviewed for accuracy, real events.
