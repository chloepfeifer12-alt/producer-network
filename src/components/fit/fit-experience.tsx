"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ArrowRight, Clock3, RotateCcw, X } from "lucide-react";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { getProfile } from "@/lib/services/profiles";
import { formatDate } from "@/lib/utils/dates";
import { Kicker } from "@/components/editorial";
import { CoverArt } from "@/components/brand/cover-art";
import { Button } from "@/components/ui/button";
import { ProgressSteps, QuestionStep } from "./fit-questions";
import { FitResults } from "./fit-results";
import { STEPS, draftFromProfile, fromAnswers, toAnswers, type Draft, type StepId } from "./model";

type Phase = "intro" | "questions" | "results";

function scrollTop() {
  if (typeof window !== "undefined") window.scrollTo({ top: 0, behavior: "instant" as ScrollBehavior });
}

export function FitExperience() {
  const db = useDb();
  const user = useCurrentUser();
  const profile = useMemo(() => getProfile(db, user?.id), [db, user?.id]);
  const saved = user ? db.fitAnswers[user.id] : undefined;
  const fresh = useMemo(() => draftFromProfile(profile), [profile]);

  const [phase, setPhase] = useState<Phase>("intro");
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [draft, setDraftState] = useState<Draft>(() => (saved ? fromAnswers(saved) : fresh.draft));
  const [prefilled, setPrefilled] = useState<StepId[]>(() => (saved ? [] : fresh.prefilled));

  // If the demo persona changes while on the page, start over for the new person.
  const [forUser, setForUser] = useState(user?.id);
  if (forUser !== user?.id) {
    setForUser(user?.id);
    setDraftState(saved ? fromAnswers(saved) : fresh.draft);
    setPrefilled(saved ? [] : fresh.prefilled);
    setPhase("intro");
    setStep(0);
  }

  const setDraft = useCallback((fn: (d: Draft) => Draft) => setDraftState((d) => fn(d)), []);
  const answers = useMemo(() => toAnswers(draft), [draft]);

  useEffect(scrollTop, [phase, step]);

  const go = (i: number) => {
    setDirection(i >= step ? 1 : -1);
    setStep(i);
    setPhase("questions");
  };

  const start = (d: Draft, pre: StepId[]) => {
    setDraftState(d);
    setPrefilled(pre);
    setDirection(1);
    setStep(0);
    setPhase("questions");
  };

  const next = () => {
    if (step < STEPS.length - 1) go(step + 1);
    else if (answers) setPhase("results");
  };
  const back = () => (step === 0 ? setPhase("intro") : go(step - 1));

  const edit = (s: StepId) => {
    setPrefilled([]);
    go(STEPS.findIndex((x) => x.id === s));
  };

  if (phase === "results" && answers) {
    return <FitResults answers={answers} draft={draft} setDraft={setDraft} user={user} onEdit={edit} onRestart={() => start(fresh.draft, fresh.prefilled)} />;
  }

  if (phase === "questions") {
    return (
      <div className="mx-auto w-full max-w-4xl px-4 pb-16 pt-6 sm:px-6 sm:pt-10 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-4">
          <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Your Industry Fit</span>
          <div className="flex items-center gap-1">
            {answers && (
              <Button variant="ghost" size="sm" onClick={() => setPhase("results")}>
                See results <ArrowRight className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setPhase("intro")} aria-label="Leave the questions">
              <X className="h-4 w-4" /> <span className="hidden sm:inline">Exit</span>
            </Button>
          </div>
        </div>
        <div className="mb-9 sm:mb-12">
          <ProgressSteps index={step} draft={draft} onJump={go} />
        </div>
        <QuestionStep
          index={step}
          direction={direction}
          draft={draft}
          setDraft={setDraft}
          onBack={back}
          onNext={next}
          prefilled={prefilled}
          suggestedStates={[...(profile?.state ? [profile.state] : []), ...(profile?.licenses.map((l) => l.state) ?? [])]}
        />
      </div>
    );
  }

  return (
    <Intro
      memberName={user && profile ? user.name.split(" ")[0]! : null}
      savedAt={saved?.updatedAt}
      hasPrefill={fresh.prefilled.length > 0}
      onStart={() => start(fresh.draft, fresh.prefilled)}
      onSeeSaved={() => {
        if (!saved) return;
        setDraftState(fromAnswers(saved));
        setPhase("results");
      }}
    />
  );
}

const USES = [
  "Your answers to eight questions, and nothing else about you.",
  "What organizations and listings disclose about themselves: lines, working models, training, leads and arrangements.",
  "A fixed table of points you can read in full alongside your results.",
];

const NEVER = [
  "No AI decides anything. The same answers always produce the same results.",
  "No protected characteristics: nothing about age, race, gender, religion, disability or anything like them.",
  "Not an employment decision. It suggests where to look; organizations make their own decisions.",
  "Licenses aren't verified. Anything about licensing is self-reported.",
];

function Intro({ memberName, savedAt, hasPrefill, onStart, onSeeSaved }: { memberName: string | null; savedAt?: string; hasPrefill: boolean; onStart: () => void; onSeeSaved: () => void }) {
  return (
    <div className="animate-fade-in">
      <section className="mx-auto w-full max-w-7xl px-4 pb-14 pt-10 sm:px-6 sm:pt-16 lg:px-8">
        <Kicker className="mb-8">Signature feature · Career discovery</Kicker>
        <div className="grid gap-12 lg:grid-cols-12 lg:gap-x-16 lg:gap-y-14">
          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-1">
            <h1 className="font-display text-[46px] leading-[0.98] tracking-[-0.025em] text-ink sm:text-[76px]">
              Your Industry Fit
            </h1>
            <p className="mt-6 max-w-[34ch] font-display text-[22px] leading-[1.35] text-ink-2 sm:text-[27px]">
              {memberName ? `${memberName}, eight` : "Eight"} short questions about how you want to work, and an honest map of where those preferences line up.
            </p>
            <p className="mt-5 max-w-[60ch] text-[15px] leading-relaxed text-ink-3">
              You&apos;ll see the organizations and opportunities that align most with your answers, each with the specific reasons it ranks where it does,
              and the considerations worth weighing.
            </p>

            <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-[13px] text-ink-3">
              <span className="inline-flex items-center gap-1.5"><Clock3 className="h-3.5 w-3.5" /> About 2 minutes</span>
              <span>8 questions, 2 optional</span>
              <span>Nothing is saved unless you choose</span>
            </div>

            {savedAt ? (
              <div className="mt-8">
                <p className="mb-4 text-[14px] text-ink-2" suppressHydrationWarning>
                  You saved a fit profile on {formatDate(savedAt)}.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button size="lg" variant="primary" onClick={onSeeSaved} className="w-full sm:w-auto">
                    See your results <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button size="lg" variant="secondary" onClick={onStart} className="w-full sm:w-auto">
                    <RotateCcw className="h-4 w-4" /> Retake
                  </Button>
                </div>
              </div>
            ) : (
              <div className="mt-8">
                <Button size="lg" variant="primary" onClick={onStart} className="w-full sm:w-auto">
                  Start <ArrowRight className="h-4 w-4" />
                </Button>
                {hasPrefill && <p className="mt-3 text-[12.5px] text-ink-3">We&apos;ll prefill your stage, specialties and state from your profile. Change anything.</p>}
              </div>
            )}

          </div>

          <aside className="lg:col-span-5 lg:col-start-8 lg:row-span-2 lg:row-start-1">
            <div className="relative aspect-[16/8] overflow-hidden rounded-2xl lg:aspect-[16/10]">
              <CoverArt seed="industry-fit" variant="orbit" hue="#1f3152" ground="#efebe2" />
            </div>
            <div className="mt-8">
              <div>
                <Kicker className="mb-4">What it uses</Kicker>
                <ul className="space-y-3 text-[14px] leading-relaxed text-ink-2">
                  {USES.map((t) => <li key={t} className="border-l border-line-strong pl-3.5">{t}</li>)}
                </ul>
              </div>
            </div>
          </aside>

          <div className="lg:col-span-7 lg:col-start-1 lg:row-start-2">
            <Kicker className="mb-5">What it doesn&apos;t do</Kicker>
            <ul className="grid gap-x-8 gap-y-4 text-[14px] leading-relaxed text-ink-2 sm:grid-cols-2">
              {NEVER.map((t) => <li key={t} className="border-l-2 border-navy pl-3.5">{t}</li>)}
            </ul>
          </div>
        </div>
      </section>

      <section className="border-t border-line bg-subtle/50">
        <div className="mx-auto w-full max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">The questions</div>
          <ol className="mt-6 grid grid-cols-2 gap-x-6 gap-y-6 sm:grid-cols-4">
            {STEPS.map((s, i) => (
              <li key={s.id} className="border-t border-line-strong pt-3">
                <span className="font-display text-[22px] leading-none text-ink-4 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
                <span className="mt-2 block text-[14px] font-medium text-ink">{s.kicker}{s.optional && <span className="ml-1.5 text-[12px] font-normal text-ink-4">Optional</span>}</span>
                <span className="mt-1 block text-[13px] leading-snug text-ink-3">{s.question}</span>
              </li>
            ))}
          </ol>
        </div>
      </section>
    </div>
  );
}
