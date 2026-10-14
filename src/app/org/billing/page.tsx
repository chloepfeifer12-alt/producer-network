"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, CreditCard, Megaphone, Receipt, ShieldCheck } from "lucide-react";
import type { Plan, PlanId, SponsoredPlacement, SponsoredSurface } from "@/lib/data/types";
import { can } from "@/lib/auth/permissions";
import { changePlanDemo, planUsage, requestSponsoredPlacement } from "@/lib/services/billing";
import { OrgScope, OrgStatusNotice, ReadOnlyNotice, type OrgContext } from "@/components/org/org-scope";
import { SURFACE_INFO } from "@/components/org/org-utils";
import { PageHeader } from "@/components/ui/page";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { DemoTag, EmptyState, Notice, SponsoredTag } from "@/components/ui/feedback";
import { Field, Select } from "@/components/ui/form";
import { ProgressBar } from "@/components/ui/stat";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/dates";
import { moneyExact } from "@/lib/utils/format";

const PLACEMENT_TONE: Record<SponsoredPlacement["status"], BadgeTone> = { active: "success", scheduled: "navy", requested: "gold", paused: "neutral", ended: "outline" };
const PLACEMENT_LABEL: Record<SponsoredPlacement["status"], string> = { active: "Active", scheduled: "Scheduled", requested: "Awaiting platform review", paused: "Paused", ended: "Ended" };

export default function BillingPage() {
  return <OrgScope>{(ctx) => <Billing {...ctx} />}</OrgScope>;
}

function UsageRow({ label, used, limit }: { label: string; used: number; limit: number | null }) {
  return (
    <div>
      <div className="mb-1.5 flex items-baseline justify-between text-[13px]">
        <span className="text-ink-3">{label}</span>
        <span className="font-medium tabular-nums text-ink">{used}<span className="font-normal text-ink-3"> / {limit == null ? "Unlimited" : limit}</span></span>
      </div>
      {limit == null ? <div className="h-1.5 rounded-full bg-navy-50" aria-hidden /> : <ProgressBar value={limit === 0 ? 0 : (used / limit) * 100} tone={limit > 0 && used >= limit ? "gold" : "navy"} />}
    </div>
  );
}

