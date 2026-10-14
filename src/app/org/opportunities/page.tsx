"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Archive, Briefcase, Copy, Eye, MoreHorizontal, Pencil, Plus, RotateCcw, Send } from "lucide-react";
import type { Opportunity, OpportunityStatus } from "@/lib/data/types";
import { ARRANGEMENT_LABEL } from "@/lib/data/taxonomy";
import { archiveOpportunity, duplicateOpportunity, opportunitiesForOrg, publishOpportunity, restoreOpportunityToDraft } from "@/lib/services/opportunities";
import { applicationsForOrg } from "@/lib/services/applications";
import { planUsage } from "@/lib/services/billing";
import { can } from "@/lib/auth/permissions";
import { OrgScope, OrgStatusNotice, type OrgContext } from "@/components/org/org-scope";
import { FLAG_GUIDE, personName } from "@/components/org/org-utils";
import { PageHeader } from "@/components/ui/page";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/tabs";
import { Popover, MenuItem } from "@/components/ui/menu";
import { ProgressBar } from "@/components/ui/stat";
import { toast } from "@/components/ui/toast";
import { KindBadge, OppStatusBadge } from "@/components/domain/badges";
import { opportunityLocation } from "@/components/domain/opportunity-card";
import { formatDate } from "@/lib/utils/dates";
import { pluralize } from "@/lib/utils/format";

type TabKey = "all" | "published" | "draft" | "review" | "attention" | "archived";

const TAB_STATUSES: Record<TabKey, OpportunityStatus[] | null> = {
  all: null,
  published: ["published"],
  draft: ["draft"],
  review: ["pending_review"],
  attention: ["changes_requested", "rejected"],
  archived: ["archived"],
};

export default function OrgOpportunitiesPage() {
  return <OrgScope>{(ctx) => <OpportunitiesList {...ctx} />}</OrgScope>;
}

function OpportunitiesList({ db, user, org }: OrgContext) {
  const [tab, setTab] = useState<TabKey>("all");
  const opps = useMemo(() => opportunitiesForOrg(db, org.id), [db, org.id]);
  const appCounts = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of applicationsForOrg(db, org.id)) m.set(a.opportunityId, (m.get(a.opportunityId) ?? 0) + 1);
    return m;
  }, [db, org.id]);
  const usage = useMemo(() => planUsage(db, org.id), [db, org.id]);
  const canManage = can(user, "org:manage_opportunities");

  const count = (k: TabKey) => (TAB_STATUSES[k] ? opps.filter((o) => TAB_STATUSES[k]!.includes(o.status)).length : opps.length);
  const shown = TAB_STATUSES[tab] ? opps.filter((o) => TAB_STATUSES[tab]!.includes(o.status)) : opps;
  const limit = usage.plan.limits.activeOpportunities;

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Opportunities"
        description="Jobs and affiliation opportunities your organization publishes. Every listing is pre-screened for income claims, guarantees and undisclosed costs."
        actions={canManage && <ButtonLink href="/org/opportunities/new" variant="accent" size="sm"><Plus className="h-4 w-4" /> New opportunity</ButtonLink>}
      />
      <OrgStatusNotice org={org} className="mb-6" />

      <Card className="mb-6 flex flex-col gap-4 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3 sm:justify-start">
            <span className="text-[13px] text-ink-3">Active listings on the {usage.plan.name} plan</span>
            <span className="text-sm font-semibold tabular-nums text-ink">
              {usage.active}
              <span className="font-normal text-ink-3"> / {limit == null ? "Unlimited" : limit}</span>
            </span>
          </div>
          {limit == null ? (
            <p className="mt-1.5 text-xs text-ink-3">Your plan has no limit on active listings.</p>
          ) : (
            <ProgressBar className="mt-2.5 max-w-md" value={(usage.active / Math.max(1, limit)) * 100} tone={usage.active >= limit ? "gold" : "navy"} />
          )}
          {limit != null && usage.active >= limit && <p className="mt-2 text-xs text-gold-ink">You&apos;ve reached your plan&apos;s active listing limit. Archive a listing or preview an upgrade to publish more.</p>}
        </div>
        <ButtonLink href="/org/billing" variant="ghost" size="sm">Plan & billing</ButtonLink>
      </Card>

      <Tabs<TabKey>
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: "all", label: "All", count: count("all") },
          { value: "published", label: "Published", count: count("published") },
          { value: "draft", label: "Drafts", count: count("draft") },
          { value: "review", label: "In review", count: count("review") },
          { value: "attention", label: "Needs changes", count: count("attention") },
          { value: "archived", label: "Archived", count: count("archived") },
        ]}
      />

      {shown.length === 0 ? (
        <EmptyState
          icon={<Briefcase className="h-5 w-5" strokeWidth={1.75} />}
          title={opps.length === 0 ? "No opportunities yet" : "Nothing in this view"}
          description={opps.length === 0 ? "Create your first listing. The compliance pre-check helps you write a clear, honest description before it goes live." : "Listings with this status will appear here."}
          action={opps.length === 0 && canManage ? <ButtonLink href="/org/opportunities/new" variant="accent" size="sm"><Plus className="h-4 w-4" /> New opportunity</ButtonLink> : undefined}
        />
      ) : (
        <ul className="space-y-3">
          {shown.map((o) => (
            <OpportunityRow key={o.id} o={o} ctx={{ db, user, org }} applications={appCounts.get(o.id) ?? 0} />
          ))}
        </ul>
      )}
    </div>
  );
}

