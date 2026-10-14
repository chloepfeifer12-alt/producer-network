"use client";

import { useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Ban, Building2, CircleCheck, ExternalLink, Flag, MessageSquare, CircleX } from "lucide-react";
import type { OrgListingStatus } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can, ROLE_LABEL } from "@/lib/auth/permissions";
import { setOrganizationStatus } from "@/lib/services/admin";
import {
  ARRANGEMENT_LABEL,
  ENGAGEMENT_LABEL,
  LEADS_LABEL,
  ORG_CATEGORY_LABEL,
  RECRUITING_LABEL,
  REPORT_REASON_LABEL,
  lineName,
  stateName,
} from "@/lib/data/taxonomy";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge, Tag } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { DemoTag, EmptyState, Notice } from "@/components/ui/feedback";
import { toastResult } from "@/components/ui/toast";
import { OrgLogo } from "@/components/brand/org-logo";
import { KindBadge, ListingStatusBadge, OppStatusBadge } from "@/components/domain/badges";
import { GuardedButton, NoteDialog, profileTone, TableShell, Td, Th, userName } from "@/components/admin/admin-kit";
import { CheckIcon, FlagList, Highlight, organizationChecklist } from "@/components/admin/moderation";
import { formatDate, relativeDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

type Decision = "approved" | "changes_requested" | "rejected" | "suspended";

const DECISION_COPY: Record<Decision, { title: string; confirm: string; description: string; placeholder: string; tone: "accent" | "danger" | "primary" }> = {
  approved: {
    title: "Approve organization",
    confirm: "Approve & publish profile",
    description: "The profile becomes public in the directory, pending team accounts are activated and the team can publish listings (each still pre-screened).",
    placeholder: "Optional note to the organization (e.g. what you verified).",
    tone: "accent",
  },
  changes_requested: {
    title: "Request changes",
    confirm: "Send change request",
    description: "The organization is notified with your note and can resubmit. The profile stays out of the directory.",
    placeholder: "Be specific: what must change before approval?",
    tone: "primary",
  },
  rejected: {
    title: "Reject application",
    confirm: "Reject application",
    description: "The application is closed and any published listings are archived. The organization is notified with your note.",
    placeholder: "Explain which policy the application does not meet.",
    tone: "danger",
  },
  suspended: {
    title: "Suspend organization",
    confirm: "Suspend organization",
    description: "The profile is removed from the directory and every published listing is archived immediately. Team accounts remain but cannot publish.",
    placeholder: "Reason for suspension (shared with the organization and recorded in the audit log).",
    tone: "danger",
  },
};

function Section({ title, children, className }: { title: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("border-t border-line px-5 py-5 sm:px-6", className)}>
      <h3 className="mb-2.5 text-[11.5px] font-medium uppercase tracking-[0.1em] text-ink-4">{title}</h3>
      <div className="text-sm leading-relaxed text-ink-2">{children}</div>
    </div>
  );
}

function Fact({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <dt className="text-xs text-ink-3">{label}</dt>
      <dd className="mt-0.5 text-sm text-ink">{children}</dd>
    </div>
  );
}

function Missing({ children = "Not provided" }: { children?: ReactNode }) {
  return <span className="italic text-danger">{children}</span>;
}

