"use client";

import { useMemo, useState } from "react";
import type { User } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { lineName } from "@/lib/data/taxonomy";
import { Masthead } from "./masthead";
import { IndustryToday } from "./industry-today";
import { FitPanel, MemberDesk, OrgDesk } from "./desk";
import { FeaturedOrganizations } from "./featured-orgs";
import { OpportunitiesForYou } from "./opportunities-for-you";
import { PeopleToMeet } from "./people-to-meet";
import { Conversations } from "./conversations";
import { Community } from "./community";
import { LearningPath } from "./learning-path";
import {
  activeGroup,
  briefing,
  careerGuides,
  conversationsFor,
  featuredOrganizations,
  focusLines,
  groupActivity,
  hqMode,
  industryToday,
  knownPeople,
  learningResources,
  mentorsFor,
  opportunitiesFor,
  peopleToMeet,
  spotlight,
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
  const [groupId] = useState(() => activeGroup(db, user)?.g.id);

  const lines = useMemo(() => focusLines(db, user, profile, fit), [db, user, profile, fit]);
  const brief = useMemo(() => briefing(db, user, profile, fit), [db, user, profile, fit]);
  const today = useMemo(() => industryToday(db, lines, mode), [db, lines, mode]);
  const orgs = useMemo(() => featuredOrganizations(db, user, profile, fit, initiallyFollowed, mode), [db, user, profile, fit, initiallyFollowed, mode]);
  const opps = useMemo(() => opportunitiesFor(db, user, profile, fit, 4), [db, user, profile, fit]);
  // Mentors claim mentor-capable people first; connection suggestions fill from everyone else.
  const mentorPicks = useMemo(
    () => (isOrg ? [] : mentorsFor(db, user, profile, new Set(), initiallyKnown, mode, mode === "aspiring" ? 3 : 2)),
    [db, user, profile, initiallyKnown, mode, isOrg],
  );
  const people = useMemo(
    () => peopleToMeet(db, user, new Set([...initiallyKnown, ...mentorPicks.map((m) => m.profile.userId)]), 3),
    [db, user, initiallyKnown, mentorPicks],
  );
  const posts = useMemo(() => conversationsFor(db, user, 3), [db, user]);
  const group = useMemo(() => {
    const g = db.groups.find((x) => x.id === groupId);
    if (!g) return undefined;
    return { g, n: groupActivity(db, g.id), mine: g.memberIds.includes(user.id) };
  }, [db, groupId, user.id]);
  const events = useMemo(() => upcomingEvents(db, user, lines, 3), [db, user, lines]);
  const spot = useMemo(() => spotlight(db), [db]);
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

  const rail = (
    <aside className="space-y-10 lg:col-span-4 lg:border-l lg:border-line lg:pl-10" aria-label={isOrg ? "Recruiting workspace" : "Your desk"}>
      {isOrg ? <OrgDesk db={db} user={user} /> : <FitPanel fit={fit} profile={profile} mode={mode} />}
      {!isOrg && <MemberDesk db={db} user={user} mode={mode} />}
    </aside>
  );

  const oppsBlock = !isOrg && <OpportunitiesForYou picks={opps} title={oppCopy.title} dek={oppCopy.dek} usesFit={!!fit} />;
  const peopleBlock = <PeopleToMeet suggestions={people} mentorPicks={mentorPicks} mentorsFirst={mode === "aspiring"} showMentors={!isOrg} />;

  return (
    <div className="space-y-16 pb-6 lg:space-y-24">
      <Masthead user={user} mode={mode} items={brief} />

      {mode === "aspiring" && profile && <LearningPath profile={profile} guides={guides} resources={reading} />}

      <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="lg:col-span-8">
          <IndustryToday cover={today.cover} secondary={today.secondary} />
        </div>
        {rail}
      </div>

      {isOrg ? (
        <>
          <Conversations db={db} posts={posts} group={group} />
          <FeaturedOrganizations items={orgs} title={orgCopy.title} dek={orgCopy.dek} />
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <Community article={spot} events={events} stacked />
            </div>
            <div className="lg:col-span-5">{peopleBlock}</div>
          </div>
        </>
      ) : (
        <>
          <div className="grid grid-cols-1 gap-14 lg:grid-cols-12 lg:gap-16">
            <div className="lg:col-span-7">{mode === "aspiring" ? peopleBlock : oppsBlock}</div>
            <div className="lg:col-span-5">{mode === "aspiring" ? oppsBlock : peopleBlock}</div>
          </div>
          <FeaturedOrganizations items={orgs} title={orgCopy.title} dek={orgCopy.dek} />
          <Conversations db={db} posts={posts} group={group} />
          <Community article={spot} events={events} />
        </>
      )}

      <p className="border-t border-line pt-6 text-[12px] leading-relaxed text-ink-4">
        Every person, organization, article and listing on the Network is fictional demo content. Recommendations are rule-based and explained; nothing here is sponsored.
      </p>
    </div>
  );
}
