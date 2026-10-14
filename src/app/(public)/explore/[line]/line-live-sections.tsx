"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Briefcase, Building2, BookOpen, Users } from "lucide-react";
import type { LineSlug } from "@/lib/data/types";
import { LINE_BY_SLUG } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { searchOpportunities } from "@/lib/services/opportunities";
import { activeSponsored, approvedOrganizations, orgOpenOpportunities } from "@/lib/services/organizations";
import { OpportunityCard } from "@/components/domain/opportunity-card";
import { OrgCard } from "@/components/domain/org-card";
import { ButtonLink } from "@/components/ui/button";
import { Container, SectionHeading } from "@/components/ui/page";
import { EmptyState, SponsoredTag } from "@/components/ui/feedback";
import { ResourceCard } from "@/components/marketing/resource-card";
import { GroupPreviewCard } from "@/components/marketing/group-card";
import { LineGrid } from "@/components/marketing/line-grid";

export function LineLiveSections({ slug }: { slug: LineSlug }) {
  const db = useDb();
  const line = LINE_BY_SLUG[slug];

  const data = useMemo(() => {
    const opportunities = searchOpportunities(db, { lines: [slug], sort: "newest" });
    const orgs = approvedOrganizations(db)
      .filter((o) => o.lines.includes(slug))
      .sort((a, b) => a.name.localeCompare(b.name));
    const resources = db.resources.filter((r) => r.lines.includes(slug));
    const groups = db.groups.filter((g) => g.lines.includes(slug));
    // Sponsored placements for line pages — shown only when relevant to this category.
    const sponsored = activeSponsored(db, "line_page")
      .map(({ placement, org }) => {
        const opp = placement.opportunityId ? opportunities.find((o) => o.id === placement.opportunityId) : undefined;
        return { placement, org, opp };
      })
      .filter((s) => (s.placement.opportunityId ? !!s.opp : s.org.lines.includes(slug)))
      .slice(0, 2);
    return { opportunities, orgs, resources, groups, sponsored };
  }, [db, slug]);

  return (
    <>
      {data.sponsored.length > 0 && (
        <Container className="pb-4">
          <section aria-labelledby="sponsored-heading" className="rounded-[22px] border border-gold-200 bg-gold-50/50 p-5 sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <h2 id="sponsored-heading" className="flex items-center gap-2 text-[13px] font-medium text-gold-ink">
                <SponsoredTag /> Sponsored in {line.shortName}
              </h2>
              <Link href="/for-organizations#sponsored" className="text-xs text-gold-ink underline-offset-4 hover:underline">
                About sponsored placements
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              {data.sponsored.map(({ placement, org, opp }) =>
                opp ? (
                  <OpportunityCard key={placement.id} o={opp} org={org} sponsored />
                ) : (
                  <OrgCard key={placement.id} org={org} sponsored openCount={orgOpenOpportunities(db, org.id).length} />
                ),
              )}
            </div>
            <p className="mt-4 text-xs leading-relaxed text-gold-ink/80">
              Paid placement. Shown separately from the organic listings below, which are never ordered by payment.
            </p>
          </section>
        </Container>
      )}

      <section className="py-14 sm:py-20" aria-labelledby="opps-heading">
        <Container>
          <SectionHeading
            eyebrow="Live on the network"
            title={<span id="opps-heading">Open {line.shortName} opportunities</span>}
            description="Newest first. Compensation is shown exactly as each organization disclosed it."
            action={
              data.opportunities.length > 0 ? (
                <ButtonLink href={`/opportunities?lines=${slug}`} variant="secondary">
                  View all {data.opportunities.length} <ArrowRight className="h-4 w-4" />
                </ButtonLink>
              ) : undefined
            }
          />
          {data.opportunities.length ? (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {data.opportunities.slice(0, 6).map((o) => (
                <OpportunityCard key={o.id} o={o} org={db.organizations.find((x) => x.id === o.orgId)} />
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<Briefcase className="h-5 w-5" />}
              title={`No open ${line.shortName} opportunities right now`}
              description="New listings are reviewed before they go live. Browse all opportunities, or check back soon."
              action={<ButtonLink href="/opportunities" variant="secondary">Browse all opportunities</ButtonLink>}
            />
          )}
        </Container>
      </section>

      <section id="organizations" className="scroll-mt-24 border-y border-line bg-surface py-14 sm:py-20" aria-labelledby="orgs-heading">
        <Container>
          <SectionHeading
            eyebrow="Who’s active here"
            title={<span id="orgs-heading">Organizations in {line.shortName}</span>}
            description="Approved organizations that list this category. Listed alphabetically — never by plan or payment."
            action={<ButtonLink href="/organizations" variant="secondary">Organization directory</ButtonLink>}
          />
          {data.orgs.length ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.orgs.slice(0, 6).map((o) => (
                <OrgCard key={o.id} org={o} openCount={orgOpenOpportunities(db, o.id).length} />
              ))}
            </div>
          ) : (
            <EmptyState icon={<Building2 className="h-5 w-5" />} title="No organizations listed yet" description="Organizations are added after platform review." />
          )}
        </Container>
      </section>

      <section className="py-14 sm:py-20">
        <Container>
          <div className="grid gap-14 lg:grid-cols-2">
            <div>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <div className="eyebrow mb-2">Learn</div>
                  <h2 className="font-display text-[28px] leading-tight sm:text-[32px]">Relevant resources</h2>
                </div>
                <Link href="/resources" className="text-sm font-medium text-navy-600 hover:text-navy">Library →</Link>
              </div>
              {data.resources.length ? (
                <div className="grid gap-4">
                  {data.resources.slice(0, 3).map((r) => <ResourceCard key={r.id} r={r} />)}
                </div>
              ) : (
                <EmptyState compact icon={<BookOpen className="h-5 w-5" />} title="No resources tagged yet" description="Browse the full library for general career guidance." action={<ButtonLink href="/resources" variant="secondary" size="sm">Open the library</ButtonLink>} />
              )}
            </div>
            <div>
              <div className="mb-6 flex items-end justify-between gap-4">
                <div>
                  <div className="eyebrow mb-2">Connect</div>
                  <h2 className="font-display text-[28px] leading-tight sm:text-[32px]">Related groups</h2>
                </div>
                <Link href="/community" className="text-sm font-medium text-navy-600 hover:text-navy">Community →</Link>
              </div>
              {data.groups.length ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {data.groups.slice(0, 4).map((g) => <GroupPreviewCard key={g.id} group={g} db={db} />)}
                </div>
              ) : (
                <EmptyState compact icon={<Users className="h-5 w-5" />} title="No groups for this category yet" description="Members can find peers across every category in the community." action={<ButtonLink href="/community" variant="secondary" size="sm">Visit the community</ButtonLink>} />
              )}
            </div>
          </div>
        </Container>
      </section>

      <section className="border-t border-line bg-subtle py-14 sm:py-20">
        <Container>
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-[28px] leading-tight sm:text-[32px]">Explore other categories</h2>
            <Link href="/explore" className="text-sm font-medium text-navy-600 hover:text-navy">All categories →</Link>
          </div>
          <LineGrid exclude={slug} />
        </Container>
      </section>
    </>
  );
}
