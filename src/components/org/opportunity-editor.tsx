"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Briefcase, Eye, FileCheck2, Handshake, Info, Save, Send } from "lucide-react";
import type { CareerCategory, CompensationModel, ExperienceLevel, LeadsPolicy, LicenseRequirement, Opportunity, OpportunityKind, WorkArrangement } from "@/lib/data/types";
import {
  ARRANGEMENT_LABEL, CATEGORY_LABEL, COMP_MODEL_LABEL, ENGAGEMENT_LABEL, EXPERIENCE_LABEL, KIND_LABEL, LEADS_LABEL,
  LICENSE_REQ_LABEL, LINES_OF_AUTHORITY, US_STATES,
} from "@/lib/data/taxonomy";
import {
  ENGAGEMENT_FOR_KIND, emptyOpportunityInput, inputFromOpportunity, publishOpportunity, saveOpportunityDraft, validateOpportunityInput,
  type OpportunityInput,
} from "@/lib/services/opportunities";
import { screenOpportunity } from "@/lib/services/moderation-rules";
import { attempt } from "@/lib/services/result";
import { getDb } from "@/lib/store/db-store";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Notice } from "@/components/ui/feedback";
import { ChipGroup, Field, Input, ListEditor, Select, Switch, Textarea } from "@/components/ui/form";
import { PageHeader } from "@/components/ui/page";
import { toast } from "@/components/ui/toast";
import { OppStatusBadge } from "@/components/domain/badges";
import { OpportunityCard } from "@/components/domain/opportunity-card";
import { CompensationDisclaimer } from "@/components/domain/disclaimers";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/dates";
import type { OrgContext } from "./org-scope";
import { OrgStatusNotice } from "./org-scope";
import { CompliancePanel, type ChecklistItem } from "./compliance-panel";
import { CharCount, FormSection, LinePicker, SectionNav, StateMultiSelect } from "./form-bits";
import { FLAG_GUIDE, personName } from "./org-utils";

const SECTIONS = [
  { id: "basics", label: "Basics" },
  { id: "location", label: "Location" },
  { id: "requirements", label: "Requirements" },
  { id: "training", label: "Training" },
  { id: "leads", label: "Leads" },
  { id: "compensation", label: "Compensation" },
  { id: "content", label: "Content" },
];

const KIND_EXPLAINER: Record<OpportunityKind, { icon: typeof Briefcase; body: string }> = {
  employment: {
    icon: Briefcase,
    body: "W-2 employment. Your organization is the employer: it withholds payroll taxes, directs the work and provides any benefits you describe.",
  },
  contracting: {
    icon: Handshake,
    body: "Independent contractor (1099) affiliation. The producer runs their own business, is typically paid under carrier contracts, and controls how the work is done.",
  },
};

/** Removes blank list items and trims free text before saving. */
function clean(i: OpportunityInput): OpportunityInput {
  const list = (xs: string[]) => xs.map((x) => x.trim()).filter(Boolean);
  return {
    ...i,
    title: i.title.trim(),
    city: i.city?.trim() || undefined,
    responsibilities: list(i.responsibilities),
    requirements: list(i.requirements),
    support: list(i.support),
    compensation: i.compensation.disclosed ? i.compensation : { model: i.compensation.model, disclosed: false, notes: i.compensation.notes },
  };
}

function checklist(i: OpportunityInput): ChecklistItem[] {
  const items: ChecklistItem[] = [
    { key: "title", label: "Role title (4+ characters)", ok: i.title.trim().length >= 4 },
    { key: "lines", label: "At least one insurance category", ok: i.lines.length > 0 },
    { key: "state", label: "Primary state or Nationwide", ok: !!i.state },
    { key: "summary", label: "Summary (30+ characters)", ok: i.summary.trim().length >= 30 },
    { key: "description", label: "Description (60+ characters)", ok: i.description.trim().length >= 60 },
    { key: "responsibilities", label: "At least one responsibility", ok: i.responsibilities.some((x) => x.trim()) },
    { key: "requirements", label: "At least one requirement", ok: i.requirements.some((x) => x.trim()) },
    { key: "compNotes", label: "Compensation approach described (15+ characters)", ok: i.compensation.notes.trim().length >= 15 },
  ];
  if (i.compensation.disclosed) {
    const { min, max } = i.compensation;
    items.push({ key: "compRange", label: "Disclosed range has a valid minimum and maximum", ok: min != null && min > 0 && (max == null || max >= min) });
  }
  if (i.leads === "available_at_cost") {
    items.push({ key: "leadsNotes", label: "Producer lead costs disclosed (30+ characters)", ok: i.leadsNotes.trim().length >= 30 });
  }
  return items;
}

