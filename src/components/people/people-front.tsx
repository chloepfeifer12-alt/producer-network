"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Eye, Lock, Search, ShieldCheck, Sprout } from "lucide-react";
import type { Availability, LineSlug, User } from "@/lib/data/types";
import { AVAILABILITY_LABEL, INSURANCE_LINES, LINE_BY_SLUG, VISIBILITY_LABEL } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { pendingIncoming } from "@/lib/services/network";
import { Kicker, SectionHead } from "@/components/editorial";
import { CoverArt } from "@/components/brand/cover-art";
import { Avatar } from "@/components/ui/avatar";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { DemoTag } from "@/components/ui/feedback";
import { LineIcon } from "@/components/ui/line-icon";
import { SECTION_LABEL } from "@/lib/services/insider";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/format";
import { FeaturedCompact, FeaturedLead, MentorRow } from "./cards";
import { EMPTY_FILTERS, PeopleDirectory, type DirectoryFilters } from "./directory";
import { JoinPromptDialog, PersonaChoices } from "./join-prompt";
import {
  connectionCount, featuredProfessionals, featuresOf, listedCount, memberEntries, membersOnlyCount, mentorTopics, peopleHref,
  specialtyCounts, stageCounts, STAGES, visibleMentors,
} from "./people-data";

const WRAP = "mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8";

function initialFilters(params: URLSearchParams): DirectoryFilters {
  const line = params.get("specialty") as LineSlug | null;
  const availability = params.get("availability") as Availability | null;
  return {
    ...EMPTY_FILTERS,
    q: params.get("q") ?? "",
    line: line && LINE_BY_SLUG[line] ? line : "",
    state: params.get("state") ?? "",
    level: params.get("experience") ?? "",
    availability: availability && AVAILABILITY_LABEL[availability] ? availability : "",
    mentors: params.get("mentors") === "1",
  };
}

function syncUrl(f: DirectoryFilters) {
  const p = new URLSearchParams();
  if (f.q) p.set("q", f.q);
  if (f.line) p.set("specialty", f.line);
  if (f.state) p.set("state", f.state);
  if (f.level) p.set("experience", f.level);
  if (f.availability) p.set("availability", f.availability);
  if (f.mentors) p.set("mentors", "1");
  const qs = p.toString();
  window.history.replaceState(null, "", qs ? `?${qs}` : window.location.pathname);
}

