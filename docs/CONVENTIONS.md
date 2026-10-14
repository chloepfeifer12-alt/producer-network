# Producer Network — Engineering & Design Conventions

Read this before adding screens. The goal is a cohesive, premium product — every screen should feel like it came from one team.

## Architecture (where things live)

| Concern | Location |
|---|---|
| Brand name / copy constants | `src/config/brand.ts` (never hard-code "Producer Network" — import `brand`) |
| Navigation config | `src/config/navigation.ts` |
| Domain types | `src/lib/data/types.ts` |
| Taxonomy + labels (lines, enums, states) | `src/lib/data/taxonomy.ts` |
| Synthetic seed data | `src/lib/data/seed/*` |
| Local "database" store | `src/lib/store/db-store.ts` (`useDb()`, `useHydrated()`) |
| Demo session (NOT auth) | `src/lib/auth/session.ts` (`useCurrentUser()`) |
| RBAC | `src/lib/auth/permissions.ts` (`can`, `canForOrg`) |
| Business logic (queries + commands) | `src/lib/services/*` |
| Design-system primitives | `src/components/ui/*` |
| Shared domain components | `src/components/domain/*` |
| Layout (shells, header, guards) | `src/components/layout/*` |
| Routes | `src/app/(public)/…` public site · `src/app/me` producer · `src/app/network` · `src/app/org` · `src/app/admin` |

## Data rules

- **Reading data:** `const db = useDb();` then derive with `useMemo(() => query(db, …), [db, …])`. Never pass a selector that returns a new array/object to the zustand store (causes infinite render loops).
- **Writing data:** ONLY via service commands in `src/lib/services/*` (they check permissions, validate, write audit entries and notifications). Commands return `Result` → `{ ok: true, data } | { ok: false, error }`. Surface with `toast()` / `toastResult()` from `@/components/ui/toast`.
- Pass the actor explicitly: `const user = useCurrentUser(); submitApplication(user, input)`.
- Pages that depend on persisted data (detail pages by slug, anything under /me /org /admin /network) must render inside `HydrationGate` (portal layouts already gate). Public list pages may render seed data immediately.
- Dynamic route params: in client pages use `useParams()` from `next/navigation`. In Next 15, server `params` is a Promise.
- `useSearchParams()` must be inside a `<Suspense>` boundary.

## Compliance rules (mandatory)

- License records always display `<UnverifiedLicenseBadge />` ("Self-reported — Not verified"). Never show "verified".
- Compensation: show exactly what the org disclosed via `compensationLabel()`; always include `<CompensationDisclaimer />` on detail views. No projections, "potential earnings", or income claims.
- Clearly distinguish **Job · Employment (W-2)** from **Affiliation · Contracting (1099)** using `<KindBadge />`.
- Sponsored content uses `<SponsoredTag />` and is rendered in a visually separate block from organic results — never mixed into organic ordering.
- Never auto-share producer data. Org views of candidates go through `viewProfile()` in `services/privacy.ts`.
- All organizations/people are fictional; use `<DemoTag />` where helpful. Analytics must be labeled as demonstration data.
- No insurance sales, quoting, binding, commission calculation, or policy recommendations anywhere.
- Legal pages are placeholders that explicitly say they require legal review.

## Visual language

- Canvas `bg-canvas` (warm ivory); cards `bg-surface border border-line rounded-2xl shadow-card` (or `<Card>`).
- Text: `text-ink` (primary), `text-ink-2`, `text-ink-3` (secondary/meta), `text-ink-4` (faint). Accent `navy`; detail `gold` (sparingly).
- Headlines: `font-display` (Newsreader serif) for page titles and hero/section headings only. UI text is Geist sans.
- Page titles: `<PageHeader eyebrow title description actions />`. Card titles: 15–17px semibold, `tracking-[-0.01em]`.
- Eyebrows: `className="eyebrow"`. Generous whitespace; avoid dense dashboards; no gradients/glows except subtle tints.
- Icons: lucide-react, `h-4 w-4`, `strokeWidth` 1.75 where possible. Import icons individually (never `import *`).
- Every list needs an `EmptyState`; every hydrating region a skeleton; every validation error surfaced inline or via toast.
- Responsive: mobile-first; grids collapse to 1 column; wide tables scroll inside `overflow-x-auto` or become stacked cards.
- Accessibility: ordered headings, labelled inputs (`Field` + `id`), `aria-pressed` on toggles, visible focus, good contrast.
- No dead links. If a feature is out of scope, link to a real screen that explains it is a prototype placeholder.
