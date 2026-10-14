"use client";

import { Fragment, useMemo, useState } from "react";
import { ArrowRight, Check, Minus } from "lucide-react";
import type { Plan, PlanId } from "@/lib/data/types";
import { useDb, useHydrated } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { ButtonLink } from "@/components/ui/button";
import { Segmented } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

type Billing = "monthly" | "annual";
type Cell = boolean | string;

const COMPARISON: { group: string; rows: { label: string; hint?: string; values: (p: Plan) => Cell }[] }[] = [
  {
    group: "Presence",
    rows: [
      { label: "Organization profile", values: () => true },
      { label: "Culture, training & leadership sections", values: (p) => p.id !== "directory" },
      { label: "Directory placement", hint: "Organic results are never influenced by plan.", values: () => "Standard" },
      { label: "Listing review against platform standards", values: () => true },
    ],
  },
  {
    group: "Recruiting",
    rows: [
      { label: "Active opportunities", values: (p) => (p.limits.activeOpportunities == null ? "Unlimited" : String(p.limits.activeOpportunities)) },
      { label: "Team seats", values: (p) => String(p.limits.seats) },
      { label: "Application inbox", values: () => true },
      { label: "Recruiting pipeline, private notes & messaging", values: (p) => p.id !== "directory" },
      { label: "Consent-based talent discovery", values: (p) => p.id !== "directory" },
      { label: "Multi-office team management", values: (p) => p.id === "premier" },
    ],
  },
  {
    group: "Insight & promotion",
    rows: [
      { label: "Listing analytics", values: (p) => (p.id === "directory" ? false : p.id === "premier" ? "Advanced" : "Standard") },
      { label: "Exports", values: (p) => (p.id === "premier" ? "Planned" : false) },
      { label: "Sponsored placement credits", hint: "Per quarter. Always labeled and reviewed.", values: (p) => (p.limits.sponsoredSlots ? String(p.limits.sponsoredSlots) : false) },
      { label: "Dedicated success contact", values: (p) => (p.id === "premier" ? "Planned" : false) },
    ],
  },
];

function priceFor(p: Plan, billing: Billing) {
  return billing === "annual" ? p.priceAnnual : p.priceMonthly;
}

function savings(p: Plan) {
  if (!p.priceMonthly) return 0;
  return Math.round((1 - p.priceAnnual / p.priceMonthly) * 100);
}

function CellValue({ v }: { v: Cell }) {
  if (v === true) return <Check className="mx-auto h-4 w-4 text-navy" strokeWidth={2.25} aria-label="Included" />;
  if (v === false) return <Minus className="mx-auto h-4 w-4 text-ink-4" aria-label="Not included" />;
  return <span className="text-[13px] font-medium text-ink">{v}</span>;
}

