"use client";

import { useMemo, useState } from "react";
import { Ban, Save, Undo2 } from "lucide-react";
import type { Plan } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { updatePlan } from "@/lib/services/admin";
import { platformAnalytics } from "@/lib/services/analytics";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardFooter, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Field, Input } from "@/components/ui/form";
import { BarList } from "@/components/ui/charts";
import { Notice } from "@/components/ui/feedback";
import { toastResult } from "@/components/ui/toast";
import { GuardedButton, PermissionNotice } from "@/components/admin/admin-kit";
import { moneyExact } from "@/lib/utils/format";

interface Draft {
  priceMonthly: string;
  priceAnnual: string;
  activeOpportunities: string;
  seats: string;
  sponsoredSlots: string;
  tagline: string;
}

const toDraft = (p: Plan): Draft => ({
  priceMonthly: String(p.priceMonthly),
  priceAnnual: String(p.priceAnnual),
  activeOpportunities: p.limits.activeOpportunities == null ? "" : String(p.limits.activeOpportunities),
  seats: String(p.limits.seats),
  sponsoredSlots: String(p.limits.sponsoredSlots),
  tagline: p.tagline,
});

const PROHIBITED = [
  { title: "No commission sharing", body: "The platform never takes a share of producer commissions, overrides or contracting compensation." },
  { title: "No premium-based fees", body: "Pricing is never tied to premium volume, policies written or any insurance transaction." },
  { title: "No unreviewed placement fees", body: "No per-hire or per-affiliation fees, and no paid placement that bypasses listing moderation." },
];

function PlanEditor({ plan, orgCount }: { plan: Plan; orgCount: number }) {
  const user = useCurrentUser();
  const allowed = can(user, "admin:configure_plans");
  const [draft, setDraft] = useState<Draft>(() => toDraft(plan));
  const [errors, setErrors] = useState<Partial<Record<keyof Draft, string>>>({});
  const original = toDraft(plan);
  const dirty = (Object.keys(draft) as (keyof Draft)[]).some((k) => draft[k] !== original[k]);
  const set = (k: keyof Draft) => (e: React.ChangeEvent<HTMLInputElement>) => setDraft((d) => ({ ...d, [k]: e.target.value }));

  const save = () => {
    const e: Partial<Record<keyof Draft, string>> = {};
    const num = (k: keyof Draft, min: number, allowBlank = false) => {
      const v = draft[k].trim();
      if (allowBlank && v === "") return null;
      const n = Number(v);
      if (v === "" || !Number.isFinite(n) || n < min || !Number.isInteger(n)) e[k] = `Whole number ≥ ${min}${allowBlank ? ", or blank for unlimited" : ""}.`;
      return n;
    };
    const priceMonthly = num("priceMonthly", 0);
    const priceAnnual = num("priceAnnual", 0);
    const activeOpportunities = num("activeOpportunities", 1, true);
    const seats = num("seats", 1);
    const sponsoredSlots = num("sponsoredSlots", 0);
    if (draft.tagline.trim().length < 10) e.tagline = "At least 10 characters.";
    if (!e.priceAnnual && !e.priceMonthly && (priceAnnual ?? 0) > (priceMonthly ?? 0)) e.priceAnnual = "Annual (per month) shouldn't exceed the monthly price.";
    setErrors(e);
    if (Object.keys(e).length) return;
    const r = updatePlan(user, plan.id, {
      priceMonthly: priceMonthly!,
      priceAnnual: priceAnnual!,
      tagline: draft.tagline.trim(),
      limits: { activeOpportunities, seats: seats!, sponsoredSlots: sponsoredSlots! },
    });
    toastResult(r, `${plan.name} plan saved`, "Illustrative configuration updated · logged to the audit trail.");
  };

  return (
    <Card className={plan.highlighted ? "border-navy-200" : undefined}>
      <CardHeader
        title={<span className="flex items-center gap-2">{plan.name}{plan.highlighted && <Badge tone="navy">Most chosen</Badge>}</span>}
        description={`${orgCount} approved organization${orgCount === 1 ? "" : "s"} on this plan`}
        action={dirty ? <Badge tone="gold">Unsaved</Badge> : undefined}
      />
      <CardBody className="space-y-4">
        <fieldset disabled={!allowed} className="space-y-4">
          <legend className="sr-only">{plan.name} plan settings</legend>
          <div className="grid grid-cols-2 gap-3">
            <Field id={`${plan.id}-m`} label="Monthly price ($)" error={errors.priceMonthly}>
              <Input id={`${plan.id}-m`} inputMode="numeric" value={draft.priceMonthly} onChange={set("priceMonthly")} />
            </Field>
            <Field id={`${plan.id}-a`} label="Annual ($ / mo)" error={errors.priceAnnual}>
              <Input id={`${plan.id}-a`} inputMode="numeric" value={draft.priceAnnual} onChange={set("priceAnnual")} />
            </Field>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <Field id={`${plan.id}-o`} label="Active listings" error={errors.activeOpportunities} hint={draft.activeOpportunities.trim() === "" ? "Unlimited" : undefined}>
              <Input id={`${plan.id}-o`} inputMode="numeric" placeholder="∞" value={draft.activeOpportunities} onChange={set("activeOpportunities")} />
            </Field>
            <Field id={`${plan.id}-s`} label="Seats" error={errors.seats}>
              <Input id={`${plan.id}-s`} inputMode="numeric" value={draft.seats} onChange={set("seats")} />
            </Field>
            <Field id={`${plan.id}-sp`} label="Sponsored" error={errors.sponsoredSlots}>
              <Input id={`${plan.id}-sp`} inputMode="numeric" value={draft.sponsoredSlots} onChange={set("sponsoredSlots")} />
            </Field>
          </div>
          <Field id={`${plan.id}-t`} label="Tagline" error={errors.tagline}>
            <Input id={`${plan.id}-t`} value={draft.tagline} onChange={set("tagline")} />
          </Field>
        </fieldset>
        <div>
          <div className="mb-1.5 text-xs text-ink-3">Features (edited in product copy)</div>
          <ul className="list-disc space-y-0.5 pl-5 text-[12.5px] text-ink-3">{plan.features.map((f) => <li key={f}>{f}</li>)}</ul>
        </div>
      </CardBody>
      <CardFooter>
        <span className="text-xs text-ink-4">Illustrative · {moneyExact(plan.priceMonthly)}/mo now</span>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" disabled={!dirty} onClick={() => { setDraft(toDraft(plan)); setErrors({}); }}>
            <Undo2 className="h-3.5 w-3.5" /> Reset
          </Button>
          <GuardedButton user={user} permission="admin:configure_plans" variant="primary" size="sm" disabled={!dirty} onClick={save}>
            <Save className="h-3.5 w-3.5" /> Save
          </GuardedButton>
        </div>
      </CardFooter>
    </Card>
  );
}

