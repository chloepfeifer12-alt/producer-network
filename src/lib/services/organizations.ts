import type { Database, EngagementType, LineSlug, OrgCategory, Organization, RecruitingStatus, SponsoredSurface, User, WorkArrangement } from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";
import { assertCan } from "@/lib/auth/permissions";
import { nowISO } from "@/lib/utils/dates";
import { attempt, invariant } from "./result";
import { audit, findOrThrow } from "./_helpers";
import { publishedOpportunities } from "./opportunities";

export interface OrgFilters {
  q?: string;
  category?: OrgCategory[];
  lines?: LineSlug[];
  state?: string;
  arrangement?: WorkArrangement[];
  engagement?: EngagementType[];
  training?: boolean;
  mentorship?: boolean;
  recruiting?: RecruitingStatus[];
}

export function approvedOrganizations(db: Database) {
  return db.organizations.filter((o) => o.listingStatus === "approved");
}

export function servesStateOrg(o: Organization, state: string) {
  return o.hqState === state || o.statesServed.includes(state) || o.statesServed.includes("ALL");
}

/** Organic directory results — alphabetical, never influenced by plan or sponsorship. */
export function searchOrganizations(db: Database, f: OrgFilters): Organization[] {
  const q = f.q?.toLowerCase().trim();
  return approvedOrganizations(db)
    .filter((o) => {
      if (q && ![o.name, o.tagline, o.hqCity, o.about].some((t) => t.toLowerCase().includes(q))) return false;
      if (f.category?.length && !f.category.includes(o.category)) return false;
      if (f.lines?.length && !o.lines.some((l) => f.lines!.includes(l))) return false;
      if (f.state && !servesStateOrg(o, f.state)) return false;
      if (f.arrangement?.length && !o.arrangements.some((a) => f.arrangement!.includes(a))) return false;
      if (f.engagement?.length && !o.engagementTypes.some((e) => f.engagement!.includes(e))) return false;
      if (f.training && !o.trainingAvailable) return false;
      if (f.mentorship && !o.mentorship.available) return false;
      if (f.recruiting?.length && !f.recruiting.includes(o.recruitingStatus)) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function getOrganizationBySlug(db: Database, slug: string) {
  return db.organizations.find((o) => o.slug === slug || o.id === slug);
}

export function getOrganization(db: Database, id: string | undefined) {
  return id ? db.organizations.find((o) => o.id === id) : undefined;
}

export function orgOpenOpportunities(db: Database, orgId: string) {
  return publishedOpportunities(db).filter((o) => o.orgId === orgId);
}

/** Active sponsored placements for a surface (only approved orgs, only active window). */
export function activeSponsored(db: Database, surface: SponsoredSurface) {
  const now = nowISO();
  return db.sponsored
    .filter((s) => s.surface === surface && s.status === "active" && s.startsOn <= now && s.endsOn >= now)
    .map((s) => ({ placement: s, org: db.organizations.find((o) => o.id === s.orgId && o.listingStatus === "approved") }))
    .filter((x): x is { placement: typeof x.placement; org: Organization } => !!x.org);
}

export function isOrgSaved(db: Database, userId: string | undefined, orgId: string) {
  return !!userId && db.savedOrganizations.some((s) => s.userId === userId && s.targetId === orgId);
}

/* ---------------- Commands ---------------- */

export type OrgProfileInput = Pick<
  Organization,
  | "name" | "tagline" | "about" | "hqCity" | "hqState" | "footprint" | "statesServed" | "lines" | "arrangements" | "engagementTypes"
  | "teamSize" | "trainingAvailable" | "trainingPrograms" | "mentorship" | "leadProgram" | "compensationApproach" | "culture"
  | "leadership" | "recruitingStatus" | "recruitingContact" | "brand" | "founded"
>;

export function updateOrganizationProfile(actor: User | null, orgId: string, input: OrgProfileInput) {
  return attempt(() => {
    assertCan(actor, "org:edit_profile", orgId);
    invariant(input.name.trim().length >= 3, "Organization name is required.");
    invariant(input.tagline.trim().length >= 10, "Add a tagline of at least 10 characters.");
    invariant(input.about.trim().length >= 60, "The About section should be at least 60 characters.");
    invariant(input.lines.length > 0, "Choose at least one insurance category.");
    commit((d) => {
      const o = findOrThrow(d.organizations, orgId, "Organization");
      Object.assign(o, structuredClone(input), { updatedAt: nowISO() });
      audit(d, actor, "organization.profile_updated", "organization", orgId, "Public profile edited");
    });
  });
}

export function toggleSaveOrganization(actor: User | null, orgId: string) {
  return attempt(() => {
    assertCan(actor, "member:save");
    let saved = false;
    commit((d) => {
      const i = d.savedOrganizations.findIndex((s) => s.userId === actor.id && s.targetId === orgId);
      if (i >= 0) d.savedOrganizations.splice(i, 1);
      else {
        d.savedOrganizations.unshift({ userId: actor.id, targetId: orgId, savedAt: nowISO() });
        saved = true;
      }
    });
    return saved;
  });
}

const viewedOrgs = new Set<string>();
export function recordOrgView(orgId: string) {
  if (viewedOrgs.has(orgId)) return;
  viewedOrgs.add(orgId);
  commit((d) => {
    d.orgProfileViews[orgId] = (d.orgProfileViews[orgId] ?? 0) + 1;
  });
}

/* ---------------- Follow organizations ---------------- */

export function isFollowing(db: Database, userId: string | undefined, orgId: string) {
  return !!userId && db.follows.some((f) => f.userId === userId && f.targetId === orgId);
}

export function followerCount(db: Database, orgId: string) {
  return db.follows.filter((f) => f.targetId === orgId).length;
}

export function toggleFollowOrganization(actor: User | null, orgId: string) {
  return attempt(() => {
    assertCan(actor, "network:participate");
    let following = false;
    commit((d) => {
      const i = d.follows.findIndex((f) => f.userId === actor.id && f.targetId === orgId);
      if (i >= 0) d.follows.splice(i, 1);
      else {
        d.follows.unshift({ userId: actor.id, targetId: orgId, savedAt: nowISO() });
        following = true;
      }
    });
    return following;
  });
}

/** Editorial collections for Discover — derived from organization data, never from payment. */
export interface OrgCollection {
  id: string;
  title: string;
  dek: string;
  match: (o: Organization, db: Database) => boolean;
}

export const ORG_COLLECTIONS: OrgCollection[] = [
  {
    id: "new-producers",
    title: "Built for new producers",
    dek: "Structured training, mentorship and licensing support for people starting out.",
    match: (o) => !!o.portal?.participating && o.trainingAvailable && o.mentorship.available,
  },
  {
    id: "salaried",
    title: "Salaried development programs",
    dek: "W-2 roles with a training salary while you learn the business.",
    match: (o, db) => o.engagementTypes.includes("w2") && publishedOpportunities(db).some((x) => x.orgId === o.id && x.engagement === "w2" && (x.experienceLevel === "no_license" || x.experienceLevel === "newly_licensed")),
  },
  {
    id: "independent",
    title: "Independent & entrepreneurial",
    dek: "Affiliation models for producers who want to own their practice.",
    match: (o) => o.engagementTypes.includes("independent_contractor"),
  },
  {
    id: "specialty",
    title: "Specialty, wholesale & underwriting",
    dek: "Technical careers in E&S, programs and specialty markets.",
    match: (o) => o.lines.some((l) => l === "specialty" || l === "surplus-lines"),
  },
  {
    id: "financial",
    title: "Financial services firms",
    dek: "Planning, wealth and bank programs that value insurance expertise.",
    match: (o) => ["ria", "broker_dealer", "bank_program"].includes(o.category),
  },
  {
    id: "remote",
    title: "Remote-friendly",
    dek: "Organizations offering fully remote work arrangements.",
    match: (o) => o.arrangements.includes("remote"),
  },
];

export function collectionOrgs(db: Database, c: OrgCollection) {
  return approvedOrganizations(db).filter((o) => c.match(o, db));
}
