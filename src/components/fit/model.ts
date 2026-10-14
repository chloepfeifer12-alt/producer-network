import type { ExperienceLevel, FitAmbition, FitAnswers, FitEnvironment, FitLeads, FitModel, FitStage, FitTraining, LineSlug, ProducerProfile } from "@/lib/data/types";
import { lineName, stateName } from "@/lib/data/taxonomy";

/** Answers without the persistence timestamp — what the engine scores. */
export type Answers = Omit<FitAnswers, "updatedAt">;

/** In-progress answers while the member works through the questions. */
export interface Draft {
  stage?: FitStage;
  lines: LineSlug[];
  model?: FitModel;
  training?: FitTraining;
  leads?: FitLeads;
  environment?: FitEnvironment;
  ambitions: FitAmbition[];
  state?: string;
}

export type StepId = "stage" | "lines" | "model" | "training" | "leads" | "environment" | "ambitions" | "state";

export interface Choice<T extends string> {
  value: T;
  title: string;
  body: string;
  /** Short label used in summaries and compact controls. */
  short: string;
}

export interface StepMeta {
  id: StepId;
  kicker: string;
  /** Compact label for the progress indicator. */
  label: string;
  question: string;
  helper: string;
  kind: "single" | "multi" | "lines" | "state";
  optional?: boolean;
}

export const STEPS: StepMeta[] = [
  { id: "stage", label: "Stage", kicker: "Career stage", question: "Where are you in your career?", helper: "This shapes which roles and programs are realistic next steps, not how you're judged.", kind: "single" },
  { id: "lines", label: "Specialties", kicker: "Specialties", question: "Which corners of the industry interest you?", helper: "Choose every line you work in or want to learn. At least one.", kind: "lines" },
  { id: "model", label: "Model", kicker: "Working model", question: "How would you like to be engaged?", helper: "Employment and independent contracting are different arrangements. We always keep them distinct.", kind: "single" },
  { id: "training", label: "Training", kicker: "Training", question: "How do you like to learn?", helper: "Organizations differ a lot in how much structure they offer.", kind: "single" },
  { id: "leads", label: "Leads", kicker: "Lead support", question: "How should new clients find you?", helper: "Lead programs vary: some are provided, some cost the producer money. We show what each organization discloses.", kind: "single" },
  { id: "environment", label: "Setting", kicker: "Work environment", question: "Where do you want to do the work?", helper: "Pick the arrangement you'd choose if everything else were equal.", kind: "single" },
  { id: "ambitions", label: "Ambitions", kicker: "Ambitions", question: "What are you building toward?", helper: "Choose any that ring true. It's fine to skip this one.", kind: "multi", optional: true },
  { id: "state", label: "Location", kicker: "Location", question: "Where are you licensed, or want to work?", helper: "Optional. One state narrows results to organizations and roles active there.", kind: "state", optional: true },
];

export const STAGE_CHOICES: Choice<FitStage>[] = [
  { value: "exploring", title: "Exploring the industry", body: "Not licensed yet. Learning what the work is really like.", short: "exploring the industry" },
  { value: "newly_licensed", title: "Newly licensed", body: "Licensed within the last year and looking for the right first home.", short: "newly licensed" },
  { value: "early", title: "Early career", body: "One to three years in, with the basics behind you.", short: "early in your career" },
  { value: "established", title: "Established", body: "Three or more years, with a track record or a book of business.", short: "established in the industry" },
  { value: "leader", title: "Leading others", body: "Running a team, an agency or a practice, or ready to.", short: "leading teams" },
];

export const MODEL_CHOICES: Choice<FitModel>[] = [
  { value: "independent", title: "Independent practice (1099)", body: "Contract with an agency, IMO or network and run your own business, usually on commission.", short: "independent (1099) affiliation" },
  { value: "employed", title: "W-2 employment", body: "Be an employee with a salary or hourly pay, a manager and employer benefits.", short: "W-2 employment" },
  { value: "career_agency", title: "Carrier career-agency program", body: "Join a carrier's structured development path, typically employment with a defined track.", short: "a carrier career-agency program" },
  { value: "open", title: "Open to either", body: "Show me both models side by side and let me compare the trade-offs.", short: "either employment or independent work" },
];

export const TRAINING_CHOICES: Choice<FitTraining>[] = [
  { value: "structured", title: "Structured training", body: "A formal program with curriculum, milestones and licensing support.", short: "structured training" },
  { value: "mentorship", title: "Mentorship", body: "A named person to learn alongside. Relationships over syllabi.", short: "mentorship" },
  { value: "self_directed", title: "Self-directed", body: "Give me room and good resources. I'll find my own way.", short: "room to learn on your own" },
];

export const LEADS_CHOICES: Choice<FitLeads>[] = [
  { value: "provided", title: "Leads or referrals provided", body: "The organization supplies prospects or warm introductions.", short: "leads provided" },
  { value: "optional_paid", title: "Optional, with clear costs", body: "I'm open to buying leads when the costs are disclosed up front.", short: "optional leads with disclosed costs" },
  { value: "own_book", title: "Build my own book", body: "I'd rather grow my own client relationships, with firm support.", short: "building your own book" },
];

