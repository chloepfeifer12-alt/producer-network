"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowRight, CalendarPlus, Clock3, Eye, Hash, Lock, Mail, MapPin, MessageSquare, Phone, ShieldCheck, ShieldX, StickyNote, Video,
} from "lucide-react";
import type { Application, PipelineStage } from "@/lib/data/types";
import { AVAILABILITY_LABEL, EXPERIENCE_LABEL, STAGE_LABEL, STAGE_ORDER, lineName, stateName } from "@/lib/data/taxonomy";
import { addApplicationNote, getApplicationFor, moveApplicationStage, scheduleInterview, sendApplicationMessage } from "@/lib/services/applications";
import { viewProfile } from "@/lib/services/privacy";
import { OrgScope, type OrgContext } from "@/components/org/org-scope";
import { daysSinceLabel, personName } from "@/components/org/org-utils";
import { PageHeader } from "@/components/ui/page";
import { Avatar } from "@/components/ui/avatar";
import { Badge, Tag } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { DemoTag, EmptyState, Notice } from "@/components/ui/feedback";
import { Field, Input, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { StageBadge, UnverifiedLicenseBadge, KindBadge } from "@/components/domain/badges";
import { cn } from "@/lib/utils/cn";
import { formatDate, formatDateTime, relativeDay } from "@/lib/utils/dates";

export default function ApplicationReviewPage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params.id ?? ""));
  return <OrgScope>{(ctx) => <Review ctx={ctx} appId={id} />}</OrgScope>;
}

const FORMAT_LABEL = { video: "Video call", phone: "Phone call", in_person: "In person" } as const;
const FORMAT_ICON = { video: Video, phone: Phone, in_person: MapPin } as const;

function Review({ ctx, appId }: { ctx: OrgContext; appId: string }) {
  const { db, user } = ctx;
  const app = useMemo(() => getApplicationFor(db, user, appId), [db, user, appId]);

  if (!app || app.orgId !== ctx.org.id) {
    return (
      <div>
        <PageHeader breadcrumbs={[{ href: "/org/pipeline", label: "Pipeline" }, { label: "Application" }]} title="Application unavailable" />
        <EmptyState
          icon={<Lock className="h-5 w-5" strokeWidth={1.75} />}
          title="You don't have access to this application"
          description="Applications are visible only to the applicant and the organization they applied to. It may also have been removed from the demo data."
          action={<ButtonLink href="/org/pipeline" variant="secondary" size="sm">Back to pipeline</ButtonLink>}
        />
      </div>
    );
  }
  return <ReviewBody ctx={ctx} app={app} />;
}

