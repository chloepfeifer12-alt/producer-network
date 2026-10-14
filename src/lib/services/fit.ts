/**
 * Your Industry Fit — deterministic, explainable preference matching.
 *
 * Every point awarded corresponds to a sentence shown to the member. There is
 * no machine learning, no inference about the person, and no use of protected
 * characteristics. It ranks what to explore; it never makes or informs an
 * employment decision, and it does not verify licenses.
 */
import type { Database, FitAnswers, Opportunity, Organization, User } from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";
import { assertCan } from "@/lib/auth/permissions";
import { nowISO } from "@/lib/utils/dates";
import { ARRANGEMENT_LABEL, lineName, stateName } from "@/lib/data/taxonomy";
import { attempt, invariant } from "./result";
import { approvedOrganizations, servesStateOrg } from "./organizations";
import { publishedOpportunities, servesState } from "./opportunities";

export interface FitReason {
  text: string;
  points: number;
}

export interface FitResult<T> {
  item: T;
  score: number; // 0–100, share of the points available for these answers
  label: "Strong alignment" | "Good alignment" | "Partial alignment";
  reasons: FitReason[];
  considerations: string[];
}

function label(score: number): FitResult<unknown>["label"] {
  return score >= 72 ? "Strong alignment" : score >= 52 ? "Good alignment" : "Partial alignment";
}

const NEW_STAGES = new Set(["exploring", "newly_licensed"]);

function finish<T>(item: T, reasons: FitReason[], considerations: string[], max: number): FitResult<T> {
  const raw = reasons.reduce((s, r) => s + r.points, 0);
  const score = Math.max(0, Math.min(100, Math.round((raw / max) * 100)));
  return { item, score, label: label(score), reasons: reasons.sort((a, b) => b.points - a.points), considerations };
}

