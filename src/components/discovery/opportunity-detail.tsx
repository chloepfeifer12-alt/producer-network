"use client";

import { useEffect, useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowRight, CalendarDays, Eye } from "lucide-react";
import type { Opportunity, Organization } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { getOpportunityBySlug, isPublic, recordOpportunityView, relatedOpportunities } from "@/lib/services/opportunities";
import { ARRANGEMENT_LABEL, CATEGORY_LABEL, ENGAGEMENT_LABEL, EXPERIENCE_LABEL, lineName } from "@/lib/data/taxonomy";
import { HydrationGate } from "@/components/layout/guards";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { Breadcrumbs, Container, MetaRow } from "@/components/ui/page";
import { KindBadge, OppStatusBadge } from "@/components/domain/badges";
import { DemoApplicationDisclaimer } from "@/components/domain/disclaimers";
import { OpportunityCard, opportunityLocation } from "@/components/domain/opportunity-card";
import { SaveButton } from "@/components/domain/save-button";
import { compensationLabel } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { ReportLink } from "./report-dialog";
import { Unavailable } from "./detail-ui";
import { DetailSkeleton } from "./skeletons";
import { AppliedStrip, PostingBody, PostingHeader, eligibleStatesLabel, useApplyCta } from "./opportunity-posting";

export function OpportunityDetailPage() {
  return (
    <HydrationGate fallback={<DetailSkeleton />}>
      <OpportunityDetail />
    </HydrationGate>
  );
}

function OpportunityDetail() {
  const { slug } = useParams<{ slug: string }>();
  const db = useDb();
  const user = useCurrentUser();
  const o = useMemo(() => getOpportunityBySlug(db, decodeURIComponent(slug ?? "")), [db, slug]);
  const org = useMemo(() => (o ? db.organizations.find((x) => x.id === o.orgId) : undefined), [db, o]);
  const publicNow = !!o && isPublic(o, db);
  const canPreview = !!o && !!user && (user.kind === "admin" || (user.kind === "organization" && user.orgId === o.orgId));

  const oppId = o?.id;
  useEffect(() => {
    if (oppId) recordOpportunityView(oppId);
  }, [oppId]);

  if (!o || (!publicNow && !canPreview)) {
    return (
      <Unavailable
        title="This opportunity isn't available"
        body="The listing may have been filled, archived, or is still awaiting review. Explore other open roles and affiliations in the marketplace."
        backHref="/opportunities"
        backLabel="Browse opportunities"
        secondary={{ href: "/organizations", label: "Explore organizations" }}
      />
    );
  }
  return <OpportunityView o={o} org={org} preview={!publicNow} />;
}

function OpportunityView({ o, org, preview }: { o: Opportunity; org?: Organization; preview: boolean }) {
  const db = useDb();
  const { cta, dialog, existing } = useApplyCta(o, org, preview);
  const related = useMemo(() => relatedOpportunities(db, o, 3), [db, o]);
  const orgById = useMemo(() => new Map(db.organizations.map((x) => [x.id, x])), [db]);

  return (
    <>
      <Container className="pb-32 pt-8 lg:pb-20">
        <Breadcrumbs
          items={[{ href: "/opportunities", label: "Opportunities" }, ...(org ? [{ href: `/organizations/${org.slug}`, label: org.name }] : []), { label: o.title }]}
        />

        {preview && (
          <Notice tone="warning" title="Preview — this listing is not public" className="mt-6">
            <span className="flex flex-wrap items-center gap-2">
              Current status: <OppStatusBadge status={o.status} />
              {org?.listingStatus !== "approved" && <span>· Organization profile pending approval.</span>}
              <span>Only your organization&apos;s team and platform admins can see this page.</span>
            </span>
          </Notice>
        )}

        <div className="mt-8">
          <PostingHeader o={o} org={org} />
        </div>

        <div className="mt-10 grid gap-12 lg:grid-cols-[minmax(0,1fr)_340px]">
          <PostingBody o={o} org={org} />

          <aside className="hidden lg:block" aria-label="Apply and listing details">
            <div className="sticky top-24 space-y-4">
              <Card className="p-5">
                <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4">Compensation as disclosed</div>
                <div className="mt-1 text-[15px] font-semibold text-ink">{compensationLabel(o.compensation)}</div>
                {existing && (
                  <div className="mt-4">
                    <AppliedStrip existing={existing} />
                  </div>
                )}
                <div className="mt-4 flex gap-2">
                  <div className="flex-1">{cta}</div>
                  <SaveButton targetId={o.id} variant="button" />
                </div>
                {!preview && !existing && <p className="mt-3 text-[12px] leading-relaxed text-ink-3">You choose exactly what to share. Nothing is sent until you submit.</p>}

                <div className="mt-4 divide-y divide-line border-t border-line">
                  <MetaRow label="Opportunity type">
                    <KindBadge kind={o.kind} />
                  </MetaRow>
                  <MetaRow label="Engagement">{ENGAGEMENT_LABEL[o.engagement]}</MetaRow>
                  <MetaRow label="Location">
                    {opportunityLocation(o)} · {ARRANGEMENT_LABEL[o.arrangement]}
                  </MetaRow>
                  <MetaRow label="Eligible states">{eligibleStatesLabel(o)}</MetaRow>
                  <MetaRow label="Experience">{EXPERIENCE_LABEL[o.experienceLevel]}</MetaRow>
                  <MetaRow label="Career category">{CATEGORY_LABEL[o.category]}</MetaRow>
                  {o.postedAt && (
                    <MetaRow label="Posted">
                      <span className="inline-flex items-center gap-1.5">
                        <CalendarDays className="h-3.5 w-3.5 text-ink-4" />
                        {formatDate(o.postedAt)}
                      </span>
                    </MetaRow>
                  )}
                </div>
              </Card>
              <div className="flex items-center justify-between px-1">
                <ReportLink targetType="opportunity" targetId={o.id} label="Report this listing" />
                <span className="inline-flex items-center gap-1 text-[11.5px] text-ink-4" title="Demonstration data">
                  <Eye className="h-3.5 w-3.5" /> {o.views.toLocaleString()} views (demo)
                </span>
              </div>
              <DemoApplicationDisclaimer className="px-1" />
            </div>
          </aside>
        </div>

        <div className="mt-10 lg:hidden">
          <ReportLink targetType="opportunity" targetId={o.id} label="Report this listing" />
        </div>

        {related.length > 0 && (
          <section aria-labelledby="related-title" className="mt-16 border-t border-line pt-10">
            <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
              <div>
                <div className="eyebrow mb-1.5">Keep exploring</div>
                <h2 id="related-title" className="text-[22px] font-semibold tracking-[-0.015em] text-ink">
                  Related opportunities
                </h2>
              </div>
              <Link href={`/opportunities?lines=${o.lines[0]}`} className="inline-flex items-center gap-1 text-[13px] font-medium text-navy-600 hover:text-navy">
                More in {lineName(o.lines[0]!, true)} <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {related.map((r) => (
                <OpportunityCard key={r.id} o={r} org={orgById.get(r.orgId)} compact />
              ))}
            </div>
          </section>
        )}
      </Container>

      {/* Mobile action bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-4 py-3 shadow-pop backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-xl items-center gap-2">
          <div className="min-w-0 flex-1">{cta}</div>
          <SaveButton targetId={o.id} variant="button" />
        </div>
      </div>

      {dialog}
    </>
  );
}
