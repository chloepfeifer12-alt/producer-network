"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, BadgeCheck, Building2, Compass, EyeOff, Info, Lock } from "lucide-react";
import type { Availability, ExperienceLevel, LineSlug, Sector } from "@/lib/data/types";
import { AVAILABILITY_LABEL, EXPERIENCE_LABEL, LINES_BY_SECTOR, SECTOR_LABEL, US_STATES } from "@/lib/data/taxonomy";
import { createMemberAccount } from "@/lib/services/accounts";
import { useCurrentUser } from "@/lib/auth/session";
import { useHydrated } from "@/lib/store/db-store";
import { Container } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Checkbox, ChipGroup, Field, Input, Select, Switch } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { StepIndicator } from "@/components/marketing/step-indicator";
import { brand } from "@/config/brand";
import { cn } from "@/lib/utils/cn";

const STEPS = ["Your path", "Basics", "Interests", "Privacy & consent"];
const PRODUCER_LEVELS: ExperienceLevel[] = ["newly_licensed", "early", "mid", "senior", "leadership"];
const AVAILABILITY: Availability[] = ["actively_looking", "open", "not_looking"];

type Path = "producer" | "aspiring";
type Errors = Partial<Record<"path" | "name" | "headline" | "state" | "experience" | "years" | "specialties" | "terms" | "form", string>>;

