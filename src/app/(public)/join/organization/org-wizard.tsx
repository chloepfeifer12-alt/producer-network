"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowRight, ClipboardCheck, FlaskConical } from "lucide-react";
import type { LineSlug, OrgCategory, Sector } from "@/lib/data/types";
import { LINES_BY_SECTOR, ORG_CATEGORY_DESCRIPTION, ORG_CATEGORY_LABEL, SECTOR_LABEL, US_STATES } from "@/lib/data/taxonomy";
import { createOrganizationAccount } from "@/lib/services/accounts";
import { useCurrentUser } from "@/lib/auth/session";
import { useHydrated } from "@/lib/store/db-store";
import { Container } from "@/components/ui/page";
import { Button } from "@/components/ui/button";
import { Checkbox, ChipGroup, Field, Input, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { StepIndicator } from "@/components/marketing/step-indicator";
import { cn } from "@/lib/utils/cn";

const STEPS = ["Contact", "Organization", "Presence", "Standards"];
const CATEGORIES = Object.keys(ORG_CATEGORY_LABEL) as OrgCategory[];

type Key = "ownerName" | "orgName" | "category" | "hqState" | "lines" | "tagline" | "about" | "standards" | "form";
type Errors = Partial<Record<Key, string>>;

const STANDARDS = [
  { key: "income", label: "No unsubstantiated income claims", description: "We won’t publish earnings guarantees, projections, or top-producer results presented as typical." },
  { key: "costs", label: "Disclose producer costs", description: "Any cost a producer bears — leads, E&O, technology, licensing, marketing or fees — will be stated in the listing." },
  { key: "classification", label: "Classify roles accurately", description: "Each opportunity will be correctly labeled as W-2 employment or independent-contractor affiliation." },
] as const;

type StandardKey = (typeof STANDARDS)[number]["key"];

export function OrgWizard() {
  const router = useRouter();
  const hydrated = useHydrated();
  const current = useCurrentUser();
  const topRef = useRef<HTMLDivElement>(null);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Errors>({});
  const [submitting, setSubmitting] = useState(false);

  const [ownerName, setOwnerName] = useState("");
  const [ownerTitle, setOwnerTitle] = useState("");
  const [orgName, setOrgName] = useState("");
  const [category, setCategory] = useState<OrgCategory | "">("");
  const [hqCity, setHqCity] = useState("");
  const [hqState, setHqState] = useState("");
  const [lines, setLines] = useState<LineSlug[]>([]);
  const [tagline, setTagline] = useState("");
  const [about, setAbout] = useState("");
  const [ack, setAck] = useState<Record<StandardKey | "terms", boolean>>({ income: false, costs: false, classification: false, terms: false });

  const clear = (k: Key) => setErrors((x) => (x[k] ? { ...x, [k]: undefined } : x));

  const validate = (s: number): Errors => {
    const e: Errors = {};
    if (s === 0 && ownerName.trim().length < 2) e.ownerName = "Enter your name.";
    if (s === 1) {
      if (orgName.trim().length < 3) e.orgName = "Enter the organization name (at least 3 characters).";
      if (!category) e.category = "Choose the category that best fits.";
      if (!hqState) e.hqState = "Choose a headquarters state.";
      if (!lines.length) e.lines = "Choose at least one category.";
    }
    if (s === 2) {
      if (tagline.trim().length < 10) e.tagline = "Add a one-line description (at least 10 characters).";
      if (about.trim().length < 60) e.about = `Describe the organization in at least 60 characters (${about.trim().length}/60).`;
    }
    if (s === 3 && !Object.values(ack).every(Boolean)) e.standards = "Please acknowledge each standard and the organization terms placeholder.";
    return e;
  };

  const scrollTop = () => topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });

  const next = () => {
    const e = validate(step);
    setErrors(e);
    if (Object.keys(e).length) return;
    setStep((s) => s + 1);
    scrollTop();
  };

  const back = () => {
    setErrors({});
    setStep((s) => Math.max(0, s - 1));
    scrollTop();
  };

  const submit = () => {
    for (let s = 0; s < STEPS.length; s++) {
      const e = validate(s);
      if (Object.keys(e).length) {
        setErrors(e);
        setStep(s);
        return;
      }
    }
    setSubmitting(true);
    const r = createOrganizationAccount({
      ownerName,
      ownerTitle,
      orgName,
      category: category as OrgCategory,
      hqCity,
      hqState,
      lines,
      tagline,
      about,
      acceptedTerms: Object.values(ack).every(Boolean),
    });
    if (!r.ok) {
      setSubmitting(false);
      if (/organization name|already exists/i.test(r.error)) {
        setErrors({ orgName: r.error });
        setStep(1);
      } else {
        setErrors({ form: r.error });
      }
      toast("Couldn’t submit the application", { body: r.error, tone: "error" });
      return;
    }
    toast("Application submitted for review", {
      body: "Your listing is pending platform review. In this demo, an administrator can approve it from the admin console.",
    });
    router.push("/org");
  };

  return (
    <Container size="narrow" className="py-10 sm:py-16">
      <div ref={topRef} className="scroll-mt-24">
        <div className="eyebrow mb-3">For organizations</div>
        <h1 className="font-display text-[36px] leading-[1.06] sm:text-[46px]">List your organization</h1>
        <p className="mt-3 max-w-2xl text-[15.5px] leading-relaxed text-ink-3">
          Tell us who you are. Every organization is reviewed against our listing standards before its profile appears publicly — review
          checks your listing content; it does not verify licenses, registrations or appointments.
        </p>
      </div>

      {hydrated && current && (
        <Notice tone="info" className="mt-6">
          You’re currently viewing as <span className="font-medium">{current.name}</span>. Submitting will switch your demo session to the new organization owner.
        </Notice>
      )}

      <StepIndicator steps={STEPS} current={step} className="mt-10" />

      <div className="mt-6 rounded-[22px] border border-line bg-surface shadow-card">
        <div className="px-5 py-7 sm:px-8 sm:py-9">
          {step === 0 && (
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">Your details</h2>
              <p className="mt-1 text-sm text-ink-3">You’ll be the owner of the organization’s workspace and can invite recruiters later.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Your name" id="o-owner" error={errors.ownerName}>
                  <Input id="o-owner" value={ownerName} onChange={(e) => { setOwnerName(e.target.value); clear("ownerName"); }} autoComplete="name" aria-invalid={!!errors.ownerName} />
                </Field>
                <Field label="Your title" id="o-title" optional hint="e.g. Agency Principal, Director of Recruiting">
                  <Input id="o-title" value={ownerTitle} onChange={(e) => setOwnerTitle(e.target.value)} autoComplete="organization-title" />
                </Field>
              </div>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">Organization</h2>
              <p className="mt-1 text-sm text-ink-3">The essentials producers use to find and compare organizations.</p>
              <div className="mt-6 grid gap-5 sm:grid-cols-2">
                <Field label="Organization name" id="o-name" error={errors.orgName} className="sm:col-span-2">
                  <Input id="o-name" value={orgName} onChange={(e) => { setOrgName(e.target.value); clear("orgName"); }} autoComplete="organization" aria-invalid={!!errors.orgName} />
                </Field>
                <Field
                  label="Category"
                  id="o-cat"
                  error={errors.category}
                  hint={category ? ORG_CATEGORY_DESCRIPTION[category] : "Choose the description that best fits how you work with producers."}
                  className="sm:col-span-2"
                >
                  <Select id="o-cat" value={category} onChange={(e) => { setCategory(e.target.value as OrgCategory); clear("category"); }} aria-invalid={!!errors.category}>
                    <option value="">Choose a category…</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{ORG_CATEGORY_LABEL[c]}</option>)}
                  </Select>
                </Field>
                <Field label="Headquarters city" id="o-city" optional>
                  <Input id="o-city" value={hqCity} onChange={(e) => setHqCity(e.target.value)} autoComplete="address-level2" />
                </Field>
                <Field label="Headquarters state" id="o-state" error={errors.hqState}>
                  <Select id="o-state" value={hqState} onChange={(e) => { setHqState(e.target.value); clear("hqState"); }} aria-invalid={!!errors.hqState}>
                    <option value="">Choose a state…</option>
                    {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </Select>
                </Field>
              </div>
              <div className="mt-7">
                <div className="mb-3 text-[13px] font-medium text-ink-2">Categories you recruit for</div>
                <div className="space-y-4">
                  {(Object.keys(LINES_BY_SECTOR) as Sector[]).map((sec) => {
                    const slugs = new Set<LineSlug>(LINES_BY_SECTOR[sec].map((l) => l.slug));
                    return (
                      <div key={sec}>
                        <div className="mb-2 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink-4">{SECTOR_LABEL[sec]}</div>
                        <ChipGroup
                          ariaLabel={`${SECTOR_LABEL[sec]} categories you recruit for`}
                          options={LINES_BY_SECTOR[sec].map((l) => ({ value: l.slug, label: l.name }))}
                          value={lines.filter((x) => slugs.has(x))}
                          onChange={(v) => {
                            const merged = [...lines.filter((x) => !slugs.has(x)), ...v];
                            setLines(merged);
                            if (merged.length) clear("lines");
                          }}
                          size="sm"
                        />
                      </div>
                    );
                  })}
                </div>
                {errors.lines && <p className="mt-2 text-xs text-danger" role="alert">{errors.lines}</p>}
              </div>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">Presence</h2>
              <p className="mt-1 text-sm text-ink-3">How your organization introduces itself. You can add culture, training and leadership after approval.</p>
              <div className="mt-6 space-y-5">
                <Field label="Tagline" id="o-tag" error={errors.tagline} hint="One sentence on what makes your organization a good place to build a career.">
                  <Input id="o-tag" value={tagline} maxLength={140} onChange={(e) => { setTagline(e.target.value); clear("tagline"); }} aria-invalid={!!errors.tagline} />
                </Field>
                <Field
                  label="About"
                  id="o-about"
                  error={errors.about}
                  hint={<span className="flex justify-between gap-4"><span>Who you serve, how producers are supported, and what working with you is like. Avoid income claims.</span><span className={cn("shrink-0 tabular-nums", about.trim().length >= 60 ? "text-success" : "text-ink-4")}>{about.trim().length}/60</span></span>}
                >
                  <Textarea id="o-about" rows={6} value={about} onChange={(e) => { setAbout(e.target.value); clear("about"); }} aria-invalid={!!errors.about} />
                </Field>
              </div>
            </div>
          )}

          {step === 3 && (
            <div>
              <h2 className="text-[18px] font-semibold tracking-[-0.01em] text-ink">Listing standards</h2>
              <p className="mt-1 text-sm text-ink-3">These standards apply to every organization on every plan. They’re what make listings here worth reading.</p>
              <div className="mt-6 space-y-3">
                {STANDARDS.map((s) => (
                  <div key={s.key} className={cn("rounded-xl border p-4 transition", ack[s.key] ? "border-navy-200 bg-navy-50/40" : "border-line")}>
                    <Checkbox
                      id={`o-std-${s.key}`}
                      checked={ack[s.key]}
                      onChange={(v) => { setAck((a) => ({ ...a, [s.key]: v })); clear("standards"); }}
                      label={<span className="font-medium">{s.label}</span>}
                      description={s.description}
                    />
                  </div>
                ))}
                <div className={cn("rounded-xl border p-4 transition", ack.terms ? "border-navy-200 bg-navy-50/40" : "border-line")}>
                  <Checkbox
                    id="o-terms"
                    checked={ack.terms}
                    onChange={(v) => { setAck((a) => ({ ...a, terms: v })); clear("standards"); }}
                    label={<>I acknowledge the placeholder <Link href="/legal/organization-terms" target="_blank" className="font-medium text-navy-600 underline-offset-2 hover:underline">Organization Terms</Link></>}
                    description="Prototype: the terms are a placeholder pending legal review and are not in effect."
                  />
                </div>
              </div>
              {errors.standards && <p className="mt-3 text-xs text-danger" role="alert">{errors.standards}</p>}

              <div className="mt-7 flex gap-3 rounded-xl border border-line bg-subtle/60 p-4 text-[13.5px] leading-relaxed text-ink-2">
                <ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
                <span>
                  <span className="font-medium text-ink">What happens next:</span> your organization is created with a <span className="font-medium">pending</span> listing on
                  the Directory plan, and you’re taken to your recruiting workspace to prepare your profile and first opportunity. Nothing appears
                  publicly until the platform approves it.
                </span>
              </div>
              <p className="mt-4 flex items-center gap-1.5 text-xs text-ink-3"><FlaskConical className="h-3.5 w-3.5" /> Demo: a platform admin persona can approve your organization from the admin console.</p>
              {errors.form && <Notice tone="danger" className="mt-6">{errors.form}</Notice>}
            </div>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-line bg-subtle/50 px-5 py-4 sm:px-8">
          {step > 0 ? (
            <Button variant="ghost" onClick={back} disabled={submitting}><ArrowLeft className="h-4 w-4" /> Back</Button>
          ) : (
            <Link href="/join" className="text-sm text-ink-3 hover:text-ink">Joining as an individual?</Link>
          )}
          {step < STEPS.length - 1 ? (
            <Button onClick={next}>Continue <ArrowRight className="h-4 w-4" /></Button>
          ) : (
            <Button onClick={submit} disabled={submitting || !hydrated}>{submitting ? "Submitting…" : "Submit for review"}</Button>
          )}
        </div>
      </div>
    </Container>
  );
}
