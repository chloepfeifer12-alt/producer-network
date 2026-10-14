"use client";

import { useId, useMemo, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Check, ChevronDown, MapPin, PencilLine, RotateCcw, SlidersHorizontal, TriangleAlert, UserPlus } from "lucide-react";
import type { Opportunity, Organization, User } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { can } from "@/lib/auth/permissions";
import { industryFit, saveFitAnswers, type FitResult } from "@/lib/services/fit";
import { ARRANGEMENT_LABEL, ENGAGEMENT_LABEL, ORG_CATEGORY_LABEL, US_STATES, lineName, stateName } from "@/lib/data/taxonomy";
import { compensationLabel } from "@/lib/utils/format";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { Kicker } from "@/components/editorial";
import { CoverArt, variantFor } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { KindBadge } from "@/components/domain/badges";
import { SaveButton } from "@/components/domain/save-button";
import { CompensationDisclaimer } from "@/components/domain/disclaimers";
import { opportunityLocation } from "@/components/domain/opportunity-card";
import {
  AMBITION_CHOICES,
  ENVIRONMENT_CHOICES,
  LEADS_CHOICES,
  MODEL_CHOICES,
  STAGE_CHOICES,
  TRAINING_CHOICES,
  choiceFor,
  sameAnswers,
  summarize,
  type Answers,
  type Draft,
  type StepId,
} from "./model";

const TOP = 6;

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */

function Alignment({ r, size = "md" }: { r: FitResult<unknown>; size?: "md" | "lg" }) {
  const tone = r.label === "Strong alignment" ? "bg-navy" : r.label === "Good alignment" ? "bg-navy-400" : "bg-ink-4";
  return (
    <div className={size === "lg" ? "w-full" : "w-full sm:w-[168px]"}>
      <div className="flex items-baseline justify-between gap-3">
        <span className={cn("font-medium text-ink", size === "lg" ? "text-[13.5px]" : "text-[12.5px]")}>{r.label}</span>
        <span className="tabular-nums text-ink-3">
          <span className={cn("font-display text-ink", size === "lg" ? "text-[26px]" : "text-[19px]")}>{r.score}</span>
          <span className="text-[11px]">/100</span>
        </span>
      </div>
      <div
        className="mt-1.5 h-[5px] w-full overflow-hidden rounded-full bg-sunken"
        role="meter"
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={r.score}
        aria-label={`${r.score} out of 100: alignment with your stated preferences`}
      >
        <div className={cn("h-full rounded-full transition-[width] duration-500 ease-out", tone)} style={{ width: `${r.score}%` }} />
      </div>
      {size === "lg" && <p className="mt-1.5 text-[11.5px] text-ink-4">Alignment with your stated preferences, not a probability</p>}
    </div>
  );
}

function Reasons({ r, max = 3, maxCons = 2, className }: { r: FitResult<unknown>; max?: number; maxCons?: number; className?: string }) {
  const reasons = r.reasons.slice(0, max);
  const cons = r.considerations.slice(0, maxCons);
  return (
    <ul className={cn("space-y-1.5 text-[13.5px] leading-snug", className)}>
      {reasons.map((x) => (
        <li key={x.text} className="flex gap-2 text-ink-2">
          <Check className="mt-[2px] h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} aria-hidden />
          <span><span className="sr-only">Matches: </span>{x.text}</span>
        </li>
      ))}
      {cons.map((c) => (
        <li key={c} className="flex gap-2 text-ink-3">
          <TriangleAlert className="mt-[2px] h-3.5 w-3.5 shrink-0 text-warning" strokeWidth={2} aria-hidden />
          <span><span className="sr-only">Consider: </span>{c}</span>
        </li>
      ))}
    </ul>
  );
}

function orgPlace(o: Organization) {
  return `${o.hqCity}, ${o.hqState}`;
}

