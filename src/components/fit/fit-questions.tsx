"use client";

import { useEffect, useRef, type ComponentType } from "react";
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Briefcase,
  Building,
  Building2,
  CircleDashed,
  Compass,
  Crown,
  Gem,
  HeartHandshake,
  Inbox,
  Landmark,
  Laptop,
  MapPin,
  Receipt,
  Repeat,
  Shuffle,
  Sprout,
  Store,
  TrendingUp,
  Users,
  Wallet,
  type LucideProps,
} from "lucide-react";
import type { FitAmbition, FitEnvironment, FitLeads, FitModel, FitStage, FitTraining, LineSlug } from "@/lib/data/types";
import { LINES_BY_SECTOR, SECTOR_LABEL, US_STATES, stateName } from "@/lib/data/taxonomy";
import { LineIcon } from "@/components/ui/line-icon";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { cn } from "@/lib/utils/cn";
import { MultiTiles, SingleTiles, type TileOption } from "./choice-tiles";
import {
  AMBITION_CHOICES,
  ENVIRONMENT_CHOICES,
  LEADS_CHOICES,
  MODEL_CHOICES,
  STAGE_CHOICES,
  STEPS,
  TRAINING_CHOICES,
  stepComplete,
  type Choice,
  type Draft,
  type StepId,
} from "./model";

type Icon = ComponentType<LucideProps>;
const ICON = { className: "h-[18px] w-[18px]", strokeWidth: 1.75 };

const STAGE_ICONS: Record<FitStage, Icon> = { exploring: Compass, newly_licensed: Sprout, early: TrendingUp, established: Briefcase, leader: Crown };
const MODEL_ICONS: Record<FitModel, Icon> = { independent: Store, employed: Building2, career_agency: Landmark, open: Shuffle };
const TRAINING_ICONS: Record<FitTraining, Icon> = { structured: BookOpen, mentorship: Users, self_directed: Compass };
const LEADS_ICONS: Record<FitLeads, Icon> = { provided: Inbox, optional_paid: Receipt, own_book: Sprout };
const ENV_ICONS: Record<FitEnvironment, Icon> = { remote: Laptop, hybrid: Repeat, in_person: Building, any: CircleDashed };
const AMBITION_ICONS: Record<FitAmbition, Icon> = { own_practice: Store, specialist: Gem, lead_team: Users, stable_salary: Wallet, client_service: HeartHandshake };

function tiles<T extends string>(choices: Choice<T>[], icons: Record<T, Icon>): TileOption<T>[] {
  return choices.map((c) => {
    const I: Icon = icons[c.value];
    return { value: c.value, title: c.title, body: c.body, icon: <I {...ICON} /> };
  });
}

const SINGLE = {
  stage: tiles(STAGE_CHOICES, STAGE_ICONS),
  model: tiles(MODEL_CHOICES, MODEL_ICONS),
  training: tiles(TRAINING_CHOICES, TRAINING_ICONS),
  leads: tiles(LEADS_CHOICES, LEADS_ICONS),
  environment: tiles(ENVIRONMENT_CHOICES, ENV_ICONS),
} as const;
const AMBITION_TILES = tiles(AMBITION_CHOICES, AMBITION_ICONS);

const LINE_GROUPS = (Object.keys(LINES_BY_SECTOR) as (keyof typeof LINES_BY_SECTOR)[]).map((sector) => ({
  sector,
  label: SECTOR_LABEL[sector],
  options: LINES_BY_SECTOR[sector].map<TileOption<LineSlug>>((l) => ({ value: l.slug, title: l.name, body: l.summary, icon: <LineIcon line={l.slug} className="h-[17px] w-[17px]" /> })),
}));