function ReviewBody({ ctx, app }: { ctx: OrgContext; app: Application }) {
  const { db, user } = ctx;
  const profile = db.profiles.find((p) => p.userId === app.applicantId);
  const applicant = db.users.find((u) => u.id === app.applicantId);
  const opp = db.opportunities.find((o) => o.id === app.opportunityId);
  const view = useMemo(() => (profile ? viewProfile(db, user, profile, app.id) : null), [db, user, profile, app.id]);
  const name = applicant?.name ?? "Member";
  const [scheduleOpen, setScheduleOpen] = useState(false);

  const idx = STAGE_ORDER.indexOf(app.stage);
  const next: PipelineStage | undefined = app.stage === "hired" || app.stage === "closed" ? undefined : STAGE_ORDER[idx + 1];
  const locked = app.withdrawn;

  const move = (stage: PipelineStage) => {
    const r = moveApplicationStage(user, app.id, stage);
    if (r.ok) toast(`Moved to ${STAGE_LABEL[stage]}`, { body: `${name} was notified of the update.` });
    else toast("Couldn't update stage", { body: r.error, tone: "error" });
  };

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ href: "/org/pipeline", label: "Pipeline" }, { label: name }]}
        title={
          <span className="flex items-center gap-4">
            <Avatar name={name} tone={profile?.avatarTone ?? 0} size={52} className="hidden sm:inline-flex" />
            <span>{name}</span>
          </span>
        }
        description={
          <span className="flex flex-col gap-2">
            {profile?.headline && <span>{profile.headline}</span>}
            <span className="flex flex-wrap items-center gap-2 text-[13px]">
              <StageBadge stage={app.stage} withdrawn={app.withdrawn} />
              {profile && <span className="inline-flex items-center gap-1 text-ink-3"><MapPin className="h-3.5 w-3.5" />{profile.city}, {profile.state}</span>}
              <span className="text-ink-3">Applied {daysSinceLabel(app.submittedAt).toLowerCase()}</span>
            </span>
          </span>
        }
        actions={
          !locked && (
            <>
              <Button variant="secondary" size="sm" onClick={() => setScheduleOpen(true)}><CalendarPlus className="h-4 w-4" /> {app.interview ? "Reschedule" : "Schedule interview"}</Button>
              {next && <Button variant="accent" size="sm" onClick={() => move(next)}>Move to {STAGE_LABEL[next]} <ArrowRight className="h-3.5 w-3.5" /></Button>}
            </>
          )
        }
      />

      {locked && <Notice tone="warning" title="The applicant withdrew this application" className="mb-6">Stage changes and messages are disabled. Internal notes remain available to your team.</Notice>}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-6">
          {opp && (
            <Card className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
              <div className="min-w-0">
                <div className="text-xs text-ink-3">Applied for</div>
                <Link href={`/org/opportunities/${opp.id}`} className="mt-0.5 block truncate text-[15px] font-semibold text-ink hover:underline hover:underline-offset-4">{opp.title}</Link>
              </div>
              <KindBadge kind={opp.kind} />
            </Card>
          )}

          <Card>
            <CardHeader title="Cover note" description={`Submitted ${formatDate(app.submittedAt)}`} />
            <div className="px-5 pb-5 pt-3 sm:px-6">
              <p className="whitespace-pre-line text-[14.5px] leading-relaxed text-ink-2">{app.coverNote}</p>
              <div className="mt-4 inline-flex items-center gap-2 rounded-lg bg-subtle px-3 py-1.5 text-[13px] text-ink-2">
                <Clock3 className="h-3.5 w-3.5 text-ink-4" /> Preferred start: <span className="font-medium text-ink">{app.preferredStartWindow || "Not specified"}</span>
              </div>
            </div>
          </Card>

          <CandidateProfile ctx={ctx} app={app} />
          <MessageThread ctx={ctx} app={app} applicantName={name} />
          <InternalNotes ctx={ctx} app={app} />
        </div>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="Stage" />
            <div className="space-y-3 px-5 pb-5 pt-3 sm:px-6">
              <Field id="stage-select" label="Current stage">
                <Select id="stage-select" value={app.stage} disabled={locked} onChange={(e) => move(e.target.value as PipelineStage)}>
                  {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
                </Select>
              </Field>
              {next && !locked && (
                <Button variant="secondary" size="sm" className="w-full" onClick={() => move(next)}>
                  Move to {STAGE_LABEL[next]} <ArrowRight className="h-3.5 w-3.5" />
                </Button>
              )}
              <p className="text-xs leading-relaxed text-ink-3">The candidate sees an applicant-friendly status (e.g. &ldquo;In review&rdquo;) — never your internal notes.</p>
            </div>
          </Card>

          <Card>
            <CardHeader title="Interview" />
            <div className="px-5 pb-5 pt-3 sm:px-6">
              {app.interview ? (
                <InterviewSummary interview={app.interview} />
              ) : (
                <p className="text-[13px] text-ink-3">No interview scheduled.</p>
              )}
              {!locked && (
                <Button variant="ghost" size="sm" className="mt-3 -ml-3" onClick={() => setScheduleOpen(true)}>
                  <CalendarPlus className="h-4 w-4" /> {app.interview ? "Reschedule" : "Schedule interview"}
                </Button>
              )}
            </div>
          </Card>

          <PrivacyCard app={app} hidden={view?.hidden ?? []} />

          <Card>
            <CardHeader title="Activity" />
            <ol className="relative space-y-4 px-5 pb-5 pt-4 sm:px-6">
              {[...app.activity].reverse().map((a, i, arr) => (
                <li key={a.id} className="relative flex gap-3">
                  {i < arr.length - 1 && <span aria-hidden className="absolute left-[3.5px] top-3 h-[calc(100%+4px)] w-px bg-line" />}
                  <span aria-hidden className={cn("relative mt-1.5 h-2 w-2 shrink-0 rounded-full", i === 0 ? "bg-navy" : "bg-line-strong")} />
                  <div className="min-w-0">
                    <div className="text-[13px] text-ink">{a.message}</div>
                    <div className="text-xs text-ink-4">{personName(db, a.actorId)} · {relativeDay(a.at)}</div>
                  </div>
                </li>
              ))}
            </ol>
          </Card>
        </aside>
      </div>

      <ScheduleDialog open={scheduleOpen} onClose={() => setScheduleOpen(false)} ctx={ctx} app={app} applicantName={name} />
    </div>
  );
}

