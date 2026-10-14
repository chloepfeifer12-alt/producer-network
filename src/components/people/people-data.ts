/**
 * People: presentation-only derivations on top of the service layer.
 *
 * Everything here starts from `directoryMembers()` / `viewProfile()` so the
 * privacy rules stay in one place. Aggregate counts (e.g. "14 members work in
 * Commercial") may include members-only profiles, but identities never leave
 * the visibility rules.
 */
import type { Article, Database, ExperienceLevel, LineSlug, ProducerProfile, User } from "@/lib/data/types";
import { lineName } from "@/lib/data/taxonomy";
import { directoryMembers } from "@/lib/services/privacy";
import { connectionsOf, mentors, mutualCount } from "@/lib/services/network";
import { articlesByDate } from "@/lib/services/insider";
import { hashString } from "@/lib/utils/format";
import type { CoverVariant } from "@/components/brand/cover-art";

export const peopleHref = (id: string) => `/people/${encodeURIComponent(id)}`;

export const firstName = (name: string) => name.split(" ")[0] ?? name;

export interface MemberEntry {
  profile: ProducerProfile;
  user: User;
  name: string;
  mutual: number;
  /** Specialties shared with the signed-in viewer (empty for visitors). */
  shared: LineSlug[];
  isSelf: boolean;
  /** Insider pieces that feature this member. */
  features: Article[];
}

/** Every member the viewer may see in the directory, enriched for display. */
export function memberEntries(db: Database, viewer: User | null): MemberEntry[] {
  const mine = viewer ? db.profiles.find((p) => p.userId === viewer.id) : undefined;
  const mySpecialties = new Set(mine?.specialties ?? []);
  const featured = featureIndex(db);
  return directoryMembers(db, viewer).flatMap((profile) => {
    const user = db.users.find((u) => u.id === profile.userId);
    if (!user) return [];
    const isSelf = viewer?.id === user.id;
    return [{
      profile,
      user,
      name: user.name,
      mutual: viewer && !isSelf ? mutualCount(db, viewer.id, user.id) : 0,
      shared: isSelf ? [] : profile.specialties.filter((s) => mySpecialties.has(s)),
      isSelf,
      features: featured.get(user.id) ?? [],
    }];
  });
}

function featureIndex(db: Database) {
  const map = new Map<string, Article[]>();
  for (const a of articlesByDate(db)) {
    if (!a.subjectUserId) continue;
    map.set(a.subjectUserId, [...(map.get(a.subjectUserId) ?? []), a]);
  }
  return map;
}

/** Insider pieces featuring a member, newest first. */
export function featuresOf(db: Database, userId: string) {
  return articlesByDate(db).filter((a) => a.subjectUserId === userId);
}

/** "Shares your Commercial focus" — the reason a member is surfaced. */
export function sharedReason(shared: LineSlug[]) {
  if (shared.length === 0) return undefined;
  if (shared.length === 1) return `Shares your ${lineName(shared[0]!, true)} focus`;
  return `Shares your ${lineName(shared[0]!, true)} and ${lineName(shared[1]!, true)} focus`;
}

/**
 * The single line that makes a portfolio card feel specific: an accomplishment,
 * an award, an Insider feature, a mentorship offer — in that order.
 */
export function highlightFor(entry: Pick<MemberEntry, "profile" | "features">): { label: string; text: string; detail?: string } | undefined {
  const p = entry.profile;
  const acc = p.accomplishments[0];
  if (acc) return { label: "Highlight", text: acc.title, detail: acc.description };
  const award = p.awards[0];
  if (award) return { label: "Recognition", text: award.title, detail: [award.issuer, award.year].filter(Boolean).join(" · ") };
  const feature = entry.features[0];
  if (feature) return { label: "In The Insider", text: feature.title, detail: feature.dek };
  if (p.mentor?.available) return { label: "Mentoring", text: p.mentor.note, detail: p.mentor.topics.join(" · ") };
  if (p.expertise.length) return { label: "Known for", text: p.expertise.slice(0, 3).join(", ") };
  return undefined;
}

/** Deterministic "editorial interest" score used to pick featured professionals. */
export function featureScore(e: MemberEntry) {
  const p = e.profile;
  return (
    e.features.length * 4 +
    p.accomplishments.length * 2 +
    p.awards.length * 2 +
    (p.mentor?.available ? 2 : 0) +
    Math.min(p.yearsInIndustry, 20) / 5 +
    (p.bio.length > 120 ? 1 : 0) +
    e.shared.length * 3 +
    Math.min(e.mutual, 3)
  );
}