export default function AdminPlansPage() {
  const db = useDb();
  const user = useCurrentUser();
  const a = useMemo(() => platformAnalytics(db), [db]);

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Plans (preview)"
        description="Configure the organization subscription tiers shown on pricing and billing pages. Members never pay to use the platform."
      />
      <Notice tone="demo" title="Illustrative pricing — no billing connected" className="mb-6">
        These values only change demo records in this browser. No payment processor is connected, no invoices are charged and no money moves.
      </Notice>
      <PermissionNotice user={user} permission="admin:configure_plans" what="plan configuration" />

      <div className="grid gap-4 lg:grid-cols-3">
        {db.plans.map((p) => (
          <PlanEditor key={p.id} plan={p} orgCount={a.planMix.find((m) => m.plan.id === p.id)?.count ?? 0} />
        ))}
      </div>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="Plan mix" description="Approved organizations by plan." />
          <CardBody>
            <BarList items={a.planMix.map((m) => ({ label: m.plan.name, value: m.count }))} />
            <p className="mt-4 text-xs text-ink-3">Illustrative MRR across approved organizations: <span className="font-medium text-ink">{moneyExact(a.illustrativeMRR)}</span> — no billing connected.</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Prohibited revenue models" description="Pricing must stay independent of insurance transactions and hiring outcomes." />
          <CardBody>
            <ul className="space-y-3.5">
              {PROHIBITED.map((p) => (
                <li key={p.title} className="flex gap-3 text-[13px]">
                  <Ban className="mt-0.5 h-4 w-4 shrink-0 text-danger" strokeWidth={1.75} />
                  <div><div className="font-medium text-ink">{p.title}</div><div className="mt-0.5 leading-relaxed text-ink-3">{p.body}</div></div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
