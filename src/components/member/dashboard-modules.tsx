"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, CalendarClock, CalendarDays, Check, Compass, Handshake, MapPin, Search, Sparkles } from "lucide-react";
import type { Database, ProducerProfile, User } from "@/lib/data/types";
import { profileCompletion, respondToIntroduction } from "@/lib/services/profiles";
import { recommendForProfile } from "@/lib/services/opportunities";
import { applicationsForApplicant } from "@/lib/services/applications";
import { introductionsForMember } from "@/lib/services/talent";
import { pendingIncoming, toggleEventRsvp } from "@/lib/services/network";
import { US_STATES } from "@/lib/data/taxonomy";
import { formatDateTime, formatEventDate, isFuture, relativeDay } from "@/lib/utils/dates";
import { pluralize } from "@/lib/utils/format";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { ProgressBar } from "@/components/ui/stat";
import { toast, toastResult } from "@/components/ui/toast";
import { OrgLogo } from "@/components/brand/org-logo";
import { cn } from "@/lib/utils/cn";
import { JobRow } from "./job-row";
import { ResourceRow } from "./resource-row";
import { AspiringNextStep, AspiringStepper } from "./aspiring-path";
import { hasUpcomingInterview, INTERVIEW_FORMAT_LABEL, resourcesFor } from "./utils";

interface ModuleProps {
  db: Database;
  user: User;
  profile: ProducerProfile;
}