export function featuredProfessionals(entries: MemberEntry[], limit = 3) {
  return entries
    .filter((e) => !e.isSelf && e.profile.experienceLevel !== "no_license")
    .sort((a, b) => featureScore(b) - featureScore(a) || a.name.localeCompare(b.name))
    .slice(0, limit);
}

/** Mentors the viewer may see (mentors() ∩ the viewer's directory). */
export function visibleMentors(db: Database, viewer: User | null) {
  const visible = new Set(directoryMembers(db, viewer).map((p) => p.userId));
  return mentors(db).filter((p) => visible.has(p.userId));
}

/** Aggregate, identity-free mentorship stats for visitors. */
export function mentorTopics(db: Database) {
  const all = mentors(db);
  const topics = Array.from(new Set(all.flatMap((m) => m.mentor?.topics ?? [])));
  return { count: all.length, topics };
}

/**
 * Every profile listed in the directory for members (active, opted in, not private).
 * Use ONLY for aggregate counts; identities must come from `directoryMembers()`.
 */
function listedProfiles(db: Database) {
  return db.profiles.filter((p) => {
    const u = db.users.find((x) => x.id === p.userId);
    return !!u && u.status === "active" && p.consent.showInDirectory && p.visibility !== "private";
  });
}

/** Count of listed profiles per specialty (aggregate; identities stay private). */
export function specialtyCounts(db: Database) {
  const counts = new Map<LineSlug, number>();
  for (const p of listedProfiles(db)) for (const s of p.specialties) counts.set(s, (counts.get(s) ?? 0) + 1);
  return counts;
}

/** Count of listed profiles per career stage (aggregate). */
export function stageCounts(db: Database) {
  const listed = listedProfiles(db);
  return new Map(STAGES.map((s) => [s.key, listed.filter((p) => s.levels.includes(p.experienceLevel)).length]));
}

export function listedCount(db: Database) {
  return listedProfiles(db).length;
}

/** Profiles a visitor can't see but members can — a count only. */
export function membersOnlyCount(db: Database) {
  return listedProfiles(db).filter((p) => p.visibility === "members").length;
}

export const STAGES: { key: string; label: string; dek: string; levels: ExperienceLevel[] }[] = [
  { key: "exploring", label: "Exploring & studying", dek: "Career changers and people preparing for licensing", levels: ["no_license"] },
  { key: "new", label: "Newly licensed", dek: "In their first year in the field", levels: ["newly_licensed"] },
  { key: "building", label: "Building a practice", dek: "One to seven years in", levels: ["early", "mid"] },
  { key: "seasoned", label: "Seasoned professionals", dek: "Seven years and more", levels: ["senior"] },
  { key: "leaders", label: "Leaders", dek: "Principals, trainers and recruiting leaders", levels: ["leadership"] },
];

export function connectionCount(db: Database, userId: string) {
  return connectionsOf(db, userId).length;
}

/** Mutual connections between viewer and member, as user records. */
export function mutualPeople(db: Database, a: string, b: string) {
  const setA = new Set(connectionsOf(db, a).map((x) => x.otherId));
  return connectionsOf(db, b)
    .filter((x) => setA.has(x.otherId))
    .map((x) => db.users.find((u) => u.id === x.otherId))
    .filter((u): u is User => !!u);
}

/* ---------------- Cover palette ---------------- */

const COVER_PALETTES: { hue: string; ground: string }[] = [
  { hue: "#1f3152", ground: "#e9ebef" },
  { hue: "#2c2f36", ground: "#ece9e2" },
  { hue: "#33403a", ground: "#e7e9e3" },
  { hue: "#3a3230", ground: "#eee8e1" },
  { hue: "#28394a", ground: "#e5e9ec" },
];
const COVER_VARIANTS: CoverVariant[] = ["contour", "arcs", "orbit", "stripes"];

/** A quiet, stable cover for a member — ink palette, never decorative. */
export function coverFor(userId: string) {
  const h = hashString(userId);
  return { variant: COVER_VARIANTS[h % COVER_VARIANTS.length]!, ...COVER_PALETTES[(h >> 3) % COVER_PALETTES.length]! };
}

export function yearsLabel(years: number) {
  if (years <= 0) return "New to the industry";
  return `${years} ${years === 1 ? "year" : "years"} in the industry`;
}