function OpportunityRow({ o, ctx, applications }: { o: Opportunity; ctx: OrgContext; applications: number }) {
  const { db, user } = ctx;
  const publishable = ["draft", "changes_requested", "rejected"].includes(o.status);
  const restorable = ["archived", "rejected", "pending_review", "changes_requested"].includes(o.status);

  const publish = () => {
    const r = publishOpportunity(user, o.id);
    if (!r.ok) toast("Couldn't publish", { body: r.error, tone: "error" });
    else if (r.data.status === "published") toast("Published", { body: `${o.title} is live in opportunity search.` });
    else toast("Sent for review", { body: r.data.reasons.join(" · "), tone: "info" });
  };
  const archive = () => {
    const r = archiveOpportunity(user, o.id);
    if (r.ok) toast("Archived", { body: "The listing is hidden from search. Existing applications stay in your pipeline." });
    else toast("Couldn't archive", { body: r.error, tone: "error" });
  };
  const restore = () => {
    const r = restoreOpportunityToDraft(user, o.id);
    if (r.ok) toast("Restored to draft", { body: "Edit and publish when you're ready." });
    else toast("Couldn't restore", { body: r.error, tone: "error" });
  };
  const duplicate = () => {
    const r = duplicateOpportunity(user, o.id);
    if (r.ok) toast("Duplicated", { body: "A new draft copy was created." });
    else toast("Couldn't duplicate", { body: r.error, tone: "error" });
  };
  const preview = () => window.open(`/opportunities/${o.slug}`, "_blank", "noopener");

  const conversion = o.views ? `${((applications / o.views) * 100).toFixed(1)}%` : "—";
  const mod = o.moderation;
  const showMod = !!mod && (mod.flags.length > 0 || !!mod.reviewerNote) && o.status !== "published";

  return (
    <li>
      <Card className="px-5 py-4 sm:px-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <OppStatusBadge status={o.status} />
              <KindBadge kind={o.kind} />
            </div>
            <h2 className="mt-2 text-[15.5px] font-semibold tracking-[-0.01em] text-ink">
              <Link href={`/org/opportunities/${o.id}`} className="hover:underline hover:underline-offset-4">{o.title}</Link>
            </h2>
            <p className="mt-1 text-[13px] text-ink-3">
              {opportunityLocation(o)} · {ARRANGEMENT_LABEL[o.arrangement]} · {o.postedAt && o.status === "published" ? `Posted ${formatDate(o.postedAt)}` : `Updated ${formatDate(o.updatedAt)}`}
            </p>
          </div>

          <dl className="grid grid-cols-3 gap-6 text-right md:w-[260px]">
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-4">Views</dt>
              <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">{o.views.toLocaleString()}</dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-4">Applied</dt>
              <dd className="mt-0.5 text-[15px] font-semibold tabular-nums">
                {applications > 0 ? <Link href="/org/pipeline" className="hover:text-navy">{applications}</Link> : 0}
              </dd>
            </div>
            <div>
              <dt className="text-[11px] uppercase tracking-[0.08em] text-ink-4">Conv.</dt>
              <dd className="mt-0.5 text-[15px] font-semibold tabular-nums text-ink-2">{conversion}</dd>
            </div>
          </dl>

          <div className="flex items-center gap-1.5 md:justify-end">
            <ButtonLink href={`/org/opportunities/${o.id}`} variant="secondary" size="sm"><Pencil className="h-3.5 w-3.5" /> Edit</ButtonLink>
            {publishable && (
              <Button variant="accent" size="sm" onClick={publish}><Send className="h-3.5 w-3.5" /> Publish</Button>
            )}
            <Popover
              label={`Actions for ${o.title}`}
              className="w-52 p-1.5"
              trigger={({ toggle, open }) => (
                <button type="button" onClick={toggle} aria-expanded={open} aria-label={`More actions for ${o.title}`} className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-3 transition hover:bg-sunken hover:text-ink">
                  <MoreHorizontal className="h-4 w-4" />
                </button>
              )}
            >
              {(close) => (
                <div>
                  <MenuItem icon={<Eye className="h-4 w-4" />} onClick={() => { close(); preview(); }}>Preview</MenuItem>
                  <MenuItem icon={<Copy className="h-4 w-4" />} onClick={() => { close(); duplicate(); }}>Duplicate</MenuItem>
                  {restorable && <MenuItem icon={<RotateCcw className="h-4 w-4" />} onClick={() => { close(); restore(); }}>Restore to draft</MenuItem>}
                  {o.status !== "archived" && <MenuItem danger icon={<Archive className="h-4 w-4" />} onClick={() => { close(); archive(); }}>Archive</MenuItem>}
                </div>
              )}
            </Popover>
          </div>
        </div>

        {showMod && (
          <div className="mt-4 space-y-2 border-t border-line pt-4">
            {mod!.reviewerNote && (
              <Notice tone="warning" title={`Reviewer note${mod!.reviewedBy ? ` · ${personName(db, mod!.reviewedBy)}` : ""}${mod!.reviewedAt ? ` · ${formatDate(mod!.reviewedAt)}` : ""}`}>
                {mod!.reviewerNote}
              </Notice>
            )}
            {mod!.flags.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5 text-xs text-ink-3">
                <span className="mr-1">Pre-screen {pluralize(mod!.flags.length, "flag")}:</span>
                {mod!.flags.map((f, i) => (
                  <span key={i} title={f.excerpt} className="inline-flex items-center gap-1 rounded-md bg-warning-50 px-2 py-0.5 text-[11.5px] font-medium text-warning ring-1 ring-inset ring-warning/15">
                    {FLAG_GUIDE[f.code]?.title ?? f.label}
                  </span>
                ))}
              </div>
            )}
          </div>
        )}
      </Card>
    </li>
  );
}