export function ProgressSteps({ index, draft, onJump }: { index: number; draft: Draft; onJump: (i: number) => void }) {
  // A step is reachable when every required step before it is complete.
  const reachable = (i: number) => STEPS.slice(0, i).every((s) => stepComplete(s.id, draft));
  return (
    <nav aria-label="Questions" className="w-full">
      <ol className="flex gap-1.5">
        {STEPS.map((s, i) => {
          const done = i < index;
          const can = i !== index && reachable(i);
          return (
            <li key={s.id} className="min-w-0 flex-1">
              <button
                type="button"
                disabled={!can}
                onClick={() => onJump(i)}
                aria-current={i === index ? "step" : undefined}
                aria-label={`Question ${i + 1}: ${s.kicker}${i === index ? " (current)" : ""}`}
                className="group block w-full py-2 disabled:cursor-default"
              >
                <span className={cn("block h-[3px] rounded-full transition-colors duration-300", i === index ? "bg-ink" : done ? "bg-navy-400" : "bg-sunken group-enabled:group-hover:bg-line-strong")} />
                <span className={cn("mt-2 hidden truncate text-left text-[11px] uppercase tracking-[0.1em] lg:block", i === index ? "font-semibold text-ink" : can ? "text-ink-3 group-hover:text-ink" : "text-ink-4")}>{s.label}</span>
              </button>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function QuestionStep({
  index,
  direction,
  draft,
  setDraft,
  onBack,
  onNext,
  prefilled,
  suggestedStates,
}: {
  index: number;
  direction: 1 | -1;
  draft: Draft;
  setDraft: (fn: (d: Draft) => Draft) => void;
  onBack: () => void;
  onNext: () => void;
  prefilled: StepId[];
  suggestedStates: string[];
}) {
  const step = STEPS[index]!;
  const headingRef = useRef<HTMLHeadingElement>(null);
  const advanceTimer = useRef<number | undefined>(undefined);
  const complete = stepComplete(step.id, draft);
  const last = index === STEPS.length - 1;

  // Move focus to the question so screen readers announce it on every step.
  useEffect(() => {
    headingRef.current?.focus({ preventScroll: true });
    return () => window.clearTimeout(advanceTimer.current);
  }, [index]);

  const chooseSingle = (key: "stage" | "model" | "training" | "leads" | "environment") => (v: string, commit: boolean) => {
    setDraft((d) => ({ ...d, [key]: v }));
    if (commit) {
      window.clearTimeout(advanceTimer.current);
      advanceTimer.current = window.setTimeout(onNext, 280);
    }
  };

  // Keyboard: number keys choose, Enter continues.
  useEffect(() => {
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "SELECT" || t.tagName === "INPUT" || t.tagName === "TEXTAREA")) return;
      if (e.key === "Enter" && t?.tagName !== "BUTTON" && t?.tagName !== "A") {
        if (stepComplete(step.id, draft)) { e.preventDefault(); onNext(); }
        return;
      }
      const n = Number(e.key);
      if (!Number.isInteger(n) || n < 1) return;
      if (step.kind === "single") {
        const opt = SINGLE[step.id as keyof typeof SINGLE][n - 1];
        if (opt) chooseSingle(step.id as keyof typeof SINGLE)(opt.value, true);
      } else if (step.id === "ambitions") {
        const opt = AMBITION_TILES[n - 1];
        if (opt) setDraft((d) => ({ ...d, ambitions: d.ambitions.includes(opt.value) ? d.ambitions.filter((x) => x !== opt.value) : [...d.ambitions, opt.value] }));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  });

  const wasPrefilled = prefilled.includes(step.id);
  const chooseHint = step.kind === "single" ? `Press 1–${SINGLE[step.id as keyof typeof SINGLE].length} to choose` : step.id === "ambitions" ? "Press 1–5 to toggle" : null;
  const hint = [chooseHint, complete ? "Enter to continue" : null].filter(Boolean).join(" · ");

  return (
    <div className="flex flex-col">
      <div key={index} className={direction === 1 ? "animate-rise" : "animate-fade-in"}>
        <div className="mb-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          <span>
            <span className="tabular-nums">Question {index + 1} of {STEPS.length}</span>
            <span className="mx-2 text-ink-4">·</span>
            {step.kicker}
          </span>
          {step.optional && <span className="font-medium normal-case tracking-normal text-ink-4">Optional</span>}
          {wasPrefilled && <span className="rounded-full bg-gold-50 px-2 py-0.5 font-medium normal-case tracking-normal text-gold-ink">Prefilled from your profile</span>}
        </div>
        <h2 ref={headingRef} tabIndex={-1} className="font-display text-[30px] leading-[1.08] tracking-[-0.015em] text-ink outline-none sm:text-[42px]">
          {step.question}
        </h2>
        <p className="mt-3 max-w-[58ch] text-[15px] leading-relaxed text-ink-3">{step.helper}</p>

        <div className="mt-8">
          {step.kind === "single" && (
            <SingleTiles
              label={step.question}
              options={SINGLE[step.id as keyof typeof SINGLE] as TileOption<string>[]}
              value={draft[step.id as keyof typeof SINGLE]}
              onChoose={chooseSingle(step.id as keyof typeof SINGLE)}
            />
          )}

          {step.id === "lines" && (
            <div className="space-y-8">
              {LINE_GROUPS.map((g) => (
                <section key={g.sector} aria-label={g.label}>
                  <div className="mb-3 flex items-center gap-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
                    <span>{g.label}</span>
                    <span className="h-px flex-1 bg-line" aria-hidden />
                    <span className="font-medium normal-case tracking-normal text-ink-4 tabular-nums">{g.options.filter((o) => draft.lines.includes(o.value)).length} selected</span>
                  </div>
                  <MultiTiles compact label={`${g.label} specialties`} options={g.options} value={draft.lines.filter((l) => g.options.some((o) => o.value === l))} onChange={(v) => setDraft((d) => ({ ...d, lines: [...d.lines.filter((l) => !g.options.some((o) => o.value === l)), ...v] }))} />
                </section>
              ))}
            </div>
          )}

          {step.id === "ambitions" && (
            <MultiTiles label={step.question} options={AMBITION_TILES} value={draft.ambitions} onChange={(v) => setDraft((d) => ({ ...d, ambitions: v }))} />
          )}

          {step.id === "state" && <StatePicker value={draft.state} onChange={(s) => setDraft((d) => ({ ...d, state: s }))} suggested={suggestedStates} />}
        </div>
      </div>

      <div className="sticky bottom-0 z-10 -mx-4 mt-10 border-t border-line bg-canvas/92 px-4 py-3 backdrop-blur supports-[backdrop-filter]:bg-canvas/80 sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none">
        <div className="flex items-center justify-between gap-3 sm:border-t sm:border-line sm:pt-6">
          <Button variant="ghost" size="lg" onClick={onBack} className="px-3 sm:px-4">
            <ArrowLeft className="h-4 w-4" /> Back
          </Button>
          <div className="flex items-center gap-4">
            <span className="hidden text-[12.5px] text-ink-4 lg:inline">{hint}</span>
            {step.id === "lines" && !complete && <span className="text-[12.5px] text-ink-3" role="status">Choose at least one</span>}
            <Button variant={last ? "accent" : "primary"} size="lg" onClick={onNext} disabled={!complete} className="min-w-[132px]">
              {last ? "See my results" : step.optional && (step.id === "ambitions" ? draft.ambitions.length === 0 : !draft.state) ? "Skip" : "Continue"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatePicker({ value, onChange, suggested }: { value?: string; onChange: (s: string | undefined) => void; suggested: string[] }) {
  const quick = Array.from(new Set(suggested)).slice(0, 4);
  return (
    <div className="grid gap-6 lg:grid-cols-12">
      <div className="lg:col-span-7">
        <label htmlFor="fit-state" className="mb-2 block text-[13px] font-medium text-ink-2">State</label>
        <Select id="fit-state" value={value ?? ""} onChange={(e) => onChange(e.target.value || undefined)} className="h-14 rounded-xl text-[16px]">
          <option value="">No preference: show me everywhere</option>
          {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
        </Select>
        {quick.length > 0 && (
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[12.5px] text-ink-3">From your profile:</span>
            {quick.map((code) => (
              <button
                key={code}
                type="button"
                aria-pressed={value === code}
                onClick={() => onChange(value === code ? undefined : code)}
                className={cn("inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition", value === code ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4 hover:text-ink")}
              >
                <MapPin className="h-3.5 w-3.5" /> {stateName(code)}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="border-t border-line pt-5 text-[13.5px] leading-relaxed text-ink-3 lg:col-span-5 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
        <p>
          A state adds up to five points for organizations and roles active there, and a consideration where they aren&apos;t. Leave it blank and location
          won&apos;t affect your results.
        </p>
        <p className="mt-3 text-ink-4">Licenses are self-reported and are not verified by this tool. Confirm requirements with your state department of insurance.</p>
      </div>
    </div>
  );
}
