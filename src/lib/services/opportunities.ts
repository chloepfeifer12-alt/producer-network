import type {
  CareerCategory,
  Database,
  ExperienceLevel,
  LeadsPolicy,
  LineSlug,
  Opportunity,
  OpportunityKind,
  ProducerProfile,
  User,
  WorkArrangement,
  EngagementType,
} from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";
import { assertCan } from "@/lib/auth/permissions";
import { lineName } from "@/lib/data/taxonomy";
import { newId, slugify } from "@/lib/utils/ids";
import { nowISO } from "@/lib/utils/dates";
import { attempt, invariant } from "./result";
import { audit, findOrThrow, notifyAdmins } from "./_helpers";
import { screenOpportunity } from "./moderation-rules";

/* ================================================================== */
/* Queries                                                             */
/* ================================================================== */

export type CompFilter = "salary_based" | "commission_based";

export interface OpportunityFilters {
  q?: string;
  lines?: LineSlug[];
  state?: string;
  arrangement?: WorkArrangement[];
  kind?: OpportunityKind[];
  experience?: ExperienceLevel[];
  training?: boolean;
  leads?: LeadsPolicy[];
  comp?: CompFilter[];
  category?: CareerCategory[];
  orgId?: string;
  sort?: "relevance" | "newest";
}

const SALARY_MODELS = new Set(["salary", "salary_plus_incentive", "hourly"]);

export function isPublic(o: Opportunity, db: Database) {
  const org = db.organizations.find((x) => x.id === o.orgId);
  return o.status === "published" && org?.listingStatus === "approved";
}

export function publishedOpportunities(db: Database) {
  return db.opportunities.filter((o) => isPublic(o, db));
}

export function servesState(o: Opportunity, state: string) {
  return o.state === state || o.eligibleStates.includes(state) || o.eligibleStates.includes("ALL");
}

function textScore(db: Database, o: Opportunity, q: string): number {
  const terms = q.toLowerCase().split(/\s+/).filter(Boolean);
  if (!terms.length) return 1;
  const org = db.organizations.find((x) => x.id === o.orgId);
  const fields: [string, number][] = [
    [o.title, 4],
    [org?.name ?? "", 3],
    [o.lines.map((l) => lineName(l)).join(" "), 2],
    [o.city ?? "", 1],
    [o.summary, 1],
    [o.description, 0.5],
  ];
  let score = 0;
  for (const t of terms) {
    let matched = false;
    for (const [text, w] of fields) {
      if (text.toLowerCase().includes(t)) {
        score += w;
        matched = true;
      }
    }
    if (!matched) return 0; // every term must match something
  }
  return score;
}

export function searchOpportunities(db: Database, f: OpportunityFilters): Opportunity[] {
  const scored: { o: Opportunity; s: number }[] = [];
  for (const o of publishedOpportunities(db)) {
    if (f.orgId && o.orgId !== f.orgId) continue;
    if (f.lines?.length && !o.lines.some((l) => f.lines!.includes(l))) continue;
    if (f.state && !servesState(o, f.state)) continue;
    if (f.arrangement?.length && !f.arrangement.includes(o.arrangement)) continue;
    if (f.kind?.length && !f.kind.includes(o.kind)) continue;
    if (f.experience?.length && !f.experience.includes(o.experienceLevel)) continue;
    if (f.training && !o.trainingProvided) continue;
    if (f.leads?.length && !f.leads.includes(o.leads)) continue;
    if (f.category?.length && !f.category.includes(o.category)) continue;
    if (f.comp?.length) {
      const salaryBased = SALARY_MODELS.has(o.compensation.model);
      const ok = (f.comp.includes("salary_based") && salaryBased) || (f.comp.includes("commission_based") && !salaryBased);
      if (!ok) continue;
    }
    const s = f.q ? textScore(db, o, f.q) : 1;
    if (s <= 0) continue;
    scored.push({ o, s });
  }
  const byDate = (a: Opportunity, b: Opportunity) => (b.postedAt ?? "").localeCompare(a.postedAt ?? "");
  if (f.sort === "newest" || !f.q) return scored.map((x) => x.o).sort(byDate);
  return scored.sort((a, b) => b.s - a.s || byDate(a.o, b.o)).map((x) => x.o);
}