export const ENVIRONMENT_CHOICES: Choice<FitEnvironment>[] = [
  { value: "remote", title: "Remote", body: "Work from home or anywhere you're licensed.", short: "remote work" },
  { value: "hybrid", title: "Hybrid", body: "A mix of office days and independent time.", short: "hybrid work" },
  { value: "in_person", title: "In person", body: "An office, a team around you and face-to-face clients.", short: "in-person work" },
  { value: "any", title: "No preference", body: "The arrangement matters less than the organization.", short: "any work arrangement" },
];

export const AMBITION_CHOICES: Choice<FitAmbition>[] = [
  { value: "own_practice", title: "Build my own practice", body: "Own the client relationships and, eventually, the business.", short: "build your own practice" },
  { value: "specialist", title: "Become a specialist", body: "Go deep in a niche: commercial, specialty or E&S.", short: "become a specialist" },
  { value: "lead_team", title: "Lead a team", body: "Develop people, recruit and manage.", short: "lead a team" },
  { value: "stable_salary", title: "A steady salary", body: "Predictable pay matters more than upside.", short: "earn a steady salary" },
  { value: "client_service", title: "Serve clients well", body: "Account management and long relationships over hunting.", short: "focus on client service" },
];

export function choiceFor<T extends string>(list: Choice<T>[], v: T | undefined) {
  return list.find((c) => c.value === v);
}

/** A step is complete when the engine has what it needs from it. */
export function stepComplete(id: StepId, d: Draft) {
  switch (id) {
    case "stage": return !!d.stage;
    case "lines": return d.lines.length > 0;
    case "model": return !!d.model;
    case "training": return !!d.training;
    case "leads": return !!d.leads;
    case "environment": return !!d.environment;
    case "ambitions":
    case "state": return true;
  }
}

export function toAnswers(d: Draft): Answers | null {
  if (!d.stage || !d.lines.length || !d.model || !d.training || !d.leads || !d.environment) return null;
  return { stage: d.stage, lines: d.lines, model: d.model, training: d.training, leads: d.leads, environment: d.environment, ambitions: d.ambitions, ...(d.state ? { state: d.state } : {}) };
}

export function fromAnswers(a: Answers | FitAnswers): Draft {
  return { stage: a.stage, lines: [...a.lines], model: a.model, training: a.training, leads: a.leads, environment: a.environment, ambitions: [...a.ambitions], state: a.state };
}

const STAGE_FROM_EXPERIENCE: Record<ExperienceLevel, FitStage> = {
  no_license: "exploring",
  newly_licensed: "newly_licensed",
  early: "early",
  mid: "established",
  senior: "established",
  leadership: "leader",
};

/** Prefill only what the member already told us on their profile. */
export function draftFromProfile(p: ProducerProfile | undefined): { draft: Draft; prefilled: StepId[] } {
  const draft: Draft = { lines: [], ambitions: [] };
  const prefilled: StepId[] = [];
  if (!p) return { draft, prefilled };
  if (p.experienceLevel) { draft.stage = STAGE_FROM_EXPERIENCE[p.experienceLevel]; prefilled.push("stage"); }
  if (p.specialties.length) { draft.lines = [...p.specialties]; prefilled.push("lines"); }
  if (p.state) { draft.state = p.state; prefilled.push("state"); }
  return { draft, prefilled };
}

/** Stable comparison of two answer sets (order-insensitive for lists). */
export function sameAnswers(a: Answers | null, b: Answers | FitAnswers | undefined) {
  if (!a || !b) return false;
  const norm = (x: Answers) => JSON.stringify([x.stage, [...x.lines].sort(), x.model, x.training, x.leads, x.environment, [...x.ambitions].sort(), x.state ?? ""]);
  return norm(a) === norm(b);
}

function list(items: string[]) {
  if (items.length <= 1) return items.join("");
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")} and ${items[items.length - 1]}`;
}

/** A plain-language sentence built only from the member's own answers. */
export function summarize(a: Answers): string[] {
  const stage = choiceFor(STAGE_CHOICES, a.stage)!.short;
  const lines = a.lines.length > 3 ? `${list(a.lines.slice(0, 3).map((l) => lineName(l, true)))} and ${a.lines.length - 3} more` : list(a.lines.map((l) => lineName(l, true)));
  const model = choiceFor(MODEL_CHOICES, a.model)!.short;
  const training = choiceFor(TRAINING_CHOICES, a.training)!.short;
  const leads = choiceFor(LEADS_CHOICES, a.leads)!.short;
  const env = choiceFor(ENVIRONMENT_CHOICES, a.environment)!.short;
  const where = a.state ? ` in ${stateName(a.state)}` : "";
  const sentences = [
    `You're ${stage}, drawn to ${lines}.`,
    `You're looking for ${model}, with ${training}, ${leads} and ${env}${where}.`,
  ];
  if (a.ambitions.length) sentences.push(`Over time, you want to ${list(a.ambitions.map((m) => choiceFor(AMBITION_CHOICES, m)!.short))}.`);
  return sentences;
}
