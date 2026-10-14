"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, ExternalLink, Plus, Save, Trash2, Undo2 } from "lucide-react";
import type {
  CultureValue, EngagementType, LeaderEntry, LeadsPolicy, Organization, OrgBrand, RecruitingStatus, TrainingProgram, WorkArrangement,
} from "@/lib/data/types";
import {
  ARRANGEMENT_LABEL, ENGAGEMENT_LABEL, LEADS_LABEL, ORG_CATEGORY_DESCRIPTION, ORG_CATEGORY_LABEL, RECRUITING_LABEL, US_STATES,
} from "@/lib/data/taxonomy";
import { can } from "@/lib/auth/permissions";
import { updateOrganizationProfile, type OrgProfileInput } from "@/lib/services/organizations";
import { screenOpportunity } from "@/lib/services/moderation-rules";
import { newId } from "@/lib/utils/ids";
import { OrgScope, OrgStatusNotice, ReadOnlyNotice, type OrgContext } from "@/components/org/org-scope";
import { CompliancePanel } from "@/components/org/compliance-panel";
import { CharCount, FormSection, LinePicker, SectionNav, StateMultiSelect } from "@/components/org/form-bits";
import { OrgLogo } from "@/components/brand/org-logo";
import { PageHeader } from "@/components/ui/page";
import { Button, ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { ChipGroup, Field, Input, Select, Switch, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { ListingStatusBadge } from "@/components/domain/badges";
import { OrgCard } from "@/components/domain/org-card";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/dates";

const PALETTE: { name: string; color: string; tint: string }[] = [
  { name: "Forest", color: "#2F4A3A", tint: "#E5EBE3" },
  { name: "Harbor", color: "#1F3B57", tint: "#E3EAF1" },
  { name: "Ink blue", color: "#23395B", tint: "#E3E8F0" },
  { name: "Aubergine", color: "#3B2F5C", tint: "#ECE8F2" },
  { name: "Teal", color: "#24525A", tint: "#E1EEEE" },
  { name: "Olive", color: "#4D5A2C", tint: "#EBEEE0" },
  { name: "Terracotta", color: "#7A3E2A", tint: "#F3E7E0" },
  { name: "Garnet", color: "#6B2E3A", tint: "#F2E4E6" },
  { name: "Walnut", color: "#4A3B2C", tint: "#EFE9E1" },
  { name: "Bronze", color: "#5C4A1F", tint: "#F1ECDF" },
  { name: "Slate", color: "#3A4452", tint: "#E6E9EE" },
];

const MARKS: OrgBrand["mark"][] = ["arch", "circle", "diamond", "stack", "wave", "split", "ring", "chevron"];

const FOOTPRINT_LABEL: Record<Organization["footprint"], string> = { local: "Local", regional: "Regional", multi_state: "Multi-state", national: "National" };

const TRAINING_FORMAT_LABEL: Record<TrainingProgram["format"], string> = { virtual: "Virtual", in_person: "In person", blended: "Blended", self_paced: "Self-paced" };

const SECTIONS = [
  { id: "identity", label: "Identity" },
  { id: "about", label: "About" },
  { id: "footprint", label: "HQ & footprint" },
  { id: "categories", label: "Categories" },
  { id: "arrangements", label: "Arrangements" },
  { id: "training", label: "Training" },
  { id: "mentorship", label: "Mentorship" },
  { id: "leads", label: "Leads" },
  { id: "compensation", label: "Compensation" },
  { id: "culture", label: "Culture" },
  { id: "leadership", label: "Leadership" },
  { id: "recruiting", label: "Recruiting" },
];

function inputFromOrg(o: Organization): OrgProfileInput {
  return structuredClone({
    name: o.name, tagline: o.tagline, about: o.about, hqCity: o.hqCity, hqState: o.hqState, footprint: o.footprint, statesServed: o.statesServed,
    lines: o.lines, arrangements: o.arrangements, engagementTypes: o.engagementTypes, teamSize: o.teamSize, trainingAvailable: o.trainingAvailable,
    trainingPrograms: o.trainingPrograms, mentorship: o.mentorship, leadProgram: o.leadProgram, compensationApproach: o.compensationApproach,
    culture: o.culture, leadership: o.leadership, recruitingStatus: o.recruitingStatus, recruitingContact: o.recruitingContact, brand: o.brand, founded: o.founded,
  });
}

function clean(i: OrgProfileInput): OrgProfileInput {
  return {
    ...i,
    name: i.name.trim(),
    tagline: i.tagline.trim(),
    about: i.about.trim(),
    hqCity: i.hqCity.trim(),
    teamSize: i.teamSize.trim(),
    trainingPrograms: i.trainingPrograms.filter((t) => t.name.trim()).map((t) => ({ ...t, name: t.name.trim(), duration: t.duration.trim(), description: t.description.trim() })),
    leadership: i.leadership.filter((l) => l.name.trim()).map((l) => ({ ...l, name: l.name.trim(), title: l.title.trim(), bio: l.bio.trim() })),
    culture: { summary: i.culture.summary.trim(), values: i.culture.values.filter((v) => v.title.trim()).map((v) => ({ title: v.title.trim(), description: v.description.trim() })) },
    compensationApproach: i.compensationApproach.trim(),
    leadProgram: { ...i.leadProgram, description: i.leadProgram.description.trim() },
    mentorship: { ...i.mentorship, description: i.mentorship.description.trim() },
  };
}

function validate(i: OrgProfileInput): Record<string, string> {
  const e: Record<string, string> = {};
  if (i.name.trim().length < 3) e.name = "Organization name is required (3+ characters).";
  if (i.tagline.trim().length < 10) e.tagline = "Add a tagline of at least 10 characters.";
  if (i.about.trim().length < 60) e.about = "The About section should be at least 60 characters.";
  if (i.lines.length === 0) e.lines = "Choose at least one insurance category.";
  if (i.leadProgram.policy === "available_at_cost" && i.leadProgram.description.trim().length < 30)
    e.leads = "Describe what producer-paid leads cost and when costs are disclosed (30+ characters).";
  if (i.founded && (i.founded < 1800 || i.founded > new Date().getFullYear())) e.founded = "Enter a valid year.";
  return e;
}

export default function OrgProfilePage() {
  return <OrgScope>{(ctx) => <ProfileEditor key={ctx.org.id} {...ctx} />}</OrgScope>;
}

function ProfileEditor({ user, org }: OrgContext) {
  const canEdit = can(user, "org:edit_profile");
  const [input, setInput] = useState<OrgProfileInput>(() => inputFromOrg(org));
  const [baseline, setBaseline] = useState(() => JSON.stringify(inputFromOrg(org)));
  const [showErrors, setShowErrors] = useState(false);
  const dirty = JSON.stringify(input) !== baseline;
  const errors = useMemo(() => validate(input), [input]);
  const err = (k: string) => (showErrors ? errors[k] : undefined);

  useEffect(() => {
    if (!dirty || !canEdit) return;
    const h = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", h);
    return () => window.removeEventListener("beforeunload", h);
  }, [dirty, canEdit]);

  const set = <K extends keyof OrgProfileInput>(k: K, v: OrgProfileInput[K]) => setInput((i) => ({ ...i, [k]: v }));

  const languageFlags = useMemo(
    () =>
      screenOpportunity({
        title: "",
        summary: input.tagline,
        description: [input.about, input.culture.summary, ...input.culture.values.map((v) => `${v.title} ${v.description}`), ...input.trainingPrograms.map((t) => t.description)].join(" \n "),
        compensation: { model: "salary", disclosed: false, notes: input.compensationApproach },
        leads: input.leadProgram.policy,
        leadsNotes: input.leadProgram.description,
        responsibilities: [],
        requirements: [],
        support: [input.mentorship.description],
      }),
    [input],
  );

  const previewOrg: Organization = useMemo(() => ({ ...org, ...clean(input), name: input.name || "Your organization", tagline: input.tagline || "Your tagline appears here." }), [org, input]);

  const save = () => {
    setShowErrors(true);
    const first = Object.values(errors)[0];
    if (first) {
      toast("Please fix a few fields", { body: first, tone: "error" });
      return;
    }
    const data = clean(input);
    const r = updateOrganizationProfile(user, org.id, data);
    if (r.ok) {
      setInput(data);
      setBaseline(JSON.stringify(data));
      setShowErrors(false);
      toast("Profile saved", { body: org.listingStatus === "approved" ? "Your public profile is updated." : "Saved. Your profile is visible publicly once approved." });
    } else toast("Couldn't save profile", { body: r.error, tone: "error" });
  };
  const discard = () => {
    setInput(JSON.parse(baseline) as OrgProfileInput);
    setShowErrors(false);
    toast("Changes discarded", { tone: "info" });
  };

  const customColor = !PALETTE.some((p) => p.color.toLowerCase() === input.brand.color.toLowerCase());

  return (
    <div>
      <PageHeader
        eyebrow="Organization"
        title="Public profile"
        description="What members see on your organization page and in the directory. Be specific — candidates value honest detail about training, leads and compensation."
        actions={
          <>
            <ButtonLink href={`/organizations/${org.slug}`} target="_blank" variant="ghost" size="sm"><ExternalLink className="h-4 w-4" /> View public profile</ButtonLink>
            {canEdit && <Button variant="accent" size="sm" onClick={save} disabled={!dirty}><Save className="h-4 w-4" /> Save profile</Button>}
          </>
        }
      />

      <div className="mb-6 space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[13px] text-ink-3">
          Listing status <ListingStatusBadge status={org.listingStatus} /> <span>· Last updated {formatDate(org.updatedAt)}</span>
        </div>
        <OrgStatusNotice org={org} />
        {org.listingNote && org.listingStatus === "approved" && <Notice tone="info" title="Note from the platform team">{org.listingNote}</Notice>}
        {!canEdit && <ReadOnlyNotice what="edit the public profile" />}
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <SectionNav items={SECTIONS} />
          <fieldset disabled={!canEdit} className="min-w-0 space-y-5">
            <legend className="sr-only">Organization profile</legend>

            <FormSection id="identity" title="Identity" description="Name, tagline and a generated brand mark. Logos are generated — uploads are out of scope for the prototype.">
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="org-name" label="Organization name" error={err("name")}>
                  <Input id="org-name" value={input.name} onChange={(e) => set("name", e.target.value)} />
                </Field>
                <Field label="Category" hint={ORG_CATEGORY_DESCRIPTION[org.category]}>
                  <div className="flex h-10 items-center rounded-lg border border-line bg-subtle px-3 text-sm text-ink-2">{ORG_CATEGORY_LABEL[org.category]}</div>
                </Field>
              </div>
              <Field id="org-tagline" label="Tagline" error={err("tagline")} hint="One line shown on directory cards.">
                <Input id="org-tagline" value={input.tagline} maxLength={140} onChange={(e) => set("tagline", e.target.value)} />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="org-founded" label="Founded" error={err("founded")}>
                  <Input id="org-founded" type="number" inputMode="numeric" value={input.founded || ""} onChange={(e) => set("founded", Number(e.target.value) || 0)} />
                </Field>
                <Field id="org-team" label="Team size" hint="e.g. “85–120 team members”">
                  <Input id="org-team" value={input.teamSize} onChange={(e) => set("teamSize", e.target.value)} />
                </Field>
              </div>
              <div className="grid gap-5 sm:grid-cols-[auto_minmax(0,1fr)]">
                <div className="flex flex-col items-center gap-2">
                  <OrgLogo brand={input.brand} name={input.name || "Organization"} size={84} />
                  <span className="text-[11px] text-ink-4">Live preview</span>
                </div>
                <div className="space-y-4">
                  <div>
                    <div className="mb-1.5 text-[13px] font-medium text-ink-2">Brand color</div>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Brand color">
                      {customColor && (
                        <span className="flex h-8 items-center gap-1.5 rounded-full border border-navy px-2 text-xs text-ink-2">
                          <span className="h-4 w-4 rounded-full" style={{ background: input.brand.color }} /> Current
                        </span>
                      )}
                      {PALETTE.map((p) => {
                        const active = p.color.toLowerCase() === input.brand.color.toLowerCase();
                        return (
                          <button
                            key={p.color}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={p.name}
                            title={p.name}
                            onClick={() => set("brand", { ...input.brand, color: p.color, tint: p.tint })}
                            className={cn("flex h-8 w-8 items-center justify-center rounded-full ring-offset-2 ring-offset-surface transition", active ? "ring-2 ring-navy" : "hover:ring-2 hover:ring-line-strong")}
                            style={{ background: p.color }}
                          >
                            {active && <Check className="h-3.5 w-3.5 text-white" strokeWidth={2.5} />}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div>
                    <div className="mb-1.5 text-[13px] font-medium text-ink-2">Mark</div>
                    <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Logo mark">
                      {MARKS.map((m) => {
                        const active = m === input.brand.mark;
                        return (
                          <button
                            key={m}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={`${m} mark`}
                            onClick={() => set("brand", { ...input.brand, mark: m })}
                            className={cn("rounded-[12px] p-0.5 transition", active ? "ring-2 ring-navy" : "opacity-70 hover:opacity-100")}
                          >
                            <OrgLogo brand={{ ...input.brand, mark: m }} name={`${m} mark`} size={36} />
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </FormSection>

            <FormSection id="about" title="About" description="Who you are, who you serve and how your teams work.">
              <Field id="org-about" label="About" error={err("about")}>
                <Textarea id="org-about" value={input.about} onChange={(e) => set("about", e.target.value)} className="min-h-[150px]" />
                <div className="mt-1 text-right"><CharCount value={input.about} min={60} /></div>
              </Field>
            </FormSection>

            <FormSection id="footprint" title="HQ & footprint">
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="org-city" label="HQ city">
                  <Input id="org-city" value={input.hqCity} onChange={(e) => set("hqCity", e.target.value)} />
                </Field>
                <Field id="org-state" label="HQ state">
                  <Select id="org-state" value={input.hqState} onChange={(e) => set("hqState", e.target.value)}>
                    {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                  </Select>
                </Field>
                <Field id="org-footprint" label="Footprint">
                  <Select id="org-footprint" value={input.footprint} onChange={(e) => set("footprint", e.target.value as Organization["footprint"])}>
                    {Object.entries(FOOTPRINT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                  </Select>
                </Field>
              </div>
              <Field label="States served">
                <StateMultiSelect
                  value={input.statesServed}
                  onChange={(v) => setInput((i) => ({ ...i, statesServed: v, footprint: v.includes("ALL") ? "national" : i.footprint }))}
                  description="You work with producers or clients in every state."
                  collapsedByDefault={input.statesServed.length > 0}
                />
              </Field>
            </FormSection>

            <FormSection id="categories" title="Categories" description="Insurance and financial-services categories, used for directory filters and matching. A discovery taxonomy, not a statement of licensing.">
              <Field error={err("lines")}>
                <LinePicker value={input.lines} onChange={(v) => set("lines", v)} />
              </Field>
            </FormSection>

            <FormSection id="arrangements" title="Arrangements & engagement types">
              <Field label="Work arrangements">
                <ChipGroup<WorkArrangement> ariaLabel="Work arrangements" options={(Object.keys(ARRANGEMENT_LABEL) as WorkArrangement[]).map((a) => ({ value: a, label: ARRANGEMENT_LABEL[a] }))} value={input.arrangements} onChange={(v) => set("arrangements", v)} />
              </Field>
              <Field label="Engagement types" hint="W-2 employment and independent contractor (1099) affiliation are always shown distinctly to members.">
                <ChipGroup<EngagementType> ariaLabel="Engagement types" options={(Object.keys(ENGAGEMENT_LABEL) as EngagementType[]).map((a) => ({ value: a, label: ENGAGEMENT_LABEL[a] }))} value={input.engagementTypes} onChange={(v) => set("engagementTypes", v)} />
              </Field>
            </FormSection>

            <FormSection id="training" title="Training programs" aside={<Switch checked={input.trainingAvailable} onChange={(v) => set("trainingAvailable", v)} label={<span className="sr-only">Training available</span>} />}>
              {!input.trainingAvailable ? (
                <p className="text-[13px] text-ink-3">Training is marked as not available. Turn it on to describe your programs.</p>
              ) : (
                <>
                  {input.trainingPrograms.length === 0 && <p className="text-[13px] text-ink-3">No programs yet. Add the structured training a new team member can expect.</p>}
                  {input.trainingPrograms.map((t, idx) => (
                    <RepeatCard key={t.id} title={t.name || `Program ${idx + 1}`} onRemove={() => set("trainingPrograms", input.trainingPrograms.filter((x) => x.id !== t.id))}>
                      <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_150px_150px]">
                        <Field id={`tp-name-${t.id}`} label="Name">
                          <Input id={`tp-name-${t.id}`} value={t.name} onChange={(e) => set("trainingPrograms", input.trainingPrograms.map((x) => (x.id === t.id ? { ...x, name: e.target.value } : x)))} />
                        </Field>
                        <Field id={`tp-format-${t.id}`} label="Format">
                          <Select id={`tp-format-${t.id}`} value={t.format} onChange={(e) => set("trainingPrograms", input.trainingPrograms.map((x) => (x.id === t.id ? { ...x, format: e.target.value as TrainingProgram["format"] } : x)))}>
                            {Object.entries(TRAINING_FORMAT_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                          </Select>
                        </Field>
                        <Field id={`tp-dur-${t.id}`} label="Duration">
                          <Input id={`tp-dur-${t.id}`} value={t.duration} placeholder="12 weeks" onChange={(e) => set("trainingPrograms", input.trainingPrograms.map((x) => (x.id === t.id ? { ...x, duration: e.target.value } : x)))} />
                        </Field>
                      </div>
                      <Field id={`tp-desc-${t.id}`} label="Description">
                        <Textarea id={`tp-desc-${t.id}`} className="min-h-[64px]" value={t.description} onChange={(e) => set("trainingPrograms", input.trainingPrograms.map((x) => (x.id === t.id ? { ...x, description: e.target.value } : x)))} />
                      </Field>
                    </RepeatCard>
                  ))}
                  <AddButton onClick={() => set("trainingPrograms", [...input.trainingPrograms, { id: newId("tp"), name: "", format: "blended", duration: "", description: "" }])}>Add training program</AddButton>
                </>
              )}
            </FormSection>

            <FormSection id="mentorship" title="Mentorship">
              <Switch checked={input.mentorship.available} onChange={(v) => set("mentorship", { ...input.mentorship, available: v })} label="Mentorship is available" description="Shown as a directory filter." />
              {input.mentorship.available && (
                <Field id="org-mentor" label="How mentorship works">
                  <Textarea id="org-mentor" className="min-h-[72px]" value={input.mentorship.description} onChange={(e) => set("mentorship", { ...input.mentorship, description: e.target.value })} placeholder="Who mentors, how often, and for how long." />
                </Field>
              )}
            </FormSection>

            <FormSection id="leads" title="Lead program" description="Who pays for leads is one of the first things candidates ask. Say it plainly.">
              <Field id="org-leads" label="Policy">
                <Select id="org-leads" value={input.leadProgram.policy} onChange={(e) => set("leadProgram", { ...input.leadProgram, policy: e.target.value as LeadsPolicy })}>
                  {Object.entries(LEADS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <Field
                id="org-leads-desc"
                label={input.leadProgram.policy === "available_at_cost" ? "Producer cost disclosure" : "Description"}
                error={err("leads")}
                hint={
                  input.leadProgram.policy === "available_at_cost"
                    ? "Required: what leads cost, whether buying them is optional, and that costs are disclosed in writing before any purchase."
                    : input.leadProgram.policy === "provided"
                      ? "Describe how leads are provided and whether there is any cost to the producer (there shouldn't be, if they're “provided”)."
                      : "How producers build a book — referral programs, marketing support, centers of influence."
                }
              >
                <Textarea id="org-leads-desc" className="min-h-[80px]" value={input.leadProgram.description} onChange={(e) => set("leadProgram", { ...input.leadProgram, description: e.target.value })} />
                {input.leadProgram.policy === "available_at_cost" && <div className="mt-1 text-right"><CharCount value={input.leadProgram.description} min={30} /></div>}
              </Field>
            </FormSection>

            <FormSection id="compensation" title="Compensation approach">
              <Field id="org-comp" label="How people are paid" hint="Describe the model (salary, salary plus incentive, carrier commissions for independent contractors…) and when terms are confirmed in writing. No income claims, examples of top results or guarantees.">
                <Textarea id="org-comp" className="min-h-[96px]" value={input.compensationApproach} onChange={(e) => set("compensationApproach", e.target.value)} />
              </Field>
            </FormSection>

            <FormSection id="culture" title="Culture">
              <Field id="org-culture" label="Summary" hint="A sentence or two about how your team works.">
                <Input id="org-culture" value={input.culture.summary} onChange={(e) => set("culture", { ...input.culture, summary: e.target.value })} />
              </Field>
              <div>
                <div className="mb-2 text-[13px] font-medium text-ink-2">Values</div>
                <div className="space-y-3">
                  {input.culture.values.map((v, idx) => {
                    const update = (patch: Partial<CultureValue>) => set("culture", { ...input.culture, values: input.culture.values.map((x, j) => (j === idx ? { ...x, ...patch } : x)) });
                    return (
                      <RepeatCard key={idx} title={v.title || `Value ${idx + 1}`} onRemove={() => set("culture", { ...input.culture, values: input.culture.values.filter((_, j) => j !== idx) })}>
                        <Field id={`val-title-${idx}`} label="Title">
                          <Input id={`val-title-${idx}`} value={v.title} onChange={(e) => update({ title: e.target.value })} />
                        </Field>
                        <Field id={`val-desc-${idx}`} label="Description">
                          <Input id={`val-desc-${idx}`} value={v.description} onChange={(e) => update({ description: e.target.value })} />
                        </Field>
                      </RepeatCard>
                    );
                  })}
                  <AddButton onClick={() => set("culture", { ...input.culture, values: [...input.culture.values, { title: "", description: "" }] })}>Add value</AddButton>
                </div>
              </div>
            </FormSection>

            <FormSection id="leadership" title="Leadership" description="Fictional people only in the prototype.">
              {input.leadership.length === 0 && <p className="text-[13px] text-ink-3">No leaders listed yet.</p>}
              {input.leadership.map((l, idx) => {
                const update = (patch: Partial<LeaderEntry>) => set("leadership", input.leadership.map((x) => (x.id === l.id ? { ...x, ...patch } : x)));
                return (
                  <RepeatCard key={l.id} title={l.name || `Leader ${idx + 1}`} onRemove={() => set("leadership", input.leadership.filter((x) => x.id !== l.id))}>
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field id={`ld-name-${l.id}`} label="Name">
                        <Input id={`ld-name-${l.id}`} value={l.name} onChange={(e) => update({ name: e.target.value })} />
                      </Field>
                      <Field id={`ld-title-${l.id}`} label="Title">
                        <Input id={`ld-title-${l.id}`} value={l.title} onChange={(e) => update({ title: e.target.value })} />
                      </Field>
                    </div>
                    <Field id={`ld-bio-${l.id}`} label="Short bio">
                      <Input id={`ld-bio-${l.id}`} value={l.bio} onChange={(e) => update({ bio: e.target.value })} />
                    </Field>
                  </RepeatCard>
                );
              })}
              <AddButton onClick={() => set("leadership", [...input.leadership, { id: newId("ld"), name: "", title: "", bio: "" }])}>Add leader</AddButton>
            </FormSection>

            <FormSection id="recruiting" title="Recruiting status & contact">
              <Field label="Recruiting status">
                <ChipGroup<RecruitingStatus>
                  ariaLabel="Recruiting status"
                  multiple={false}
                  options={(Object.keys(RECRUITING_LABEL) as RecruitingStatus[]).map((r) => ({ value: r, label: RECRUITING_LABEL[r] }))}
                  value={[input.recruitingStatus]}
                  onChange={(v) => v[0] && set("recruitingStatus", v[0])}
                />
              </Field>
              <div className="grid gap-4 sm:grid-cols-2">
                <Field id="rc-name" label="Recruiting contact name">
                  <Input id="rc-name" value={input.recruitingContact.name} onChange={(e) => set("recruitingContact", { ...input.recruitingContact, name: e.target.value })} />
                </Field>
                <Field id="rc-title" label="Contact title">
                  <Input id="rc-title" value={input.recruitingContact.title} onChange={(e) => set("recruitingContact", { ...input.recruitingContact, title: e.target.value })} />
                </Field>
              </div>
              <p className="text-xs text-ink-3">Members contact you through applications and platform messages. Direct email addresses are never published.</p>
            </FormSection>
          </fieldset>

          {canEdit && (
            <div className={cn("sticky bottom-4 z-30 flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 shadow-pop transition sm:px-5", dirty ? "border-line bg-surface" : "pointer-events-none border-transparent bg-transparent opacity-0 shadow-none")} aria-hidden={!dirty}>
              <span className="text-[13px] text-ink-2">You have unsaved changes</span>
              <div className="flex gap-2">
                <Button variant="ghost" size="sm" onClick={discard} tabIndex={dirty ? 0 : -1}><Undo2 className="h-4 w-4" /> Discard</Button>
                <Button variant="accent" size="sm" onClick={save} tabIndex={dirty ? 0 : -1}><Save className="h-4 w-4" /> Save profile</Button>
              </div>
            </div>
          )}
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start" aria-label="Preview">
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="eyebrow">Directory preview</span>
              <span className="text-[11px] text-ink-4">Updates as you type</span>
            </div>
            <div inert aria-hidden className="pointer-events-none select-none">
              <OrgCard org={previewOrg} />
            </div>
          </div>
          <CompliancePanel
            flags={languageFlags}
            title="Profile language check"
            subject="profile"
            footnote="The same rule-based pre-screen used for listings, applied to your profile copy. A writing aid — not legal advice."
          />
          <Card className="px-4 py-3.5 text-[12.5px] leading-relaxed text-ink-3">
            <ButtonLink href={`/organizations/${org.slug}`} target="_blank" variant="link" size="sm" className="text-[13px]">
              View public profile <ExternalLink className="h-3.5 w-3.5" />
            </ButtonLink>
            <p className="mt-1">
              {org.listingStatus === "approved" ? "Saved changes appear on your public page immediately." : "Your public page becomes visible to members once the platform approves your organization."}
            </p>
          </Card>
        </aside>
      </div>
    </div>
  );
}

function RepeatCard({ title, onRemove, children }: { title: string; onRemove: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-line bg-subtle/40 p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <span className="truncate text-[13px] font-semibold text-ink">{title}</span>
        <button type="button" onClick={onRemove} className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs text-ink-3 transition hover:bg-danger-50 hover:text-danger" aria-label={`Remove ${title}`}>
          <Trash2 className="h-3.5 w-3.5" /> Remove
        </button>
      </div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 py-2 text-[13px] font-medium text-navy-600 transition hover:border-navy-200 hover:bg-navy-50/50">
      <Plus className="h-3.5 w-3.5" /> {children}
    </button>
  );
}