export function getOpportunityBySlug(db: Database, slug: string) {
  return db.opportunities.find((o) => o.slug === slug || o.id === slug);
}

export function relatedOpportunities(db: Database, o: Opportunity, limit = 3) {
  return publishedOpportunities(db)
    .filter((x) => x.id !== o.id)
    .map((x) => ({ x, s: x.lines.filter((l) => o.lines.includes(l)).length * 2 + (x.orgId === o.orgId ? 1 : 0) + (x.kind === o.kind ? 1 : 0) }))
    .filter((r) => r.s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, limit)
    .map((r) => r.x);
}

const EXP_ORDER: ExperienceLevel[] = ["no_license", "newly_licensed", "early", "mid", "senior", "leadership"];

/** Transparent, rule-based matching (no opaque ranking). Returns reasons for display. */
export function recommendForProfile(db: Database, p: ProducerProfile, limit = 4) {
  const applied = new Set(db.applications.filter((a) => a.applicantId === p.userId).map((a) => a.opportunityId));
  const licensedStates = new Set([p.state, ...p.licenses.map((l) => l.state)]);
  return publishedOpportunities(db)
    .filter((o) => !applied.has(o.id))
    .map((o) => {
      const reasons: string[] = [];
      let s = 0;
      const lineOverlap = o.lines.filter((l) => p.specialties.includes(l));
      if (lineOverlap.length) {
        s += lineOverlap.length * 3;
        reasons.push(`Matches ${lineName(lineOverlap[0]!, true)}`);
      }
      if (p.arrangementPrefs.includes(o.arrangement)) {
        s += 2;
        reasons.push(`${o.arrangement === "in_person" ? "In-person" : o.arrangement[0]!.toUpperCase() + o.arrangement.slice(1)} preference`);
      }
      if (p.engagementPrefs.includes(o.engagement)) s += 1;
      if ([...licensedStates].some((st) => servesState(o, st))) {
        s += 2;
        reasons.push("Open in your state");
      }
      const gap = Math.abs(EXP_ORDER.indexOf(o.experienceLevel) - EXP_ORDER.indexOf(p.experienceLevel));
      s += Math.max(0, 3 - gap);
      if (gap <= 1) reasons.push("Fits your experience");
      if (p.experienceLevel === "no_license" || p.experienceLevel === "newly_licensed") {
        if (o.trainingProvided) {
          s += 2;
          reasons.push("Training provided");
        }
      }
      return { opportunity: o, score: s, reasons: reasons.slice(0, 3) };
    })
    .filter((r) => r.score >= 5)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

export function opportunitiesForOrg(db: Database, orgId: string) {
  return db.opportunities.filter((o) => o.orgId === orgId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function isSaved(db: Database, userId: string | undefined, oppId: string) {
  return !!userId && db.savedOpportunities.some((s) => s.userId === userId && s.targetId === oppId);
}

/* ================================================================== */
/* Commands                                                            */
/* ================================================================== */

export function toggleSaveOpportunity(actor: User | null, oppId: string) {
  return attempt(() => {
    assertCan(actor, "member:save");
    let saved = false;
    commit((d) => {
      const i = d.savedOpportunities.findIndex((s) => s.userId === actor.id && s.targetId === oppId);
      if (i >= 0) d.savedOpportunities.splice(i, 1);
      else {
        d.savedOpportunities.unshift({ userId: actor.id, targetId: oppId, savedAt: nowISO() });
        saved = true;
      }
    });
    return saved;
  });
}

const viewed = new Set<string>();
/** Increments the demo view counter once per browser session per listing. */
export function recordOpportunityView(oppId: string) {
  if (viewed.has(oppId)) return;
  viewed.add(oppId);
  commit((d) => {
    const o = d.opportunities.find((x) => x.id === oppId);
    if (o && o.status === "published") o.views += 1;
  });
}

export type OpportunityInput = Omit<
  Opportunity,
  "id" | "slug" | "orgId" | "status" | "moderation" | "postedAt" | "createdAt" | "updatedAt" | "views" | "isDemo"
>;

export function emptyOpportunityInput(): OpportunityInput {
  return {
    title: "",
    kind: "employment",
    engagement: "w2",
    lines: [],
    category: "sales",
    arrangement: "hybrid",
    city: "",
    state: "",
    eligibleStates: [],
    experienceLevel: "early",
    licenseRequirement: "required",
    licensesNeeded: [],
    trainingProvided: true,
    trainingSummary: "",
    leads: "not_provided",
    leadsNotes: "",
    compensation: { model: "salary", disclosed: false, notes: "" },
    summary: "",
    description: "",
    responsibilities: [],
    requirements: [],
    support: [],
  };
}

export function validateOpportunityInput(input: OpportunityInput, forPublish: boolean) {
  invariant(input.title.trim().length >= 4, "Add a role title (at least 4 characters).");
  if (!forPublish) return;
  invariant(input.lines.length > 0, "Choose at least one insurance category.");
  invariant(input.state, "Choose a primary state (or Nationwide).");
  invariant(input.summary.trim().length >= 30, "Write a summary of at least 30 characters.");
  invariant(input.description.trim().length >= 60, "Write a description of at least 60 characters.");
  invariant(input.responsibilities.length > 0, "Add at least one responsibility.");
  invariant(input.requirements.length > 0, "Add at least one requirement.");
  invariant(input.compensation.notes.trim().length >= 15, "Describe the compensation approach (required for transparency).");
  if (input.compensation.disclosed) {
    invariant(input.compensation.min != null && input.compensation.min > 0, "Enter the disclosed compensation minimum.");
    invariant(input.compensation.max == null || input.compensation.max >= input.compensation.min!, "Maximum must be at least the minimum.");
  }
  invariant(
    ENGAGEMENT_FOR_KIND[input.kind].includes(input.engagement),
    input.kind === "contracting"
      ? "Affiliation / contracting opportunities must be independent contractor engagements."
      : "Employment opportunities must be W-2 engagements.",
  );
}

function uniqueSlug(d: Database, title: string, orgSlug: string) {
  const base = slugify(`${title} ${orgSlug.split("-")[0]}`);
  let slug = base;
  let i = 2;
  while (d.opportunities.some((o) => o.slug === slug)) slug = `${base}-${i++}`;
  return slug;
}

export function saveOpportunityDraft(actor: User | null, orgId: string, input: OpportunityInput, existingId?: string) {
  return attempt(() => {
    assertCan(actor, "org:manage_opportunities", orgId);
    validateOpportunityInput(input, false);
    let id = existingId ?? "";
    commit((d) => {
      const org = findOrThrow(d.organizations, orgId, "Organization");
      if (existingId) {
        const o = findOrThrow(d.opportunities, existingId, "Opportunity");
        invariant(o.orgId === orgId, "Opportunity belongs to another organization.");
        Object.assign(o, input, { updatedAt: nowISO() });
        if (o.status === "published") {
          // Edits to live listings are re-screened.
          const flags = screenOpportunity(o);
          if (flags.length) {
            o.status = "pending_review";
            o.moderation = { flags };
            notifyAdmins(d, "Edited listing needs review", `${o.title} was edited and flagged by the pre-screen.`, "/admin/opportunities");
          }
        }
        audit(d, actor, "opportunity.updated", "opportunity", o.id, o.title);
      } else {
        id = newId("opp");
        d.opportunities.unshift({
          ...input,
          id,
          slug: uniqueSlug(d, input.title, org.slug),
          orgId,
          status: "draft",
          createdAt: nowISO(),
          updatedAt: nowISO(),
          views: 0,
          isDemo: true,
        });
        audit(d, actor, "opportunity.draft_created", "opportunity", id, input.title);
      }
    });
    return id;
  });
}

export type PublishOutcome = { status: "published" } | { status: "pending_review"; reasons: string[] };

export function publishOpportunity(actor: User | null, oppId: string) {
  return attempt((): PublishOutcome => {
    let outcome: PublishOutcome = { status: "published" };
    commit((d) => {
      const o = findOrThrow(d.opportunities, oppId, "Opportunity");
      assertCan(actor, "org:manage_opportunities", o.orgId);
      validateOpportunityInput(o, true);
      const org = findOrThrow(d.organizations, o.orgId, "Organization");
      const plan = d.plans.find((p) => p.id === org.plan);
      const live = d.opportunities.filter((x) => x.orgId === org.id && x.status === "published" && x.id !== o.id).length;
      if (plan?.limits.activeOpportunities != null && live >= plan.limits.activeOpportunities) {
        throw new Error(`Your ${plan.name} plan allows ${plan.limits.activeOpportunities} active opportunities. Archive a listing or preview an upgrade in Billing.`);
      }
      const flags = screenOpportunity(o);
      const reasons: string[] = [];
      if (org.listingStatus !== "approved") reasons.push("Your organization profile is awaiting platform approval.");
      reasons.push(...flags.map((f) => f.label));
      o.updatedAt = nowISO();
      if (reasons.length) {
        o.status = "pending_review";
        o.moderation = { flags };
        outcome = { status: "pending_review", reasons };
        notifyAdmins(d, "Listing awaiting review", `${org.name}: ${o.title}`, "/admin/opportunities");
        audit(d, actor, "opportunity.submitted_for_review", "opportunity", o.id, reasons.join("; "));
      } else {
        o.status = "published";
        o.postedAt = nowISO();
        o.moderation = undefined;
        audit(d, actor, "opportunity.published", "opportunity", o.id, o.title);
      }
    });
    return outcome;
  });
}

export function archiveOpportunity(actor: User | null, oppId: string) {
  return attempt(() => {
    commit((d) => {
      const o = findOrThrow(d.opportunities, oppId, "Opportunity");
      assertCan(actor, "org:manage_opportunities", o.orgId);
      o.status = "archived";
      o.updatedAt = nowISO();
      audit(d, actor, "opportunity.archived", "opportunity", o.id, o.title);
    });
  });
}

export function restoreOpportunityToDraft(actor: User | null, oppId: string) {
  return attempt(() => {
    commit((d) => {
      const o = findOrThrow(d.opportunities, oppId, "Opportunity");
      assertCan(actor, "org:manage_opportunities", o.orgId);
      o.status = "draft";
      o.updatedAt = nowISO();
      audit(d, actor, "opportunity.restored", "opportunity", o.id, o.title);
    });
  });
}

export function duplicateOpportunity(actor: User | null, oppId: string) {
  return attempt(() => {
    let id = "";
    commit((d) => {
      const o = findOrThrow(d.opportunities, oppId, "Opportunity");
      assertCan(actor, "org:manage_opportunities", o.orgId);
      const org = findOrThrow(d.organizations, o.orgId, "Organization");
      id = newId("opp");
      d.opportunities.unshift({
        ...structuredClone(o),
        id,
        title: `${o.title} (copy)`,
        slug: uniqueSlug(d, `${o.title} copy`, org.slug),
        status: "draft",
        moderation: undefined,
        postedAt: undefined,
        createdAt: nowISO(),
        updatedAt: nowISO(),
        views: 0,
      });
      audit(d, actor, "opportunity.duplicated", "opportunity", id, o.title);
    });
    return id;
  });
}

export function inputFromOpportunity(o: Opportunity): OpportunityInput {
  const { id: _i, slug: _s, orgId: _o, status: _st, moderation: _m, postedAt: _p, createdAt: _c, updatedAt: _u, views: _v, isDemo: _d, ...rest } = o;
  return structuredClone(rest);
}

export const ENGAGEMENT_FOR_KIND: Record<OpportunityKind, EngagementType[]> = {
  employment: ["w2"],
  contracting: ["independent_contractor"],
};