function InterviewSummary({ interview }: { interview: NonNullable<Application["interview"]> }) {
  const Icon = FORMAT_ICON[interview.format];
  return (
    <div className="flex items-start gap-3 rounded-xl border border-gold-200 bg-gold-50/60 px-3.5 py-3">
      <Icon className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" strokeWidth={1.75} />
      <div className="text-[13px]">
        <div className="font-medium text-ink">{formatDateTime(interview.at)}</div>
        <div className="text-ink-3">{FORMAT_LABEL[interview.format]} · with {interview.with}</div>
      </div>
    </div>
  );
}

function CandidateProfile({ ctx, app }: { ctx: OrgContext; app: Application }) {
  const { db, user } = ctx;
  const profile = db.profiles.find((p) => p.userId === app.applicantId);
  const view = useMemo(() => (profile ? viewProfile(db, user, profile, app.id) : null), [db, user, profile, app.id]);

  if (!profile || !view || !view.visible) {
    return (
      <Card>
        <CardHeader title="Candidate profile" />
        <div className="px-5 pb-5 pt-3 sm:px-6">
          <Notice tone="info">{view?.hidden[0] ?? "This member's profile isn't available."}</Notice>
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Candidate profile" description="Only what this candidate chose to share with your organization." action={<Badge tone="navy" icon={<ShieldCheck className="h-3 w-3" />}>Shared with consent</Badge>} />
      <div className="space-y-6 px-5 pb-6 pt-4 sm:px-6">
        {profile.bio && <p className="text-[14px] leading-relaxed text-ink-2">{profile.bio}</p>}

        <dl className="grid gap-x-6 gap-y-4 sm:grid-cols-3">
          <div>
            <dt className="text-xs text-ink-3">Experience</dt>
            <dd className="mt-0.5 text-sm text-ink">{EXPERIENCE_LABEL[profile.experienceLevel]}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">Years in industry</dt>
            <dd className="mt-0.5 text-sm text-ink">{profile.yearsInIndustry}</dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">Availability</dt>
            <dd className="mt-0.5 text-sm text-ink">{AVAILABILITY_LABEL[profile.availability]}</dd>
          </div>
          {view.email && (
            <div className="sm:col-span-2">
              <dt className="text-xs text-ink-3">Email (shared)</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-sm text-ink"><Mail className="h-3.5 w-3.5 text-ink-4" />{view.email}</dd>
            </div>
          )}
          {view.npn && (
            <div>
              <dt className="text-xs text-ink-3">NPN (shared)</dt>
              <dd className="mt-0.5 flex items-center gap-1.5 text-sm tabular-nums text-ink"><Hash className="h-3.5 w-3.5 text-ink-4" />{view.npn}</dd>
            </div>
          )}
        </dl>

        {profile.specialties.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-medium text-ink-3">Specialties</h4>
            <div className="flex flex-wrap gap-1.5">{profile.specialties.map((s) => <Tag key={s}>{lineName(s)}</Tag>)}</div>
          </div>
        )}
        {profile.expertise.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-medium text-ink-3">Expertise</h4>
            <div className="flex flex-wrap gap-1.5">{profile.expertise.map((s) => <Tag key={s}>{s}</Tag>)}</div>
          </div>
        )}

        {view.showLicenses && (
          <div>
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <h4 className="text-xs font-medium text-ink-3">Licenses</h4>
              <span className="text-[11px] text-ink-4">As reported by the member</span>
            </div>
            {view.licenses.length === 0 ? (
              <p className="text-[13px] text-ink-3">No license records on file.</p>
            ) : (
              <ul className="divide-y divide-line rounded-xl border border-line">
                {view.licenses.map((l) => (
                  <li key={l.id} className="flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
                    <div className="min-w-0">
                      <div className="text-[13.5px] font-medium text-ink">
                        {stateName(l.state)} <span className="font-normal text-ink-3">· {l.residency === "resident" ? "Resident" : "Non-resident"} · {l.status}</span>
                      </div>
                      <div className="text-xs text-ink-3">{l.linesOfAuthority.join(", ")}{l.expiresOn ? ` · Expires ${formatDate(l.expiresOn)}` : ""}</div>
                    </div>
                    <UnverifiedLicenseBadge />
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-4">The platform does not verify licenses. Confirm license status with the applicable state before contracting or hiring.</p>
          </div>
        )}

        {view.showExperience && profile.experience.length > 0 && (
          <div>
            <h4 className="mb-2 text-xs font-medium text-ink-3">Work history</h4>
            <ol className="space-y-3">
              {profile.experience.map((e) => (
                <li key={e.id} className="border-l-2 border-line pl-3">
                  <div className="text-[13.5px] font-medium text-ink">{e.title} · <span className="font-normal text-ink-2">{e.organization}</span></div>
                  <div className="text-xs text-ink-4">{e.start} – {e.end ?? "Present"}</div>
                  {e.description && <p className="mt-1 text-[13px] leading-relaxed text-ink-3">{e.description}</p>}
                </li>
              ))}
            </ol>
          </div>
        )}
      </div>
    </Card>
  );
}

function PrivacyCard({ app, hidden }: { app: Application; hidden: string[] }) {
  const rows = [
    { label: "Contact email", on: app.share.contactEmail },
    { label: "License records", on: app.share.licenses },
    { label: "NPN", on: app.share.npn },
    { label: "Work history", on: app.share.experience },
  ];
  return (
    <Card>
      <CardHeader title="Shared with consent" description="Chosen by the candidate when applying. Nothing else is shared automatically." />
      <div className="px-5 pb-5 pt-3 sm:px-6">
        <ul className="space-y-1.5">
          {rows.map((r) => (
            <li key={r.label} className="flex items-center justify-between text-[13px]">
              <span className="text-ink-2">{r.label}</span>
              {r.on ? <span className="inline-flex items-center gap-1 text-success"><ShieldCheck className="h-3.5 w-3.5" />Shared</span> : <span className="inline-flex items-center gap-1 text-ink-4"><ShieldX className="h-3.5 w-3.5" />Not shared</span>}
            </li>
          ))}
        </ul>
        {hidden.length > 0 && (
          <ul className="mt-4 space-y-1.5 border-t border-line pt-3">
            {hidden.map((h) => (
              <li key={h} className="flex gap-2 text-xs leading-relaxed text-ink-3"><Eye className="mt-0.5 h-3 w-3 shrink-0 text-ink-4" />{h}</li>
            ))}
          </ul>
        )}
      </div>
    </Card>
  );
}

function MessageThread({ ctx, app, applicantName }: { ctx: OrgContext; app: Application; applicantName: string }) {
  const { db, user } = ctx;
  const [body, setBody] = useState("");
  const send = () => {
    const r = sendApplicationMessage(user, app.id, body);
    if (r.ok) {
      setBody("");
      toast("Message sent", { body: `${applicantName} will see it in their application (demo — no email is sent).` });
    } else toast("Couldn't send", { body: r.error, tone: "error" });
  };
  return (
    <Card>
      <CardHeader
        title="Messages"
        description="Conversation with the candidate."
        action={<Badge tone="navy" icon={<Eye className="h-3 w-3" />}>Visible to the candidate</Badge>}
      />
      <div className="px-5 pb-5 pt-4 sm:px-6">
        {app.messages.length === 0 ? (
          <EmptyState compact icon={<MessageSquare className="h-5 w-5" strokeWidth={1.75} />} title="No messages yet" description="Introduce your team, ask a question or propose interview times." />
        ) : (
          <ol className="space-y-3">
            {app.messages.map((m) => {
              const mine = m.authorId !== app.applicantId;
              return (
                <li key={m.id} className={cn("flex", mine ? "justify-end" : "justify-start")}>
                  <div className={cn("max-w-[85%] rounded-2xl px-4 py-2.5", mine ? "rounded-br-md bg-navy text-white" : "rounded-bl-md bg-subtle text-ink")}>
                    <p className="whitespace-pre-line text-[13.5px] leading-relaxed">{m.body}</p>
                    <div className={cn("mt-1 text-[11px]", mine ? "text-white/70" : "text-ink-4")}>{personName(db, m.authorId)} · {relativeDay(m.createdAt)}</div>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
        {!app.withdrawn && (
          <div className="mt-5 border-t border-line pt-4">
            <Field id="msg-body" label={`Message ${applicantName}`}>
              <Textarea id="msg-body" value={body} onChange={(e) => setBody(e.target.value)} maxLength={2000} className="min-h-[84px]" placeholder="Write a message the candidate will see…" />
            </Field>
            <div className="mt-2 flex items-center justify-between gap-3">
              <span className="text-[11.5px] text-ink-4">Keep it professional — no compensation promises.</span>
              <Button size="sm" variant="accent" onClick={send} disabled={!body.trim()}>Send message</Button>
            </div>
          </div>
        )}
      </div>
    </Card>
  );
}

function InternalNotes({ ctx, app }: { ctx: OrgContext; app: Application }) {
  const { db, user } = ctx;
  const [body, setBody] = useState("");
  const add = () => {
    const r = addApplicationNote(user, app.id, body);
    if (r.ok) {
      setBody("");
      toast("Note added", { body: "Visible to your team only." });
    } else toast("Couldn't add note", { body: r.error, tone: "error" });
  };
  return (
    <section aria-labelledby="notes-title" className="rounded-2xl border border-dashed border-gold-200 bg-gold-50/40">
      <div className="flex items-start justify-between gap-4 px-5 pt-5 sm:px-6">
        <div>
          <h3 id="notes-title" className="text-[15px] font-semibold tracking-[-0.01em] text-ink">Internal notes</h3>
          <p className="mt-1 text-[13px] text-ink-3">Private to your organization. Never shown to the candidate.</p>
        </div>
        <Badge tone="gold" icon={<Lock className="h-3 w-3" />}>Only visible to your team</Badge>
      </div>
      <div className="px-5 pb-5 pt-4 sm:px-6">
        {app.notes.length === 0 ? (
          <p className="text-[13px] text-ink-3">No notes yet.</p>
        ) : (
          <ul className="space-y-2.5">
            {app.notes.map((n) => (
              <li key={n.id} className="rounded-xl border border-line bg-surface px-4 py-3">
                <p className="text-[13.5px] leading-relaxed text-ink-2">{n.body}</p>
                <div className="mt-1.5 flex items-center gap-1.5 text-[11.5px] text-ink-4"><StickyNote className="h-3 w-3" />{personName(db, n.authorId)} · {relativeDay(n.createdAt)}</div>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-4">
          <Field id="note-body" label="Add a note">
            <Textarea id="note-body" value={body} onChange={(e) => setBody(e.target.value)} className="min-h-[72px] bg-surface" placeholder="Interview impressions, follow-ups, next steps…" />
          </Field>
          <div className="mt-2 flex justify-end">
            <Button size="sm" variant="secondary" onClick={add} disabled={!body.trim()}>Add internal note</Button>
          </div>
        </div>
      </div>
    </section>
  );
}

function defaultInterviewTime() {
  const d = new Date();
  d.setDate(d.getDate() + 2);
  d.setHours(15, 0, 0, 0);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function ScheduleDialog({ open, onClose, ctx, app, applicantName }: { open: boolean; onClose: () => void; ctx: OrgContext; app: Application; applicantName: string }) {
  const [at, setAt] = useState(defaultInterviewTime);
  const [format, setFormat] = useState<"video" | "phone" | "in_person">(app.interview?.format ?? "video");
  const [withWhom, setWithWhom] = useState(app.interview?.with ?? ctx.user.name);
  const [error, setError] = useState<string>();

  const submit = () => {
    if (!at) return setError("Choose a date and time.");
    if (new Date(at).getTime() < Date.now()) return setError("Choose a time in the future.");
    const r = scheduleInterview(ctx.user, app.id, at, format, withWhom.trim());
    if (r.ok) {
      toast("Interview scheduled", { body: `${applicantName} was notified (demo — no calendar invite is sent).` });
      setError(undefined);
      onClose();
    } else setError(r.error);
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={app.interview ? "Reschedule interview" : "Schedule interview"}
      description={`With ${applicantName}. Candidates in New or Under Review move to Interview automatically.`}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="accent" size="sm" onClick={submit}>Schedule</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field id="iv-at" label="Date & time" error={error} hint="Entered in your local time; displayed in UTC across the workspace.">
          <Input id="iv-at" type="datetime-local" value={at} onChange={(e) => setAt(e.target.value)} />
        </Field>
        <Field id="iv-format" label="Format">
          <Select id="iv-format" value={format} onChange={(e) => setFormat(e.target.value as typeof format)}>
            <option value="video">Video call</option>
            <option value="phone">Phone call</option>
            <option value="in_person">In person</option>
          </Select>
        </Field>
        <Field id="iv-with" label="With whom" hint="Names or roles of the people the candidate will meet.">
          <Input id="iv-with" value={withWhom} onChange={(e) => setWithWhom(e.target.value)} placeholder="e.g. Daniel Whitfield and a senior account manager" />
        </Field>
        <div className="flex items-center gap-2"><DemoTag>Prototype</DemoTag><span className="text-xs text-ink-3">No calendar, email or video link is created.</span></div>
      </div>
    </Dialog>
  );
}