export function MemberWizard() {
  const router = useRouter();
  const hydrated = useHydrated();
  const current = useCurrentUser();
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const [path, setPath] = useState<Path | null>(null);
  const [name, setName] = useState("");
  const [headline, setHeadline] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [experience, setExperience] = useState<ExperienceLevel | "">("");
  const [years, setYears] = useState("");
  const [specialties, setSpecialties] = useState<LineSlug[]>([]);
  const [availability, setAvailability] = useState<Availability>("open");
  const [showInDirectory, setShowInDirectory] = useState(true);
  const [recruiterContact, setRecruiterContact] = useState(false); // privacy by default
  const [accepted, setAccepted] = useState(false);

  const validate = (s: number): Errors => {
    const e: Errors = {};
    if (s === 0 && !path) e.path = "Choose the option that best describes you.";
    if (s === 1) {
      if (name.trim().length < 2) e.name = "Enter your full name.";
      if (headline.trim().length > 120) e.headline = "Keep your headline under 120 characters.";
      if (!state) e.state = "Choose your state.";
      if (path === "producer") {
        if (!experience) e.experience = "Choose your experience level.";
        const n = Number(years);
        if (years.trim() === "" || !Number.isFinite(n) || n < 0 || n > 60 || !Number.isInteger(n)) e.years = "Enter whole years in the industry (0–60).";
      }
    }
    if (s === 2 && specialties.length === 0) e.specialties = "Choose at least one category you’re interested in.";
    if (s === 3 && !accepted) e.terms = "Please acknowledge the placeholder terms and consent notice to continue.";
    return e;
  };

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
    scrollTop();
  };

  const back = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
    scrollTop();
  };

  const submit = () => {
    const e = validate(3);
    setErrors(e);
    if (Object.keys(e).length || !path) return;
    setSubmitting(true);
    const r = createMemberAccount({
      name,
      kind: path,
      headline: headline.trim() || (path === "aspiring" ? "Exploring a career in insurance" : "Insurance professional"),
      city,
      state,
      specialties,
      experienceLevel: path === "aspiring" ? "no_license" : (experience as ExperienceLevel),
      yearsInIndustry: path === "aspiring" ? 0 : Number(years),
      availability,
      recruiterContact,
      showInDirectory,
      acceptedTerms: accepted,
    });
    if (!r.ok) {
      setSubmitting(false);
      setErrors({ form: r.error });
      toast("Couldn’t create your profile", { body: r.error, tone: "error" });
      return;
    }
    toast(`Welcome to ${brand.name}`, { body: "Your demo profile is ready — add experience and licenses to complete it." });
    router.push("/me/profile");
  };

  return (
    <Container size="narrow" className="py-10 sm:py-16">
      <div ref={topRef} className="scroll-mt-24">
        <div className="eyebrow mb-3">Join the Network</div>
        <h1 className="font-display text-[36px] leading-[1.06] sm:text-[46px]">Create your member profile</h1>
        <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-ink-3">
          Free for insurance and financial professionals and anyone exploring the field. It takes about two minutes, and you control what’s visible.
          Already exploring?{" "}
          <Link href="/join?step=persona" className="font-medium text-navy-600 hover:text-navy">Use a demo persona instead</Link>.
        </p>
      </div>

      {hydrated && current && (
        <Notice tone="info" className="mt-6">
          You’re currently viewing as <span className="font-medium">{current.name}</span>. Creating a new profile will switch your demo session to the new account.
        </Notice>
      )}

      <StepIndicator steps={STEPS} current={step} className="mt-10" />

      <div className="mt-6 rounded-[22px] border border-line bg-surface shadow-card">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          {step === 0 && (
            <fieldset>
              <legend className="text-[18px] font-semibold tracking-[-0.01em] text-ink">Which best describes you?</legend>
              <p className="mt-1 text-sm text-ink-3">This shapes your profile and the opportunities we highlight. You can change it later.</p>
              <div role="radiogroup" aria-label="Your path" className="mt-6 grid gap-3">
                <PathOption
                  selected={path === "producer"}
                  onSelect={() => { setPath("producer"); setErrors({}); }}
                  icon={<BadgeCheck className="h-5 w-5" strokeWidth={1.75} />}
                  title="I’m a licensed insurance or financial professional"
                  body="You hold (or recently held) an insurance license or securities registration and want to grow your career, network or next role."
                />
                <PathOption
                  selected={path === "aspiring"}
                  onSelect={() => { setPath("aspiring"); setErrors({}); }}
                  icon={<Compass className="h-5 w-5" strokeWidth={1.75} />}
                  title="I’m exploring insurance or financial careers"
                  body="You’re considering the industry, studying for a license, or changing careers — no license needed."
                />
                <Link
                  href="/join/organization"
                  className="group flex items-start gap-4 rounded-2xl border border-dashed border-line-strong p-5 text-left transition hover:border-ink-4 hover:bg-subtle/50"
                >
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-ink-3 ring-1 ring-line"><Building2 className="h-5 w-5" strokeWidth={1.75} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[15px] font-semibold text-ink">I represent an organization</span>
                    <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-3">Agencies, IMOs, carriers, brokerages, MGAs, advisory firms, broker-dealers and bank programs apply separately.</span>
                  </span>
                  <ArrowRight className="mt-2.5 h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                </Link>
              </div>
              {errors.path && <p className="mt-3 text-xs text-danger" role="alert">{errors.path}</p>}
            </fieldset>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">The basics</h2>
              <p className="mt-1 text-sm text-ink-3">How you’ll appear to other members.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Full name" id="j-name" error={errors.name} className="sm:col-span-2">
                  <Input id="j-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" aria-invalid={!!errors.name} />
                </Field>
                <Field
                  label="Professional headline"
                  id="j-headline"
                  optional
                  error={errors.headline}
                  hint={path === "aspiring" ? "e.g. “Former teacher studying for my life & health license”" : "e.g. “Commercial lines producer · construction & contractors”"}
                  className="sm:col-span-2"
                >
                  <Input id="j-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} maxLength={140} aria-invalid={!!errors.headline} />
                </Field>
                <Field label="City" id="j-city" optional>
                  <Input id="j-city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
                </Field>
                <Field label="State" id="j-state" error={errors.state}>
                  <Select id="j-state" value={state} onChange={(e) => setState(e.target.value)} aria-invalid={!!errors.state}>
                    <option value="">Choose a state…</option>
                    {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </Select>
                </Field>
                {path === "producer" && (
                  <>
                    <Field label="Experience level" id="j-exp" error={errors.experience}>
                      <Select id="j-exp" value={experience} onChange={(e) => setExperience(e.target.value as ExperienceLevel)} aria-invalid={!!errors.experience}>
                        <option value="">Choose…</option>
                        {PRODUCER_LEVELS.map((l) => <option key={l} value={l}>{EXPERIENCE_LABEL[l]}</option>)}
                      </Select>
                    </Field>
                    <Field label="Years in the industry" id="j-years" error={errors.years}>
                      <Input id="j-years" inputMode="numeric" type="number" min={0} max={60} value={years} onChange={(e) => setYears(e.target.value)} aria-invalid={!!errors.years} />
                    </Field>
                  </>
                )}
              </div>
              {path === "producer" && (
                <p className="mt-5 flex gap-2 text-xs leading-relaxed text-ink-3">
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  You can add license details from your profile later. They’ll be labeled “Self-reported — Not verified,” because the platform does not verify licenses or registrations.
                </p>
              )}
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">{path === "aspiring" ? "What are you curious about?" : "Where do you focus?"}</h2>
              <p className="mt-1 text-sm text-ink-3">Choose any categories that interest you. These are browsing categories, not license types or registrations.</p>
              <div className="mt-6">
                <div className="space-y-6">
                  {(Object.keys(LINES_BY_SECTOR) as Sector[]).map((sec) => {
                    const group = LINES_BY_SECTOR[sec];
                    const slugs = new Set<LineSlug>(group.map((l) => l.slug));
                    return (
                      <div key={sec}>
                        <div className="mb-2.5 text-[12px] font-semibold uppercase tracking-[0.1em] text-ink-3">{SECTOR_LABEL[sec]}</div>
                        <ChipGroup
                          ariaLabel={`${SECTOR_LABEL[sec]} categories`}
                          options={group.map((l) => ({ value: l.slug, label: l.name }))}
                          value={specialties.filter((x) => slugs.has(x))}
                          onChange={(v) => {
                            const merged = [...specialties.filter((x) => !slugs.has(x)), ...v];
                            setSpecialties(merged);
                            if (merged.length) setErrors((x) => ({ ...x, specialties: undefined }));
                          }}
                        />
                      </div>
                    );
                  })}
                </div>
                {errors.specialties && <p className="mt-3 text-xs text-danger" role="alert">{errors.specialties}</p>}
              </div>
              <div className="mt-9 border-t border-line pt-7">
                <h3 className="text-[15px] font-semibold text-ink">Availability</h3>
                <p className="mt-1 text-sm text-ink-3">Shown on your profile. Change it any time.</p>
                <div role="radiogroup" aria-label="Availability" className="mt-4 grid gap-2 sm:grid-cols-3">
                  {AVAILABILITY.map((a) => (
                    <button
                      key={a}
                      type="button"
                      role="radio"
                      aria-checked={availability === a}
                      onClick={() => setAvailability(a)}
                      className={cn(
                        "rounded-xl border px-4 py-3 text-left text-[13.5px] transition",
                        availability === a ? "border-navy bg-navy-50 font-medium text-navy" : "border-line-strong text-ink-2 hover:border-ink-4",
                      )}
                    >
                      {AVAILABILITY_LABEL[a]}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">Privacy &amp; consent</h2>
              <p className="mt-1 text-sm text-ink-3">You’re in control. Every setting can be changed later from Privacy &amp; consent.</p>

              <div className="mt-6 flex gap-3 rounded-xl border border-navy-100 bg-navy-50 p-4 text-[13.5px] leading-relaxed text-navy-700">
                <Lock className="mt-0.5 h-4 w-4 shrink-0" />
                <span>Nothing about you is shared with organizations unless you apply to an opportunity or opt in to recruiter contact below.</span>
              </div>

              <div className="mt-6 divide-y divide-line rounded-xl border border-line">
                <div className="p-5">
                  <Switch
                    checked={showInDirectory}
                    onChange={setShowInDirectory}
                    label="Show me in the member directory"
                    description="Signed-in members can find your profile and send connection requests."
                  />
                </div>
                <div className="p-5">
                  <Switch
                    checked={recruiterContact}
                    onChange={setRecruiterContact}
                    label="Allow organizations to contact me"
                    description="Reviewed organizations may find you in talent discovery and send an introduction. Off by default."
                  />
                  {!recruiterContact && (
                    <p className="mt-3 flex items-center gap-1.5 text-xs text-ink-3"><EyeOff className="h-3.5 w-3.5" /> Organizations will only see you if you apply.</p>
                  )}
                </div>
              </div>

              <div className="mt-7">
                <Checkbox
                  id="j-terms"
                  checked={accepted}
                  onChange={(v) => { setAccepted(v); if (v) setErrors((x) => ({ ...x, terms: undefined })); }}
                  label={<>I acknowledge the placeholder <Link href="/legal/terms" target="_blank" className="font-medium text-navy-600 underline-offset-2 hover:underline">Terms of Service</Link> and <Link href="/legal/producer-consent" target="_blank" className="font-medium text-navy-600 underline-offset-2 hover:underline">Producer Consent</Link> notice.</>}
                  description="Prototype: these documents are placeholders pending legal review. Your profile is stored only in this browser."
                />
                {errors.terms && <p className="mt-2 text-xs text-danger" role="alert">{errors.terms}</p>}
              </div>
              {errors.form && <Notice tone="danger" className="mt-6">{errors.form}</Notice>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-subtle/50 px-5 py-4 sm:px-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={back} disabled={submitting}><ArrowLeft className="h-4 w-4" /> Back</Button>
          ) : (
            <span className="text-xs text-ink-4">Step 1 of {STEPS.length}</span>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={submit} disabled={submitting || !hydrated}>{submitting ? "Creating…" : "Create my profile"}</Button>
          )}
        </div>
      </div>
    </Container>
  );
}

function PathOption({ selected, onSelect, icon, title, body }: { selected: boolean; onSelect: () => void; icon: React.ReactNode; title: string; body: string }) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      onClick={onSelect}
      className={cn(
        "flex items-start gap-4 rounded-2xl border p-5 text-left transition",
        selected ? "border-navy bg-navy-50/60 ring-4 ring-navy-100" : "border-line-strong hover:border-ink-4 hover:bg-subtle/40",
      )}
    >
      <span className={cn("flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 transition", selected ? "bg-navy text-white ring-navy" : "bg-subtle text-navy ring-line")}>{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[15px] font-semibold text-ink">{title}</span>
        <span className="mt-1 block text-[13.5px] leading-relaxed text-ink-3">{body}</span>
      </span>
      <span className={cn("mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition", selected ? "border-navy" : "border-line-strong")} aria-hidden>
        {selected && <span className="h-2.5 w-2.5 rounded-full bg-navy" />}
      </span>
    </button>
  );
}
