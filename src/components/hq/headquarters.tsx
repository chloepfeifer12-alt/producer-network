"use client";

import { useMemo, useState } from "react";
import type { User } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { lineName } from "@/lib/data/taxonomy";
import { Masthead } from "./masthead";
import { OrgDesk } from "./desk";
import { ActivityLine, CalmTabs, TodayList } from "./calm";
import { FeaturedOrganizations } from "./featured-orgs";
import { OpportunitiesForYou } from "./opportunities-for-you";
import { PeopleToMeet } from "./people-to-meet";
import { LearningPath } from "./learning-path";
import {
  briefing,
  careerGuides,
  conversationsFor,
  featuredOrganizations,
  focusLines,
  hqMode,
  industryToday,
  knownPeople,
  learningResources,
  mentorsFor,
  opportunitiesFor,
  peopleToMeet,
  upcomingEvents,
} from "./hq-data";

/**
 * The Network — a member's headquarters. A front page edited for one person:
 * the day's briefing, the industry's lead story, organizations and people worth
 * knowing, opportunities with their reasons, and the conversations in between.
 */
export function Headquarters({ user }: { user: User }) {
  const db = useDb();
  const profile = useMemo(() => db.profiles.find((p) => p.userId === user.id), [db, user.id]);
  const fit = user.kind === "organization" ? undefined : db.fitAnswers[user.id];
  const mode = hqMode(user, profile);
  const isOrg = mode === "organization";

  // Snapshots taken on arrival so that following / connecting doesn't make items jump away mid-visit.
  const [initiallyFollowed] = useState(() => new Set(db.follows.filter((f) => f.userId === user.id).map((f) => f.targetId)));
  const [initiallyKnown] = useState(() => knownPeople(db, user.id));

  const lines = useMemo(() => focusLines(db, user, profile, fit), [db, user, profile, fit]);
  const brief = useMemo(() => briefing(db, user, profile, fit), [db, user, profile, fit]);
  const today = useMemo(() => industryToday(db, lines, mode), [db, lines, mode]);
  const orgs = useMemo(() => featuredOrganizations(db, user, profile, fit, initiallyFollowed, mode), [db, user, profile, fit, initiallyFollowed, mode]);
  const opps = useMemo(() => opportunitiesFor(db, user, profile, fit, 3), [db, user, profile, fit]);
  // Mentors claim mentor-capable people first; connection suggestions fill from everyone else.
  const mentorPicks = useMemo(
    () => (isOrg ? [] : mentorsFor(db, user, profile, new Set(), initiallyKnown, mode, mode === "aspiring" ? 3 : 2)),
    [db, user, profile, initiallyKnown, mode, isOrg],
  );
  const people = useMemo(
    () => peopleToMeet(db, user, new Set([...initiallyKnown, ...mentorPicks.map((m) => m.profile.userId)]), 3),
    [db, user, initiallyKnown, mentorPicks],
  );
  const posts = useMemo(() => conversationsFor(db, user, 2), [db, user]);
  const events = useMemo(() => upcomingEvents(db, user, lines, 3), [db, user, lines]);
  const guides = useMemo(() => careerGuides(db, lines), [db, lines]);
  const reading = useMemo(() => learningResources(db, lines), [db, lines]);

  const focus = lines.slice(0, 2).map((l) => lineName(l, true)).join(" & ");

  const orgCopy = isOrg
    ? { title: "Peers worth knowing", dek: "Organizations working in your lines. Follow them to keep up with their news, programs and openings." }
    : mode === "aspiring"
      ? { title: "Companies that train people like you", dek: "Organizations with real training, mentorship and licensing support — the places career changers tend to thrive." }
      : mode === "new"
        ? { title: "Organizations built for your first years", dek: `Training-first teams in ${focus || "your lines"}, several of them in the New Producer Portal.` }
        : { title: "Organizations worth discovering", dek: fit ? "Chosen from your Industry Fit answers — each with the reasons it surfaced." : `Chosen for your ${focus || "specialties"} focus and the companies you already follow.` };

  const oppCopy =
    mode === "aspiring"
      ? { title: "Roles open to people starting out", dek: "Positions that welcome career changers or offer licensing support." }
      : mode === "new"
        ? { title: "Roles that fit your first year", dek: "Training-forward roles matched to your license and preferences." }
        : { title: "Opportunities for you", dek: fit ? "Matched to your Industry Fit — every reason shown." : `Matched to your ${focus || "specialties"} focus — every reason shown.` };

  const authorName = (id: string) => db.users.find((u) => u.id === id)?.name ?? "A member";
  const stories = [today.cover, ...today.secondary].filter(Boolean).slice(0, 4) as NonNullable<typeof today.cover>[];

  return (
    <div className="mx-auto max-w-[1100px] space-y-20 pb-6 lg:space-y-24">
      <div className="space-y-10">
        <Masthead user={user} mode={mode} items={brief.slice(0, 3)} />
        {isOrg ? <OrgDesk db={db} user={user} /> : <ActivityLine db={db} user={user} />}
      </div>

      {mode === "aspiring" && profile && <LearningPath profile={profile} guides={guides} resources={reading} />}

      <CalmTabs
        label="For you"
        initial={isOrg ? "companies" : mode === "aspiring" ? "people" : "roles"}
        tabs={[
          ...(isOrg ? [] : [{ id: "roles" as const, label: "Roles", render: () => <OpportunitiesForYou bare picks={opps.slice(0, 3)} title={oppCopy.title} dek={oppCopy.dek} usesFit={!!fit} /> }]),
          { id: "companies" as const, label: "Companies", render: () => <FeaturedOrganizations bare items={orgs} title={orgCopy.title} dek={orgCopy.dek} /> },
          { id: "people" as const, label: "People", render: () => <PeopleToMeet bare suggestions={people} mentorPicks={mentorPicks} mentorsFirst={mode === "aspiring"} showMentors={!isOrg} /> },
        ]}
      />

      <TodayList stories={stories} posts={posts} authorName={authorName} nextEvent={events[0]} />

      <p className="border-t border-line pt-6 text-[12px] leading-relaxed text-ink-4">
        Every person, organization, article and listing here is fictional demo content. Recommendations are rule-based and explained; nothing here is sponsored.
      </p>
    </div>
  );
}
