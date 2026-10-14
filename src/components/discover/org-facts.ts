import type { Database, Organization } from "@/lib/data/types";
import { approvedOrganizations, type OrgCollection } from "@/lib/services/organizations";
import { stateName } from "@/lib/data/taxonomy";

/** Short, honest facts used on Discover cards, the profile fact strip and compare. */

export const FOOTPRINT_LABEL: Record<Organization["footprint"], string> = {
  local: "Local",
  regional: "Regional",
  multi_state: "Multi-state",
  national: "National",
};

export const FORMAT_LABEL: Record<Organization["trainingPrograms"][number]["format"], string> = {
  virtual: "Virtual",
  in_person: "In person",
  blended: "Blended",
  self_paced: "Self-paced",
};

export function isNationwide(o: Organization) {
  return o.statesServed.includes("ALL");
}

/** "Charlotte, NC · 5 states" / "Dallas, TX · Nationwide". */
export function placeLine(o: Organization) {
  return `${o.hqCity}, ${o.hqState} · ${isNationwide(o) ? "Nationwide" : `${o.statesServed.length} ${o.statesServed.length === 1 ? "state" : "states"}`}`;
}

export function footprintDetail(o: Organization) {
  if (isNationwide(o)) return "Nationwide";
  if (o.statesServed.length <= 4) return o.statesServed.map((s) => stateName(s)).join(", ");
  return `${o.statesServed.length} states`;
}

/** Compact employment model — W-2 and 1099 are always named distinctly. */
export function employmentShort(o: Organization) {
  const w2 = o.engagementTypes.includes("w2");
  const ic = o.engagementTypes.includes("independent_contractor");
  if (w2 && ic) return "W-2 & 1099";
  return w2 ? "W-2" : "1099";
}

export function employmentLong(o: Organization) {
  const w2 = o.engagementTypes.includes("w2");
  const ic = o.engagementTypes.includes("independent_contractor");
  if (w2 && ic) return "W-2 employment and 1099 affiliation";
  return w2 ? "W-2 employment" : "Independent contractor (1099)";
}

export const LEAD_SHORT: Record<Organization["leadProgram"]["policy"], string> = {
  provided: "Leads provided",
  available_at_cost: "Producer-paid leads",
  not_provided: "Build your own book",
};

/** Plain-language explanation of each lead policy (no claims beyond the policy itself). */
export const LEAD_PLAIN: Record<Organization["leadProgram"]["policy"], string> = {
  provided: "The organization says it supplies leads or referrals. Ask how they are assigned and whether any costs are passed on.",
  available_at_cost: "Leads are optional and paid for by the producer. Ask for pricing, minimums and refund terms in writing before you commit.",
  not_provided: "You build your own book of business. The organization lists the marketing and referral support it offers instead.",
};

export function trainingShort(o: Organization) {
  if (!o.trainingAvailable || !o.trainingPrograms.length) return "No formal program";
  return o.trainingPrograms.length === 1 ? "1 program" : `${o.trainingPrograms.length} programs`;
}

/** Related companies by shared specialties and type. Never influenced by plan or sponsorship. */
export function similarOrganizations(db: Database, org: Organization, limit = 3) {
  return approvedOrganizations(db)
    .filter((o) => o.id !== org.id)
    .map((o) => ({
      o,
      score: o.lines.filter((l) => org.lines.includes(l)).length * 2 + (o.category === org.category ? 3 : 0) + (o.engagementTypes.some((e) => org.engagementTypes.includes(e)) ? 1 : 0),
    }))
    .filter((x) => x.score > 1)
    .sort((a, b) => b.score - a.score || a.o.name.localeCompare(b.o.name))
    .slice(0, limit)
    .map((x) => x.o);
}

/** Maps each editorial collection to the closest equivalent directory search. */
export const COLLECTION_HREF: Record<string, string> = {
  "new-producers": "/organizations?training=1&mentorship=1",
  salaried: "/organizations?eng=w2&training=1",
  independent: "/organizations?eng=independent_contractor",
  specialty: "/organizations?lines=specialty,surplus-lines",
  financial: "/organizations?cat=ria,broker_dealer,bank_program",
  remote: "/organizations?arr=remote",
};

export function collectionHref(c: OrgCollection) {
  return COLLECTION_HREF[c.id] ?? "/organizations";
}