export function scoreOrganization(db: Database, o: Organization, a: Omit<FitAnswers, "updatedAt">): FitResult<Organization> {
  const reasons: FitReason[] = [];
  const cons: string[] = [];
  const opps = publishedOpportunities(db).filter((x) => x.orgId === o.id);
  let max = 0;

  // Specialties (30)
  max += 30;
  const overlap = o.lines.filter((l) => a.lines.includes(l));
  if (overlap.length) reasons.push({ text: `Works in ${overlap.slice(0, 2).map((l) => lineName(l)).join(" and ")}`, points: Math.min(30, 20 + overlap.length * 5) });
  else if (a.lines.length) cons.push("Doesn't focus on the specialties you selected");

  // Working model (20)
  max += 20;
  const ic = o.engagementTypes.includes("independent_contractor");
  const w2 = o.engagementTypes.includes("w2");
  if (a.model === "independent") ic ? reasons.push({ text: "Offers independent (1099) affiliation", points: 20 }) : cons.push("Hires W-2 employees rather than independent affiliates");
  if (a.model === "employed") w2 ? reasons.push({ text: "Offers W-2 employment", points: 20 }) : cons.push("Works with independent contractors, not employees");
  if (a.model === "career_agency") {
    if (o.category === "carrier_recruiting") reasons.push({ text: "Runs a carrier career-agency program", points: 20 });
    else if (w2 && o.trainingAvailable) { reasons.push({ text: "Structured W-2 development path", points: 10 }); cons.push("Not a carrier career-agency program"); }
    else cons.push("Not a career-agency program");
  }
  if (a.model === "open") reasons.push({ text: `Offers ${[w2 && "W-2", ic && "independent"].filter(Boolean).join(" and ")} paths`, points: 12 });

  // Training (15)
  max += 15;
  if (a.training === "structured") {
    if (o.trainingPrograms.length) reasons.push({ text: `Structured training: ${o.trainingPrograms[0]!.name}`, points: 15 });
    else cons.push("No formal training program listed");
  } else if (a.training === "mentorship") {
    if (o.mentorship.available) reasons.push({ text: "Mentorship available", points: 15 });
    else cons.push("No formal mentorship program");
  } else reasons.push({ text: "Suits a self-directed approach", points: o.trainingPrograms.length ? 8 : 12 });

  // Leads (15)
  max += 15;
  const lp = o.leadProgram.policy;
  if (a.leads === "provided") lp === "provided" ? reasons.push({ text: "Leads or referrals provided", points: 15 }) : cons.push(lp === "available_at_cost" ? "Leads are available at the producer's cost" : "You'd build your own book");
  if (a.leads === "optional_paid") lp !== "not_provided" ? reasons.push({ text: lp === "provided" ? "Leads provided" : "Optional leads with disclosed costs", points: 12 }) : reasons.push({ text: "Book-building support without lead purchases", points: 6 });
  if (a.leads === "own_book") lp === "not_provided" ? reasons.push({ text: "Build your own book with firm support", points: 15 }) : reasons.push({ text: "Lead programs are optional", points: 8 });

  // Environment (10)
  max += 10;
  if (a.environment === "any") reasons.push({ text: `Work arrangements: ${o.arrangements.map((x) => ARRANGEMENT_LABEL[x]).join(", ")}`, points: 6 });
  else if (o.arrangements.includes(a.environment)) reasons.push({ text: `${ARRANGEMENT_LABEL[a.environment]} work available`, points: 10 });
  else cons.push(`${ARRANGEMENT_LABEL[a.environment]} work isn't listed`);

  // Stage (10)
  max += 10;
  if (NEW_STAGES.has(a.stage)) {
    const newRoles = opps.some((x) => x.experienceLevel === "no_license" || x.experienceLevel === "newly_licensed" || x.licenseRequirement === "licensing_support_available");
    if (o.portal?.participating) reasons.push({ text: "Participates in the New Producer Portal", points: 10 });
    else if (newRoles) reasons.push({ text: "Has roles open to new producers", points: 8 });
    else cons.push("Open roles generally ask for experience");
  } else if (a.stage === "leader") {
    opps.some((x) => x.category === "leadership" || x.experienceLevel === "leadership") ? reasons.push({ text: "Has leadership roles open", points: 10 }) : reasons.push({ text: "Established organization", points: 4 });
  } else {
    opps.some((x) => ["early", "mid", "senior"].includes(x.experienceLevel)) ? reasons.push({ text: "Has roles for experienced professionals", points: 10 }) : cons.push("Open roles are mostly entry-level");
  }

  // Ambitions (up to 10)
  max += 10;
  let amb = 0;
  for (const m of a.ambitions) {
    if (m === "own_practice" && ic) { amb += 5; reasons.push({ text: "Supports building your own practice", points: 0 }); }
    if (m === "specialist" && o.lines.some((l) => ["specialty", "surplus-lines", "commercial"].includes(l))) { amb += 5; reasons.push({ text: "Room to specialize", points: 0 }); }
    if (m === "lead_team" && (o.lines.includes("agency-leadership") || opps.some((x) => x.category === "leadership"))) { amb += 5; reasons.push({ text: "Leadership path visible", points: 0 }); }
    if (m === "stable_salary" && w2) { amb += 5; reasons.push({ text: "Salaried roles available", points: 0 }); }
    if (m === "client_service" && opps.some((x) => x.category === "client_service" || x.category === "account_management")) { amb += 5; reasons.push({ text: "Client service & account roles", points: 0 }); }
  }
  if (amb) reasons.push({ text: "", points: Math.min(10, amb) });

  // State (5)
  if (a.state) {
    max += 5;
    servesStateOrg(o, a.state) ? reasons.push({ text: `Active in ${stateName(a.state)}`, points: 5 }) : cons.push(`Not active in ${stateName(a.state)}`);
  }

  const r = finish(o, reasons, cons, max);
  r.reasons = r.reasons.filter((x) => x.text);
  return r;
}