function OrgEngagement({ o }: { o: Organization }) {
  return <>{o.engagementTypes.map((e) => (e === "w2" ? "W-2" : "1099")).join(" · ")}</>;
}

/* ------------------------------------------------------------------ */
/* Organizations                                                       */
/* ------------------------------------------------------------------ */

function FeaturedOrg({ r }: { r: FitResult<Organization> }) {
  const o = r.item;
  return (
    <article className="group relative overflow-hidden rounded-2xl border border-line bg-surface shadow-card transition duration-200 hover:border-line-strong hover:shadow-lift">
      <div className="grid sm:grid-cols-5">
        <div className="relative h-40 overflow-hidden sm:col-span-2 sm:h-auto sm:min-h-[300px]">
          <CoverArt seed={o.id} variant={variantFor(o.id)} hue={o.brand.color} ground={o.brand.tint} className="transition-transform duration-500 group-hover:scale-[1.03]" />
          <span className="absolute left-4 top-4 rounded-full bg-surface/90 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink backdrop-blur">01 · Closest alignment</span>
        </div>
        <div className="flex flex-col p-5 sm:col-span-3 sm:p-7">
          <div className="flex items-start gap-3.5">
            <OrgLogo brand={o.brand} name={o.name} size={46} />
            <div className="min-w-0 flex-1">
              <h3 className="text-[19px] font-semibold leading-snug tracking-[-0.01em] text-ink">
                <Link href={`/organizations/${o.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none">{o.name}</Link>
              </h3>
              <p className="mt-0.5 text-[13px] text-ink-3">
                {ORG_CATEGORY_LABEL[o.category]} · {orgPlace(o)} · <OrgEngagement o={o} />
              </p>
            </div>
            <SaveButton targetId={o.id} type="organization" className="-mr-2 -mt-1" />
          </div>
          <p className="mt-4 line-clamp-2 text-[14px] leading-relaxed text-ink-2">{o.tagline}</p>
          <div className="mt-5"><Alignment r={r} size="lg" /></div>
          <Reasons r={r} max={4} maxCons={2} className="mt-5" />
          <div className="mt-auto flex items-center gap-1.5 pt-6 text-[13px] font-medium text-ink-2 group-hover:text-ink">
            View organization <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
          </div>
        </div>
      </div>
    </article>
  );
}

function OrgRow({ r, rank }: { r: FitResult<Organization>; rank: number }) {
  const o = r.item;
  return (
    <li className="group relative border-t border-line py-6 first:border-t-0">
      <div className="flex gap-4 sm:gap-5">
        <span className="hidden w-8 shrink-0 pt-1 font-display text-[22px] leading-none text-ink-4 tabular-nums sm:block">{String(rank).padStart(2, "0")}</span>
        <OrgLogo brand={o.brand} name={o.name} size={42} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-6">
            <div className="min-w-0">
              <h3 className="text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
                <Link href={`/organizations/${o.slug}`} className="after:absolute after:inset-0 focus-visible:outline-none group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">{o.name}</Link>
              </h3>
              <p className="mt-0.5 text-[13px] text-ink-3">
                {ORG_CATEGORY_LABEL[o.category]} · {orgPlace(o)} · <OrgEngagement o={o} />
              </p>
            </div>
            <Alignment r={r} />
          </div>
          <Reasons r={r} max={3} maxCons={2} className="mt-3.5 sm:columns-2 sm:gap-8 [&>li]:break-inside-avoid [&>li+li]:mt-1.5 sm:[&>li]:mt-0 sm:[&>li]:mb-1.5" />
        </div>
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Opportunities                                                       */
/* ------------------------------------------------------------------ */

function OppCard({ r, org }: { r: FitResult<Opportunity>; org?: Organization }) {
  const o = r.item;
  return (
    <article className="group relative flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift sm:p-6">
      <div className="flex items-start gap-3.5">
        {org && <OrgLogo brand={org.brand} name={org.name} size={40} />}
        <div className="min-w-0 flex-1">
          {org && <div className="truncate text-[12.5px] text-ink-3">{org.name}</div>}
          <h3 className="mt-0.5 text-[16px] font-semibold leading-snug tracking-[-0.01em] text-ink">
            <Link href={`/opportunities/${o.slug}`} className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">{o.title}</Link>
          </h3>
        </div>
        <SaveButton targetId={o.id} className="-mr-2 -mt-1" />
      </div>
      <div className="mt-3.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-[12.5px] text-ink-3">
        <KindBadge kind={o.kind} />
        <span>{ENGAGEMENT_LABEL[o.engagement]}</span>
        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{opportunityLocation(o)}</span>
        <span>{ARRANGEMENT_LABEL[o.arrangement]}</span>
      </div>
      <div className="mt-5"><Alignment r={r} size="lg" /></div>
      <Reasons r={r} max={3} maxCons={2} className="mt-4" />
      <div className="mt-auto pt-5">
        <div className="border-t border-line pt-3.5">
          <div className="text-[10.5px] uppercase tracking-[0.12em] text-ink-4">Compensation as disclosed</div>
          <div className="mt-0.5 text-[13.5px] font-medium text-ink">{compensationLabel(o.compensation)}</div>
        </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Tune panel: changes answers in place; results re-rank instantly     */
/* ------------------------------------------------------------------ */

function TuneSelect<T extends string>({ label, value, options, onChange }: { label: string; value: T | undefined; options: { value: T; title: string }[]; onChange: (v: T) => void }) {
  const id = useId();
  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-[12px] font-medium text-ink-3">{label}</label>
      <Select id={id} value={value ?? ""} onChange={(e) => onChange(e.target.value as T)} className="h-10 text-[14px]">
        {options.map((o) => <option key={o.value} value={o.value}>{o.title}</option>)}
      </Select>
    </div>
  );
}

function TunePanel({ draft, setDraft, onEdit }: { draft: Draft; setDraft: (fn: (d: Draft) => Draft) => void; onEdit: (s: StepId) => void }) {
  const stateId = useId();
  const set = <K extends keyof Draft>(k: K) => (v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));
  return (
    <div className="space-y-3.5">
      <div>
        <div className="mb-1.5 flex items-center justify-between">
          <span className="text-[12px] font-medium text-ink-3">Specialties</span>
          <button type="button" onClick={() => onEdit("lines")} className="inline-flex items-center gap-1 text-[11.5px] text-ink-4 hover:text-ink"><PencilLine className="h-3 w-3" /> Edit</button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {draft.lines.map((l) => <span key={l} className="rounded-full bg-subtle px-2.5 py-1 text-[12px] text-ink-2">{lineName(l, true)}</span>)}
        </div>
      </div>
      <TuneSelect label="Career stage" value={draft.stage} options={STAGE_CHOICES} onChange={set("stage")} />
      <TuneSelect label="Working model" value={draft.model} options={MODEL_CHOICES} onChange={set("model")} />
      <TuneSelect label="Training" value={draft.training} options={TRAINING_CHOICES} onChange={set("training")} />
      <TuneSelect label="Lead support" value={draft.leads} options={LEADS_CHOICES} onChange={set("leads")} />
      <TuneSelect label="Work environment" value={draft.environment} options={ENVIRONMENT_CHOICES} onChange={set("environment")} />
      <div>
        <span className="mb-1 block text-[12px] font-medium text-ink-3">Ambitions</span>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Ambitions">
          {AMBITION_CHOICES.map((c) => {
            const on = draft.ambitions.includes(c.value);
            return (
              <button
                key={c.value}
                type="button"
                aria-pressed={on}
                onClick={() => setDraft((d) => ({ ...d, ambitions: on ? d.ambitions.filter((x) => x !== c.value) : [...d.ambitions, c.value] }))}
                className={cn("inline-flex min-h-8 items-center gap-1 rounded-full border px-2.5 py-1 text-[12px] transition", on ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4")}
              >
                {on && <Check className="h-3 w-3" strokeWidth={2.5} />}
                {c.title}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <label htmlFor={stateId} className="mb-1 block text-[12px] font-medium text-ink-3">State</label>
        <Select id={stateId} value={draft.state ?? ""} onChange={(e) => set("state")(e.target.value || undefined)} className="h-10 text-[14px]">
          <option value="">Anywhere</option>
          {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
        </Select>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* How this works                                                      */
/* ------------------------------------------------------------------ */

const WEIGHTS: { factor: string; org: string; opp: string; how: string }[] = [
  { factor: "Specialties", org: "30", opp: "30", how: "Overlap between the lines you chose and the lines an organization or role lists." },
  { factor: "Working model", org: "20", opp: "20", how: "W-2 employment, independent (1099) affiliation or a carrier career-agency program, as disclosed." },
  { factor: "Training", org: "15", opp: "15", how: "Listed training programs or mentorship, matched to how you like to learn." },
  { factor: "Lead support", org: "15", opp: "15", how: "The disclosed lead policy: provided, available at the producer's cost, or not provided." },
  { factor: "Work environment", org: "10", opp: "10", how: "Remote, hybrid or in-person arrangements." },
  { factor: "Career stage", org: "10", opp: "10", how: "Whether open roles suit your stage (and New Producer Portal participation for new producers)." },
  { factor: "Ambitions", org: "up to 10*", opp: "5*", how: "*Only counted when you choose ambitions. Organizations: 5 per matching ambition. Roles: only if you chose a steady salary." },
  { factor: "State", org: "15", opp: "15", how: "Only counted when you name a state. Weighted heavily because location decides where you can work." },
];

function HowItWorks() {
  return (
    <details className="group border-y border-line">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">How this works</span>
          <span className="mt-1 block font-display text-[22px] leading-tight text-ink sm:text-[26px]">Every point, and the sentence it earns</span>
        </span>
        <ChevronDown className="h-5 w-5 shrink-0 text-ink-3 transition-transform duration-200 group-open:rotate-180" />
      </summary>
      <div className="grid gap-8 pb-8 lg:grid-cols-12">
        <div className="space-y-3 text-[14px] leading-relaxed text-ink-2 lg:col-span-5">
          <p>
            Your Industry Fit is <strong className="font-semibold text-ink">deterministic preference matching</strong>. Each factor below awards points when
            what an organization or role discloses lines up with your answer, and every point awarded appears as a ✓ reason. Gaps appear as considerations.
          </p>
          <p>
            The score is the share of points available for <em>your</em> answers, from 0 to 100. Strong alignment is 72 or above, good is 52 or above, and
            anything lower is partial. It describes alignment with your stated preferences. It is not a probability and not a prediction.
          </p>
          <p className="text-ink-3">
            No AI or machine learning decides anything; the same answers always produce the same ranking. It never uses protected characteristics, never
            verifies licenses, and is never an employment or hiring decision. Organizations can&apos;t pay to change their alignment; sponsored placements are
            not part of these results.
          </p>
        </div>
        <div className="lg:col-span-7">
          <table className="w-full text-left text-[13px]">
            <caption className="sr-only">Points available per factor</caption>
            <thead>
              <tr className="border-b border-line text-[11px] uppercase tracking-[0.1em] text-ink-4">
                <th scope="col" className="py-2 pr-3 font-medium">Factor</th>
                <th scope="col" className="w-[72px] py-2 pr-3 text-right font-medium">Orgs</th>
                <th scope="col" className="w-[64px] py-2 text-right font-medium">Roles</th>
              </tr>
            </thead>
            <tbody>
              {WEIGHTS.map((w) => (
                <tr key={w.factor} className="border-b border-line align-top last:border-b-0">
                  <th scope="row" className="py-3 pr-3 font-normal">
                    <span className="block font-medium text-ink">{w.factor}</span>
                    <span className="mt-0.5 block text-[12.5px] leading-snug text-ink-3">{w.how}</span>
                  </th>
                  <td className="py-3 pr-3 text-right font-display text-[17px] tabular-nums text-ink">{w.org}</td>
                  <td className="py-3 text-right font-display text-[17px] tabular-nums text-ink">{w.opp}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </details>
  );
}

/* ------------------------------------------------------------------ */
/* Results page                                                        */
/* ------------------------------------------------------------------ */

function AnswerChip({ label, value, onClick }: { label: string; value: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="group inline-flex min-h-9 items-center gap-1.5 rounded-full border border-line-strong bg-surface px-3 py-1.5 text-left text-[12.5px] transition hover:border-ink-4">
      <span className="text-ink-4">{label}</span>
      <span className="font-medium text-ink">{value}</span>
      <PencilLine className="h-3 w-3 text-ink-4 transition group-hover:text-ink" aria-hidden />
    </button>
  );
}

export function FitResults({
  answers,
  draft,
  setDraft,
  user,
  onEdit,
  onRestart,
}: {
  answers: Answers;
  draft: Draft;
  setDraft: (fn: (d: Draft) => Draft) => void;
  user: User | null;
  onEdit: (s: StepId) => void;
  onRestart: () => void;
}) {
  const db = useDb();
  const fit = useMemo(() => industryFit(db, answers), [db, answers]);
  const orgs = fit.organizations.slice(0, TOP);
  const opps = fit.opportunities.slice(0, TOP);
  const orgById = useMemo(() => new Map(db.organizations.map((o) => [o.id, o])), [db.organizations]);
  const summary = summarize(answers);

  const canSave = !!user && can(user, "member:edit_own_profile");
  const saved = user ? db.fitAnswers[user.id] : undefined;
  const isSaved = sameAnswers(answers, saved);

  const onSave = () => {
    const r = saveFitAnswers(user, answers);
    if (r.ok) toast(saved ? "Fit profile updated" : "Saved to your profile", { body: "The Network will use these answers to explain what it shows you." });
    else toast("Couldn't save", { body: r.error, tone: "error" });
  };

  const chips: { step: StepId; label: string; value: string }[] = [
    { step: "stage", label: "Stage", value: choiceFor(STAGE_CHOICES, answers.stage)!.title },
    { step: "lines", label: "Specialties", value: answers.lines.length > 2 ? `${lineName(answers.lines[0]!, true)} +${answers.lines.length - 1}` : answers.lines.map((l) => lineName(l, true)).join(", ") },
    { step: "model", label: "Model", value: choiceFor(MODEL_CHOICES, answers.model)!.title },
    { step: "training", label: "Training", value: choiceFor(TRAINING_CHOICES, answers.training)!.title },
    { step: "leads", label: "Leads", value: choiceFor(LEADS_CHOICES, answers.leads)!.title },
    { step: "environment", label: "Where", value: choiceFor(ENVIRONMENT_CHOICES, answers.environment)!.title },
    { step: "ambitions", label: "Ambitions", value: answers.ambitions.length ? `${answers.ambitions.length} chosen` : "None" },
    { step: "state", label: "State", value: answers.state ? stateName(answers.state) : "Anywhere" },
  ];

  const saveBlock = (
    <div>
      {canSave ? (
        isSaved ? (
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-success-50 text-success"><Check className="h-4 w-4" strokeWidth={2.5} /></span>
            <div>
              <div className="text-[14px] font-medium text-ink">Saved to your profile</div>
              <div className="text-[12.5px] text-ink-3" suppressHydrationWarning>{saved ? `Last updated ${formatDate(saved.updatedAt)}` : null}</div>
            </div>
          </div>
        ) : (
          <>
            <Button variant="accent" size="lg" onClick={onSave} className="w-full">{saved ? "Update my saved profile" : "Save to my profile"}</Button>
            <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-3">{saved ? "These answers differ from the ones you saved." : "Only you see your answers. Saving lets The Network explain its recommendations."}</p>
          </>
        )
      ) : user ? (
        <p className="text-[13px] leading-relaxed text-ink-3">Saving a fit profile is for member accounts. Switch to a producer persona to save.</p>
      ) : (
        <>
          <ButtonLink href="/join" variant="accent" size="lg" className="w-full"><UserPlus className="h-4 w-4" /> Join to save your results</ButtonLink>
          <p className="mt-2.5 text-[12.5px] leading-relaxed text-ink-3">Your results are yours to read either way. Nothing is stored unless you join and choose to save.</p>
        </>
      )}
    </div>
  );

  return (
    <div className="pb-20">
      {/* Masthead */}
      <header className="border-b border-line">
        <div className="mx-auto w-full max-w-7xl px-4 pb-10 pt-10 sm:px-6 sm:pt-14 lg:px-8">
          <Kicker className="mb-6">Your Industry Fit · Results</Kicker>
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="lg:col-span-8">
              <h1 className="font-display text-[40px] leading-[1.02] tracking-[-0.02em] text-ink sm:text-[58px]">Your fit profile</h1>
              <div className="mt-5 max-w-[60ch] space-y-2 font-display text-[20px] leading-[1.45] text-ink-2 sm:text-[23px]">
                {summary.map((s) => <p key={s}>{s}</p>)}
              </div>
              <div className="mt-7 flex flex-wrap gap-2" aria-label="Your answers. Select one to change it.">
                {chips.map((c) => <AnswerChip key={c.step} label={c.label} value={c.value} onClick={() => onEdit(c.step)} />)}
              </div>
            </div>
            <aside className="lg:col-span-4 lg:border-l lg:border-line lg:pl-8">
              {saveBlock}
              <div className="mt-5 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => onEdit("stage")}><SlidersHorizontal className="h-4 w-4" /> Adjust answers</Button>
                <Button variant="ghost" onClick={onRestart}><RotateCcw className="h-4 w-4" /> Start over</Button>
              </div>
              <p className="mt-6 border-t border-line pt-4 text-[12px] leading-relaxed text-ink-4">
                Deterministic matching on your answers only. Not an employment decision. Licenses are self-reported and not verified. All organizations and roles are fictional demo data.
              </p>
            </aside>
          </div>
        </div>
      </header>

      <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-x-12 lg:grid-cols-12">
          {/* Mobile / tablet tune panel */}
          <details className="group mt-6 rounded-2xl border border-line bg-surface lg:hidden">
            <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-3 px-5 text-[14px] font-medium text-ink [&::-webkit-details-marker]:hidden">
              <span className="inline-flex items-center gap-2"><SlidersHorizontal className="h-4 w-4 text-ink-3" /> Tune your answers</span>
              <span className="inline-flex items-center gap-2 text-[12px] font-normal text-ink-4">Results update instantly <ChevronDown className="h-4 w-4 transition-transform group-open:rotate-180" /></span>
            </summary>
            <div className="border-t border-line px-5 py-5"><TunePanel draft={draft} setDraft={setDraft} onEdit={onEdit} /></div>
          </details>

          <div className="min-w-0 lg:col-span-8">
            <p className="sr-only" aria-live="polite">
              {orgs[0] ? `Results updated. Closest organization: ${orgs[0].item.name}, ${orgs[0].label}.` : "No results."}
            </p>

            {/* Organizations */}
            <section aria-labelledby="fit-orgs" className="pt-12">
              <Kicker className="mb-4">Organizations · ranked by alignment</Kicker>
              <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
                <h2 id="fit-orgs" className="font-display text-[28px] leading-[1.08] tracking-[-0.015em] text-ink sm:text-[34px]">Where your preferences line up</h2>
                <Link href="/discover" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
                  Explore in Discover <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              {orgs.length === 0 ? (
                <EmptyState title="No organizations to compare yet" description="Approved organizations will appear here as they join." action={<ButtonLink href="/organizations" variant="secondary">Browse the directory</ButtonLink>} />
              ) : (
                <>
                  <FeaturedOrg r={orgs[0]!} />
                  <ol className="mt-4" start={2}>
                    {orgs.slice(1).map((r, i) => <OrgRow key={r.item.id} r={r} rank={i + 2} />)}
                  </ol>
                </>
              )}
            </section>

            {/* Opportunities */}
            <section aria-labelledby="fit-opps" className="pt-14">
              <Kicker className="mb-4">Opportunities · employment and contracting</Kicker>
              <div className="mb-7 flex flex-wrap items-end justify-between gap-3">
                <div className="max-w-2xl">
                  <h2 id="fit-opps" className="font-display text-[28px] leading-[1.08] tracking-[-0.015em] text-ink sm:text-[34px]">Roles worth a closer look</h2>
                  <p className="mt-2.5 text-[14.5px] leading-relaxed text-ink-3">W-2 jobs and 1099 affiliations are different arrangements; each card says which. Compensation is shown exactly as the organization disclosed it.</p>
                </div>
                <Link href="/opportunities" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
                  Browse all opportunities <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>
              {opps.length === 0 ? (
                <EmptyState title="No open opportunities right now" description="Published roles will be ranked here." action={<ButtonLink href="/opportunities" variant="secondary">Browse opportunities</ButtonLink>} />
              ) : (
                <div className="grid gap-4 md:grid-cols-2">
                  {opps.map((r) => <OppCard key={r.item.id} r={r} org={orgById.get(r.item.orgId)} />)}
                </div>
              )}
              <CompensationDisclaimer className="mt-6 max-w-[68ch]" />
            </section>

            <section className="pt-14" aria-label="How this works">
              <HowItWorks />
            </section>

            {/* Next steps */}
            <section aria-labelledby="fit-next" className="pt-14">
              <h2 id="fit-next" className="font-display text-[26px] leading-tight text-ink sm:text-[30px]">Keep exploring</h2>
              <ul className="mt-5 divide-y divide-line border-y border-line">
                {[
                  { href: "/discover", title: "Explore in Discover", body: "Curated collections of organizations, edited by theme." },
                  { href: "/opportunities", title: "Browse all opportunities", body: "Filter every open role by line, model, training and leads." },
                  { href: "/organizations/compare", title: "Compare organizations side by side", body: "Training, leads, compensation approach and arrangements in one view." },
                ].map((l) => (
                  <li key={l.href}>
                    <Link href={l.href} className="group flex items-center justify-between gap-4 py-4">
                      <span>
                        <span className="block text-[15px] font-medium text-ink">{l.title}</span>
                        <span className="mt-0.5 block text-[13px] text-ink-3">{l.body}</span>
                      </span>
                      <ArrowUpRight className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          </div>

          {/* Desktop tune rail */}
          <aside className="hidden lg:col-span-4 lg:block" aria-label="Tune your answers">
            <div className="sticky top-[84px] max-h-[calc(100vh-96px)] overflow-y-auto pb-6 pt-12 [scrollbar-width:thin]">
              <Kicker className="mb-4">Tune your answers</Kicker>
              <p className="mb-4 text-[13px] leading-relaxed text-ink-3">Change anything and the ranking updates instantly. Nothing is saved until you choose to.</p>
              <TunePanel draft={draft} setDraft={setDraft} onEdit={onEdit} />
              {canSave && !isSaved && (
                <div className="mt-6 border-t border-line pt-5">
                  <Button variant="secondary" className="w-full" onClick={onSave}>{saved ? "Update my saved profile" : "Save to my profile"}</Button>
                </div>
              )}
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}