export function PeopleFront() {
  const db = useDb();
  const user = useCurrentUser();
  const params = useSearchParams();
  const [filters, setFiltersState] = useState<DirectoryFilters>(() => initialFilters(params));
  const [joinOpen, setJoinOpen] = useState(false);
  const signedIn = !!user;

  const setFilters = useCallback((f: DirectoryFilters) => {
    setFiltersState(f);
    syncUrl(f);
  }, []);
  const toDirectory = useCallback((patch: Partial<DirectoryFilters>) => {
    setFilters({ ...EMPTY_FILTERS, ...patch });
    requestAnimationFrame(() => document.getElementById("directory")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, [setFilters]);

  // Content mounts after hydration, so honour #directory / #mentors deep links once it exists.
  useEffect(() => {
    const id = window.location.hash.slice(1);
    if (id) requestAnimationFrame(() => document.getElementById(id)?.scrollIntoView({ block: "start" }));
  }, []);

  const entries = useMemo(() => memberEntries(db, user), [db, user]);
  const featured = useMemo(() => featuredProfessionals(entries, 3), [entries]);
  const directoryEntries = useMemo(() => entries.filter((e) => !e.isSelf), [entries]);
  const mentorList = useMemo(() => {
    const ids = new Set(visibleMentors(db, user).map((p) => p.userId));
    return entries
      .filter((e) => ids.has(e.profile.userId) && !e.isSelf)
      .sort((a, b) => b.shared.length - a.shared.length || b.profile.yearsInIndustry - a.profile.yearsInIndustry);
  }, [db, user, entries]);
  const mentorStats = useMemo(() => mentorTopics(db), [db]);
  const hiddenCount = useMemo(() => (signedIn ? 0 : membersOnlyCount(db)), [db, signedIn]);
  const total = useMemo(() => listedCount(db), [db]);
  const lineCounts = useMemo(() => specialtyCounts(db), [db]);
  const stages = useMemo(() => stageCounts(db), [db]);
  const visibleIds = useMemo(() => new Set(entries.map((e) => e.profile.userId)), [entries]);
  const voices = useMemo(
    () =>
      db.articles
        .filter((a) => a.subjectUserId)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .map((a) => ({ article: a, subject: db.users.find((u) => u.id === a.subjectUserId) }))
        .filter((v): v is { article: typeof v.article; subject: User } => !!v.subject && v.subject.status === "active"),
    [db],
  );

  return (
    <>
      <Hero
        user={user}
        total={total}
        mentorCount={mentorStats.count}
        specialtyCount={lineCounts.size}
        onSearch={(q) => toDirectory({ q })}
        onJoin={() => setJoinOpen(true)}
      />

      {/* Featured professionals */}
      <section className={cn(WRAP, "py-16 sm:py-20")} aria-labelledby="featured-h">
        <SectionHead
          kicker="Featured professionals"
          title={<span id="featured-h">Portfolios worth reading</span>}
          dek={
            signedIn && entries.some((e) => e.shared.length)
              ? "Chosen for the specialties you share and the work they've put on the record."
              : "Practitioners who've put their work on the record: accomplishments, careers and what they're known for."
          }
        />
        {featured.length === 0 ? (
          <MembersOnlyPanel hiddenCount={hiddenCount} onJoin={() => setJoinOpen(true)} />
        ) : (
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-12">
            <div className="lg:col-span-7"><FeaturedLead entry={featured[0]!} signedIn={signedIn} /></div>
            <div className="grid gap-5 lg:col-span-5">
              {featured.slice(1).map((e) => <FeaturedCompact key={e.profile.userId} entry={e} signedIn={signedIn} />)}
              {featured.length < 3 && !signedIn && <MembersOnlyPanel hiddenCount={hiddenCount} onJoin={() => setJoinOpen(true)} compact />}
            </div>
          </div>
        )}
      </section>

      {/* Mentors */}
      <section id="mentors" className="scroll-mt-20 border-y border-line bg-surface" aria-labelledby="mentors-h">
        <div className={cn(WRAP, "grid grid-cols-1 gap-12 py-16 sm:py-20 lg:grid-cols-12")}>
          <div className="lg:col-span-4">
            <Kicker className="mb-4">Mentorship</Kicker>
            <h2 id="mentors-h" className="font-display text-[30px] leading-[1.08] tracking-[-0.015em] text-ink sm:text-[38px]">
              Office hours from people who&apos;ve done the work
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-ink-3">
              Experienced members set aside time for people earlier in their careers. No programs, no fees: a clear ask and an honest conversation.
            </p>
            <ol className="mt-8 space-y-0 border-t border-line">
              {[
                ["Pick a mentor", "Read their note and the topics they're glad to cover."],
                ["Bring a goal", "Your request arrives as a connection request with your note."],
                ["Meet as peers", "Once they accept, keep the conversation going in the network."],
              ].map(([t, d], i) => (
                <li key={t} className="flex gap-4 border-b border-line py-4">
                  <span className="font-display text-[22px] leading-none text-ink-4">{i + 1}</span>
                  <span>
                    <span className="block text-[14px] font-medium text-ink">{t}</span>
                    <span className="mt-0.5 block text-[13px] leading-relaxed text-ink-3">{d}</span>
                  </span>
                </li>
              ))}
            </ol>
            {signedIn && mentorList.length > 0 && (
              <button type="button" onClick={() => toDirectory({ mentors: true })} className="group mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
                Browse every mentor in the directory <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </button>
            )}
          </div>
          <div className="lg:col-span-8">
            {mentorList.length > 0 ? (
              <ul className="divide-y divide-line">
                {mentorList.slice(0, 5).map((e) => <MentorRow key={e.profile.userId} entry={e} signedIn={signedIn} />)}
              </ul>
            ) : (
              <VisitorMentors count={mentorStats.count} topics={mentorStats.topics} onJoin={() => setJoinOpen(true)} />
            )}
          </div>
        </div>
      </section>

      {/* Voices */}
      {voices.length > 0 && (
        <section className={cn(WRAP, "py-16 sm:py-20")} aria-labelledby="voices-h">
          <SectionHead
            kicker={<span className="inline-flex items-center gap-3">Voices <DemoTag className="normal-case tracking-normal">Fictional editorial</DemoTag></span>}
            title={<span id="voices-h">Members in The Insider</span>}
            dek="Interviews, spotlights and essays featuring people from the community."
            href="/insider"
            linkLabel="Read The Insider"
          />
          <div className="grid grid-cols-1 gap-x-10 gap-y-10 lg:grid-cols-12">
            <VoiceLead voice={voices[0]!} linkable={visibleIds.has(voices[0]!.subject.id)} tone={db.profiles.find((p) => p.userId === voices[0]!.subject.id)?.avatarTone} />
            <ul className="divide-y divide-line border-t border-line lg:col-span-5 lg:border-t-0">
              {voices.slice(1, 5).map((v) => (
                <VoiceRow key={v.article.id} voice={v} linkable={visibleIds.has(v.subject.id)} />
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Browse */}
      <section className="border-t border-line bg-subtle/50" aria-labelledby="browse-h">
        <div className={cn(WRAP, "py-16 sm:py-20")}>
          <SectionHead kicker="Browse" title={<span id="browse-h">Find your people</span>} dek="By the work they do, and by where they are in their career." />
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">By specialty</h3>
              <ul className="grid border-t border-line sm:grid-cols-2 sm:gap-x-8">
                {INSURANCE_LINES.filter((l) => lineCounts.get(l.slug)).sort((a, b) => (lineCounts.get(b.slug) ?? 0) - (lineCounts.get(a.slug) ?? 0)).map((l) => (
                  <li key={l.slug} className="border-b border-line">
                    <button type="button" onClick={() => toDirectory({ line: l.slug })} className="group flex w-full items-center gap-3 py-3 text-left">
                      <LineIcon line={l.slug} className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:text-navy-600" />
                      <span className="min-w-0 flex-1 truncate text-[14px] text-ink-2 transition group-hover:text-ink">{l.name}</span>
                      <span className="font-display text-[17px] tabular-nums text-ink-3">{lineCounts.get(l.slug)}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <div className="lg:col-span-5">
              <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">By career stage</h3>
              <ul className="border-t border-line">
                {STAGES.map((s) => (
                  <li key={s.key} className="border-b border-line">
                    <button type="button" onClick={() => toDirectory({ level: `stage:${s.key}` })} className="group flex w-full items-baseline gap-4 py-3.5 text-left">
                      <span className="min-w-0 flex-1">
                        <span className="block text-[14.5px] font-medium text-ink-2 transition group-hover:text-ink">{s.label}</span>
                        <span className="block text-[12.5px] text-ink-3">{s.dek}</span>
                      </span>
                      <span className="font-display text-[22px] tabular-nums text-ink-3">{stages.get(s.key) ?? 0}</span>
                    </button>
                  </li>
                ))}
              </ul>
              {!signedIn && <p className="mt-4 text-xs leading-relaxed text-ink-3">Counts include profiles shared with members only.</p>}
            </div>
          </div>
        </div>
      </section>

      {/* Directory */}
      <section id="directory" className={cn(WRAP, "scroll-mt-16 py-16 sm:py-20")} aria-labelledby="directory-h">
        <SectionHead
          kicker="The directory"
          title={<span id="directory-h">Everyone who chose to be found</span>}
          dek={
            signedIn
              ? "Only members who opted into the directory appear here. Private profiles are never listed."
              : "You're seeing public profiles. Members see everyone who opted into the directory."
          }
          className="mb-5"
        />
        <PeopleDirectory entries={directoryEntries} filters={filters} onChange={setFilters} signedIn={signedIn} hiddenCount={hiddenCount} onJoin={() => setJoinOpen(true)} />
        <p className="mt-10 flex items-start gap-2 text-xs leading-relaxed text-ink-3">
          <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
          Members control whether they appear here. License numbers (NPN) and contact details are never shown on People. All people on this prototype are fictional.
        </p>
      </section>

      <JoinPromptDialog
        open={joinOpen}
        onClose={() => setJoinOpen(false)}
        title="Join the people of the industry"
        reason="Members see the full directory, connect with peers and request mentorship. Create a profile, or explore as a demo member."
      />
    </>
  );
}

/* ------------------------------------------------------------------ */

function Hero({ user, total, mentorCount, specialtyCount, onSearch, onJoin }: { user: User | null; total: number; mentorCount: number; specialtyCount: number; onSearch: (q: string) => void; onJoin: () => void }) {
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSearch(q.trim());
  };
  return (
    <section className="border-b border-line">
      <div className={cn(WRAP, "grid grid-cols-1 gap-12 pb-14 pt-12 sm:pt-16 lg:grid-cols-12 lg:gap-16 lg:pb-20")}>
        <div className="lg:col-span-7 animate-rise">
          <Kicker className="mb-6 max-w-xs">People</Kicker>
          <h1 className="font-display text-[44px] leading-[1.02] tracking-[-0.025em] text-ink sm:text-[64px] lg:text-[72px]">
            The people of <span className="italic text-ink-3">the industry.</span>
          </h1>
          <p className="mt-6 max-w-[34rem] text-[17px] leading-relaxed text-ink-2">
            Producers, account managers, adjusters, trainers, principals and the people about to join them. Professional portfolios, mentors who make time, and
            a directory where every member chose to be found.
          </p>
          <form onSubmit={submit} className="mt-8 flex max-w-xl gap-2" role="search">
            <label htmlFor="hero-search" className="sr-only">Search people</label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" strokeWidth={1.75} />
              <Input id="hero-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search by name, city or expertise" className="h-12 rounded-xl pl-10 text-[15px]" />
            </div>
            <Button type="submit" size="lg" className="shrink-0">Search</Button>
          </form>
          <p className="mt-6 text-[13px] text-ink-3">
            <span className="font-display text-[17px] text-ink">{total}</span> professionals in the directory
            <span className="mx-2 text-ink-4">·</span>
            <span className="font-display text-[17px] text-ink">{mentorCount}</span> offering mentorship
            <span className="mx-2 text-ink-4">·</span>
            <span className="font-display text-[17px] text-ink">{specialtyCount}</span> specialties
          </p>
        </div>
        <div className="lg:col-span-5 lg:pt-10">
          {user ? <YourPlace user={user} /> : <VisitorPanel onJoin={onJoin} />}
        </div>
      </div>
    </section>
  );
}

function YourPlace({ user }: { user: User }) {
  const db = useDb();
  const profile = useMemo(() => db.profiles.find((p) => p.userId === user.id), [db, user.id]);
  const connections = useMemo(() => connectionCount(db, user.id), [db, user.id]);
  const incoming = useMemo(() => pendingIncoming(db, user.id).length, [db, user.id]);
  const features = useMemo(() => featuresOf(db, user.id).length, [db, user.id]);
  const org = user.orgId ? db.organizations.find((o) => o.id === user.orgId) : undefined;

  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
      <Kicker className="mb-5">{profile ? "Your place in it" : "Viewing as"}</Kicker>
      <div className="flex items-center gap-4">
        <Avatar name={user.name} tone={profile?.avatarTone ?? 1} size={56} decorative />
        <div className="min-w-0">
          <div className="font-display text-[22px] leading-tight text-ink">{user.name}</div>
          <div className="truncate text-[13px] text-ink-3">{profile ? profile.headline : `${ROLE_LABEL(user)}${org ? ` · ${org.name}` : ""}`}</div>
        </div>
      </div>
      {profile ? (
        <>
          <dl className="mt-6 grid grid-cols-3 border-y border-line text-center">
            {[
              ["Connections", connections],
              ["Requests", incoming],
              ["Insider features", features],
            ].map(([label, n], i) => (
              <div key={label} className={cn("py-4", i > 0 && "border-l border-line")}>
                <dt className="text-[11px] uppercase tracking-[0.12em] text-ink-3">{label}</dt>
                <dd className="mt-1 font-display text-[26px] leading-none text-ink">{n}</dd>
              </div>
            ))}
          </dl>
          <p className="mt-4 flex items-center gap-2 text-[12.5px] text-ink-3">
            {profile.visibility === "private" ? <Lock className="h-3.5 w-3.5" strokeWidth={1.75} /> : <Eye className="h-3.5 w-3.5" strokeWidth={1.75} />}
            Profile visibility: <span className="font-medium text-ink-2">{VISIBILITY_LABEL[profile.visibility]}</span>
            {!profile.consent.showInDirectory && <span>· hidden from directory</span>}
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <ButtonLink href={peopleHref(user.id)} variant="primary" size="sm">View your portfolio</ButtonLink>
            {incoming > 0 ? (
              <ButtonLink href="/network/connections?tab=received" variant="secondary" size="sm">Review {pluralize(incoming, "request")}</ButtonLink>
            ) : (
              <ButtonLink href="/me/profile" variant="secondary" size="sm">Edit profile</ButtonLink>
            )}
          </div>
        </>
      ) : (
        <p className="mt-5 text-[13.5px] leading-relaxed text-ink-3">
          Organization team members can browse and connect with the community. Connecting never shares a member&apos;s application data. To review
          candidates, use your recruiting workspace.
        </p>
      )}
    </div>
  );
}

function VisitorPanel({ onJoin }: { onJoin: () => void }) {
  return (
    <div className="rounded-2xl border border-line bg-surface p-6 sm:p-7">
      <Kicker className="mb-4">Be visible, on your terms</Kicker>
      <p className="font-display text-[22px] leading-snug text-ink">A professional portfolio that belongs to you, not to a recruiter&apos;s database.</p>
      <ul className="mt-5 space-y-2.5 text-[13.5px] text-ink-2">
        {[
          "You choose who sees your profile: public, members or private.",
          "License records are always marked self-reported.",
          "Your NPN and contact details are never shown on People.",
        ].map((t) => (
          <li key={t} className="flex gap-2.5"><span aria-hidden className="mt-2 h-1 w-1 shrink-0 rounded-full bg-ink-3" />{t}</li>
        ))}
      </ul>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <ButtonLink href="/join" variant="primary" size="sm">Create your profile <ArrowRight className="h-3.5 w-3.5" /></ButtonLink>
        <button type="button" onClick={onJoin} className="text-[13px] font-medium text-ink-2 hover:text-ink">or explore as a demo member</button>
      </div>
    </div>
  );
}

function MembersOnlyPanel({ hiddenCount, onJoin, compact }: { hiddenCount: number; onJoin: () => void; compact?: boolean }) {
  return (
    <div className={cn("flex flex-col justify-between rounded-2xl border border-dashed border-line-strong bg-surface/60", compact ? "p-6" : "p-8 sm:p-10")}>
      <div>
        <div className="flex -space-x-2.5" aria-hidden>
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <span key={i} className="h-9 w-9 rounded-full ring-2 ring-canvas" style={{ background: ["#E8E1D3", "#DCE3EE", "#E3E9E1", "#EFE1DC", "#E6E2EE", "#DDEAEA"][i] }} />
          ))}
          <span className="flex h-9 w-9 items-center justify-center rounded-full bg-surface text-ink-4 ring-2 ring-canvas"><Lock className="h-3.5 w-3.5" strokeWidth={1.75} /></span>
        </div>
        <p className={cn("mt-4 font-display leading-snug text-ink", compact ? "text-[22px]" : "text-[28px]")}>
          {hiddenCount > 0 ? `${pluralize(hiddenCount, "more professional")} share their portfolios with members only.` : "Most portfolios are shared with members only."}
        </p>
        <p className="mt-2 text-[13.5px] leading-relaxed text-ink-3">Members decide who sees their work. Join to read their portfolios, connect and ask for mentorship.</p>
      </div>
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <Button variant="primary" size="sm" onClick={onJoin}>Join to see everyone</Button>
        <Link href="/join" className="text-[13px] font-medium text-ink-2 hover:text-ink">Create a profile</Link>
      </div>
    </div>
  );
}

function VisitorMentors({ count, topics, onJoin }: { count: number; topics: string[]; onJoin: () => void }) {
  return (
    <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
      <div>
        <p className="font-display text-[56px] leading-none text-ink">{count}</p>
        <p className="mt-2 text-[15px] text-ink-2">members are offering mentorship right now.</p>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Topics on offer</p>
        <ul className="mt-3 grid grid-cols-1 gap-x-6 border-t border-line text-[13.5px] text-ink-2 sm:grid-cols-2">
          {topics.map((t) => (
            <li key={t} className="border-b border-line py-2">{t}</li>
          ))}
        </ul>
      </div>
      <div className="rounded-2xl border border-line bg-canvas p-5">
        <div className="flex items-center gap-2 text-[13.5px] font-medium text-ink">
          <Sprout className="h-4 w-4 text-success" strokeWidth={1.75} /> Mentors share their notes with members
        </div>
        <p className="mt-1.5 text-[13px] leading-relaxed text-ink-3">Step in as a demo member to read their notes and send a request.</p>
        <div className="mt-4"><PersonaChoices /></div>
        <button type="button" onClick={onJoin} className="mt-3 text-[12.5px] font-medium text-ink-3 hover:text-ink">Or create a profile</button>
      </div>
    </div>
  );
}

type Voice = { article: import("@/lib/data/types").Article; subject: User };

function SubjectLine({ subject, linkable, tone }: { subject: User; linkable: boolean; tone?: number }) {
  return (
    <span className="inline-flex items-center gap-2 text-[12.5px] text-ink-3">
      <Avatar name={subject.name} tone={tone ?? 1} size={22} decorative />
      Featuring{" "}
      {linkable ? (
        <Link href={peopleHref(subject.id)} className="relative z-10 font-medium text-ink-2 hover:text-navy-600">{subject.name}</Link>
      ) : (
        <span className="font-medium text-ink-2">{subject.name}</span>
      )}
    </span>
  );
}

function VoiceLead({ voice, linkable, tone }: { voice: Voice; linkable: boolean; tone?: number }) {
  const { article: a, subject } = voice;
  return (
    <article className="group relative lg:col-span-7">
      <div className="aspect-[16/9] overflow-hidden rounded-xl">
        <CoverArt seed={a.id} variant={a.art.variant} hue={a.art.hue} ground={a.art.ground} className="transition duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="mt-5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{SECTION_LABEL[a.section]} · {a.readMinutes} min read</div>
      <h3 className="mt-2 font-display text-[28px] leading-[1.1] tracking-[-0.015em] text-ink sm:text-[34px]">
        <Link href={`/insider/${a.slug}`} className="after:absolute after:inset-0 after:content-[''] group-hover:text-navy-600">{a.title}</Link>
      </h3>
      <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-3">{a.dek}</p>
      <div className="mt-4"><SubjectLine subject={subject} linkable={linkable} tone={tone} /></div>
    </article>
  );
}

function VoiceRow({ voice, linkable }: { voice: Voice; linkable: boolean }) {
  const { article: a, subject } = voice;
  return (
    <li className="group relative flex gap-4 py-5 first:pt-5 lg:first:pt-0">
      <div className="h-[72px] w-[104px] shrink-0 overflow-hidden rounded-lg">
        <CoverArt seed={a.id} variant={a.art.variant} hue={a.art.hue} ground={a.art.ground} className="transition duration-500 group-hover:scale-[1.05]" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">{SECTION_LABEL[a.section]} · {formatDate(a.publishedAt, { month: "short", day: "numeric" })}</div>
        <h3 className="mt-1 font-display text-[18px] leading-snug text-ink">
          <Link href={`/insider/${a.slug}`} className="after:absolute after:inset-0 after:content-[''] group-hover:text-navy-600">{a.title}</Link>
        </h3>
        <p className="mt-1 text-[12.5px] text-ink-3">
          With{" "}
          {linkable ? (
            <Link href={peopleHref(subject.id)} className="relative z-10 font-medium text-ink-2 hover:text-navy-600">{subject.name}</Link>
          ) : (
            <span className="font-medium text-ink-2">{subject.name}</span>
          )}
        </p>
      </div>
    </li>
  );
}