export function PricingView() {
  const db = useDb();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const [billing, setBilling] = useState<Billing>("annual");
  const plans = useMemo(() => {
    const order: PlanId[] = ["directory", "growth", "premier"];
    return [...db.plans].sort((a, b) => order.indexOf(a.id) - order.indexOf(b.id));
  }, [db.plans]);

  const isOrg = hydrated && user?.kind === "organization";
  const ctaHref = isOrg ? "/org/billing" : "/join/organization";
  const maxSave = Math.max(0, ...plans.map(savings));

  return (
    <>
      <div className="mb-10 flex flex-col items-center gap-3">
        <Segmented
          ariaLabel="Billing period"
          value={billing}
          onChange={setBilling}
          items={[
            { value: "monthly", label: "Monthly" },
            { value: "annual", label: <>Annual {maxSave > 0 && <span className="text-[11px] text-success">−{maxSave}%</span>}</> },
          ]}
        />
        <p className="text-xs text-ink-3">{billing === "annual" ? "Shown per month, billed annually (illustrative)." : "Billed monthly (illustrative)."}</p>
      </div>

      <div className="grid gap-5 lg:grid-cols-3">
        {plans.map((p) => {
          const price = priceFor(p, billing);
          const featured = p.highlighted;
          return (
            <div
              key={p.id}
              className={cn(
                "relative flex flex-col rounded-[22px] border p-7 shadow-card sm:p-8",
                featured ? "border-navy bg-navy text-white shadow-pop lg:-my-3 lg:py-11" : "border-line bg-surface",
              )}
            >
              <div className="flex items-center justify-between gap-3">
                <h3 className={cn("font-display text-[28px] leading-none", featured ? "text-white" : "text-ink")}>{p.name}</h3>
                {featured && <Badge tone="gold" className="bg-gold-50">Most chosen</Badge>}
              </div>
              <p className={cn("mt-3 min-h-[44px] text-[14px] leading-relaxed", featured ? "text-white/70" : "text-ink-3")}>{p.tagline}</p>
              <div className="mt-6 flex items-baseline gap-1.5">
                <span className={cn("text-[44px] font-semibold tracking-[-0.04em] tabular-nums", featured ? "text-white" : "text-ink")}>
                  {price === 0 ? "$0" : `$${price.toLocaleString("en-US")}`}
                </span>
                <span className={cn("text-sm", featured ? "text-white/60" : "text-ink-3")}>/ month</span>
              </div>
              <p className={cn("mt-1 h-5 text-xs", featured ? "text-white/60" : "text-ink-3")}>
                {price === 0 ? "No cost to list" : billing === "annual" && savings(p) > 0 ? `Save ${savings(p)}% vs. monthly · illustrative` : "Illustrative price"}
              </p>
              <ButtonLink
                href={ctaHref}
                size="lg"
                variant={featured ? "secondary" : p.id === "directory" ? "secondary" : "primary"}
                className={cn("mt-7 w-full", featured && "border-white bg-white text-ink hover:bg-canvas")}
              >
                {isOrg ? "Preview in billing" : p.id === "directory" ? "List your organization" : `Apply with ${p.name}`}
                <ArrowRight className="h-4 w-4" />
              </ButtonLink>
              <ul className={cn("mt-8 space-y-3 border-t pt-7", featured ? "border-white/15" : "border-line")}>
                {p.features.map((f) => (
                  <li key={f} className={cn("flex gap-3 text-[14px] leading-snug", featured ? "text-white/85" : "text-ink-2")}>
                    <Check className={cn("mt-0.5 h-4 w-4 shrink-0", featured ? "text-gold-200" : "text-navy")} strokeWidth={2.25} />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
      {!isOrg && (
        <p className="mt-6 text-center text-xs text-ink-3">
          Every organization starts on Directory while its listing is reviewed. Already exploring as an organization persona? Plan previews live in{" "}
          <span className="font-medium text-ink-2">Plan &amp; billing</span> inside the recruiting workspace.
        </p>
      )}

      <section className="mt-24" aria-labelledby="compare-heading">
        <div className="mb-8 text-center">
          <div className="eyebrow mb-3">Compare</div>
          <h2 id="compare-heading" className="font-display text-[30px] leading-tight sm:text-[38px]">Full feature comparison</h2>
        </div>
        <div className="overflow-x-auto rounded-[22px] border border-line bg-surface shadow-card">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <caption className="sr-only">Feature comparison across plans</caption>
            <thead>
              <tr className="border-b border-line">
                <th scope="col" className="w-[40%] px-6 py-5 text-[13px] font-medium text-ink-3">Feature</th>
                {plans.map((p) => (
                  <th key={p.id} scope="col" className={cn("px-4 py-5 text-center", p.highlighted && "bg-navy-50/60")}>
                    <div className="text-[15px] font-semibold text-ink">{p.name}</div>
                    <div className="mt-0.5 text-xs font-normal tabular-nums text-ink-3">{priceFor(p, billing) === 0 ? "$0" : `$${priceFor(p, billing)}/mo`}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {COMPARISON.map((g) => (
                <Fragment key={g.group}>
                  <tr>
                    <th scope="colgroup" colSpan={plans.length + 1} className="bg-subtle px-6 py-2.5 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-3">
                      {g.group}
                    </th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="border-t border-line">
                      <th scope="row" className="px-6 py-4 text-[14px] font-normal text-ink-2">
                        {r.label}
                        {r.hint && <span className="mt-0.5 block text-xs text-ink-4">{r.hint}</span>}
                      </th>
                      {plans.map((p) => (
                        <td key={p.id} className={cn("px-4 py-4 text-center", p.highlighted && "bg-navy-50/60")}>
                          <CellValue v={r.values(p)} />
                        </td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
