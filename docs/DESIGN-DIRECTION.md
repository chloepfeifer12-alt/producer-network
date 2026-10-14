# Design direction — "An industry network first. A career marketplace second."

Producer Network is the professional home of the insurance industry. The experience should feel like entering a thoughtfully edited professional ecosystem, closer to a fine magazine and a well-made tool than to a job board or a SaaS dashboard.

## The five destinations
| Destination | Route | Role |
|---|---|---|
| **The Network** | `/network` | Member headquarters and default home after sign-in: curated, personal, alive |
| **Discover** | `/discover` (curated) · `/organizations` (full directory) · `/organizations/[slug]` | Editorial directory of exceptional companies |
| **Opportunities** | `/opportunities` · `/opportunities/[slug]` | Career marketplace: transparent, matched, W-2 vs 1099 always distinct |
| **People** | `/people` · `/people/[id]` | Professional community: portfolios, mentors, connections |
| **The Insider** | `/insider` · `/insider/[slug]` | Editorial hub (all content fictional and labeled demo) |
| Signature feature | `/fit` | "Your Industry Fit": deterministic, explainable career discovery |

## References & tone
Linear-level polish, Monocle-inspired editorial sophistication, high-end professional networking, premium fintech. Subtle luxury, not decorative luxury.

## Composition rules
1. **Fewer boxes.** Prefer hairline rules (`border-line`), whitespace and typographic hierarchy over bordered/shadowed cards. Use a card only to set off an object the user acts on (a company, a person, a listing). Never wrap every section in a card.
2. **Editorial hierarchy.** Section openers use a small uppercase kicker with a hairline rule (`<Kicker>`), then a serif headline (`font-display`). Mix scales deliberately: one dominant element per section.
3. **Asymmetric layouts.** Use 12-column grids with lead + rail compositions (e.g. 7/5, 8/4) and occasional full-bleed bands. Avoid identical three-card rows everywhere.
4. **Imagery.** Use `<CoverArt>` (src/components/brand/cover-art.tsx) for editorial imagery: articles have `art`, organizations use `variantFor(org.id)` with `org.brand.color` / `org.brand.tint`. No stock photos, no AI-generated people, no emoji.
5. **No metric-tile walls.** At most a single quiet line of numbers when numbers matter. No meaningless charts on member surfaces.
6. **Color.** Ink, ivory, navy accent. Gold is a rare detail (sponsored labels, one highlight); don't sprinkle it. Demo labeling stays honest but quiet: one discreet "Fictional" / "Demo" marker per object, not repeated badges.
7. **Typography.** Serif (`font-display`, Newsreader) for headlines, pull quotes and large numerals. Geist sans for UI. Body text max ~68ch. Use `text-[11px] uppercase tracking-[0.14em]` for kickers.
8. **Motion.** Subtle: 150–250ms hover transitions, gentle `animate-rise` on first reveal, image zoom (`group-hover:scale-[1.03]`) on cover art inside `overflow-hidden`. Everything respects `prefers-reduced-motion` (handled globally in globals.css).
9. **Personalization.** Logged-in content adapts to the persona (specialties, stage, saved items, Industry Fit answers in `db.fitAnswers[user.id]`) and says *why* something is shown ("Because you follow Ashgrove", "Matches your Commercial focus").
10. **Empty & loading states.** Every list has a designed empty state with a next step; hydrating regions use skeletons (`Skeleton`, `PageSkeleton`).

## Shared building blocks
- `src/components/editorial/*` — `Kicker`, `SectionHead`, `Rule`, `PullQuote`, `ByLine` (use them; extend carefully).
- `src/components/brand/cover-art.tsx` — `CoverArt`, `variantFor`.
- Existing UI kit in `src/components/ui/*`, domain components in `src/components/domain/*`.

## Compliance (unchanged, mandatory)
See docs/CONVENTIONS.md. Licenses are always "Self-reported — Not verified". Compensation shown only as disclosed. W-2 vs independent contractor always distinct. Sponsored always labeled and separate. No fabricated news or endorsements: every article, interview and spotlight is labeled fictional/demo. Industry Fit is deterministic preference matching, never an employment decision, never uses protected characteristics, never verifies licenses.

## Calm by default (v2 — supersedes density choices above)

Feedback from the founder: the product felt like "a lot all in one place". Every page now follows these rules:

1. **One job per page.** The top of each page states what the page is for and leads with ONE primary element (a search, a briefing, a cover story). Nothing competes with it above the fold.
2. **Four sections maximum** below the lead. If there is more, it moves behind a tab, a "Show more", or a link to its own page.
3. **Choose, then reveal.** Group related modules behind a single tabbed block (e.g. "For you: Roles · Companies · People") instead of stacking them. Default to the most useful tab.
4. **Text before imagery.** Cover art is an accent, not a billboard: max ~240px tall on index pages, and never more than one large image per screen. Lists of stories, companies and people default to compact text rows.
5. **Fewer containers.** Prefer whitespace and hairline rules. No more than one bordered "card" style per section.
6. **Consistent home for personal items.** Saved roles, applications and requests live in one compact "Your activity" strip or panel, always in the same place.
7. **Generous rhythm.** Section spacing ~96px desktop / 64px mobile; body 15–16px; headline sizes reduced one step from v1 (page titles 36–48px, not 60–80px).
8. **Fewer badges.** One label per item max beyond the W-2/1099 kind badge. Demo labeling stays honest but appears once per page/object.