function numberOrUndefined(v: string) {
  if (v.trim() === "") return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
}

export function OpportunityEditor({ ctx, opportunity }: { ctx: OrgContext; opportunity?: Opportunity }) {
  const { db, user, org } = ctx;
  const router = useRouter();
  const [input, setInput] = useState<OpportunityInput>(() => (opportunity ? inputFromOpportunity(opportunity) : { ...emptyOpportunityInput(), city: org.hqCity, state: org.hqState }));
  const [baseline, setBaseline] = useState(() => JSON.stringify(input));
  const [showErrors, setShowErrors] = useState(false);
  const [previewNow] = useState(() => new Date().toISOString());

  const dirty = JSON.stringify(input) !== baseline;
  const flags = useMemo(() => screenOpportunity(input), [input]);
  const checks = useMemo(() => checklist(input), [input]);
  const errorFor = (key: string, message: string) => (showErrors && checks.find((c) => c.key === key && !c.ok) ? message : undefined);
  const status = opportunity?.status;
  const isLive = status === "published";

  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);

  const set = <K extends keyof OpportunityInput>(key: K, value: OpportunityInput[K]) => setInput((i) => ({ ...i, [key]: value }));
  const setComp = (patch: Partial<OpportunityInput["compensation"]>) => setInput((i) => ({ ...i, compensation: { ...i.compensation, ...patch } }));

  const previewOpp: Opportunity = useMemo(() => {
    const c = clean(input);
    return {
      ...c,
      title: c.title || "Untitled opportunity",
      summary: c.summary || "Your one-paragraph summary appears here in search results.",
      state: c.state || org.hqState,
      id: opportunity?.id ?? "preview",
      slug: opportunity?.slug ?? "preview",
      orgId: org.id,
      status: status ?? "draft",
      createdAt: previewNow,
      updatedAt: previewNow,
      postedAt: opportunity?.postedAt ?? previewNow,
      views: 0,
      isDemo: true,
    };
  }, [input, opportunity, org, status, previewNow]);

  /** Saves the form; returns the opportunity id or null on failure. */
  const persist = (): string | null => {
    const data = clean(input);
    const r = saveOpportunityDraft(user, org.id, data, opportunity?.id);
    if (!r.ok) {
      toast("Couldn't save", { body: r.error, tone: "error" });
      return null;
    }
    setInput(data);
    setBaseline(JSON.stringify(data));
    return r.data || opportunity?.id || null;
  };

  const onSave = () => {
    const id = persist();
    if (!id) return;
    const after = getDb().opportunities.find((o) => o.id === id);
    if (isLive && after?.status === "pending_review") {
      toast("Edits sent for review", { body: "The pre-screen flagged your changes, so the listing is paused until a reviewer approves it.", tone: "info" });
    } else {
      toast(isLive ? "Changes saved" : "Draft saved", { body: isLive ? "Your live listing is updated." : "Only your team can see drafts." });
    }
    if (!opportunity) router.replace(`/org/opportunities/${id}`);
  };

  const onPublish = () => {
    setShowErrors(true);
    const missing = checks.find((c) => !c.ok);
    if (missing) {
      toast("A few things are needed before publishing", { body: missing.label, tone: "error" });
      return;
    }
    const v = attempt(() => validateOpportunityInput(clean(input), true));
    if (!v.ok) {
      toast("A few things are needed before publishing", { body: v.error, tone: "error" });
      return;
    }
    const id = persist();
    if (!id) return;
    const r = publishOpportunity(user, id);
    if (!r.ok) {
      toast("Saved as draft — not published", { body: r.error, tone: "error" });
    } else if (r.data.status === "published") {
      toast("Published", { body: "Your listing is live in opportunity search." });
    } else {
      toast("Sent for review", { body: r.data.reasons.join(" · "), tone: "info" });
    }
    if (!opportunity) router.replace(`/org/opportunities/${id}`);
  };

  const onPreview = () => {
    if (!opportunity) return;
    if (dirty) toast("Preview shows the last saved version", { body: "Save to include your latest edits.", tone: "info" });
    window.open(`/opportunities/${opportunity.slug}`, "_blank", "noopener");
  };

  const actions = (
    <>
      {opportunity && (
        <Button variant="ghost" size="sm" onClick={onPreview}>
          <Eye className="h-4 w-4" strokeWidth={1.75} /> Preview
        </Button>
      )}
      {isLive ? (
        <Button variant="accent" size="sm" onClick={onSave} disabled={!dirty}>
          <Save className="h-4 w-4" strokeWidth={1.75} /> Save changes
        </Button>
      ) : (
        <>
          <Button variant="secondary" size="sm" onClick={onSave}>
            <Save className="h-4 w-4" strokeWidth={1.75} /> Save draft
          </Button>
          <Button variant="accent" size="sm" onClick={onPublish}>
            <Send className="h-4 w-4" strokeWidth={1.75} /> {status === "pending_review" ? "Save & resubmit" : "Save & publish"}
          </Button>
        </>
      )}
    </>
  );

  const kindExp = KIND_EXPLAINER[input.kind];

  return (
    <div>
      <PageHeader
        breadcrumbs={[{ href: "/org/opportunities", label: "Opportunities" }, { label: opportunity ? "Edit" : "New opportunity" }]}
        title={opportunity ? opportunity.title : "New opportunity"}
        description={
          opportunity ? (
            <span className="inline-flex flex-wrap items-center gap-2">
              {status && <OppStatusBadge status={status} />}
              <span className="text-[13px]">Last updated {formatDate(opportunity.updatedAt)}</span>
              {dirty && <Badge tone="gold">Unsaved changes</Badge>}
            </span>
          ) : (
            "Describe the role honestly and specifically. The compliance pre-check updates as you type."
          )
        }
        actions={actions}
      />

      <div className="space-y-4">
        <OrgStatusNotice org={org} />
        {opportunity?.moderation?.reviewerNote && (
          <Notice tone="warning" title={`Reviewer note${opportunity.moderation.reviewedBy ? ` from ${personName(db, opportunity.moderation.reviewedBy)}` : ""}`}>
            {opportunity.moderation.reviewerNote}
          </Notice>
        )}
        {opportunity?.moderation && opportunity.moderation.flags.length > 0 && (
          <Notice tone="info" title="Flags recorded at last submission">
            {opportunity.moderation.flags.map((f) => FLAG_GUIDE[f.code]?.title ?? f.label).join(" · ")}. The live pre-check on this page reflects your current text.
          </Notice>
        )}
        {isLive && (
          <Notice tone="info" title="Editing a live listing">
            Saved edits are re-screened automatically. If the pre-check flags anything, the listing is paused and sent to a reviewer.
          </Notice>
        )}
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="min-w-0 space-y-5">
          <SectionNav items={SECTIONS} />

          <FormSection id="basics" title="Basics" description="What the role is and how the working relationship is structured.">
            <Field id="opp-title" label="Role title" error={errorFor("title", "Add a role title (at least 4 characters).")} hint="Describe the role, not the opportunity: “Commercial Lines Account Manager”, not “Unlimited Income!”">
              <Input id="opp-title" value={input.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Personal Lines Account Manager" maxLength={120} />
            </Field>

            <fieldset>
              <legend className="mb-1.5 text-[13px] font-medium text-ink-2">Opportunity type</legend>
              <div className="grid gap-2 sm:grid-cols-2" role="radiogroup" aria-label="Opportunity type">
                {(["employment", "contracting"] as OpportunityKind[]).map((k) => {
                  const active = input.kind === k;
                  const Icon = KIND_EXPLAINER[k].icon;
                  return (
                    <button
                      key={k}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setInput((i) => ({ ...i, kind: k, engagement: ENGAGEMENT_FOR_KIND[k][0]! }))}
                      className={cn(
                        "flex items-start gap-3 rounded-xl border p-3.5 text-left transition",
                        active ? "border-navy bg-navy-50/70 ring-1 ring-navy" : "border-line-strong bg-surface hover:border-ink-4",
                      )}
                    >
                      <Icon className={cn("mt-0.5 h-4 w-4 shrink-0", active ? "text-navy" : "text-ink-4")} strokeWidth={1.75} />
                      <span>
                        <span className="block text-sm font-medium text-ink">{KIND_LABEL[k]}</span>
                        <span className="mt-0.5 block text-xs text-ink-3">{ENGAGEMENT_LABEL[ENGAGEMENT_FOR_KIND[k][0]!]}</span>
                      </span>
                    </button>
                  );
                })}
              </div>
              <div className="mt-2.5 flex gap-2.5 rounded-xl bg-subtle px-3.5 py-3 text-[12.5px] leading-relaxed text-ink-2">
                <kindExp.icon className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-4" strokeWidth={1.75} />
                <span>
                  {kindExp.body} Engagement is set automatically to <strong className="font-medium">{ENGAGEMENT_LABEL[input.engagement]}</strong>. Worker classification depends on the actual relationship — confirm with your counsel.
                </span>
              </div>
            </fieldset>

            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="opp-category" label="Career category">
                <Select id="opp-category" value={input.category} onChange={(e) => set("category", e.target.value as CareerCategory)}>
                  {Object.entries(CATEGORY_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
            </div>

            <Field label="Categories" error={errorFor("lines", "Choose at least one category.")} hint="A discovery taxonomy — not a statement of license lines of authority.">
              <LinePicker value={input.lines} onChange={(v) => set("lines", v)} />
            </Field>
          </FormSection>

          <FormSection id="location" title="Location & arrangement" description="Where the work happens and which states are eligible.">
            <Field label="Work arrangement">
              <ChipGroup<WorkArrangement>
                ariaLabel="Work arrangement"
                multiple={false}
                options={(Object.keys(ARRANGEMENT_LABEL) as WorkArrangement[]).map((a) => ({ value: a, label: ARRANGEMENT_LABEL[a] }))}
                value={[input.arrangement]}
                onChange={(v) => v[0] && set("arrangement", v[0])}
              />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="opp-state" label="Primary state" error={errorFor("state", "Choose a primary state (or Nationwide).")}>
                <Select id="opp-state" value={input.state} onChange={(e) => set("state", e.target.value)}>
                  <option value="">Choose…</option>
                  <option value="US">Nationwide / multi-state</option>
                  {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </Select>
              </Field>
              <Field id="opp-city" label="City" optional hint={input.state === "US" ? "Leave blank for nationwide roles." : undefined}>
                <Input id="opp-city" value={input.city ?? ""} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Charlotte" />
              </Field>
            </div>
            <Field label="Eligible states" hint="For remote or multi-state roles. Candidates filter by state.">
              <StateMultiSelect value={input.eligibleStates} onChange={(v) => set("eligibleStates", v)} label="Eligible nationwide" collapsedByDefault={input.eligibleStates.length > 0} />
            </Field>
          </FormSection>

          <FormSection id="requirements" title="Requirements" description="Experience and licensing expectations.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="opp-exp" label="Experience level">
                <Select id="opp-exp" value={input.experienceLevel} onChange={(e) => set("experienceLevel", e.target.value as ExperienceLevel)}>
                  {Object.entries(EXPERIENCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
              <Field id="opp-lic" label="License requirement">
                <Select id="opp-lic" value={input.licenseRequirement} onChange={(e) => set("licenseRequirement", e.target.value as LicenseRequirement)}>
                  {Object.entries(LICENSE_REQ_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
            </div>
            <Field label="Licenses & registrations needed" optional hint="Licensing and registration rules vary — candidates confirm requirements with their state department of insurance.">
              <ChipGroup ariaLabel="Licenses needed" size="sm" options={LINES_OF_AUTHORITY.map((l) => ({ value: l, label: l }))} value={input.licensesNeeded} onChange={(v) => set("licensesNeeded", v)} />
            </Field>
          </FormSection>

          <FormSection id="training" title="Training">
            <Switch checked={input.trainingProvided} onChange={(v) => set("trainingProvided", v)} label="Training is provided" description="Shown as a filter and badge in search." />
            {input.trainingProvided && (
              <Field id="opp-training" label="Training summary" hint="Format, duration and who leads it.">
                <Textarea id="opp-training" value={input.trainingSummary} onChange={(e) => set("trainingSummary", e.target.value)} className="min-h-[72px]" placeholder="e.g. 12-week blended residency with weekly check-ins and shadowing." />
              </Field>
            )}
          </FormSection>

          <FormSection id="leads" title="Leads" description="Be explicit about who pays for leads. Candidates filter on this.">
            <Field id="opp-leads" label="Lead policy">
              <Select id="opp-leads" value={input.leads} onChange={(e) => set("leads", e.target.value as LeadsPolicy)}>
                {Object.entries(LEADS_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
              </Select>
            </Field>
            <Field
              id="opp-leads-notes"
              label={input.leads === "available_at_cost" ? "Producer cost disclosure" : "Lead notes"}
              optional={input.leads !== "available_at_cost"}
              error={errorFor("leadsNotes", "Describe lead costs (at least 30 characters).")}
              hint={
                input.leads === "available_at_cost"
                  ? "Required: what leads cost, whether buying is optional, and when costs are disclosed in writing."
                  : "How producers find clients — referral programs, marketing support, centers of influence."
              }
            >
              <Textarea id="opp-leads-notes" value={input.leadsNotes} onChange={(e) => set("leadsNotes", e.target.value)} className="min-h-[80px]" />
              {input.leads === "available_at_cost" && <div className="mt-1 text-right"><CharCount value={input.leadsNotes} min={30} /></div>}
            </Field>
          </FormSection>

          <FormSection id="compensation" title="Compensation" description="Show exactly what you're prepared to disclose. No projections, “potential earnings” or examples of top results.">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field id="opp-comp-model" label="Compensation model">
                <Select id="opp-comp-model" value={input.compensation.model} onChange={(e) => setComp({ model: e.target.value as CompensationModel })}>
                  {Object.entries(COMP_MODEL_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
                </Select>
              </Field>
            </div>
            <Switch
              checked={input.compensation.disclosed}
              onChange={(v) => setComp(v ? { disclosed: true, period: input.compensation.period ?? (input.compensation.model === "hourly" ? "hour" : "year") } : { disclosed: false })}
              label="Disclose a pay range"
              description="Optional, and encouraged for salaried and hourly roles. Shown exactly as entered."
            />
            {input.compensation.disclosed && (
              <div className="grid gap-4 sm:grid-cols-3">
                <Field id="opp-comp-min" label="Minimum" error={errorFor("compRange", "Enter a minimum (and a maximum at least that high).")}>
                  <Input id="opp-comp-min" type="number" inputMode="numeric" min={0} value={input.compensation.min ?? ""} onChange={(e) => setComp({ min: numberOrUndefined(e.target.value) })} />
                </Field>
                <Field id="opp-comp-max" label="Maximum" optional>
                  <Input id="opp-comp-max" type="number" inputMode="numeric" min={0} value={input.compensation.max ?? ""} onChange={(e) => setComp({ max: numberOrUndefined(e.target.value) })} />
                </Field>
                <Field id="opp-comp-period" label="Period">
                  <Select id="opp-comp-period" value={input.compensation.period ?? "year"} onChange={(e) => setComp({ period: e.target.value as "year" | "hour" })}>
                    <option value="year">Per year</option>
                    <option value="hour">Per hour</option>
                  </Select>
                </Field>
              </div>
            )}
            <Field id="opp-comp-notes" label="Compensation notes" error={errorFor("compNotes", "Describe the compensation approach (required for transparency).")} hint="Plain description of how the role is paid and when terms are confirmed in writing. Avoid income examples.">
              <Textarea id="opp-comp-notes" value={input.compensation.notes} onChange={(e) => setComp({ notes: e.target.value })} className="min-h-[80px]" placeholder="e.g. Base salary during the development period, plus incentive eligibility. Final terms confirmed in a written offer." />
              <div className="mt-1 text-right"><CharCount value={input.compensation.notes} min={15} /></div>
            </Field>
            <CompensationDisclaimer />
          </FormSection>

          <FormSection id="content" title="Listing content" description="What candidates read on the detail page.">
            <Field id="opp-summary" label="Summary" error={errorFor("summary", "Write a summary of at least 30 characters.")} hint="One or two sentences shown on cards and in search.">
              <Textarea id="opp-summary" value={input.summary} onChange={(e) => set("summary", e.target.value)} className="min-h-[72px]" maxLength={300} />
              <div className="mt-1 text-right"><CharCount value={input.summary} min={30} max={300} /></div>
            </Field>
            <Field id="opp-desc" label="Description" error={errorFor("description", "Write a description of at least 60 characters.")}>
              <Textarea id="opp-desc" value={input.description} onChange={(e) => set("description", e.target.value)} className="min-h-[140px]" />
              <div className="mt-1 text-right"><CharCount value={input.description} min={60} /></div>
            </Field>
            <Field label="Responsibilities" error={errorFor("responsibilities", "Add at least one responsibility.")}>
              <ListEditor value={input.responsibilities} onChange={(v) => set("responsibilities", v)} addLabel="Add responsibility" placeholder="What the person will actually do week to week." />
            </Field>
            <Field label="Requirements" error={errorFor("requirements", "Add at least one requirement.")}>
              <ListEditor value={input.requirements} onChange={(v) => set("requirements", v)} addLabel="Add requirement" placeholder="Licenses, experience and skills you need." />
            </Field>
            <Field label="Support you provide" optional>
              <ListEditor value={input.support} onChange={(v) => set("support", v)} addLabel="Add support item" placeholder="Mentorship, service staff, designations, tools." />
            </Field>
          </FormSection>

          <div className="flex flex-wrap items-center justify-end gap-2 border-t border-line pt-5">{actions}</div>
        </div>

        <aside className="space-y-5 lg:sticky lg:top-20 lg:self-start" aria-label="Pre-check and preview">
          <CompliancePanel flags={flags} checklist={checks} />
          <div>
            <div className="mb-2 flex items-center justify-between">
              <span className="eyebrow">Card preview</span>
              <span className="text-[11px] text-ink-4">How it appears in search</span>
            </div>
            <div inert aria-hidden className="pointer-events-none select-none">
              <OpportunityCard o={previewOpp} org={org} />
            </div>
          </div>
          <Card className="px-4 py-3.5">
            <div className="flex gap-2.5 text-[12.5px] leading-relaxed text-ink-3">
              <FileCheck2 className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" strokeWidth={1.75} />
              <p>
                {org.listingStatus === "approved"
                  ? "Listings without flags publish immediately. Flagged listings go to a human reviewer, usually within one business day (demo)."
                  : "Because your organization is awaiting approval, every listing you publish is held for review."}
              </p>
            </div>
          </Card>
          <p className="flex gap-2 px-1 text-[11.5px] leading-relaxed text-ink-4">
            <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
            Demo workspace — listings are stored only in this browser.
          </p>
        </aside>
      </div>
    </div>
  );
}