function Billing(ctx: OrgContext) {
  const { db, user, org } = ctx;
  const canManage = can(user, "org:manage_billing");
  const usage = useMemo(() => planUsage(db, org.id), [db, org.id]);
  const placements = useMemo(() => db.sponsored.filter((s) => s.orgId === org.id).sort((a, b) => b.createdAt.localeCompare(a.createdAt)), [db, org.id]);
  const invoices = useMemo(() => db.invoices.filter((i) => i.orgId === org.id).sort((a, b) => b.issuedOn.localeCompare(a.issuedOn)), [db, org.id]);
  const [preview, setPreview] = useState<Plan | null>(null);
  const [requestOpen, setRequestOpen] = useState(false);
  const plan = usage.plan;
  const currentIdx = db.plans.findIndex((p) => p.id === plan.id);
  const slotsLeft = plan.limits.sponsoredSlots - usage.sponsored;
  const approved = org.listingStatus === "approved";

  return (
    <div>
      <PageHeader
        eyebrow="Organization"
        title="Plan & billing"
        description="Flat subscription pricing for recruiting tools. The platform never takes commission sharing, premium-based fees or a cut of producer compensation."
        actions={<DemoTag>Demo billing — no payments</DemoTag>}
      />
      <div className="mb-6 space-y-3">
        <OrgStatusNotice org={org} />
        {!canManage && <ReadOnlyNotice what="change plans, request sponsored placements or manage payment details" />}
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px]">
        <Card>
          <div className="flex flex-col gap-4 px-5 pt-5 sm:flex-row sm:items-start sm:justify-between sm:px-6">
            <div>
              <div className="eyebrow mb-1.5">Current plan</div>
              <h2 className="font-display text-[28px] leading-tight text-ink">{plan.name}</h2>
              <p className="mt-1 text-[13.5px] text-ink-3">{plan.tagline}</p>
            </div>
            <div className="text-left sm:text-right">
              <div className="text-[22px] font-semibold tabular-nums tracking-[-0.02em] text-ink">{plan.priceMonthly ? moneyExact(plan.priceMonthly) : "Free"}<span className="text-sm font-normal text-ink-3">{plan.priceMonthly ? " / month" : ""}</span></div>
              <div className="text-xs text-ink-4">Illustrative pricing</div>
            </div>
          </div>
          <div className="grid gap-5 px-5 pb-6 pt-6 sm:grid-cols-3 sm:px-6">
            <UsageRow label="Active listings" used={usage.active} limit={plan.limits.activeOpportunities} />
            <UsageRow label="Team seats" used={usage.seats} limit={plan.limits.seats} />
            <UsageRow label="Sponsored slots" used={usage.sponsored} limit={plan.limits.sponsoredSlots} />
          </div>
        </Card>

        <Card className="flex flex-col">
          <CardHeader title="Payment method" />
          <div className="flex flex-1 flex-col px-5 pb-5 pt-4 sm:px-6">
            <div className="flex items-center gap-3 rounded-xl border border-dashed border-line-strong bg-subtle/50 px-4 py-4">
              <CreditCard className="h-5 w-5 text-ink-4" strokeWidth={1.75} />
              <div>
                <div className="text-[13.5px] font-medium text-ink">Not connected in prototype</div>
                <div className="text-xs text-ink-3">No card is collected and no payment processor is connected.</div>
              </div>
            </div>
            <div className="mt-4 flex gap-2.5 text-[12.5px] leading-relaxed text-ink-3">
              <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" strokeWidth={1.75} />
              <p>Pricing is a flat subscription. No commission sharing, no premium-based fees, no per-hire fees. See <Link href="/pricing" className="text-navy-600 hover:text-navy">pricing</Link>.</p>
            </div>
          </div>
        </Card>
      </div>

      <section aria-labelledby="plans-heading" className="mb-10">
        <h2 id="plans-heading" className="mb-4 text-[17px] font-semibold tracking-[-0.01em]">Compare plans</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {db.plans.map((p, i) => {
            const current = p.id === plan.id;
            const direction = i > currentIdx ? "upgrade" : "downgrade";
            return (
              <Card key={p.id} className={cn("flex flex-col p-5 sm:p-6", current && "border-navy-200 ring-1 ring-navy-200")}>
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-[16px] font-semibold text-ink">{p.name}</h3>
                  {current ? <Badge tone="navy">Current plan</Badge> : p.highlighted ? <Badge tone="gold">Most chosen</Badge> : null}
                </div>
                <div className="mt-3 text-[26px] font-semibold tabular-nums tracking-[-0.03em] text-ink">
                  {p.priceMonthly ? moneyExact(p.priceMonthly) : "Free"}
                  {p.priceMonthly > 0 && <span className="text-sm font-normal text-ink-3"> / mo</span>}
                </div>
                {p.priceAnnual > 0 && <div className="text-xs text-ink-4">{moneyExact(p.priceAnnual)}/mo billed annually · illustrative</div>}
                <p className="mt-3 text-[13px] leading-relaxed text-ink-3">{p.tagline}</p>
                <ul className="mt-4 space-y-2 text-[13px] text-ink-2">
                  {p.features.map((f) => (
                    <li key={f} className="flex gap-2"><Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-navy" strokeWidth={2.25} />{f}</li>
                  ))}
                </ul>
                <div className="mt-auto pt-6">
                  {current ? (
                    <Button variant="quiet" size="sm" className="w-full" disabled>Your current plan</Button>
                  ) : (
                    <Button variant={direction === "upgrade" ? "accent" : "secondary"} size="sm" className="w-full" disabled={!canManage} onClick={() => setPreview(p)}>
                      Preview {direction}
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </section>

      <section aria-labelledby="spn-heading" className="mb-10">
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 id="spn-heading" className="text-[17px] font-semibold tracking-[-0.01em]">Sponsored placements</h2>
            <p className="mt-1 max-w-2xl text-[13px] leading-relaxed text-ink-3">
              Always labeled <SponsoredTag className="mx-0.5 align-middle" /> and shown in a separate block — never mixed into organic results or ranking. Every request is reviewed by the platform team.
            </p>
          </div>
          <Button variant="secondary" size="sm" disabled={!canManage || !approved || slotsLeft <= 0} onClick={() => setRequestOpen(true)}>
            <Megaphone className="h-4 w-4" /> Request placement
          </Button>
        </div>
        {canManage && (!approved || slotsLeft <= 0) && (
          <p className="mb-3 text-xs text-ink-3">
            {!approved
              ? "Sponsored placements are available once your organization is approved."
              : plan.limits.sponsoredSlots === 0
                ? "Your plan doesn't include sponsored placements. Growth and Premier include placement credits."
                : `All ${plan.limits.sponsoredSlots} sponsored slot(s) on your plan are in use.`}
          </p>
        )}
        {placements.length === 0 ? (
          <EmptyState compact icon={<Megaphone className="h-5 w-5" strokeWidth={1.75} />} title="No sponsored placements" description="Requested, scheduled and past placements will appear here." />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead className="border-b border-line bg-subtle/60 text-xs text-ink-3">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium sm:px-6">Surface</th>
                    <th scope="col" className="px-4 py-3 font-medium">Promoting</th>
                    <th scope="col" className="px-4 py-3 font-medium">Window</th>
                    <th scope="col" className="px-5 py-3 font-medium sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {placements.map((s) => {
                    const opp = s.opportunityId ? db.opportunities.find((o) => o.id === s.opportunityId) : undefined;
                    return (
                      <tr key={s.id}>
                        <td className="px-5 py-3 font-medium text-ink sm:px-6">{SURFACE_INFO[s.surface].label}</td>
                        <td className="max-w-[260px] truncate px-4 py-3 text-ink-2">{opp?.title ?? "Organization profile"}</td>
                        <td className="whitespace-nowrap px-4 py-3 text-ink-3">{formatDate(s.startsOn, { month: "short", day: "numeric" })} – {formatDate(s.endsOn)}</td>
                        <td className="px-5 py-3 sm:px-6"><Badge tone={PLACEMENT_TONE[s.status]}>{PLACEMENT_LABEL[s.status]}</Badge></td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        )}
      </section>

      <section aria-labelledby="inv-heading">
        <h2 id="inv-heading" className="mb-4 text-[17px] font-semibold tracking-[-0.01em]">Invoices</h2>
        {invoices.length === 0 ? (
          <EmptyState compact icon={<Receipt className="h-5 w-5" strokeWidth={1.75} />} title="No invoices" description={plan.priceMonthly ? "Illustrative invoices will appear here." : "The Directory plan is free — there's nothing to bill."} />
        ) : (
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead className="border-b border-line bg-subtle/60 text-xs text-ink-3">
                  <tr>
                    <th scope="col" className="px-5 py-3 font-medium sm:px-6">Date</th>
                    <th scope="col" className="px-4 py-3 font-medium">Description</th>
                    <th scope="col" className="px-4 py-3 text-right font-medium">Amount</th>
                    <th scope="col" className="px-5 py-3 font-medium sm:px-6">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-line">
                  {invoices.map((inv) => (
                    <tr key={inv.id}>
                      <td className="whitespace-nowrap px-5 py-3 text-ink-2 sm:px-6">{formatDate(inv.issuedOn)}</td>
                      <td className="px-4 py-3 text-ink">{inv.description}</td>
                      <td className="px-4 py-3 text-right tabular-nums text-ink">{moneyExact(inv.amount)}</td>
                      <td className="px-5 py-3 sm:px-6">
                        <Badge tone={inv.status === "demo_paid" ? "success" : "neutral"}>{inv.status === "demo_paid" ? "Paid (demo)" : "Upcoming (demo)"}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="border-t border-line px-5 py-3 text-xs text-ink-4 sm:px-6">Illustrative records only. No money has moved.</p>
          </Card>
        )}
      </section>

      <PlanDialog ctx={ctx} target={preview} onClose={() => setPreview(null)} />
      <SponsoredDialog ctx={ctx} open={requestOpen} onClose={() => setRequestOpen(false)} />
    </div>
  );
}

function limitLabel(n: number | null) {
  return n == null ? "Unlimited" : String(n);
}

function PlanDialog({ ctx, target, onClose }: { ctx: OrgContext; target: Plan | null; onClose: () => void }) {
  const { db, user, org } = ctx;
  const usage = planUsage(db, org.id);
  if (!target) return null;
  const current = usage.plan;
  const overLimit = target.limits.activeOpportunities != null && usage.active > target.limits.activeOpportunities;
  const rows: { label: string; from: string; to: string }[] = [
    { label: "Price (illustrative)", from: current.priceMonthly ? `${moneyExact(current.priceMonthly)}/mo` : "Free", to: target.priceMonthly ? `${moneyExact(target.priceMonthly)}/mo` : "Free" },
    { label: "Active listings", from: limitLabel(current.limits.activeOpportunities), to: limitLabel(target.limits.activeOpportunities) },
    { label: "Team seats", from: String(current.limits.seats), to: String(target.limits.seats) },
    { label: "Sponsored slots", from: String(current.limits.sponsoredSlots), to: String(target.limits.sponsoredSlots) },
  ];
  const confirm = () => {
    const r = changePlanDemo(user, org.id, target.id as PlanId);
    if (r.ok) {
      toast(`Switched to ${target.name} (demo)`, { body: "No payment was processed and no card was collected." });
      onClose();
    } else toast("Couldn't change plan", { body: r.error, tone: "error" });
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={`Preview: ${current.name} → ${target.name}`}
      description="Review what changes before confirming."
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="accent" size="sm" onClick={confirm}>Confirm demo change</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Notice tone="demo" title="Demo only">No payment is processed, no card is collected. This only updates the prototype&apos;s local demo data.</Notice>
        <div className="overflow-hidden rounded-xl border border-line">
          <table className="w-full text-sm">
            <thead className="bg-subtle/60 text-xs text-ink-3">
              <tr>
                <th scope="col" className="px-4 py-2 text-left font-medium"><span className="sr-only">Item</span></th>
                <th scope="col" className="px-4 py-2 text-right font-medium">{current.name}</th>
                <th scope="col" className="px-4 py-2 text-right font-medium">{target.name}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.label}>
                  <td className="px-4 py-2.5 text-ink-3">{r.label}</td>
                  <td className="px-4 py-2.5 text-right tabular-nums text-ink-2">{r.from}</td>
                  <td className={cn("px-4 py-2.5 text-right tabular-nums", r.from !== r.to ? "font-medium text-ink" : "text-ink-2")}>{r.to}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {overLimit && (
          <Notice tone="warning">
            You have {usage.active} active listings; {target.name} allows {target.limits.activeOpportunities}. Existing listings stay live, but you won&apos;t be able to publish more until you&apos;re under the limit.
          </Notice>
        )}
      </div>
    </Dialog>
  );
}

function SponsoredDialog({ ctx, open, onClose }: { ctx: OrgContext; open: boolean; onClose: () => void }) {
  const { db, user, org } = ctx;
  const [surface, setSurface] = useState<SponsoredSurface>("search_top");
  const [oppId, setOppId] = useState("");
  const published = useMemo(() => db.opportunities.filter((o) => o.orgId === org.id && o.status === "published"), [db, org.id]);
  const submit = () => {
    const r = requestSponsoredPlacement(user, org.id, surface, oppId || undefined);
    if (r.ok) {
      toast("Placement requested", { body: "The platform team will review it before it's scheduled. No charge in the prototype." });
      setOppId("");
      onClose();
    } else toast("Couldn't request placement", { body: r.error, tone: "error" });
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title="Request a sponsored placement"
      description="Requests are reviewed by the platform team. Approved placements run for 30 days and are always labeled as sponsored."
      size="lg"
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          <Button variant="accent" size="sm" onClick={submit}>Submit for review</Button>
        </>
      }
    >
      <div className="space-y-5">
        <fieldset>
          <legend className="mb-2 text-[13px] font-medium text-ink-2">Surface</legend>
          <div role="radiogroup" className="grid gap-2 sm:grid-cols-2">
            {(Object.keys(SURFACE_INFO) as SponsoredSurface[]).map((s) => {
              const active = s === surface;
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSurface(s)}
                  className={cn("rounded-xl border p-3.5 text-left transition", active ? "border-navy bg-navy-50/70 ring-1 ring-navy" : "border-line-strong hover:border-ink-4")}
                >
                  <span className="block text-[13.5px] font-medium text-ink">{SURFACE_INFO[s].label}</span>
                  <span className="mt-0.5 block text-xs leading-relaxed text-ink-3">{SURFACE_INFO[s].description}</span>
                </button>
              );
            })}
          </div>
        </fieldset>
        <Field id="spn-opp" label="Promote a specific listing" optional hint={published.length ? "Leave blank to promote your organization profile." : "You have no published listings; the placement will promote your organization profile."}>
          <Select id="spn-opp" value={oppId} onChange={(e) => setOppId(e.target.value)} disabled={!published.length}>
            <option value="">Organization profile</option>
            {published.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </Select>
        </Field>
        <Notice tone="demo">Demo only — no payment is processed and no card is collected.</Notice>
      </div>
    </Dialog>
  );
}
