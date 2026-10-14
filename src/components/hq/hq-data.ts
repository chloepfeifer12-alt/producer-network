/**
 * The Network (member HQ) — presentation-level derivations.
 *
 * Everything here is a pure, deterministic read of the local database. No
 * writes happen in this file: commands go through src/lib/services/*.
 * Every recommendation carries a human-readable "why" line.
 */
import type { Article, Database, EventItem, FitAnswers, LineSlug, Opportunity, Organization, Post, ProducerProfile, User } from "@/lib/data/types";
import { lineName, stateName } from "@/lib/data/taxonomy";
import { articlesByDate, coverStory } from "@/lib/services/insider";
import { approvedOrganizations, servesStateOrg } from "@/lib/services/organizations";
import { publishedOpportunities, recommendForProfile } from "@/lib/services/opportunities";
import { scoreOpportunity, scoreOrganization } from "@/lib/services/fit";
import { applicationsForApplicant, applicationsForOrg } from "@/lib/services/applications";
import { connectionsOf, connectionState, feedPosts, mentors, mutualCount, pendingIncoming } from "@/lib/services/network";
import { directoryMembers } from "@/lib/services/privacy";
import { introductionsForMember } from "@/lib/services/talent";
import { interestsForOrg } from "@/lib/services/portal";
import { DAY_MS, isFuture } from "@/lib/utils/dates";

export type HqMode = "experienced" | "new" | "aspiring" | "organization";

export function hqMode(user: User, profile: ProducerProfile | undefined): HqMode {
  if (user.kind === "organization") return "organization";
  if (user.kind === "aspiring" || profile?.experienceLevel === "no_license") return "aspiring";
  if (profile?.experienceLevel === "newly_licensed") return "new";
  return "experienced";
}

/** The lines this person cares about, in priority order: Fit answers → aspiring targets → specialties → org lines. */
export function focusLines(db: Database, user: User, profile: ProducerProfile | undefined, fit: FitAnswers | undefined): LineSlug[] {
  if (user.kind === "organization") return db.organizations.find((o) => o.id === user.orgId)?.lines ?? [];
  const out = new Set<LineSlug>([...(fit?.lines ?? []), ...(profile?.aspiring?.targetLines ?? []), ...(profile?.specialties ?? [])]);
  return [...out];
}

export function shortName(org: Organization) {
  return org.name.replace(/ (Insurance Partners|Financial Group|Benefits Collective|Specialty Brokerage|Underwriting Managers|Claims Services|Agency Alliance|Insurance|Field Marketing|Senior Benefits|Agency Partners)$/, "").replace(/ —.*$/, "");
}

function joinLines(lines: LineSlug[]) {
  const names = lines.slice(0, 2).map((l) => lineName(l, true));
  return names.length === 2 ? `${names[0]} & ${names[1]}` : names[0] ?? "";
}

const recent = (iso: string | undefined, days: number) => !!iso && Date.now() - new Date(iso).getTime() <= days * DAY_MS;

/* ------------------------------------------------------------------ */
/* Briefing                                                            */
/* ------------------------------------------------------------------ */

export interface BriefItem {
  id: string;
  text: string;
  href: string;
}