export function scoreOpportunity(db: Database, o: Opportunity, a: Omit<FitAnswers, "updatedAt">): FitResult<Opportunity> {
  const reasons: FitReason[] = [];
  const cons: string[] = [];
  let max = 0;

  max += 30;
  const overlap = o.lines.filter((l) => a.lines.includes(l));
  if (overlap.length) reasons.push({ text: `${lineName(overlap[0]!)} role`, points: Math.min(30, 22 + overlap.length * 4) });
  else if (a.lines.length) cons.push("Outside your selected specialties");

  max += 20;
  if (a.model === "independent") o.engagement === "independent_contractor" ? reasons.push({ text: "Independent affiliation (1099)", points: 20 }) : cons.push("W-2 employment, not independent");
  else if (a.model === "employed" || a.model === "career_agency") o.engagement === "w2" ? reasons.push({ text: "W-2 employment", points: 20 }) : cons.push("Independent contracting, not employment");
  else reasons.push({ text: o.engagement === "w2" ? "W-2 employment" : "Independent affiliation", points: 12 });

  max += 15;
  if (a.training !== "self_directed") o.trainingProvided ? reasons.push({ text: `Training: ${o.trainingSummary}`, points: 15 }) : cons.push("No training listed");
  else reasons.push({ text: "Suits a self-directed start", points: 10 });

  max += 15;
  if (a.leads === "provided") o.leads === "provided" ? reasons.push({ text: "Leads or referrals provided", points: 15 }) : cons.push(o.leads === "available_at_cost" ? "Leads at producer cost" : "Self-generated book");
  else if (a.leads === "own_book") reasons.push({ text: o.leads === "not_provided" ? "Build your own book" : "Leads optional", points: o.leads === "not_provided" ? 15 : 8 });
  else reasons.push({ text: o.leads === "available_at_cost" ? "Optional leads, costs disclosed" : "Lead approach fits", points: 10 });

  max += 10;
  if (a.environment === "any" || o.arrangement === a.environment) reasons.push({ text: `${ARRANGEMENT_LABEL[o.arrangement]} role`, points: 10 });
  else cons.push(`${ARRANGEMENT_LABEL[o.arrangement]}, not ${ARRANGEMENT_LABEL[a.environment as "remote"].toLowerCase()}`);

  max += 10;
  const stageFit: Record<FitAnswers["stage"], Opportunity["experienceLevel"][]> = {
    exploring: ["no_license"],
    newly_licensed: ["no_license", "newly_licensed"],
    early: ["newly_licensed", "early"],
    established: ["early", "mid", "senior"],
    leader: ["senior", "leadership"],
  };
  stageFit[a.stage].includes(o.experienceLevel) ? reasons.push({ text: "Matches your experience", points: 10 }) : cons.push("Asks for a different experience level");

  if (a.ambitions.includes("stable_salary")) {
    max += 5;
    ["salary", "salary_plus_incentive", "hourly"].includes(o.compensation.model) ? reasons.push({ text: "Salaried or hourly pay", points: 5 }) : cons.push("Commission-based pay");
  }

  if (a.state) {
    max += 5;
    servesState(o, a.state) ? reasons.push({ text: `Open in ${stateName(a.state)}`, points: 5 }) : cons.push(`Not open in ${stateName(a.state)}`);
  }

  return finish(o, reasons, cons, max);
}

export function industryFit(db: Database, a: Omit<FitAnswers, "updatedAt">) {
  const orgs = approvedOrganizations(db).map((o) => scoreOrganization(db, o, a)).sort((x, y) => y.score - x.score || x.item.name.localeCompare(y.item.name));
  const opps = publishedOpportunities(db).map((o) => scoreOpportunity(db, o, a)).sort((x, y) => y.score - x.score);
  return { organizations: orgs, opportunities: opps };
}

export function saveFitAnswers(actor: User | null, answers: Omit<FitAnswers, "updatedAt">) {
  return attempt(() => {
    assertCan(actor, "member:edit_own_profile");
    invariant(answers.lines.length > 0, "Choose at least one specialty.");
    commit((d) => {
      d.fitAnswers[actor.id] = { ...answers, updatedAt: nowISO() };
    });
  });
}
