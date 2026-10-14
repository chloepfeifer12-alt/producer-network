"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowUpRight, EyeOff, Flag, MessageSquare } from "lucide-react";
import type { Database, Report } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { resolveReport } from "@/lib/services/admin";
import { ORG_CATEGORY_LABEL, REPORT_REASON_LABEL, TOPIC_LABEL } from "@/lib/data/taxonomy";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Tabs } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/form";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { toastResult } from "@/components/ui/toast";
import { OrgLogo } from "@/components/brand/org-logo";
import { KindBadge, ListingStatusBadge, OppStatusBadge } from "@/components/domain/badges";
import { GuardedButton, NoteDialog, PermissionNotice, profileTone, userName } from "@/components/admin/admin-kit";
import { Highlight } from "@/components/admin/moderation";
import { formatDate, formatDateTime } from "@/lib/utils/dates";

type TabKey = Report["status"];

function TargetPreview({ db, r }: { db: Database; r: Report }) {
  const frame = "rounded-xl border border-line bg-subtle/50 p-3.5";
  if (r.targetType === "post") {
    const p = db.posts.find((x) => x.id === r.targetId);
    if (!p) return <div className={frame}><span className="text-sm text-ink-3">Post no longer exists.</span></div>;
    const author = db.users.find((u) => u.id === p.authorId);
    return (
      <div className={frame}>
        <div className="flex items-center gap-2.5">
          <Avatar name={author?.name ?? "Member"} tone={profileTone(db, p.authorId)} size={26} />
          <div className="min-w-0 flex-1 text-[13px]">
            <span className="font-medium text-ink">{author?.name}</span>
            <span className="text-ink-3"> · {TOPIC_LABEL[p.topic]} · {formatDate(p.createdAt)}</span>
          </div>
          {p.hidden && <Badge tone="danger" icon={<EyeOff className="h-3 w-3" />}>Hidden</Badge>}
        </div>
        <p className="mt-2 text-sm leading-relaxed text-ink-2"><Highlight text={p.body} /></p>
        {author && (author.kind === "producer" || author.kind === "aspiring") && (
          <Link href={`/network/members/${author.id}`} className="mt-2 inline-flex items-center gap-1 text-xs text-navy-600 hover:text-navy">Author profile <ArrowUpRight className="h-3 w-3" /></Link>
        )}
      </div>
    );
  }
  if (r.targetType === "opportunity") {
    const o = db.opportunities.find((x) => x.id === r.targetId);
    if (!o) return <div className={frame}><span className="text-sm text-ink-3">Listing no longer exists.</span></div>;
    const org = db.organizations.find((x) => x.id === o.orgId);
    return (
      <div className={frame}>
        <div className="text-[12.5px] text-ink-3">{org?.name}</div>
        <div className="text-[14.5px] font-semibold text-ink"><Highlight text={o.title} /></div>
        <div className="mt-1.5 flex flex-wrap gap-1.5"><KindBadge kind={o.kind} /><OppStatusBadge status={o.status} /></div>
        <p className="mt-2 line-clamp-2 text-[13px] text-ink-3"><Highlight text={o.summary} /></p>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
          <Link href={`/admin/opportunities?review=${o.id}`} className="inline-flex items-center gap-1 text-navy-600 hover:text-navy">Open in moderation <ArrowUpRight className="h-3 w-3" /></Link>
          <Link href={`/opportunities/${o.slug}`} target="_blank" className="inline-flex items-center gap-1 text-navy-600 hover:text-navy">Listing page <ArrowUpRight className="h-3 w-3" /></Link>
        </div>
      </div>
    );
  }
  if (r.targetType === "organization") {
    const o = db.organizations.find((x) => x.id === r.targetId);
    if (!o) return <div className={frame}><span className="text-sm text-ink-3">Organization no longer exists.</span></div>;
    return (
      <div className={frame}>
        <div className="flex items-start gap-3">
          <OrgLogo brand={o.brand} name={o.name} size={34} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[14.5px] font-semibold text-ink">{o.name}</span>
              <ListingStatusBadge status={o.listingStatus} />
            </div>
            <div className="text-xs text-ink-3">{ORG_CATEGORY_LABEL[o.category]} · {o.hqCity}, {o.hqState}</div>
            <p className="mt-1.5 text-[13px] text-ink-2">“<Highlight text={o.tagline} />”</p>
          </div>
        </div>
        <Link href={`/admin/organizations/${o.id}`} className="mt-2 inline-flex items-center gap-1 text-xs text-navy-600 hover:text-navy">Organization review page <ArrowUpRight className="h-3 w-3" /></Link>
      </div>
    );
  }
  const u = db.users.find((x) => x.id === r.targetId);
  if (!u) return <div className={frame}><span className="text-sm text-ink-3">User no longer exists.</span></div>;
  const org = u.orgId ? db.organizations.find((o) => o.id === u.orgId) : undefined;
  return (
    <div className={frame}>
      <div className="flex items-center gap-3">
        <Avatar name={u.name} tone={profileTone(db, u.id)} size={34} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-[14.5px] font-semibold text-ink">{u.name}</span>
            <Badge tone={u.status === "active" ? "success" : u.status === "pending" ? "gold" : "danger"}>{u.status}</Badge>
          </div>
          <div className="text-xs text-ink-3">{ROLE_LABEL(u)}{org ? ` · ${org.name}` : ""}</div>
        </div>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        <Link href={`/admin/users?q=${encodeURIComponent(u.name)}`} className="inline-flex items-center gap-1 text-navy-600 hover:text-navy">Manage user <ArrowUpRight className="h-3 w-3" /></Link>
        {org && <Link href={`/admin/organizations/${org.id}`} className="inline-flex items-center gap-1 text-navy-600 hover:text-navy">Their organization <ArrowUpRight className="h-3 w-3" /></Link>}
        {(u.kind === "producer" || u.kind === "aspiring") && <Link href={`/network/members/${u.id}`} className="inline-flex items-center gap-1 text-navy-600 hover:text-navy">Member profile <ArrowUpRight className="h-3 w-3" /></Link>}
      </div>
    </div>
  );
}