export function briefing(db: Database, user: User, profile: ProducerProfile | undefined, fit: FitAnswers | undefined): BriefItem[] {
  const items: BriefItem[] = [];
  const lines = focusLines(db, user, profile, fit);
  const myGroups = new Set(db.groups.filter((g) => g.memberIds.includes(user.id)).map((g) => g.id));
  const connections = new Set(connectionsOf(db, user.id).map((c) => c.otherId));

  if (user.kind === "organization" && user.orgId) {
    const fresh = applicationsForOrg(db, user.orgId).filter((a) => a.stage === "new");
    if (fresh.length) items.push({ id: "apps", text: `${fresh.length} new ${fresh.length === 1 ? "application" : "applications"} waiting in your workspace`, href: "/org/pipeline?stage=new" });
    const raised = interestsForOrg(db, user.orgId).filter((i) => i.status === "sent");
    if (raised.length) items.push({ id: "portal", text: `${raised.length} new producer${raised.length === 1 ? "" : "s"} raised a hand through the Portal`, href: "/org/portal" });
  } else {
    // New roles in the member's focus this week.
    const fresh = publishedOpportunities(db).filter((o) => recent(o.postedAt, 7) && o.lines.some((l) => lines.includes(l)));
    if (fresh.length && lines[0]) {
      const l = lines.find((x) => fresh.some((o) => o.lines.includes(x)))!;
      items.push({ id: "roles", text: `${fresh.length} new ${fresh.length === 1 ? "role matches" : "roles match"} your ${lineName(l, true)} focus`, href: "/opportunities" });
    }
    // Upcoming interview, or the latest movement on an application.
    const apps = applicationsForApplicant(db, user.id).filter((a) => !a.withdrawn && a.stage !== "closed");
    const interview = apps.find((a) => a.interview && isFuture(a.interview.at));
    const orgOf = (id: string) => db.organizations.find((o) => o.id === id);
    if (interview) {
      const days = Math.max(1, Math.round((new Date(interview.interview!.at).getTime() - Date.now()) / DAY_MS));
      const org = orgOf(interview.orgId);
      items.push({ id: "interview", text: `Your ${org ? shortName(org) : ""} interview is in ${days} day${days === 1 ? "" : "s"}`, href: `/me/applications/${interview.id}` });
    }
    const moved = apps
      .filter((a) => a.id !== interview?.id)
      .map((a) => ({ a, last: [...a.activity].reverse().find((x) => x.actorId !== user.id) }))
      .filter((x) => x.last && recent(x.last.at, 10))
      .sort((p, q) => q.last!.at.localeCompare(p.last!.at))[0];
    if (moved) {
      const org = orgOf(moved.a.orgId);
      const verb: Record<string, string> = {
        new: "received your application",
        under_review: "is reviewing your application",
        interview: "wants to interview you",
        offer: "shared an offer with you",
        hired: "marked your application hired",
      };
      items.push({ id: "moved", text: `${org ? shortName(org) : "An organization"} ${verb[moved.a.stage] ?? "updated your application"}`, href: `/me/applications/${moved.a.id}` });
    }
    const intro = introductionsForMember(db, user.id).find((i) => i.status === "sent");
    if (intro) {
      const org = orgOf(intro.orgId);
      items.push({ id: "intro", text: `${org ? shortName(org) : "An organization"} sent you an introduction`, href: "/me" });
    }
  }

  // Incoming connection request.
  const incoming = pendingIncoming(db, user.id);
  if (incoming[0]) {
    const from = db.users.find((u) => u.id === incoming[0]!.fromId);
    if (from) items.push({ id: "conn", text: incoming.length > 1 ? `${from.name} and ${incoming.length - 1} other${incoming.length > 2 ? "s" : ""} want to connect` : `${from.name} wants to connect`, href: "/network/connections" });
  }

  // A recent post from someone you know, or in one of your groups.
  const post = feedPosts(db).find((p) => p.authorId !== user.id && (connections.has(p.authorId) || (p.groupId && myGroups.has(p.groupId))) && recent(p.createdAt, 7));
  if (post) {
    const author = db.users.find((u) => u.id === post.authorId);
    const group = db.groups.find((g) => g.id === post.groupId);
    if (author) items.push({ id: "post", text: group ? `${author.name} posted in ${group.name}` : `${author.name} shared a new post`, href: "/network/conversations" });
  }

  // Your next event.
  const evt = db.events.filter((e) => e.attendees.includes(user.id) && isFuture(e.startsAt)).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  if (evt) {
    const days = Math.max(1, Math.round((new Date(evt.startsAt).getTime() - Date.now()) / DAY_MS));
    items.push({ id: "event", text: `${evt.title} is in ${days} day${days === 1 ? "" : "s"}`, href: "/network/events" });
  }

  return items.slice(0, 4);
}