function ViewAll({ href, children = "View all" }: { href: string; children?: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-medium text-navy-600 transition hover:text-navy">
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

/* ------------------------------------------------------------------ */
/* Search                                                              */
/* ------------------------------------------------------------------ */

/** Compact "What / Where" job search → /opportunities?q=…&state=… */
export function JobSearchBar({ profile }: Pick<ModuleProps, "profile">) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [state, setState] = useState(profile.state ?? "");
  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const p = new URLSearchParams();
    if (q.trim()) p.set("q", q.trim());
    if (state) p.set("state", state);
    const qs = p.toString();
    router.push(`/opportunities${qs ? `?${qs}` : ""}`);
  };
  return (
    <form role="search" aria-label="Search jobs" onSubmit={submit} className="flex flex-col gap-2 rounded-2xl border border-line-strong bg-surface p-2 shadow-card sm:flex-row sm:items-center sm:gap-0">
      <label className="flex min-w-0 flex-1 items-center gap-2.5 rounded-xl px-3 py-1 focus-within:bg-subtle/60">
        <span className="text-[13px] font-semibold text-ink">What</span>
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Job title, keyword or company"
          aria-label="What: job title, keyword or company"
          className="h-10 min-w-0 flex-1 bg-transparent text-sm text-ink placeholder:text-ink-4 focus:outline-none"
        />
      </label>
      <span aria-hidden className="hidden h-7 w-px bg-line sm:block" />
      <label className="flex min-w-0 items-center gap-2.5 rounded-xl px-3 py-1 focus-within:bg-subtle/60 sm:w-[240px]">
        <span className="text-[13px] font-semibold text-ink">Where</span>
        <MapPin className="h-3.5 w-3.5 shrink-0 text-ink-4" />
        <select
          value={state}
          onChange={(e) => setState(e.target.value)}
          aria-label="Where: state"
          className="h-10 min-w-0 flex-1 cursor-pointer appearance-none bg-transparent text-sm text-ink focus:outline-none"
        >
          <option value="">Anywhere</option>
          {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
        </select>
      </label>
      <Button type="submit" variant="accent" className="sm:ml-1">
        <Search className="h-4 w-4" /> Find jobs
      </Button>
    </form>
  );
}

/* ------------------------------------------------------------------ */
/* Jobs for you                                                        */
/* ------------------------------------------------------------------ */

export function JobsForYou({ db, profile }: ModuleProps) {
  const recs = useMemo(() => recommendForProfile(db, profile, 6), [db, profile]);
  return (
    <section aria-labelledby="jobs-for-you">
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 id="jobs-for-you" className="text-[19px] font-semibold tracking-[-0.015em] text-ink">Jobs for you</h2>
          <p className="mt-0.5 text-[13px] text-ink-3">Matched on your specialties, preferences, state and experience. Never influenced by paid placement.</p>
        </div>
        <ViewAll href="/opportunities">See all jobs</ViewAll>
      </div>
      {recs.length ? (
        <Card className="overflow-hidden">
          <ul className="divide-y divide-line">
            {recs.map(({ opportunity: o, reasons }) => (
              <JobRow key={o.id} o={o} org={db.organizations.find((x) => x.id === o.orgId)} reasons={reasons} />
            ))}
          </ul>
        </Card>
      ) : (
        <EmptyState
          compact
          icon={<Sparkles className="h-5 w-5" />}
          title="No strong matches yet"
          description="Add specialties and work preferences to your profile so we can match you with relevant jobs."
          action={<ButtonLink href="/me/profile#specialties" variant="secondary" size="sm">Update specialties</ButtonLink>}
        />
      )}
      <p className="mt-2.5 text-xs text-ink-4">Compensation is shown as disclosed by each employer — not verified and not a projection of earnings.</p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* My jobs strip                                                       */
/* ------------------------------------------------------------------ */

export function MyJobsStrip({ db, user }: ModuleProps) {
  const { counts, next } = useMemo(() => {
    const apps = applicationsForApplicant(db, user.id);
    const active = apps.filter((a) => !a.withdrawn);
    const next = apps.filter(hasUpcomingInterview).sort((a, b) => a.interview!.at.localeCompare(b.interview!.at))[0];
    return {
      counts: {
        saved: db.savedOpportunities.filter((s) => s.userId === user.id).length,
        applied: active.filter((a) => a.stage !== "closed").length,
        interviews: active.filter((a) => a.stage === "interview").length,
        offers: active.filter((a) => a.stage === "offer").length,
      },
      next,
    };
  }, [db, user.id]);
  const items = [
    { label: "Saved", n: counts.saved, href: "/me/applications?tab=saved" },
    { label: "Applied", n: counts.applied, href: "/me/applications?tab=applied" },
    { label: "Interviews", n: counts.interviews, href: "/me/applications?tab=interviewing" },
    { label: "Offers", n: counts.offers, href: "/me/applications?tab=applied" },
  ];
  const nextOpp = next ? db.opportunities.find((o) => o.id === next.opportunityId) : undefined;
  const nextOrg = next ? db.organizations.find((o) => o.id === next.orgId) : undefined;
  return (
    <section aria-label="My jobs" className="rounded-2xl border border-line bg-surface shadow-card">
      <div className="flex flex-wrap items-center gap-x-1 gap-y-1 px-3 py-2 sm:px-4">
        <Link href="/me/applications" className="mr-2 px-2 py-1.5 text-[13.5px] font-semibold text-ink hover:text-navy">My jobs</Link>
        {items.map((it, i) => (
          <span key={it.label} className="flex items-center">
            {i > 0 && <span aria-hidden className="mx-0.5 text-ink-4">·</span>}
            <Link href={it.href} className="rounded-lg px-2 py-1.5 text-[13.5px] text-ink-3 transition hover:bg-subtle hover:text-ink">
              <span className={cn("font-semibold tabular-nums", it.n ? "text-ink" : "text-ink-4")}>{it.n}</span> {it.label}
            </Link>
          </span>
        ))}
      </div>
      {next && next.interview && (
        <Link
          href={`/me/applications/${next.id}`}
          className="group flex items-center gap-3 border-t border-gold-200 bg-gold-50/70 px-5 py-3 text-[13px] text-gold-ink transition hover:bg-gold-50 rounded-b-2xl"
        >
          <CalendarClock className="h-4 w-4 shrink-0" />
          <span className="min-w-0 flex-1">
            <span className="font-semibold">Interview {relativeDay(next.interview.at).toLowerCase()}</span>
            {" · "}{nextOpp?.title} at {nextOrg?.name} · {formatDateTime(next.interview.at)} · {INTERVIEW_FORMAT_LABEL[next.interview.format]}
            <span className="ml-1 text-gold-ink/70">(demo — no calendar invite sent)</span>
          </span>
          <ArrowRight className="h-3.5 w-3.5 shrink-0 transition group-hover:translate-x-0.5" />
        </Link>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Introductions                                                       */
/* ------------------------------------------------------------------ */

export function Introductions({ db, user, profile }: ModuleProps) {
  const intros = useMemo(() => introductionsForMember(db, user.id), [db, user.id]);
  if (!intros.length) return null;
  const respond = (id: string, orgName: string, status: "interested" | "declined") => {
    const r = respondToIntroduction(user, id, status);
    toastResult(
      r,
      status === "interested" ? "Marked as interested" : "Introduction declined",
      status === "interested" ? `${orgName} will see that you'd like to learn more (demo — nothing is transmitted).` : `${orgName} will see that you declined. No further action needed.`,
    );
  };
  return (
    <section aria-labelledby="intros">
      <div className="mb-3">
        <h2 id="intros" className="text-[19px] font-semibold tracking-[-0.015em] text-ink">Employers reaching out</h2>
        <p className="mt-0.5 text-[13px] text-ink-3">
          Sent because you opted into recruiter contact{profile.consent.recruiterContact ? "" : " (currently off — no new introductions will arrive)"}.{" "}
          <Link href="/me/settings" className="text-navy-600 underline-offset-4 hover:underline">Manage in Privacy & consent</Link>.
        </p>
      </div>
      <Card className="overflow-hidden">
        <ul className="divide-y divide-line">
          {intros.map((i) => {
            const org = db.organizations.find((o) => o.id === i.orgId);
            const sender = db.users.find((u) => u.id === i.senderId);
            const opp = i.opportunityId ? db.opportunities.find((o) => o.id === i.opportunityId) : undefined;
            const orgName = org?.name ?? "An organization";
            return (
              <li key={i.id} className="px-5 py-5 sm:px-6">
                <div className="flex items-start gap-4">
                  {org && <OrgLogo brand={org.brand} name={org.name} size={44} className="hidden sm:inline-flex" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                      {org ? (
                        <Link href={`/organizations/${org.slug}`} className="text-[15px] font-semibold tracking-[-0.01em] text-ink underline-offset-4 hover:underline">{orgName}</Link>
                      ) : (
                        <span className="text-[15px] font-semibold">{orgName}</span>
                      )}
                      <span className="text-xs text-ink-4">· {relativeDay(i.createdAt)}</span>
                    </div>
                    <div className="mt-0.5 text-[13px] text-ink-3">
                      {sender ? `From ${sender.name}` : "From the recruiting team"}
                      {opp && (
                        <>
                          {" "}about{" "}
                          <Link href={`/opportunities/${opp.slug}`} className="text-navy-600 hover:text-navy">{opp.title}</Link>
                        </>
                      )}
                    </div>
                    <p className="mt-3 text-sm leading-relaxed text-ink-2">“{i.message}”</p>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {i.status === "sent" ? (
                        <>
                          <Button size="sm" variant="accent" onClick={() => respond(i.id, orgName, "interested")}>
                            <Check className="h-3.5 w-3.5" /> Interested
                          </Button>
                          <Button size="sm" variant="secondary" onClick={() => respond(i.id, orgName, "declined")}>Not interested</Button>
                          <span className="text-xs text-ink-4">Responding doesn&apos;t share any additional profile data.</span>
                        </>
                      ) : (
                        <Badge tone={i.status === "interested" ? "success" : "outline"}>{i.status === "interested" ? "You're interested" : "Declined"}</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </Card>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/* Aspiring path                                                       */
/* ------------------------------------------------------------------ */

export function PathIntoInsurance({ profile }: ModuleProps) {
  const a = profile.aspiring;
  return (
    <Card>
      <CardHeader
        eyebrow="Your path into the industry"
        title="From exploring to licensed"
        description="Every journey is different. Licensing requirements vary by state — confirm details with your state department of insurance."
        action={<ButtonLink href="/me/profile#licensing" variant="ghost" size="sm" className="-mr-2">Update</ButtonLink>}
      />
      <CardBody className="space-y-6">
        {a ? (
          <>
            <AspiringStepper stage={a.stage} />
            <AspiringNextStep details={a} />
          </>
        ) : (
          <p className="text-sm text-ink-3">Tell us where you are in your licensing journey to get tailored guidance.</p>
        )}
        <div className="flex flex-wrap gap-x-6 gap-y-2 border-t border-line pt-4 text-[13px]">
          <Link href="/explore" className="inline-flex items-center gap-1.5 font-medium text-navy-600 hover:text-navy"><Compass className="h-3.5 w-3.5" />Explore careers</Link>
          <Link href="/resources" className="inline-flex items-center gap-1.5 font-medium text-navy-600 hover:text-navy"><Sparkles className="h-3.5 w-3.5" />Guides for career changers</Link>
        </div>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Lighter secondary column                                            */
/* ------------------------------------------------------------------ */

export function CompletionNudge({ user, profile }: ModuleProps) {
  const { percent, items } = useMemo(() => profileCompletion(profile, user.kind), [profile, user.kind]);
  const next = items.find((i) => !i.done);
  return (
    <div className="rounded-2xl border border-line bg-surface/70 p-5">
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-sm font-semibold text-ink">Your profile</div>
        <div className="text-xs tabular-nums text-ink-3">{percent}% complete</div>
      </div>
      <ProgressBar value={percent} className="mt-2.5" />
      <p className="mt-3 text-[13px] leading-relaxed text-ink-3">
        {next ? "Employers you apply to see your profile like a résumé. A complete one helps them understand your experience." : "Your profile is complete. Keep it current as your career grows."}
      </p>
      {next ? (
        <Link href={`/me/profile#${next.section}`} className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-600 hover:text-navy">
          Add: {next.label} <ArrowRight className="h-3.5 w-3.5" />
        </Link>
      ) : (
        <Link href="/me/profile" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-600 hover:text-navy">View profile <ArrowRight className="h-3.5 w-3.5" /></Link>
      )}
    </div>
  );
}

export function ConnectionRequestsNudge({ db, user }: ModuleProps) {
  const pending = useMemo(() => pendingIncoming(db, user.id).length, [db, user.id]);
  if (!pending) return null;
  return (
    <Link href="/network/connections" className="flex items-center justify-between gap-3 rounded-2xl border border-line bg-surface/70 px-5 py-3.5 text-[13px] text-ink-2 transition hover:border-line-strong hover:text-ink">
      <span className="flex items-center gap-2.5"><Handshake className="h-4 w-4 text-ink-4" />{pluralize(pending, "connection request")}</span>
      <ArrowRight className="h-3.5 w-3.5 text-ink-4" />
    </Link>
  );
}

export function UpcomingEvents({ db, user, profile }: ModuleProps) {
  const events = useMemo(() => {
    const lines = new Set([...profile.specialties, ...(profile.aspiring?.targetLines ?? [])]);
    return db.events
      .filter((e) => isFuture(e.startsAt))
      .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
      .slice(0, 3)
      .map((e) => ({ e, relevant: e.lines.some((l) => lines.has(l)) }));
  }, [db, profile]);
  const rsvp = (id: string, title: string, attending: boolean) => {
    const r = toggleEventRsvp(user, id);
    if (r.ok) toast(attending ? "RSVP removed" : "You're on the list", { body: attending ? title : `${title} — demo RSVP, no calendar invite is sent.` });
    else toast("Couldn't update RSVP", { body: r.error, tone: "error" });
  };
  return (
    <section aria-labelledby="events-h">
      <div className="mb-3 flex items-center justify-between">
        <h2 id="events-h" className="text-sm font-semibold text-ink">Upcoming events</h2>
        <ViewAll href="/network/events">All</ViewAll>
      </div>
      {events.length ? (
        <ul className="space-y-4">
          {events.map(({ e, relevant }) => {
            const d = formatEventDate(e.startsAt);
            const attending = e.attendees.includes(user.id);
            return (
              <li key={e.id} className="flex gap-3.5">
                <div className="flex h-11 w-11 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-surface">
                  <span className="text-[9.5px] font-semibold tracking-[0.1em] text-gold-ink">{d.month}</span>
                  <span className="text-[16px] font-semibold leading-none tabular-nums text-ink">{d.day}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="text-[13.5px] font-medium leading-snug text-ink">{e.title}</div>
                  <div className="mt-0.5 text-xs text-ink-3">{d.weekday} · {d.time}</div>
                  <div className="mt-0.5 text-xs text-ink-4">{e.format === "virtual" ? "Virtual" : e.location}{relevant ? " · Matches your interests" : ""}</div>
                  <button
                    type="button"
                    onClick={() => rsvp(e.id, e.title, attending)}
                    aria-pressed={attending}
                    aria-label={attending ? `Cancel RSVP for ${e.title}` : `RSVP to ${e.title}`}
                    className={cn(
                      "mt-2 inline-flex h-7 items-center gap-1.5 rounded-md border px-2.5 text-xs font-medium transition",
                      attending ? "border-success/25 bg-success-50 text-success" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4 hover:text-ink",
                    )}
                  >
                    {attending ? <><Check className="h-3 w-3" strokeWidth={2.5} />Going</> : <><CalendarDays className="h-3 w-3" />RSVP</>}
                  </button>
                </div>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="text-sm text-ink-3">No upcoming events right now.</p>
      )}
    </section>
  );
}

export function CareerResources({ db, user, profile }: ModuleProps) {
  const items = useMemo(() => resourcesFor(db, user, profile).slice(0, 3), [db, user, profile]);
  return (
    <section aria-labelledby="res-h">
      <div className="mb-2 flex items-center justify-between">
        <h2 id="res-h" className="text-sm font-semibold text-ink">{user.kind === "aspiring" ? "Start here" : "Career resources"}</h2>
        <ViewAll href="/resources">All</ViewAll>
      </div>
      {items.length ? (
        <ul className="-mx-5 divide-y divide-line sm:-mx-6">
          {items.map((r) => <ResourceRow key={r.id} resource={r} compact />)}
        </ul>
      ) : (
        <p className="text-sm text-ink-3">New resources are on the way.</p>
      )}
    </section>
  );
}
