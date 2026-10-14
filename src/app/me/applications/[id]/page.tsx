"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowUpRight, CalendarClock, CircleDot, FileSearch, MessageSquare, SendHorizontal, ShieldCheck, Undo2 } from "lucide-react";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { applicantSafeView, getApplicationFor, sendApplicationMessage, withdrawApplication } from "@/lib/services/applications";
import { isPublic } from "@/lib/services/opportunities";
import { looksLikeClientData } from "@/lib/services/network";
import { ORG_CATEGORY_LABEL } from "@/lib/data/taxonomy";
import { Breadcrumbs } from "@/components/ui/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { DemoTag, EmptyState, Notice } from "@/components/ui/feedback";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { Avatar } from "@/components/ui/avatar";
import { toast, toastResult } from "@/components/ui/toast";
import { OrgLogo } from "@/components/brand/org-logo";
import { KindBadge, StageBadge } from "@/components/domain/badges";
import { DemoApplicationDisclaimer } from "@/components/domain/disclaimers";
import { formatDate, formatDateTime, relativeDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { SharedList, StageProgress } from "@/components/member/application-parts";
import { applicantActivity, canWithdraw, INTERVIEW_FORMAT_LABEL } from "@/components/member/utils";

export default function ApplicationDetailPage() {
  const params = useParams<{ id: string }>();
  const id = typeof params?.id === "string" ? params.id : "";
  const db = useDb();
  const user = useCurrentUser();

  const app = useMemo(() => {
    const raw = getApplicationFor(db, user, id);
    // Only the applicant's own view is rendered here; org-internal notes are always stripped.
    return raw && raw.applicantId === user?.id ? applicantSafeView(raw) : undefined;
  }, [db, user, id]);
  const opp = useMemo(() => (app ? db.opportunities.find((o) => o.id === app.opportunityId) : undefined), [db, app]);
  const org = useMemo(() => (app ? db.organizations.find((o) => o.id === app.orgId) : undefined), [db, app]);
  const profile = useMemo(() => db.profiles.find((p) => p.userId === user?.id), [db, user?.id]);
  const activity = useMemo(() => (app ? [...applicantActivity(app)].sort((a, b) => b.at.localeCompare(a.at)) : []), [app]);

  const [draft, setDraft] = useState("");
  const [confirmOpen, setConfirmOpen] = useState(false);

  if (!user || !app) {
    return (
      <div>
        <Breadcrumbs items={[{ href: "/me/applications", label: "My jobs" }, { label: "Not found" }]} className="mb-6" />
        <EmptyState
          icon={<FileSearch className="h-5 w-5" />}
          title="Application not found"
          description="This application doesn't exist or belongs to another member."
          action={<ButtonLink href="/me/applications" variant="secondary">Back to My jobs</ButtonLink>}
        />
      </div>
    );
  }

  const orgName = org?.name ?? "The organization";
  const oppLive = !!opp && isPublic(opp, db);
  const interviewFuture = !!app.interview && new Date(app.interview.at).getTime() > Date.now();

  const actorLabel = (actorId: string) => {
    if (actorId === user.id) return "You";
    const u = db.users.find((x) => x.id === actorId);
    return u?.orgId === app.orgId ? `${u.name} · ${orgName}` : `${orgName} team`;
  };

  const send = () => {
    const body = draft.trim();
    if (!body) return;
    if (looksLikeClientData(body)) {
      toast("Please remove client details", { body: "This message looks like it may include client or policy information.", tone: "error" });
      return;
    }
    const r = sendApplicationMessage(user, app.id, body);
    if (toastResult(r, "Message sent", `Delivered to ${orgName} in demo data only.`)) setDraft("");
  };

  const withdraw = () => {
    const r = withdrawApplication(user, app.id);
    if (toastResult(r, "Application withdrawn", `${orgName} has been notified (demo).`)) setConfirmOpen(false);
  };

  return (
    <div>
      <Breadcrumbs items={[{ href: "/me/applications", label: "My jobs" }, { label: opp?.title ?? "Application" }]} className="mb-6" />

      {/* Header */}
      <div className="mb-8 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex min-w-0 items-start gap-4">
          {org && <OrgLogo brand={org.brand} name={org.name} size={56} />}
          <div className="min-w-0">
            <div className="text-[13px] text-ink-3">{orgName}</div>
            <h1 className="mt-0.5 font-display text-[28px] leading-[1.12] text-ink sm:text-[34px]">{opp?.title ?? "Opportunity no longer listed"}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-2">
              <StageBadge stage={app.stage} audience="applicant" withdrawn={app.withdrawn} />
              {opp && <KindBadge kind={opp.kind} />}
              <DemoTag />
            </div>
            <div className="mt-2.5 text-[13px] text-ink-3">
              Submitted {formatDate(app.submittedAt)} · Last update {relativeDay(app.updatedAt).toLowerCase()}
            </div>
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap items-center gap-2">
          {oppLive && (
            <ButtonLink href={`/opportunities/${opp!.slug}`} variant="secondary" size="sm">
              View opportunity <ArrowUpRight className="h-3.5 w-3.5" />
            </ButtonLink>
          )}
          {canWithdraw(app) && (
            <Button variant="danger" size="sm" onClick={() => setConfirmOpen(true)}>
              <Undo2 className="h-3.5 w-3.5" /> Withdraw
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start">
        <div className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="Progress" description="Organizations move applications through these stages. You'll be notified at each step." />
            <CardBody className="pt-6">
              <StageProgress app={app} />
            </CardBody>
          </Card>

          {app.interview && !app.withdrawn && (
            <Card className={cn(interviewFuture && "border-gold-200")}>
              <CardBody className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span className={cn("flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ring-1", interviewFuture ? "bg-gold-50 text-gold-ink ring-gold-200" : "bg-subtle text-ink-3 ring-line")}>
                  <CalendarClock className="h-5 w-5" strokeWidth={1.75} />
                </span>
                <div className="min-w-0 flex-1">
                  <div className="eyebrow">{interviewFuture ? `Interview · ${relativeDay(app.interview.at)}` : "Past interview"}</div>
                  <div className="mt-1 text-[17px] font-semibold tracking-[-0.01em] text-ink">{formatDateTime(app.interview.at)}</div>
                  <dl className="mt-3 grid gap-3 text-sm sm:grid-cols-2">
                    <div>
                      <dt className="text-xs text-ink-3">Format</dt>
                      <dd className="mt-0.5 text-ink">{INTERVIEW_FORMAT_LABEL[app.interview.format]}</dd>
                    </div>
                    <div>
                      <dt className="text-xs text-ink-3">With</dt>
                      <dd className="mt-0.5 text-ink">{app.interview.with} · {orgName}</dd>
                    </div>
                  </dl>
                  <p className="mt-3 text-xs text-ink-4">Demo: no calendar invite is sent. Confirm details with the organization through messages below.</p>
                </div>
              </CardBody>
            </Card>
          )}

          {/* Messages */}
          <Card>
            <CardHeader title="Messages" description={`Your conversation with ${orgName}. Organization-internal notes are never shown here.`} />
            <CardBody>
              {app.messages.length ? (
                <ol className="space-y-4" aria-label="Message thread">
                  {app.messages.map((m) => {
                    const mine = m.authorId === user.id;
                    const author = db.users.find((u) => u.id === m.authorId);
                    return (
                      <li key={m.id} className={cn("flex gap-3", mine && "flex-row-reverse")}>
                        {mine ? (
                          <Avatar name={user.name} tone={profile?.avatarTone ?? 0} size={32} />
                        ) : org ? (
                          <OrgLogo brand={org.brand} name={org.name} size={32} />
                        ) : (
                          <Avatar name={author?.name ?? "Org"} size={32} />
                        )}
                        <div className={cn("max-w-[85%] sm:max-w-[75%]", mine && "text-right")}>
                          <div className="mb-1 text-xs text-ink-3">
                            <span className="font-medium text-ink-2">{mine ? "You" : author?.orgId === app.orgId ? author.name : orgName}</span>
                            <span className="text-ink-4"> · {formatDateTime(m.createdAt)}</span>
                          </div>
                          <div className={cn("inline-block whitespace-pre-line rounded-2xl px-4 py-2.5 text-left text-sm leading-relaxed", mine ? "rounded-tr-md bg-navy text-white" : "rounded-tl-md border border-line bg-subtle/70 text-ink")}>
                            {m.body}
                          </div>
                        </div>
                      </li>
                    );
                  })}
                </ol>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-5 text-sm text-ink-3">
                  <MessageSquare className="h-4 w-4 shrink-0 text-ink-4" />
                  No messages yet. {app.withdrawn ? "" : `You can send ${orgName} a note below.`}
                </div>
              )}

              {app.withdrawn ? (
                <Notice className="mt-5">Messaging is closed because you withdrew this application.</Notice>
              ) : (
                <form
                  className="mt-6 border-t border-line pt-5"
                  onSubmit={(e) => {
                    e.preventDefault();
                    send();
                  }}
                >
                  <Field id="app-msg" label={`Message ${orgName}`} hint="Never include client names, policy details or other confidential information. ⌘/Ctrl + Enter to send.">
                    <Textarea
                      id="app-msg"
                      rows={3}
                      value={draft}
                      maxLength={2000}
                      placeholder="Write a message…"
                      onChange={(e) => setDraft(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                          e.preventDefault();
                          send();
                        }
                      }}
                    />
                  </Field>
                  <div className="mt-3 flex justify-end">
                    <Button type="submit" variant="accent" size="sm" disabled={!draft.trim()}>
                      <SendHorizontal className="h-3.5 w-3.5" /> Send message
                    </Button>
                  </div>
                </form>
              )}
            </CardBody>
          </Card>

          {/* Activity */}
          <Card>
            <CardHeader title="Activity" description="A record of every change to this application." />
            <CardBody>
              {activity.length ? (
                <ol className="relative space-y-5 border-l border-line pl-5">
                  {activity.map((e) => (
                    <li key={e.id} className="relative">
                      <CircleDot className="absolute -left-[27px] top-0.5 h-3.5 w-3.5 bg-surface text-ink-4" />
                      <div className="text-sm text-ink">{e.message}</div>
                      <div className="mt-0.5 text-xs text-ink-3">{actorLabel(e.actorId)} · {formatDateTime(e.at)}</div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-sm text-ink-3">No activity yet.</p>
              )}
            </CardBody>
          </Card>
        </div>

        {/* Side */}
        <aside className="min-w-0 space-y-6">
          <Card>
            <CardHeader title="What you shared" description="Captured when you applied. Nothing else is sent automatically." />
            <CardBody className="pt-4">
              <SharedList share={app.share} npnConsent={!!profile?.consent.shareNpnOnApply} />
              <Link href="/me/settings" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-600 hover:text-navy">
                <ShieldCheck className="h-3.5 w-3.5" /> Privacy & consent
              </Link>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Your note" />
            <CardBody className="pt-3">
              <p className="whitespace-pre-line text-sm leading-relaxed text-ink-2">{app.coverNote}</p>
              {app.preferredStartWindow && (
                <div className="mt-4 border-t border-line pt-3 text-[13px]">
                  <span className="text-ink-3">Preferred start: </span>
                  <span className="text-ink">{app.preferredStartWindow}</span>
                </div>
              )}
            </CardBody>
          </Card>

          {org && (
            <Card>
              <CardBody>
                <div className="flex items-center gap-3">
                  <OrgLogo brand={org.brand} name={org.name} size={40} />
                  <div className="min-w-0">
                    <div className="truncate text-sm font-semibold text-ink">{org.name}</div>
                    <div className="truncate text-xs text-ink-3">{ORG_CATEGORY_LABEL[org.category]} · {org.hqCity}, {org.hqState}</div>
                  </div>
                </div>
                <p className="mt-3 line-clamp-3 text-[13px] leading-relaxed text-ink-3">{org.tagline}</p>
                <div className="mt-4 flex flex-col gap-2">
                  {org.listingStatus === "approved" && (
                    <ButtonLink href={`/organizations/${org.slug}`} variant="secondary" size="sm">View organization</ButtonLink>
                  )}
                  {oppLive ? (
                    <ButtonLink href={`/opportunities/${opp!.slug}`} variant="ghost" size="sm">View the opportunity</ButtonLink>
                  ) : (
                    <p className="text-center text-xs text-ink-4">This listing is no longer public.</p>
                  )}
                </div>
              </CardBody>
            </Card>
          )}

          <Notice tone="demo" title="Prototype">
            <DemoApplicationDisclaimer className="text-inherit" />
          </Notice>
        </aside>
      </div>

      <Dialog
        open={confirmOpen}
        onClose={() => setConfirmOpen(false)}
        title="Withdraw this application?"
        description={`${orgName} will be notified and will no longer be able to view your profile through this application.`}
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmOpen(false)}>Keep application</Button>
            <Button variant="danger" onClick={withdraw}><Undo2 className="h-3.5 w-3.5" />Withdraw</Button>
          </>
        }
      >
        <p className="text-sm leading-relaxed text-ink-2">
          Withdrawing closes this application and its message thread. To be considered again, you&apos;d need to submit a new application.
        </p>
      </Dialog>
    </div>
  );
}