/* ------------------------------------------------------------------ */
/* Editorial                                                           */
/* ------------------------------------------------------------------ */

export function industryToday(db: Database, lines: LineSlug[], mode: HqMode) {
  const cover = coverStory(db);
  const pool = articlesByDate(db).filter((a) => a.id !== cover?.id && a.section !== "spotlight");
  const boost = (a: Article) =>
    a.lines.filter((l) => lines.includes(l)).length * 2 +
    (mode === "aspiring" || mode === "new" ? (a.section === "career_guides" || a.section === "education" ? 3 : 0) : a.section === "insights" || a.section === "leadership" ? 1 : 0);
  const secondary = pool
    .map((a, i) => ({ a, s: boost(a) - i * 0.4 }))
    .sort((p, q) => q.s - p.s)
    .slice(0, 3)
    .map((x) => x.a);
  return { cover, secondary };
}

export function spotlight(db: Database): Article | undefined {
  return articlesByDate(db).find((a) => a.section === "spotlight") ?? articlesByDate(db).find((a) => a.section === "interviews");
}

export function careerGuides(db: Database, lines: LineSlug[]) {
  return articlesByDate(db)
    .filter((a) => a.section === "career_guides" || a.section === "education" || a.section === "emerging")
    .map((a) => ({ a, s: a.lines.filter((l) => lines.includes(l)).length + (a.section === "career_guides" ? 1 : 0) }))
    .sort((p, q) => q.s - p.s)
    .slice(0, 3)
    .map((x) => x.a);
}

export function learningResources(db: Database, lines: LineSlug[]) {
  return db.resources
    .filter((r) => r.audience === "aspiring" || r.audience === "new" || r.audience === "all")
    .map((r) => ({ r, s: (r.audience === "aspiring" ? 3 : r.audience === "new" ? 1 : 0) + r.lines.filter((l) => lines.includes(l)).length }))
    .sort((p, q) => q.s - p.s)
    .slice(0, 3)
    .map((x) => x.r);
}

/* ------------------------------------------------------------------ */
/* Organizations                                                       */
/* ------------------------------------------------------------------ */

export interface FeaturedOrg {
  org: Organization;
  why: string;
  fitLabel?: string;
}

export function featuredOrganizations(
  db: Database,
  user: User,
  profile: ProducerProfile | undefined,
  fit: FitAnswers | undefined,
  initiallyFollowed: Set<string>,
  mode: HqMode,
  limit = 3,
): FeaturedOrg[] {
  const lines = focusLines(db, user, profile, fit);
  const followed = approvedOrganizations(db).filter((o) => initiallyFollowed.has(o.id));
  const pool = approvedOrganizations(db).filter((o) => o.id !== user.orgId && !initiallyFollowed.has(o.id));

  if (fit) {
    return pool
      .map((o) => scoreOrganization(db, o, fit))
      .sort((a, b) => b.score - a.score || a.item.name.localeCompare(b.item.name))
      .slice(0, limit)
      .map((r) => ({ org: r.item, why: r.reasons.slice(0, 2).map((x) => x.text).join(" · "), fitLabel: r.label }));
  }

  const state = profile?.state;
  return pool
    .map((o) => {
      let s = 0;
      const why: string[] = [];
      const overlap = o.lines.filter((l) => lines.includes(l));
      if (overlap.length) {
        s += overlap.length * 3;
        why.push(user.kind === "organization" ? `Also works in ${joinLines(overlap)}` : `Works in ${joinLines(overlap)}, your focus`);
      }
      const twin = followed.find((f) => f.category === o.category || f.lines.filter((l) => o.lines.includes(l)).length >= 2);
      if (twin) {
        s += 2;
        why.unshift(`Similar to ${shortName(twin)}, which you follow`);
      }
      if ((mode === "aspiring" || mode === "new") && o.portal?.participating) {
        s += 4;
        why.push("Trains new producers through the Portal");
      }
      if (o.recruitingStatus === "actively_recruiting") s += 1;
      if (state && servesStateOrg(o, state)) {
        s += 1;
        if (why.length < 2) why.push(`Active in ${stateName(state)}`);
      }
      if (!why.length) why.push(o.tagline);
      return { org: o, s, why: why.slice(0, 2).join(" · ") };
    })
    .sort((a, b) => b.s - a.s || a.org.name.localeCompare(b.org.name))
    .slice(0, limit)
    .map(({ org, why }) => ({ org, why }));
}