export default function AdminOrganizationReviewPage() {
  const { id } = useParams<{ id: string }>();
  const db = useDb();
  const user = useCurrentUser();
  const [decision, setDecision] = useState<Decision | null>(null);

  const org = useMemo(() => db.organizations.find((o) => o.id === id || o.slug === id), [db, id]);
  const review = useMemo(() => (org ? organizationChecklist(db, org) : null), [db, org]);
  const team = useMemo(() => (org ? db.users.filter((u) => u.orgId === org.id) : []), [db, org]);
  const opps = useMemo(() => (org ? db.opportunities.filter((o) => o.orgId === org.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)) : []), [db, org]);
  const reports = useMemo(() => {
    if (!org) return [];
    const oppIds = new Set(opps.map((o) => o.id));
    const teamIds = new Set(team.map((u) => u.id));
    return db.reports
      .filter((r) => (r.targetType === "organization" && r.targetId === org.id) || (r.targetType === "opportunity" && oppIds.has(r.targetId)) || (r.targetType === "user" && teamIds.has(r.targetId)))
      .sort((a, b) => (a.status === "open" ? -1 : 1) - (b.status === "open" ? -1 : 1) || b.createdAt.localeCompare(a.createdAt));
  }, [db, org, opps, team]);
  const history = useMemo(() => (org ? db.audit.filter((e) => e.targetType === "organization" && e.targetId === org.id).slice(0, 6) : []), [db, org]);

  if (!org || !review) {
    return (
      <div>
        <PageHeader breadcrumbs={[{ href: "/admin/organizations", label: "Organizations" }, { label: "Not found" }]} title="Organization not found" />
        <EmptyState icon={<Building2 className="h-5 w-5" />} title="We couldn't find that organization" description="It may have been removed from this browser's demo data." action={<ButtonLink href="/admin/organizations" variant="secondary">Back to organizations</ButtonLink>} />
      </div>
    );
  }

  const status = org.listingStatus;
  const failing = review.checks.filter((c) => c.status === "fail");
  const warnings = review.checks.filter((c) => c.status === "warn");
  const openReports = reports.filter((r) => r.status === "open");
  const extra = review.flags.map((f) => f.excerpt ?? "").filter(Boolean);

  const availability: Record<Decision, string | undefined> = {
    approved: status === "approved" ? "Already approved." : undefined,
    changes_requested: status === "rejected" || status === "suspended" ? "Reinstate the organization first." : undefined,
    rejected: status === "pending" || status === "changes_requested" ? undefined : status === "approved" ? "Use Suspend for an approved organization." : "Already closed.",
    suspended: status === "approved" ? undefined : "Only approved organizations can be suspended.",
  };

  const decide = (d: Decision, note: string) => {
    const r = setOrganizationStatus(user, org.id, d as OrgListingStatus, note);
    const label = { approved: status === "rejected" || status === "suspended" ? "Organization reinstated" : "Organization approved", changes_requested: "Changes requested", rejected: "Application rejected", suspended: "Organization suspended" }[d];
    return toastResult(r, label, `${org.name} was notified. Logged to the audit trail.`);
  };

  const copy = decision ? DECISION_COPY[decision] : null;

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ href: "/admin/organizations", label: "Organizations" }, { label: org.name }]}
        title={
          <span className="flex items-center gap-4">
            <OrgLogo brand={org.brand} name={org.name} size={48} />
            <span className="min-w-0">{org.name}</span>
          </span>
        }
        description={
          <span className="flex flex-wrap items-center gap-2">
            <ListingStatusBadge status={status} />
            <span>{ORG_CATEGORY_LABEL[org.category]} · {org.hqCity}, {org.hqState} · submitted {formatDate(org.createdAt)}</span>
            <DemoTag>Fictional</DemoTag>
          </span>
        }
        actions={
          status === "approved" ? (
            <ButtonLink href={`/organizations/${org.slug}`} variant="secondary" size="sm" target="_blank">
              <ExternalLink className="h-3.5 w-3.5" /> Public profile
            </ButtonLink>
          ) : undefined
        }
      />

      {org.listingNote && (
        <Notice tone={status === "approved" ? "info" : "warning"} title="Prior decision note" className="mb-6">
          {org.listingNote}
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        {/* ---------------- Submitted profile ---------------- */}
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader eyebrow="Submitted profile" title="What the organization submitted" description="Phrases matching the pre-screen are highlighted for review." />
            <CardBody className="pb-4">
              <p className="font-display text-xl leading-snug text-ink">
                “<Highlight text={org.tagline} extra={extra} />”
              </p>
              <p className="mt-3 text-sm leading-relaxed text-ink-2">
                {org.about ? <Highlight text={org.about} extra={extra} /> : <Missing />}
              </p>
            </CardBody>
            <div className="border-t border-line px-5 py-5 sm:px-6">
              <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <Fact label="Category">{ORG_CATEGORY_LABEL[org.category]}</Fact>
                <Fact label="Founded">{org.founded}</Fact>
                <Fact label="Team size">{org.teamSize}</Fact>
                <Fact label="Footprint">{org.footprint.replace("_", "-")} · {org.statesServed.includes("ALL") ? "Nationwide" : org.statesServed.map((s) => stateName(s)).join(", ")}</Fact>
                <Fact label="Engagement">{org.engagementTypes.length ? org.engagementTypes.map((e) => ENGAGEMENT_LABEL[e]).join(" · ") : <Missing />}</Fact>
                <Fact label="Work arrangements">{org.arrangements.map((a) => ARRANGEMENT_LABEL[a]).join(" · ")}</Fact>
                <Fact label="Recruiting">{RECRUITING_LABEL[org.recruitingStatus]}</Fact>
                <Fact label="Recruiting contact">{org.recruitingContact.name} · {org.recruitingContact.title}</Fact>
                <Fact label="Plan">{db.plans.find((p) => p.id === org.plan)?.name}</Fact>
              </dl>
              <div className="mt-4 flex flex-wrap gap-1.5">{org.lines.map((l) => <Tag key={l}>{lineName(l)}</Tag>)}</div>
            </div>
            <Section title="Compensation approach">
              {org.compensationApproach ? <Highlight text={org.compensationApproach} extra={extra} /> : <Missing>Not described — required before approval</Missing>}
            </Section>
            <Section title="Lead program">
              <div className="mb-1 font-medium text-ink">{LEADS_LABEL[org.leadProgram.policy]}</div>
              {org.leadProgram.description ? <Highlight text={org.leadProgram.description} extra={extra} /> : <Missing />}
            </Section>
            <Section title="Training">
              {org.trainingPrograms.length ? (
                <ul className="space-y-2.5">
                  {org.trainingPrograms.map((t) => (
                    <li key={t.id}>
                      <span className="font-medium text-ink">{t.name}</span> <span className="text-ink-3">· {t.format.replace("_", " ")} · {t.duration}</span>
                      <div className="text-ink-3"><Highlight text={t.description} /></div>
                    </li>
                  ))}
                </ul>
              ) : (
                <Missing>{org.trainingAvailable ? "Says training is available but describes no programs" : "No training programs"}</Missing>
              )}
              <div className="mt-3 text-ink-3">
                Mentorship: {org.mentorship.available ? "available" : "not offered"}
                {org.mentorship.description && ` — ${org.mentorship.description}`}
              </div>
            </Section>
            <Section title="Culture & leadership">
              {org.culture.summary ? <p>{org.culture.summary}</p> : <Missing>Culture not described</Missing>}
              {org.culture.values.length > 0 && (
                <ul className="mt-2 list-disc space-y-1 pl-5 text-ink-3">
                  {org.culture.values.map((v) => <li key={v.title}><span className="text-ink-2">{v.title}</span> — {v.description}</li>)}
                </ul>
              )}
              <div className="mt-3 flex flex-wrap gap-3">
                {org.leadership.length ? org.leadership.map((l) => (
                  <div key={l.id} className="flex items-center gap-2">
                    <Avatar name={l.name} tone={l.name.length} size={28} />
                    <div className="text-[13px]"><div className="font-medium text-ink">{l.name}</div><div className="text-xs text-ink-3">{l.title}</div></div>
                  </div>
                )) : <Missing>No leadership listed</Missing>}
              </div>
            </Section>
          </Card>

          <Card>
            <CardHeader title="Listings" description="All opportunities this organization has created, in any status." />
            <CardBody className="px-0 pb-2 sm:px-0">
              {opps.length === 0 ? (
                <div className="px-5 sm:px-6"><EmptyState compact title="No listings yet" description="Listings appear here once the organization drafts or submits them." /></div>
              ) : (
                <TableShell minWidth={620}>
                  <thead><tr><Th>Title</Th><Th>Type</Th><Th>Status</Th><Th>Flags</Th><Th>Updated</Th></tr></thead>
                  <tbody>
                    {opps.map((o) => (
                      <tr key={o.id}>
                        <Td>
                          <Link href={`/admin/opportunities?review=${o.id}`} className="font-medium text-ink hover:text-navy hover:underline underline-offset-4">{o.title}</Link>
                        </Td>
                        <Td><KindBadge kind={o.kind} /></Td>
                        <Td><OppStatusBadge status={o.status} /></Td>
                        <Td>{o.moderation?.flags.length ? <Badge tone="danger">{o.moderation.flags.length} flag{o.moderation.flags.length === 1 ? "" : "s"}</Badge> : <span className="text-ink-4">—</span>}</Td>
                        <Td className="whitespace-nowrap">{relativeDay(o.updatedAt)}</Td>
                      </tr>
                    ))}
                  </tbody>
                </TableShell>
              )}
            </CardBody>
          </Card>

          <div className="grid gap-6 xl:grid-cols-2">
            <Card>
              <CardHeader title="Team accounts" description="Pending accounts activate on approval." />
              <CardBody>
                {team.length === 0 ? <p className="text-sm text-ink-3">No team accounts.</p> : (
                  <ul className="space-y-3">
                    {team.map((u) => (
                      <li key={u.id} className="flex items-center gap-3">
                        <Avatar name={u.name} tone={profileTone(db, u.id)} size={32} />
                        <div className="min-w-0 flex-1">
                          <div className="truncate text-[13.5px] font-medium text-ink">{u.name}</div>
                          <div className="truncate text-xs text-ink-3">{u.email}</div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <span className="text-xs text-ink-3">{ROLE_LABEL(u)}</span>
                          <Badge tone={u.status === "active" ? "success" : u.status === "pending" ? "gold" : "danger"}>{u.status}</Badge>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>

            <Card>
              <CardHeader title="Reports" description="About this organization, its listings or its team." action={openReports.length ? <Badge tone="danger">{openReports.length} open</Badge> : undefined} />
              <CardBody>
                {reports.length === 0 ? <p className="text-sm text-ink-3">No reports.</p> : (
                  <ul className="space-y-3">
                    {reports.map((r) => (
                      <li key={r.id} className="rounded-xl border border-line p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex items-center gap-1.5 text-[13px] font-medium text-ink"><Flag className="h-3.5 w-3.5 text-ink-4" />{REPORT_REASON_LABEL[r.reason]}</div>
                          <Badge tone={r.status === "open" ? "warning" : r.status === "actioned" ? "success" : "outline"}>{r.status}</Badge>
                        </div>
                        <p className="mt-1 text-[13px] text-ink-3">{r.details}</p>
                        <div className="mt-2 flex items-center justify-between text-xs text-ink-4">
                          <span>{r.targetType} · by {userName(db, r.reporterId)} · {relativeDay(r.createdAt)}</span>
                          <Link href={`/admin/reports#${r.id}`} className="text-navy-600 hover:text-navy">Open</Link>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardBody>
            </Card>
          </div>
        </div>

        {/* ---------------- Review sidebar ---------------- */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:self-start">
          <Card>
            <CardHeader
              eyebrow="Review checklist"
              title={failing.length ? `${failing.length} check${failing.length === 1 ? "" : "s"} failing` : warnings.length ? "Passes with notes" : "All checks pass"}
              description="Automated heuristics on the submitted text plus listing consistency. Use judgment — they never decide for you."
            />
            <CardBody>
              <ul className="space-y-3.5">
                {review.checks.map((c) => (
                  <li key={c.id} className="flex gap-2.5">
                    <span className="mt-0.5"><CheckIcon status={c.status} /></span>
                    <div className="min-w-0 text-[13px]">
                      <div className="font-medium text-ink">{c.label}</div>
                      <div className="text-ink-3">{c.detail}</div>
                      {c.excerpt && c.status !== "pass" && (
                        <div className="mt-1 rounded-md bg-subtle px-2 py-1 text-[12px] text-ink-2">“<Highlight text={c.excerpt} />”</div>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
              {review.flags.length > 0 && (
                <div className="mt-5 border-t border-line pt-4">
                  <div className="mb-2 text-[11.5px] font-medium uppercase tracking-[0.1em] text-ink-4">Pre-screen flags</div>
                  <FlagList flags={review.flags} />
                </div>
              )}
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Decision" description={can(user, "admin:manage_organizations") ? "Negative decisions require a note shared with the organization." : undefined} />
            <CardBody className="space-y-2">
              <div className="grid grid-cols-1 gap-2 [&_button]:w-full [&>span]:w-full">
                <GuardedButton user={user} permission="admin:manage_organizations" disabledReason={availability.approved} variant="accent" onClick={() => setDecision("approved")}>
                  <CircleCheck className="h-4 w-4" /> {status === "rejected" || status === "suspended" ? "Reinstate & approve" : "Approve"}
                </GuardedButton>
                <GuardedButton user={user} permission="admin:manage_organizations" disabledReason={availability.changes_requested} variant="secondary" onClick={() => setDecision("changes_requested")}>
                  <MessageSquare className="h-4 w-4" /> Request changes
                </GuardedButton>
                <GuardedButton user={user} permission="admin:manage_organizations" disabledReason={availability.rejected} variant="danger" onClick={() => setDecision("rejected")}>
                  <CircleX className="h-4 w-4" /> Reject
                </GuardedButton>
                <GuardedButton user={user} permission="admin:manage_organizations" disabledReason={availability.suspended} variant="danger" onClick={() => setDecision("suspended")}>
                  <Ban className="h-4 w-4" /> Suspend
                </GuardedButton>
              </div>
            </CardBody>
            {history.length > 0 && (
              <CardFooter className="block">
                <div className="mb-2 text-[11.5px] font-medium uppercase tracking-[0.1em] text-ink-4">History</div>
                <ol className="space-y-2">
                  {history.map((e) => (
                    <li key={e.id} className="text-xs text-ink-3">
                      <span className="font-medium text-ink-2">{e.action.replace("organization.", "").replace(/_/g, " ")}</span> · {userName(db, e.actorId)} · {relativeDay(e.at)}
                      {e.detail && <div className="line-clamp-2 text-ink-4">{e.detail}</div>}
                    </li>
                  ))}
                </ol>
              </CardFooter>
            )}
          </Card>
        </aside>
      </div>

      {copy && decision && (
        <NoteDialog
          open
          onClose={() => setDecision(null)}
          title={copy.title}
          description={copy.description}
          confirmLabel={copy.confirm}
          tone={copy.tone}
          minLength={decision === "approved" ? 0 : 10}
          noteLabel={decision === "approved" ? "Approval note" : "Note to the organization"}
          notePlaceholder={copy.placeholder}
          initialNote={decision === "changes_requested" ? failing.map((c) => `• ${c.label}: ${c.detail}`).join("\n") : ""}
          onConfirm={(note) => decide(decision, note)}
        >
          {decision === "approved" && failing.length > 0 && (
            <Notice tone="warning" title={`${failing.length} checklist item${failing.length === 1 ? "" : "s"} failing`}>
              {failing.map((c) => c.label).join(" · ")}. Approving anyway is recorded in the audit log — consider requesting changes instead.
            </Notice>
          )}
          {(decision === "rejected" || decision === "suspended") && opps.some((o) => o.status === "published") && (
            <Notice tone="danger">{opps.filter((o) => o.status === "published").length} published listing(s) will be archived.</Notice>
          )}
        </NoteDialog>
      )}
    </div>
  );
}
