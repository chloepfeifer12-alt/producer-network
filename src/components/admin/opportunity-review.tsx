"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { CircleCheck, CircleX, EyeOff, MessageSquare, ExternalLink } from "lucide-react";
import type { ModerationFlag, Opportunity, User } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { can } from "@/lib/auth/permissions";
import { approveOpportunity, REJECTION_REASONS, returnOpportunity, unpublishOpportunity } from "@/lib/services/admin";
import { screenOpportunity } from "@/lib/services/moderation-rules";
import {
  ARRANGEMENT_LABEL,
  CATEGORY_LABEL,
  ENGAGEMENT_LABEL,
  EXPERIENCE_LABEL,
  LEADS_LABEL,
  LICENSE_REQ_LABEL,
  lineName,
} from "@/lib/data/taxonomy";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge, Tag } from "@/components/ui/badge";
import { Checkbox, Field, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { Segmented } from "@/components/ui/tabs";
import { toastResult } from "@/components/ui/toast";
import { OrgLogo } from "@/components/brand/org-logo";
import { KindBadge, ListingStatusBadge, OppStatusBadge } from "@/components/domain/badges";
import { CompensationDisclaimer } from "@/components/domain/disclaimers";
import { opportunityLocation } from "@/components/domain/opportunity-card";
import { compensationLabel } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { deniedReason, userName } from "./admin-kit";
import { FlagList, Highlight } from "./moderation";

/** Stored moderation flags merged with a live re-screen of the current text. */
export function effectiveFlags(o: Opportunity): { flags: ModerationFlag[]; liveOnly: number } {
  const stored = o.moderation?.flags ?? [];
  const live = screenOpportunity(o);
  const extra = live.filter((l) => !stored.some((s) => s.code === l.code));
  return { flags: [...stored, ...extra], liveOnly: extra.length };
}

type Decision = "approve" | "changes_requested" | "rejected" | "unpublish";

function Block({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="border-t border-line py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 text-[11.5px] font-medium uppercase tracking-[0.1em] text-ink-4">{title}</h3>
      <div className="text-sm leading-relaxed text-ink-2">{children}</div>
    </section>
  );
}

export function OpportunityReviewDialog({ opp, user, onClose }: { opp: Opportunity; user: User | null; onClose: () => void }) {
  const db = useDb();
  const org = db.organizations.find((o) => o.id === opp.orgId);
  const { flags } = useMemo(() => effectiveFlags(opp), [opp]);
  const extra = flags.map((f) => f.excerpt ?? "").filter(Boolean);
  const allowed = can(user, "admin:moderate_content");
  const isLive = opp.status === "published";

  const defaultDecision: Decision = isLive ? "unpublish" : flags.length ? "changes_requested" : "approve";
  const [decision, setDecision] = useState<Decision>(defaultDecision);
  const firstReason = flags.some((f) => f.code === "income_claim" || f.code === "guarantee_language")
    ? "misleading_income_claim"
    : flags.some((f) => f.code === "undisclosed_costs")
      ? "undisclosed_fees"
      : flags.some((f) => f.code === "misleading_title")
        ? "misrepresentation"
        : "incomplete";
  const [reason, setReason] = useState<string>(firstReason);
  const reasonMessage = (code: string) => REJECTION_REASONS.find((r) => r.code === code)?.message ?? "";
  const [note, setNote] = useState<string>(defaultDecision === "approve" || defaultDecision === "unpublish" ? "" : reasonMessage(firstReason));
  const [ack, setAck] = useState(false);
  const [touched, setTouched] = useState(false);

  const needsNote = decision !== "approve";
  const noteError = touched && needsNote && note.trim().length < 10 ? "Explain the decision to the organization (at least 10 characters)." : undefined;
  const orgBlocked = decision === "approve" && org?.listingStatus !== "approved";
  const ackMissing = decision === "approve" && flags.length > 0 && !ack;

  /** The note is still a prefilled template (safe to replace) rather than reviewer-written text. */
  const isTemplate = !note.trim() || REJECTION_REASONS.some((r) => r.message === note);

  const chooseReason = (code: string) => {
    setReason(code);
    if (isTemplate) setNote(reasonMessage(code));
  };

  const chooseDecision = (d: Decision) => {
    setDecision(d);
    setTouched(false);
    if (isTemplate) setNote(d === "changes_requested" || d === "rejected" ? reasonMessage(reason) : "");
  };

  const submit = () => {
    setTouched(true);
    if (needsNote && note.trim().length < 10) return;
    let ok = false;
    if (decision === "approve") ok = toastResult(approveOpportunity(user, opp.id, note.trim() || undefined), "Listing approved & published", `${opp.title} is live. The organization was notified.`);
    else if (decision === "unpublish") ok = toastResult(unpublishOpportunity(user, opp.id, note), "Listing unpublished", "Returned to the organization with changes requested.");
    else ok = toastResult(returnOpportunity(user, opp.id, decision, reason, note), decision === "rejected" ? "Listing rejected" : "Changes requested", "The organization was notified with your note.");
    if (ok) onClose();
  };

  const decisionItems: { value: Decision; label: string }[] = isLive
    ? [{ value: "unpublish", label: "Unpublish" }]
    : [
        { value: "approve", label: "Approve" },
        { value: "changes_requested", label: "Request changes" },
        { value: "rejected", label: "Reject" },
      ];

  return (
    <Dialog
      open
      onClose={onClose}
      size="xl"
      title="Review listing"
      description={`${org?.name ?? "Unknown organization"} · submitted ${formatDate(opp.updatedAt)}`}
      footer={
        <>
          <Link href={`/opportunities/${opp.slug}`} target="_blank" className="mr-auto inline-flex items-center gap-1.5 text-[13px] text-navy-600 hover:text-navy">
            <ExternalLink className="h-3.5 w-3.5" /> Preview as published page
          </Link>
          <Button variant="ghost" onClick={onClose}>Close</Button>
          <span title={!allowed ? deniedReason(user, "admin:moderate_content") : orgBlocked ? "Approve the organization first." : ackMissing ? "Confirm you reviewed the flagged phrases." : undefined} className="inline-flex">
            <Button
              variant={decision === "approve" ? "accent" : decision === "changes_requested" ? "primary" : "danger"}
              onClick={submit}
              disabled={!allowed || orgBlocked || ackMissing}
            >
              {decision === "approve" ? <><CircleCheck className="h-4 w-4" /> Approve & publish</> : decision === "unpublish" ? <><EyeOff className="h-4 w-4" /> Unpublish listing</> : decision === "rejected" ? <><CircleX className="h-4 w-4" /> Reject listing</> : <><MessageSquare className="h-4 w-4" /> Request changes</>}
            </Button>
          </span>
        </>
      }
    >
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        {/* Listing content */}
        <article className="min-w-0">
          <div className="flex items-start gap-3">
            {org && <OrgLogo brand={org.brand} name={org.name} size={40} />}
            <div className="min-w-0">
              <div className="text-[13px] text-ink-3">{org?.name}</div>
              <h3 className="text-lg font-semibold leading-snug tracking-[-0.01em] text-ink"><Highlight text={opp.title} extra={extra} /></h3>
              <div className="mt-2 flex flex-wrap items-center gap-1.5">
                <KindBadge kind={opp.kind} />
                <OppStatusBadge status={opp.status} />
                {opp.lines.map((l) => <Tag key={l}>{lineName(l)}</Tag>)}
              </div>
            </div>
          </div>

          <dl className="mt-4 grid grid-cols-2 gap-3 rounded-xl bg-subtle/70 p-3 text-[13px] sm:grid-cols-3">
            <div><dt className="text-xs text-ink-3">Location</dt><dd className="text-ink">{opportunityLocation(opp)}</dd></div>
            <div><dt className="text-xs text-ink-3">Arrangement</dt><dd className="text-ink">{ARRANGEMENT_LABEL[opp.arrangement]}</dd></div>
            <div><dt className="text-xs text-ink-3">Engagement</dt><dd className="text-ink">{ENGAGEMENT_LABEL[opp.engagement]}</dd></div>
            <div><dt className="text-xs text-ink-3">Experience</dt><dd className="text-ink">{EXPERIENCE_LABEL[opp.experienceLevel]}</dd></div>
            <div><dt className="text-xs text-ink-3">Licensing</dt><dd className="text-ink">{LICENSE_REQ_LABEL[opp.licenseRequirement]}</dd></div>
            <div><dt className="text-xs text-ink-3">Category</dt><dd className="text-ink">{CATEGORY_LABEL[opp.category]}</dd></div>
          </dl>

          <div className="mt-5">
            <Block title="Summary"><Highlight text={opp.summary} extra={extra} /></Block>
            <Block title="Description"><p className="whitespace-pre-line"><Highlight text={opp.description} extra={extra} /></p></Block>
            {[["Responsibilities", opp.responsibilities], ["Requirements", opp.requirements], ["Support provided", opp.support]].map(([t, items]) => (
              <Block key={t as string} title={t as string}>
                {(items as string[]).length ? (
                  <ul className="list-disc space-y-1 pl-5">{(items as string[]).map((x, i) => <li key={i}><Highlight text={x} extra={extra} /></li>)}</ul>
                ) : <span className="italic text-ink-4">None listed</span>}
              </Block>
            ))}
            <Block title="Training">
              {opp.trainingProvided ? <Highlight text={opp.trainingSummary || "Training provided (not described)."} extra={extra} /> : "No training provided."}
            </Block>
            <Block title="Compensation as disclosed">
              <div className="font-medium text-ink">{compensationLabel(opp.compensation)}</div>
              <p className="mt-1">{opp.compensation.notes ? <Highlight text={opp.compensation.notes} extra={extra} /> : <span className="italic text-danger">No compensation description</span>}</p>
              <CompensationDisclaimer className="mt-3" />
            </Block>
            <Block title="Leads">
              <div className="font-medium text-ink">{LEADS_LABEL[opp.leads]}</div>
              <p className="mt-1">{opp.leadsNotes ? <Highlight text={opp.leadsNotes} extra={extra} /> : <span className="italic text-danger">{opp.leads === "available_at_cost" ? "Producer-paid leads with no cost disclosure" : "No notes"}</span>}</p>
            </Block>
          </div>
        </article>

        {/* Decision panel */}
        <aside className="space-y-5 lg:border-l lg:border-line lg:pl-6">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h3 className="text-[13px] font-semibold text-ink">Automated pre-screen</h3>
              {flags.length > 0 && <Badge tone="danger">{flags.length}</Badge>}
            </div>
            <FlagList flags={flags} />
          </div>

          {org && (
            <div className="rounded-xl border border-line p-3 text-[13px]">
              <div className="flex items-center justify-between gap-2">
                <span className="text-ink-3">Organization</span>
                <ListingStatusBadge status={org.listingStatus} />
              </div>
              <Link href={`/admin/organizations/${org.id}`} className="mt-1 block font-medium text-navy-600 hover:text-navy">{org.name}</Link>
            </div>
          )}

          {opp.moderation?.reviewerNote && (
            <div className="rounded-xl bg-subtle p-3 text-[13px]">
              <div className="text-xs text-ink-3">Previous reviewer note{opp.moderation.reviewedBy ? ` · ${userName(db, opp.moderation.reviewedBy)}` : ""}</div>
              <p className="mt-1 text-ink-2">{opp.moderation.reviewerNote}</p>
            </div>
          )}

          <div className="space-y-4 border-t border-line pt-5">
            <h3 className="text-[13px] font-semibold text-ink">Decision</h3>
            {decisionItems.length > 1 && <Segmented<Decision> ariaLabel="Decision" items={decisionItems} value={decision} onChange={chooseDecision} />}

            {orgBlocked && (
              <Notice tone="warning">
                {org?.name} is not approved yet. <Link href={`/admin/organizations/${org?.id}`} className="font-medium underline">Review the organization</Link> before publishing its listings.
              </Notice>
            )}

            {(decision === "changes_requested" || decision === "rejected") && (
              <Field id="reject-reason" label="Reason code">
                <Select id="reject-reason" value={reason} onChange={(e) => chooseReason(e.target.value)}>
                  {REJECTION_REASONS.map((r) => <option key={r.code} value={r.code}>{r.label}</option>)}
                </Select>
              </Field>
            )}

            {decision === "approve" && flags.length > 0 && (
              <Checkbox checked={ack} onChange={setAck} label="I reviewed every flagged phrase" description="Approving flagged content is recorded with your name in the audit log." />
            )}

            <Field
              id="decision-note"
              label={decision === "approve" ? "Approval note" : "Message to the organization"}
              optional={decision === "approve"}
              error={noteError}
              hint={decision === "approve" ? "Recorded in the audit log." : "Shared with the organization and recorded in the audit log."}
            >
              <Textarea id="decision-note" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => setTouched(true)} className="min-h-[120px]" aria-invalid={!!noteError} />
            </Field>
            {decision === "unpublish" && <p className="text-xs text-ink-3">The listing leaves search immediately and returns to the organization as “Changes requested”.</p>}
          </div>
        </aside>
      </div>
    </Dialog>
  );
}