/* ------------------------------------------------------------------ */
/* Opportunities                                                       */
/* ------------------------------------------------------------------ */

export interface OppPick {
  opportunity: Opportunity;
  org?: Organization;
  reasons: string[];
  fitLabel?: string;
}

export function opportunitiesFor(db: Database, user: User, profile: ProducerProfile | undefined, fit: FitAnswers | undefined, limit = 4): OppPick[] {
  if (user.kind === "organization" || !profile) return [];
  const orgOf = (id: string) => db.organizations.find((o) => o.id === id);
  if (fit) {
    const applied = new Set(applicationsForApplicant(db, user.id).map((a) => a.opportunityId));
    return publishedOpportunities(db)
      .filter((o) => !applied.has(o.id))
      .map((o) => scoreOpportunity(db, o, fit))
      .sort((a, b) => b.score - a.score || a.item.title.localeCompare(b.item.title))
      .slice(0, limit)
      .map((r) => ({ opportunity: r.item, org: orgOf(r.item.orgId), reasons: r.reasons.filter((x) => !x.text.startsWith("Training:")).slice(0, 3).map((x) => x.text), fitLabel: r.label }));
  }
  return recommendForProfile(db, profile, limit).map((r) => ({ opportunity: r.opportunity, org: orgOf(r.opportunity.orgId), reasons: r.reasons }));
}

/* ------------------------------------------------------------------ */
/* People                                                              */
/* ------------------------------------------------------------------ */

export interface PersonPick {
  profile: ProducerProfile;
  name: string;
  why: string;
}

export function peopleToMeet(db: Database, user: User, initiallyKnown: Set<string>, limit = 3): PersonPick[] {
  const mine = db.profiles.find((p) => p.userId === user.id);
  const myLines = mine?.specialties ?? db.organizations.find((o) => o.id === user.orgId)?.lines ?? [];
  return directoryMembers(db, user)
    .filter((p) => p.userId !== user.id && !initiallyKnown.has(p.userId))
    .map((p) => {
      const mutual = mutualCount(db, user.id, p.userId);
      const shared = p.specialties.filter((s) => myLines.includes(s));
      const why = mutual ? `${mutual} mutual connection${mutual === 1 ? "" : "s"}` : shared.length ? `Also in ${joinLines(shared)}` : p.city ? `${p.city}, ${p.state}` : "";
      return { p, mutual, overlap: shared.length, why };
    })
    .sort((a, b) => b.mutual - a.mutual || b.overlap - a.overlap || a.p.userId.localeCompare(b.p.userId))
    .slice(0, limit)
    .map((x) => ({ profile: x.p, name: db.users.find((u) => u.id === x.p.userId)?.name ?? "Member", why: x.why }));
}

