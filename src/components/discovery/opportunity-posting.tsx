"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, BadgeCheck, BriefcaseBusiness, Clock3, GraduationCap, Laptop, MapPin, Target, Wallet } from "lucide-react";
import type { Application, Opportunity, Organization } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { existingApplication } from "@/lib/services/applications";
import { orgOpenOpportunities } from "@/lib/services/organizations";
import {
  ARRANGEMENT_LABEL,
  COMP_MODEL_LABEL,
  ENGAGEMENT_LABEL,
  EXPERIENCE_LABEL,
  LEADS_LABEL,
  LICENSE_REQ_LABEL,
  LINE_BY_SLUG,
  ORG_CATEGORY_LABEL,
  lineName,
  stateName,
} from "@/lib/data/taxonomy";
import { OrgLogo } from "@/components/brand/org-logo";
import { Badge, Tag } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { DemoTag, Notice } from "@/components/ui/feedback";
import { LineIcon } from "@/components/ui/line-icon";
import { KindBadge, StageBadge } from "@/components/domain/badges";
import { CompensationDisclaimer, DemoApplicationDisclaimer } from "@/components/domain/disclaimers";
import { opportunityLocation } from "@/components/domain/opportunity-card";
import { RecruitingDot, footprintLabel } from "@/components/domain/org-card";
import { SaveButton } from "@/components/domain/save-button";
import { compensationLabel, pluralize } from "@/lib/utils/format";
import { relativeDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { ApplyDialog } from "./apply-dialog";
import { ReportLink } from "./report-dialog";
import { DetailList, DetailSection, FactTile } from "./detail-ui";
import { kindExplanation } from "./kind-explainer";

export function eligibleStatesLabel(o: Opportunity) {
  if (o.eligibleStates.includes("ALL")) return "Nationwide";
  if (o.eligibleStates.length > 5) return o.eligibleStates.join(", ");
  return o.eligibleStates.map(stateName).join(", ") || stateName(o.state);
}

/* ------------------------------------------------------------------ */
/* Apply state                                                         */
/* ------------------------------------------------------------------ */

/** Shared apply/save state for a posting: CTA element + the dialog to render once. */
export function useApplyCta(o: Opportunity, org: Organization | undefined, preview: boolean) {
  const db = useDb();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const existing = useMemo(() => existingApplication(db, user?.id, o.id), [db, user?.id, o.id]);

  const cta = preview ? (
    <Button className="w-full" disabled>
      Not accepting applications
    </Button>
  ) : existing ? (
    <ButtonLink href={`/me/applications/${existing.id}`} variant="secondary" className="w-full">
      View your application <ArrowRight className="h-4 w-4" />
    </ButtonLink>
  ) : (
    <Button variant="accent" className="w-full" onClick={() => setOpen(true)}>
      Apply now
    </Button>
  );
  const dialog = <ApplyDialog open={open} onClose={() => setOpen(false)} opportunity={o} org={org} />;
  return { cta, dialog, existing };
}

export function AppliedStrip({ existing }: { existing: Application }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-xl bg-subtle px-3 py-2.5 text-[13px] text-ink-2">
      <span>You applied {relativeDay(existing.submittedAt).toLowerCase()}</span>
      <StageBadge stage={existing.stage} audience="applicant" withdrawn={existing.withdrawn} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Header                                                              */
/* ------------------------------------------------------------------ */

export function PostingHeader({ o, org, size = "page", titleAs = "h1" }: { o: Opportunity; org?: Organization; size?: "page" | "pane"; titleAs?: "h1" | "h2" }) {
  const Title = titleAs;
  const pane = size === "pane";
  return (
    <header className={cn("flex gap-5", pane ? "flex-col sm:flex-row sm:items-start" : "flex-col sm:flex-row sm:items-start sm:gap-6")}>
      {org && <OrgLogo brand={org.brand} name={org.name} size={pane ? 52 : 64} className="rounded-[22%]" />}
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2 text-[13.5px] text-ink-3">
          {org ? (
            <Link href={`/organizations/${org.slug}`} className="font-medium text-ink-2 underline-offset-4 hover:text-ink hover:underline">
              {org.name}
            </Link>
          ) : (
            <span>Organization</span>
          )}
          {org && (
            <>
              <span aria-hidden>·</span>
              <span>{ORG_CATEGORY_LABEL[org.category]}</span>
            </>
          )}
          <DemoTag>Fictional listing</DemoTag>
        </div>
        <Title
          className={cn(
            "mt-2 max-w-3xl text-ink",
            pane ? "text-[24px] font-semibold leading-tight tracking-[-0.02em]" : "font-display text-[32px] leading-[1.1] sm:text-[42px]",
          )}
        >
          {o.title}
        </Title>
        <div className="mt-3.5 flex flex-wrap items-center gap-2">
          <KindBadge kind={o.kind} />
          {o.lines.map((l) => (
            <Tag key={l}>{lineName(l)}</Tag>
          ))}
        </div>
        <ul className={cn("flex flex-wrap gap-x-5 gap-y-2 text-[13.5px] text-ink-3", pane ? "mt-4" : "mt-5")}>
          <MetaItem icon={<MapPin className="h-4 w-4" />}>{opportunityLocation(o)}</MetaItem>
          <MetaItem icon={<Laptop className="h-4 w-4" />}>{ARRANGEMENT_LABEL[o.arrangement]}</MetaItem>
          <MetaItem icon={<BriefcaseBusiness className="h-4 w-4" />}>{ENGAGEMENT_LABEL[o.engagement]}</MetaItem>
          <MetaItem icon={<Target className="h-4 w-4" />}>{EXPERIENCE_LABEL[o.experienceLevel]}</MetaItem>
          <MetaItem icon={<Clock3 className="h-4 w-4" />}>
            <span suppressHydrationWarning>{o.postedAt ? `Posted ${relativeDay(o.postedAt).toLowerCase()}` : "Not yet posted"}</span>
          </MetaItem>
        </ul>
      </div>
    </header>
  );
}

function MetaItem({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="inline-flex items-center gap-1.5">
      <span className="text-ink-4 [&_svg]:stroke-[1.75]">{icon}</span>
      {children}
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Body                                                                */
/* ------------------------------------------------------------------ */

/** Every content section of a posting. Used by the detail page and the marketplace split view. */
export function PostingBody({ o, org, compact }: { o: Opportunity; org?: Organization; compact?: boolean }) {
  const db = useDb();
  const openRoles = useMemo(() => (org ? orgOpenOpportunities(db, org.id).length : 0), [db, org]);
  const primaryLine = LINE_BY_SLUG[o.lines[0]!];
  const commissionBased = o.compensation.model === "commission_only" || o.compensation.model === "draw_against_commission";
  const eligible = eligibleStatesLabel(o);
  const sid = (s: string) => (compact ? `pane-${s}` : s);

  return (
    <div className={cn("min-w-0", compact ? "space-y-8" : "space-y-10")}>
      <div className={cn("grid grid-cols-2 gap-3", !compact && "xl:grid-cols-4")}>
        <FactTile icon={<Wallet className="h-3.5 w-3.5" />} label="Compensation" value={COMP_MODEL_LABEL[o.compensation.model]} hint={o.compensation.disclosed ? "Range disclosed" : "Range not disclosed"} />
        <FactTile icon={<BadgeCheck className="h-3.5 w-3.5" />} label="Licensing" value={LICENSE_REQ_LABEL[o.licenseRequirement]} />
        <FactTile icon={<GraduationCap className="h-3.5 w-3.5" />} label="Training" value={o.trainingProvided ? "Provided" : "Not provided"} />
        <FactTile icon={<Target className="h-3.5 w-3.5" />} label="Leads" value={LEADS_LABEL[o.leads]} />
      </div>

      <section aria-labelledby={sid("summary-title")}>
        <h2 id={sid("summary-title")} className="eyebrow mb-3">
          Summary
        </h2>
        <p className={cn("leading-relaxed text-ink", compact ? "text-[15.5px]" : "text-[17px]")}>{o.summary}</p>
        <Notice tone="info" className="mt-5">
          {kindExplanation(o.kind)}
        </Notice>
      </section>

      <DetailSection id={sid("description")} title="Full description">
        <div className="prose-pn max-w-none text-[14.5px] leading-[1.75] text-ink-2">
          {o.description.split(/\n{2,}/).map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </div>
      </DetailSection>

      {o.responsibilities.length > 0 && (
        <DetailSection id={sid("responsibilities")} title="Responsibilities">
          <DetailList items={o.responsibilities} />
        </DetailSection>
      )}

      {o.requirements.length > 0 && (
        <DetailSection id={sid("requirements")} title="Requirements">
          <DetailList items={o.requirements} />
        </DetailSection>
      )}

      <DetailSection id={sid("licensing")} title="Licensing requirements">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={o.licenseRequirement === "required" ? "navy" : o.licenseRequirement === "not_required" ? "neutral" : "gold"}>{LICENSE_REQ_LABEL[o.licenseRequirement]}</Badge>
          {o.licensesNeeded.map((l) => (
            <Tag key={l}>{l}</Tag>
          ))}
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">
          {o.licensesNeeded.length ? `Licenses or registrations named by the organization: ${o.licensesNeeded.join(", ")}.` : "The organization did not name specific licenses or registrations."}{" "}
          {primaryLine?.licensingNote}
        </p>
        <p className="mt-3 text-xs leading-relaxed text-ink-3">
          Licensing and registration rules vary by state and role, and change over time. Confirm current requirements with the applicable state department of insurance or regulator. Eligible
          states for this listing: {eligible}.
        </p>
      </DetailSection>

      <DetailSection id={sid("training")} title="Training & support">
        <div className="rounded-xl border border-line bg-surface p-5">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-ink-3" strokeWidth={1.75} />
            <span className="text-[14px] font-medium text-ink">{o.trainingProvided ? "Structured training provided" : "No structured training listed"}</span>
          </div>
          {o.trainingSummary && <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{o.trainingSummary}</p>}
        </div>
        {o.support.length > 0 && (
          <div className="mt-5">
            <h3 className="eyebrow mb-3">Support offered</h3>
            <div className="flex flex-wrap gap-2">
              {o.support.map((s) => (
                <span key={s} className="inline-flex items-center rounded-lg border border-line bg-surface px-3 py-1.5 text-[13px] text-ink-2">
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}
      </DetailSection>

      <DetailSection id={sid("leads")} title="Leads policy">
        <Badge tone={o.leads === "provided" ? "success" : o.leads === "available_at_cost" ? "warning" : "neutral"}>{LEADS_LABEL[o.leads]}</Badge>
        {o.leadsNotes && <p className="mt-3 text-[14.5px] leading-relaxed text-ink-2">{o.leadsNotes}</p>}
        {o.leads === "available_at_cost" && (
          <Notice tone="warning" className="mt-4">
            Leads for this opportunity are paid for by the producer. Ask for the full cost structure, minimums and refund terms in writing before committing.
          </Notice>
        )}
        {o.leads === "not_provided" && <p className="mt-3 text-xs text-ink-3">You would be expected to develop your own clients and referral sources.</p>}
      </DetailSection>

      <DetailSection id={sid("compensation")} title="Compensation">
        <Card className="p-5 sm:p-6">
          <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4">As disclosed by the organization</div>
          <div className="mt-1.5 text-[20px] font-semibold tracking-[-0.015em] text-ink">{compensationLabel(o.compensation)}</div>
          {!o.compensation.disclosed && <p className="mt-1 text-[13px] text-ink-3">The organization has not disclosed a compensation range for this listing.</p>}
          {o.compensation.notes && <p className="mt-4 border-t border-line pt-4 text-[14px] leading-relaxed text-ink-2">{o.compensation.notes}</p>}
          {commissionBased && (
            <p className="mt-3 text-[13px] leading-relaxed text-ink-3">Commission-based compensation depends on individual results and carrier contracts. No income level is guaranteed or implied.</p>
          )}
        </Card>
        <CompensationDisclaimer className="mt-4" />
      </DetailSection>

      {org && (
        <DetailSection id={sid("organization")} title="About the organization">
          <OrgOverviewCard org={org} openRoles={openRoles} />
        </DetailSection>
      )}
    </div>
  );
}

export function OrgOverviewCard({ org, openRoles }: { org: Organization; openRoles: number }) {
  return (
    <Card className="overflow-hidden">
      <div className="h-2" style={{ background: org.brand.color }} aria-hidden />
      <div className="p-5 sm:p-6">
        <div className="flex items-start gap-4">
          <OrgLogo brand={org.brand} name={org.name} size={48} />
          <div className="min-w-0 flex-1">
            <div className="text-xs font-medium uppercase tracking-[0.1em] text-ink-4">{ORG_CATEGORY_LABEL[org.category]}</div>
            <h3 className="mt-0.5 text-[17px] font-semibold tracking-[-0.01em] text-ink">{org.name}</h3>
            <p className="mt-1 text-[14px] leading-relaxed text-ink-3">{org.tagline}</p>
          </div>
        </div>
        <p className="mt-4 line-clamp-3 text-[14px] leading-relaxed text-ink-2">{org.about}</p>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {org.lines.slice(0, 4).map((l) => (
            <span key={l} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-surface px-2.5 py-0.5 text-xs text-ink-2">
              <LineIcon line={l} className="h-3 w-3 text-ink-4" />
              {lineName(l, true)}
            </span>
          ))}
        </div>
        <div className="mt-5 flex flex-col gap-3 border-t border-line pt-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[13px] text-ink-3">
            <span className="inline-flex items-center gap-1.5">
              <MapPin className="h-3.5 w-3.5" />
              {footprintLabel(org)}
            </span>
            <RecruitingDot status={org.recruitingStatus} />
            <span>{pluralize(openRoles, "open role")}</span>
          </div>
          <ButtonLink href={`/organizations/${org.slug}`} variant="secondary" size="sm">
            View organization profile <ArrowRight className="h-3.5 w-3.5" />
          </ButtonLink>
        </div>
      </div>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Split-view pane                                                     */
/* ------------------------------------------------------------------ */

/** Full posting rendered in the marketplace's right-hand pane. */
export function OpportunityPane({ o, org }: { o: Opportunity; org?: Organization }) {
  const { cta, dialog, existing } = useApplyCta(o, org, false);
  return (
    <article aria-label={`${o.title} — full posting`}>
      <div className="border-b border-line px-6 pb-5 pt-6 sm:px-7">
        <PostingHeader o={o} org={org} size="pane" titleAs="h2" />
        <div className="mt-5 rounded-xl border border-line bg-subtle/50 p-3.5">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div className="min-w-0">
              <div className="text-[11px] uppercase tracking-[0.1em] text-ink-4">Compensation as disclosed</div>
              <div className="mt-0.5 truncate text-[14.5px] font-semibold text-ink">{compensationLabel(o.compensation)}</div>
            </div>
            <Link href={`/opportunities/${o.slug}`} className="inline-flex items-center gap-1 rounded text-[12.5px] font-medium text-navy-600 hover:text-navy">
              Open full page <ArrowUpRight className="h-3.5 w-3.5" />
            </Link>
          </div>
          {existing && (
            <div className="mt-3">
              <AppliedStrip existing={existing} />
            </div>
          )}
          <div className="mt-3 flex gap-2">
            <div className="flex-1">{cta}</div>
            <SaveButton targetId={o.id} variant="button" />
          </div>
          <div className="mt-2.5 flex flex-wrap items-center justify-between gap-2">
            <p className="text-[12px] text-ink-3">You choose exactly what to share.</p>
            <ReportLink targetType="opportunity" targetId={o.id} label="Report this listing" />
          </div>
        </div>
      </div>
      <div className="px-6 py-7 sm:px-7">
        <PostingBody o={o} org={org} compact />
        <DemoApplicationDisclaimer className="mt-8" />
      </div>
      {dialog}
    </article>
  );
}
