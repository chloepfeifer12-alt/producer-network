"use client";

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowRight, Search, ShieldCheck } from "lucide-react";
import type { Article, Availability, LineSlug, User } from "@/lib/data/types";
import { AVAILABILITY_LABEL, LINE_BY_SLUG } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { pendingIncoming } from "@/lib/services/network";
import { SECTION_LABEL } from "@/lib/services/insider";
import { Kicker } from "@/components/editorial";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/format";
import { MentorRow } from "./cards";
import { EMPTY_FILTERS, PeopleDirectory, type DirectoryFilters } from "./directory";
import { JoinPromptDialog, PersonaChoices } from "./join-prompt";
import { connectionCount, featuredProfessionals, memberEntries, membersOnlyCount, mentorTopics, peopleHref, visibleMentors } from "./people-data";

const WRAP = "mx-auto w-full max-w-[1200px] px-4 sm:px-6 lg:px-8";

type Tab = "directory" | "mentors" | "voices";
const TABS: Tab[] = ["directory", "mentors", "voices"];

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

function initialTab(params: URLSearchParams): Tab {
  const t = params.get("tab") as Tab | null;
  return t && TABS.includes(t) ? t : "directory";
}

function syncUrl(f: DirectoryFilters, tab: Tab) {
  const p = new URLSearchParams();
  if (tab !== "directory") p.set("tab", tab);
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
  const [tab, setTabState] = useState<Tab>(() => initialTab(params));
  const [joinOpen, setJoinOpen] = useState(false);
  const signedIn = !!user;

  const setFilters = useCallback((f: DirectoryFilters) => {
    setFiltersState(f);
    syncUrl(f, "directory");
  }, []);
  const setTab = useCallback((t: Tab) => {
    setTabState(t);
    syncUrl(filters, t);
  }, [filters]);
  const toDirectory = useCallback((patch: Partial<DirectoryFilters>) => {
    const f = { ...EMPTY_FILTERS, ...patch };
    setFiltersState(f);
    setTabState("directory");
    syncUrl(f, "directory");
    requestAnimationFrame(() => document.getElementById("people-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" }));
  }, []);

  // Content mounts after hydration, so honour #directory / #mentors / #voices deep links once it exists.
  useEffect(() => {
    const id = window.location.hash.slice(1) as Tab;
    if (!TABS.includes(id)) return;
    setTabState(id);
    requestAnimationFrame(() => document.getElementById("people-tabs")?.scrollIntoView({ block: "start" }));
  }, []);

  const entries = useMemo(() => memberEntries(db, user), [db, user]);
  const directoryEntries = useMemo(() => entries.filter((e) => !e.isSelf), [entries]);
  const suggestedIds = useMemo(() => featuredProfessionals(entries, 3).map((e) => e.profile.userId), [entries]);
  const mentorList = useMemo(() => {
    const ids = new Set(visibleMentors(db, user).map((p) => p.userId));
    return entries
      .filter((e) => ids.has(e.profile.userId) && !e.isSelf)
      .sort((a, b) => b.shared.length - a.shared.length || b.profile.yearsInIndustry - a.profile.yearsInIndustry);
  }, [db, user, entries]);
  const mentorStats = useMemo(() => mentorTopics(db), [db]);
  const hiddenCount = useMemo(() => (signedIn ? 0 : membersOnlyCount(db)), [db, signedIn]);
  const visibleIds = useMemo(() => new Set(entries.map((e) => e.profile.userId)), [entries]);
  const voices = useMemo(
    () =>
      db.articles
        .filter((a) => a.subjectUserId)
        .sort((a, b) => b.publishedAt.localeCompare(a.publishedAt))
        .map((a) => ({ article: a, subject: db.users.find((u) => u.id === a.subjectUserId) }))
        .filter((v): v is Voice => !!v.subject && v.subject.status === "active"),
    [db],
  );

  return (
    <>
      <Hero
        user={user}
        q={filters.q}
        onQuery={(q) => {
          setFilters({ ...filters, q });
          setTabState("directory");
        }}
        onSubmit={() => requestAnimationFrame(() => document.getElementById("people-tabs")?.scrollIntoView({ behavior: "smooth", block: "start" }))}
        onJoin={() => setJoinOpen(true)}
      />

      <section id="people-tabs" className={cn(WRAP, "scroll-mt-16 pb-24 pt-10 sm:pt-12")} aria-label="People">
        <Tabs<Tab>
          value={tab}
          onChange={setTab}
          className="mb-8"
          items={[
            { value: "directory", label: "Directory" },
            { value: "mentors", label: "Mentors", count: signedIn ? mentorList.length : mentorStats.count },
            ...(voices.length > 0 ? [{ value: "voices" as const, label: "Voices" }] : []),
          ]}
        />

        <div role="tabpanel" aria-label={tab}>
          {tab === "directory" && (
            <PeopleDirectory
              entries={directoryEntries}
              filters={filters}
              onChange={setFilters}
              signedIn={signedIn}
              hiddenCount={hiddenCount}
              suggestedIds={suggestedIds}
              onJoin={() => setJoinOpen(true)}
            />
          )}

          {tab === "mentors" && (
            mentorList.length > 0 ? (
              <div className="max-w-4xl">
                <p className="mb-6 max-w-[62ch] text-[14.5px] leading-relaxed text-ink-3">
                  Experienced members set aside time for people earlier in their careers. Send a clear goal; your request arrives as a connection request with your note.
                </p>
                <ul className="divide-y divide-line border-y border-line">
                  {mentorList.map((e) => <MentorRow key={e.profile.userId} entry={e} signedIn={signedIn} />)}
                </ul>
                <button type="button" onClick={() => toDirectory({ mentors: true })} className="group mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
                  Filter the directory by mentors <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
                </button>
              </div>
            ) : (
              <VisitorMentors count={mentorStats.count} topics={mentorStats.topics} />
            )
          )}

          {tab === "voices" && (
            <div className="max-w-4xl">
              <p className="mb-6 text-[14.5px] text-ink-3">
                Interviews, spotlights and essays featuring members, from The Insider. <span className="text-ink-4">Fictional editorial.</span>
              </p>
              <ul className="divide-y divide-line border-y border-line">
                {voices.map((v) => <VoiceRow key={v.article.id} voice={v} linkable={visibleIds.has(v.subject.id)} />)}
              </ul>
              <Link href="/insider" className="group mt-6 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
                Read The Insider <ArrowRight className="h-3.5 w-3.5 transition group-hover:translate-x-0.5" />
              </Link>
            </div>
          )}
        </div>

        <p className="mt-16 flex items-start gap-2 text-xs leading-relaxed text-ink-4">
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

/** The page's one primary element: a live search that drives the directory below. */
function Hero({ user, q, onQuery, onSubmit, onJoin }: { user: User | null; q: string; onQuery: (q: string) => void; onSubmit: () => void; onJoin: () => void }) {
  const submit = (e: FormEvent) => {
    e.preventDefault();
    onSubmit();
  };
  return (
    <section className="border-b border-line">
      <div className={cn(WRAP, "pb-10 pt-12 sm:pb-12 sm:pt-16")}>
        <div className="max-w-2xl animate-rise">
          <Kicker className="mb-5 max-w-[10rem]">People</Kicker>
          <h1 className="font-display text-[36px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[48px]">The people of the industry</h1>
          <p className="mt-3 text-[16px] leading-relaxed text-ink-3">Portfolios, mentors and a directory where every member chose to be found.</p>
          <form onSubmit={submit} className="mt-7 flex max-w-xl gap-2" role="search">
            <label htmlFor="hero-search" className="sr-only">Search people</label>
            <div className="relative flex-1">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" strokeWidth={1.75} />
              <Input id="hero-search" type="search" value={q} onChange={(e) => onQuery(e.target.value)} placeholder="Name, city or expertise" className="h-11 rounded-xl pl-10 text-[15px]" />
            </div>
            <Button type="submit" size="lg" className="shrink-0">Search</Button>
          </form>
          <div className="mt-5 text-[13px] text-ink-3">{user ? <YourLine user={user} /> : <VisitorLine onJoin={onJoin} />}</div>
        </div>
      </div>
    </section>
  );
}

const VISIBILITY_PHRASE = { public: "public", members: "visible to members", private: "private" } as const;

const QUIET_LINK = "font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink hover:decoration-ink-3";

/** One quiet status line for members: connections · requests · visibility. */
function YourLine({ user }: { user: User }) {
  const db = useDb();
  const profile = useMemo(() => db.profiles.find((p) => p.userId === user.id), [db, user.id]);
  const connections = useMemo(() => connectionCount(db, user.id), [db, user.id]);
  const incoming = useMemo(() => pendingIncoming(db, user.id).length, [db, user.id]);
  const org = user.orgId ? db.organizations.find((o) => o.id === user.orgId) : undefined;

  if (!profile) {
    return (
      <p>
        Viewing as {ROLE_LABEL(user)}{org ? ` · ${org.name}` : ""}. Connecting never shares a member&apos;s application data.
      </p>
    );
  }
  const bits = [
    <Link key="c" href="/network/connections" className="hover:text-ink">{pluralize(connections, "connection")}</Link>,
    incoming > 0 ? <Link key="r" href="/network/connections?tab=received" className="text-navy-600 hover:text-navy">{pluralize(incoming, "request")} waiting</Link> : null,
    <span key="v">
      Your profile is {VISIBILITY_PHRASE[profile.visibility]}
      {!profile.consent.showInDirectory && " and hidden from the directory"}
      {" — "}
      <Link href={peopleHref(user.id)} className={QUIET_LINK}>view</Link>
    </span>,
  ].filter(Boolean);
  return (
    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
      {bits.map((b, i) => (
        <span key={i} className="inline-flex items-center gap-2">
          {i > 0 && <span aria-hidden className="text-ink-4">·</span>}
          {b}
        </span>
      ))}
    </p>
  );
}

function VisitorLine({ onJoin }: { onJoin: () => void }) {
  return (
    <p>
      You choose who sees your portfolio.{" "}
      <Link href="/join" className={QUIET_LINK}>Create your profile</Link>{" "}
      or{" "}
      <button type="button" onClick={onJoin} className={QUIET_LINK}>explore as a demo member</button>.
    </p>
  );
}

function VisitorMentors({ count, topics }: { count: number; topics: string[] }) {
  return (
    <div className="grid max-w-4xl grid-cols-1 gap-10 sm:grid-cols-[1fr_20rem]">
      <div>
        <p className="text-[15px] leading-relaxed text-ink-2">
          <span className="font-display text-[22px] text-ink">{count}</span> members offer mentorship. Their notes and requests are shared with members.
        </p>
        <p className="mt-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Topics on offer</p>
        <p className="mt-2 text-[14px] leading-relaxed text-ink-2">{topics.slice(0, 10).join(" · ")}</p>
      </div>
      <div>
        <p className="mb-3 text-[13px] text-ink-3">Explore as a demo member to send a request:</p>
        <PersonaChoices />
      </div>
    </div>
  );
}

type Voice = { article: Article; subject: User };

function VoiceRow({ voice, linkable }: { voice: Voice; linkable: boolean }) {
  const { article: a, subject } = voice;
  return (
    <li className="group relative grid gap-1 py-5 sm:grid-cols-[8rem_1fr] sm:gap-6">
      <div className="text-[12px] text-ink-4 sm:pt-1">{formatDate(a.publishedAt, { month: "short", day: "numeric" })} · {SECTION_LABEL[a.section]}</div>
      <div className="min-w-0">
        <h3 className="font-display text-[19px] leading-snug text-ink">
          <Link href={`/insider/${a.slug}`} className="after:absolute after:inset-0 after:content-[''] group-hover:text-navy-600">{a.title}</Link>
        </h3>
        <p className="mt-1 text-[13px] text-ink-3">
          With{" "}
          {linkable ? (
            <Link href={peopleHref(subject.id)} className="relative z-10 font-medium text-ink-2 hover:text-navy-600">{subject.name}</Link>
          ) : (
            <span className="font-medium text-ink-2">{subject.name}</span>
          )}
          <span className="text-ink-4"> · {a.readMinutes} min read</span>
        </p>
      </div>
    </li>
  );
}