export function mentorsFor(db: Database, user: User, profile: ProducerProfile | undefined, exclude: Set<string>, initiallyKnown: Set<string>, mode: HqMode, limit = 3): PersonPick[] {
  const lines = profile ? [...profile.specialties, ...(profile.aspiring?.targetLines ?? [])] : [];
  return mentors(db)
    .filter((m) => m.userId !== user.id && !exclude.has(m.userId))
    .map((m) => {
      let s = m.specialties.filter((l) => lines.includes(l)).length * 2;
      if (mode === "aspiring" && m.mentor!.topics.some((t) => /career changer/i.test(t))) s += 4;
      if (mode === "new" && m.mentor!.topics.some((t) => /first-year|newly/i.test(t + m.mentor!.note))) s += 3;
      if (initiallyKnown.has(m.userId)) s -= 20;
      return { m, s };
    })
    .sort((a, b) => b.s - a.s || a.m.userId.localeCompare(b.m.userId))
    .slice(0, limit)
    .map(({ m }) => ({ profile: m, name: db.users.find((u) => u.id === m.userId)?.name ?? "Member", why: m.mentor!.topics.slice(0, 2).join(" · ") }));
}

export function knownPeople(db: Database, userId: string) {
  return new Set(db.users.filter((u) => connectionState(db, userId, u.id) !== "none").map((u) => u.id));
}

/* ------------------------------------------------------------------ */
/* Conversations & community                                           */
/* ------------------------------------------------------------------ */

export function conversationsFor(db: Database, user: User, limit = 3): Post[] {
  const myGroups = new Set(db.groups.filter((g) => g.memberIds.includes(user.id)).map((g) => g.id));
  const connections = new Set(connectionsOf(db, user.id).map((c) => c.otherId));
  return feedPosts(db)
    .filter((p) => p.authorId !== user.id)
    .map((p, i) => ({ p, s: (p.groupId && myGroups.has(p.groupId) ? 3 : 0) + (connections.has(p.authorId) ? 2 : 0) + Math.min(3, p.likes.length / 2) - i * 0.6 }))
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((x) => x.p)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Posts plus comments in a group over the last two weeks. */
export function groupActivity(db: Database, groupId: string) {
  return db.posts
    .filter((p) => p.groupId === groupId && !p.hidden)
    .reduce((n, p) => n + (recent(p.createdAt, 14) ? 1 : 0) + p.comments.filter((c) => recent(c.createdAt, 14)).length, 0);
}

export function activeGroup(db: Database, user: User) {
  return db.groups
    .map((g) => ({ g, n: groupActivity(db, g.id), mine: g.memberIds.includes(user.id) }))
    .sort((a, b) => b.n - a.n || Number(b.mine) - Number(a.mine))[0];
}

export function upcomingEvents(db: Database, user: User, lines: LineSlug[], limit = 3): EventItem[] {
  return db.events
    .filter((e) => isFuture(e.startsAt))
    .map((e) => ({ e, s: e.lines.filter((l) => lines.includes(l)).length * 2 + (e.attendees.includes(user.id) ? 1 : 0) }))
    .sort((a, b) => b.s - a.s || a.e.startsAt.localeCompare(b.e.startsAt))
    .slice(0, limit)
    .map((x) => x.e)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
}

/* ------------------------------------------------------------------ */
/* Industry Fit labels (presentation only)                             */
/* ------------------------------------------------------------------ */

export const FIT_MODEL: Record<FitAnswers["model"], string> = {
  independent: "Independent (1099)",
  employed: "Employed (W-2)",
  career_agency: "Career agency",
  open: "Open to any model",
};
export const FIT_TRAINING: Record<FitAnswers["training"], string> = {
  structured: "structured training",
  mentorship: "mentorship-led growth",
  self_directed: "a self-directed path",
};
export const FIT_ENV: Record<FitAnswers["environment"], string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  in_person: "In person",
  any: "Any arrangement",
};
export const FIT_AMBITION: Record<FitAnswers["ambitions"][number], string> = {
  own_practice: "build my own practice",
  specialist: "become a specialist",
  lead_team: "lead a team",
  stable_salary: "a stable salary",
  client_service: "client service",
};

export function timeOfDay(d = new Date()) {
  const h = d.getHours();
  return h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening";
}