export default function AdminReportsPage() {
  const db = useDb();
  const user = useCurrentUser();
  const [tab, setTab] = useState<TabKey>("open");
  const [acting, setActing] = useState<{ report: Report; outcome: "actioned" | "dismissed" } | null>(null);
  const [hide, setHide] = useState(false);

  const counts = useMemo(() => ({
    open: db.reports.filter((r) => r.status === "open").length,
    actioned: db.reports.filter((r) => r.status === "actioned").length,
    dismissed: db.reports.filter((r) => r.status === "dismissed").length,
  }), [db]);
  const rows = useMemo(() => db.reports.filter((r) => r.status === tab).sort((a, b) => (b.resolvedAt ?? b.createdAt).localeCompare(a.resolvedAt ?? a.createdAt)), [db, tab]);

  const canHide = (r: Report) => {
    if (r.targetType === "post") return !db.posts.find((p) => p.id === r.targetId)?.hidden;
    if (r.targetType === "opportunity") return db.opportunities.find((o) => o.id === r.targetId)?.status === "published";
    return false;
  };

  const open = (report: Report, outcome: "actioned" | "dismissed") => {
    setHide(false);
    setActing({ report, outcome });
  };

  return (
    <div>
      <PageHeader
        eyebrow="Trust & safety"
        title="Reports"
        description="Member reports about posts, listings, organizations and people. Every report gets a resolution note, and the reporter is told it was reviewed."
      />
      <PermissionNotice user={user} permission="admin:moderate_content" what="reports" />

      <Tabs<TabKey>
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "open", label: "Open", count: counts.open },
          { value: "actioned", label: "Actioned", count: counts.actioned },
          { value: "dismissed", label: "Dismissed", count: counts.dismissed },
        ]}
      />

      {rows.length === 0 ? (
        <EmptyState icon={<Flag className="h-5 w-5" />} title={tab === "open" ? "No open reports" : `No ${tab} reports`} description={tab === "open" ? "New member reports will appear here." : undefined} />
      ) : (
        <div className="space-y-4">
          {rows.map((r) => (
            <Card key={r.id} id={r.id} className="scroll-mt-24 target:ring-2 target:ring-navy-200">
              <div className="grid gap-5 p-5 sm:p-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge tone={r.reason === "misleading_income_claim" || r.reason === "undisclosed_fees" ? "danger" : "neutral"}>{REPORT_REASON_LABEL[r.reason]}</Badge>
                    <Badge tone="outline">{r.targetType}</Badge>
                  </div>
                  <p className="mt-3 text-[14.5px] leading-relaxed text-ink">“{r.details}”</p>
                  <div className="mt-3 flex items-center gap-2 text-xs text-ink-3">
                    <Avatar name={userName(db, r.reporterId)} tone={profileTone(db, r.reporterId)} size={20} />
                    Reported by <span className="font-medium text-ink-2">{userName(db, r.reporterId)}</span> · {formatDateTime(r.createdAt)}
                  </div>
                  {r.status !== "open" && r.resolution && (
                    <div className="mt-4 rounded-lg bg-subtle p-3 text-[13px]">
                      <div className="text-xs text-ink-3">Resolution · {r.status}{r.resolvedAt ? ` · ${formatDate(r.resolvedAt)}` : ""}</div>
                      <p className="mt-0.5 text-ink-2">{r.resolution}</p>
                    </div>
                  )}
                  {r.status === "open" && (
                    <div className="mt-5 flex flex-wrap gap-2">
                      <GuardedButton user={user} permission="admin:moderate_content" variant="primary" size="sm" onClick={() => open(r, "actioned")}>
                        Take action
                      </GuardedButton>
                      <GuardedButton user={user} permission="admin:moderate_content" variant="secondary" size="sm" onClick={() => open(r, "dismissed")}>
                        Dismiss
                      </GuardedButton>
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="mb-2 text-[11.5px] font-medium uppercase tracking-[0.1em] text-ink-4">Reported {r.targetType}</div>
                  <TargetPreview db={db} r={r} />
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {acting && (
        <NoteDialog
          open
          onClose={() => setActing(null)}
          title={acting.outcome === "dismissed" ? "Dismiss report" : "Take action on report"}
          description={acting.outcome === "dismissed" ? "Close the report without changes. The reporter is notified that it was reviewed." : "Record what you did. The reporter is notified that it was reviewed."}
          confirmLabel={acting.outcome === "dismissed" ? "Dismiss report" : "Resolve as actioned"}
          tone={acting.outcome === "dismissed" ? "primary" : "accent"}
          minLength={5}
          noteLabel="Resolution note"
          notePlaceholder={acting.outcome === "dismissed" ? "Why no action is needed (e.g. content is within policy)." : "What was done and why."}
          onConfirm={(note) => {
            const willHide = acting.outcome === "actioned" && hide && canHide(acting.report);
            const r = resolveReport(user, acting.report.id, acting.outcome, note, willHide);
            return toastResult(
              r,
              acting.outcome === "dismissed" ? "Report dismissed" : "Report actioned",
              willHide ? (acting.report.targetType === "post" ? "The post is now hidden from the feed." : "The listing was unpublished and returned to the organization.") : "Logged to the audit trail.",
            );
          }}
        >
          <div className="rounded-xl border border-line p-3 text-[13px]">
            <div className="font-medium text-ink">{REPORT_REASON_LABEL[acting.report.reason]}</div>
            <div className="mt-0.5 text-ink-3">“{acting.report.details}”</div>
          </div>
          {acting.outcome === "actioned" && canHide(acting.report) && (
            <Checkbox
              checked={hide}
              onChange={setHide}
              label={acting.report.targetType === "post" ? "Hide this post from the community feed" : "Unpublish this listing (returns it with changes requested)"}
              description="The affected party is notified. Reversible by the organization resubmitting, or by an admin."
            />
          )}
          {acting.outcome === "actioned" && (acting.report.targetType === "organization" || acting.report.targetType === "user") && (
            <Notice tone="info">
              Account-level actions happen on the{" "}
              {acting.report.targetType === "organization" ? (
                <Link className="font-medium underline" href={`/admin/organizations/${acting.report.targetId}`}>organization review page</Link>
              ) : (
                <Link className="font-medium underline" href={`/admin/users?q=${encodeURIComponent(userName(db, acting.report.targetId))}`}>user management page</Link>
              )}{" "}
              (suspend, request changes). Record the outcome here.
            </Notice>
          )}
          {acting.outcome === "actioned" && acting.report.targetType === "post" && !canHide(acting.report) && (
            <p className="flex items-center gap-1.5 text-xs text-ink-3"><MessageSquare className="h-3.5 w-3.5" /> This post is already hidden.</p>
          )}
        </NoteDialog>
      )}
    </div>
  );
}
