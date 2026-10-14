"use client";

import { Fragment, type ReactNode } from "react";
import { CircleAlert, CircleCheck, CircleX, ScrollText } from "lucide-react";
import type { Database, ModerationFlag, Organization } from "@/lib/data/types";
import { screenOpportunity, type ScreenableOpportunity } from "@/lib/services/moderation-rules";
import { ENGAGEMENT_FOR_KIND } from "@/lib/services/opportunities";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { cn } from "@/lib/utils/cn";

/* ------------------------------------------------------------------ */
/* Phrase highlighting                                                 */
/* ------------------------------------------------------------------ */

/**
 * Visual-only patterns used to <mark> risky phrases while a reviewer reads a
 * listing. They mirror the pre-screen in services/moderation-rules.ts; the
 * pre-screen remains the source of truth for flags.
 */
const RISK_PATTERNS: RegExp[] = [
  /six[\s-]?figures?(\s+your\s+first\s+year)?/gi,
  /seven[\s-]?figures?/gi,
  /unlimited\s+(income|earning|earnings|pay)/gi,
  /\bunlimited income\b/gi,
  /\$\s?\d{2,3}(,\d{3}|k)\+?(\s*(\/|per|a|in)?\s*(year one|year|yr|month|mo|week|wk))?/gi,
  /\b(earn|make|making|earning)\s+(up to\s+)?\$\s?\d[\d,k+]*/gi,
  /financial freedom/gi,
  /get rich/gi,
  /top (agents|producers|people|earners)( (earn|make))?/gi,
  /be your own boss/gi,
  /proven system/gi,
  /virtually unlimited/gi,
  /fastest growing/gi,
];
const GUARANTEE = /\bguarantee(d|s)?\b[^.!?\n]{0,30}/gi;
const NEGATION = /\b(no|not|never|cannot|can't|without)\b[\w\s,'-]{0,40}$/i;

type Range = [number, number];

function riskRanges(text: string, extra: string[] = []): Range[] {
  const ranges: Range[] = [];
  for (const re of RISK_PATTERNS) {
    for (const m of text.matchAll(re)) if (m.index != null) ranges.push([m.index, m.index + m[0].length]);
  }
  for (const m of text.matchAll(GUARANTEE)) {
    if (m.index == null) continue;
    const before = text.slice(Math.max(0, m.index - 45), m.index);
    if (!NEGATION.test(before)) ranges.push([m.index, m.index + m[0].length]);
  }
  for (const phrase of extra) {
    const p = phrase.replace(/^…|…$/g, "").trim();
    if (p.length < 6) continue;
    const i = text.toLowerCase().indexOf(p.toLowerCase());
    if (i >= 0) ranges.push([i, i + p.length]);
  }
  ranges.sort((a, b) => a[0] - b[0]);
  const merged: Range[] = [];
  for (const r of ranges) {
    const last = merged[merged.length - 1];
    if (last && r[0] <= last[1]) last[1] = Math.max(last[1], r[1]);
    else merged.push([r[0], r[1]]);
  }
  return merged;
}

export function hasRiskLanguage(text: string) {
  return riskRanges(text).length > 0;
}

/** Renders text with risky phrases wrapped in <mark>. */
export function Highlight({ text, extra }: { text: string; extra?: string[] }) {
  const ranges = riskRanges(text, extra);
  if (!ranges.length) return <>{text}</>;
  const out: ReactNode[] = [];
  let pos = 0;
  ranges.forEach(([s, e], i) => {
    if (s > pos) out.push(<Fragment key={`t${i}`}>{text.slice(pos, s)}</Fragment>);
    out.push(
      <mark key={`m${i}`} className="rounded-[3px] bg-danger-50 px-0.5 text-danger ring-1 ring-inset ring-danger/20">
        {text.slice(s, e)}
      </mark>,
    );
    pos = e;
  });
  if (pos < text.length) out.push(<Fragment key="tail">{text.slice(pos)}</Fragment>);
  return <>{out}</>;
}

/* ------------------------------------------------------------------ */
/* Flags                                                               */
/* ------------------------------------------------------------------ */

export function FlagList({ flags, className, compact }: { flags: ModerationFlag[]; className?: string; compact?: boolean }) {
  if (!flags.length) {
    return (
      <p className={cn("flex items-center gap-1.5 text-[13px] text-success", className)}>
        <CircleCheck className="h-3.5 w-3.5" /> No automated pre-screen flags
      </p>
    );
  }
  return (
    <ul className={cn("space-y-2", className)}>
      {flags.map((f, i) => (
        <li key={`${f.code}-${i}`} className="flex gap-2 text-[13px]">
          <CircleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0 text-danger" />
          <div className="min-w-0">
            <span className="font-medium text-ink">{f.label}</span>
            {f.excerpt && !compact && (
              <div className="mt-0.5 text-ink-3">
                “<Highlight text={f.excerpt} extra={[f.excerpt]} />”
              </div>
            )}
            {f.excerpt && compact && <span className="text-ink-3"> · “{f.excerpt}”</span>}
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* Policy                                                              */
/* ------------------------------------------------------------------ */

export const MODERATION_POLICY: { title: string; body: string }[] = [
  { title: "No unsubstantiated income claims", body: "No earnings figures, projections, “six figures” or “top earner” language without a documented, reviewable basis." },
  { title: "No guarantee language", body: "Nothing that implies guaranteed income, results, leads or advancement." },
  { title: "Disclose producer-paid costs", body: "Leads, fees, technology, licensing or training costs paid by the producer must be stated plainly." },
  { title: "Accurate W-2 vs. contracting classification", body: "Employment must be W-2; affiliation / contracting must be presented as independent contractor work — never as a salaried job." },
  { title: "No misleading titles", body: "Titles describe the role, not a pitch. No exclamation marks, dollar signs or promotional slogans." },
];

export function ModerationPolicyCard({ className }: { className?: string }) {
  return (
    <Card className={className}>
      <CardHeader eyebrow="Moderation policy" title="What every listing must meet" description="The automated pre-screen only routes content to human review — it never auto-rejects." action={<ScrollText className="h-4 w-4 text-ink-4" />} />
      <CardBody>
        <ol className="space-y-3">
          {MODERATION_POLICY.map((p, i) => (
            <li key={p.title} className="flex gap-3 text-[13px]">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-50 text-[11px] font-semibold text-navy-600 ring-1 ring-navy-100">{i + 1}</span>
              <div>
                <div className="font-medium text-ink">{p.title}</div>
                <div className="mt-0.5 leading-relaxed text-ink-3">{p.body}</div>
              </div>
            </li>
          ))}
        </ol>
      </CardBody>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/* Organization review checklist                                       */
/* ------------------------------------------------------------------ */

/** Adapts an organization profile into the shape the listing pre-screen understands. */
export function screenableFromOrganization(org: Organization): ScreenableOpportunity {
  return {
    title: org.tagline,
    summary: org.tagline,
    description: [org.about, org.culture.summary, ...org.culture.values.map((v) => `${v.title}. ${v.description}`)].join(" \n "),
    compensation: { model: "salary", disclosed: false, notes: org.compensationApproach },
    leads: org.leadProgram.policy,
    leadsNotes: org.leadProgram.description,
    responsibilities: org.trainingPrograms.map((t) => `${t.name}: ${t.description}`),
    requirements: [],
    support: [org.mentorship.description, ...org.leadership.map((l) => l.bio)],
  };
}

export type CheckStatus = "pass" | "warn" | "fail";
export interface ReviewCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  excerpt?: string;
}

export function organizationChecklist(db: Database, org: Organization): { checks: ReviewCheck[]; flags: ModerationFlag[] } {
  const flags = screenOpportunity(screenableFromOrganization(org)).map((f) =>
    f.code === "misleading_title" ? { ...f, label: "Tagline uses promotional language" } : f,
  );
  const has = (code: ModerationFlag["code"]) => flags.find((f) => f.code === code);
  const income = has("income_claim");
  const guarantee = has("guarantee_language");
  const promo = has("misleading_title");
  const opps = db.opportunities.filter((o) => o.orgId === org.id);
  const misclassified = opps.filter((o) => !ENGAGEMENT_FOR_KIND[o.kind].includes(o.engagement));
  const comp = org.compensationApproach.trim();

  const checks: ReviewCheck[] = [
    {
      id: "comp",
      label: "Compensation approach described",
      status: comp.length < 15 ? "fail" : income ? "warn" : "pass",
      detail: comp.length < 15 ? "No meaningful description of how team members are paid." : income ? "Described, but contains language the pre-screen flagged." : "Plain-language description provided.",
      excerpt: comp || undefined,
    },
    {
      id: "training",
      label: "Training described",
      status: org.trainingPrograms.length > 0 ? "pass" : org.trainingAvailable ? "fail" : "warn",
      detail:
        org.trainingPrograms.length > 0
          ? `${org.trainingPrograms.length} program${org.trainingPrograms.length === 1 ? "" : "s"} described.`
          : org.trainingAvailable
            ? "Claims training is available but describes no programs."
            : "States no training is offered — confirm this is accurate.",
    },
    {
      id: "income",
      label: "No income claims or guarantee language",
      status: income || guarantee ? "fail" : "pass",
      detail: income || guarantee ? [income?.label, guarantee?.label].filter(Boolean).join(" · ") : "Pre-screen found no earnings claims or guarantees.",
      excerpt: income?.excerpt ?? guarantee?.excerpt,
    },
    {
      id: "costs",
      label: "Producer-paid costs disclosed",
      status: org.leadProgram.policy === "available_at_cost" ? (org.leadProgram.description.trim().length >= 30 && !has("undisclosed_costs") ? "pass" : "fail") : "pass",
      detail:
        org.leadProgram.policy === "available_at_cost"
          ? org.leadProgram.description.trim().length >= 30
            ? "Producer-paid leads are disclosed with a description."
            : "Producer-paid leads offered without a clear cost disclosure."
          : "No producer-paid lead program declared.",
      excerpt: org.leadProgram.policy === "available_at_cost" ? org.leadProgram.description || undefined : undefined,
    },
    {
      id: "tagline",
      label: "No promotional tagline",
      status: promo ? "fail" : "pass",
      detail: promo ? "Tagline reads as a sales pitch rather than a description." : "Tagline is descriptive.",
      excerpt: promo ? org.tagline : undefined,
    },
    {
      id: "classification",
      label: "Accurate W-2 vs. contracting classification",
      status: org.engagementTypes.length === 0 || misclassified.length ? "fail" : "pass",
      detail: misclassified.length
        ? `${misclassified.length} listing(s) mix employment and contractor engagement.`
        : org.engagementTypes.length
          ? `Declares ${org.engagementTypes.map((e) => (e === "w2" ? "W-2 employment" : "independent contracting")).join(" and ")}; listings are consistent.`
          : "No engagement type declared.",
    },
    {
      id: "complete",
      label: "Profile completeness",
      status: org.about.trim().length >= 60 && org.leadership.length > 0 && org.culture.summary.trim().length >= 10 ? "pass" : "warn",
      detail: [
        org.about.trim().length < 60 && "About section is short",
        org.leadership.length === 0 && "no leadership listed",
        org.culture.summary.trim().length < 10 && "culture not described",
      ]
        .filter(Boolean)
        .join(" · ") || "About, leadership and culture provided.",
    },
  ];
  return { checks, flags };
}

export function CheckIcon({ status }: { status: CheckStatus }) {
  if (status === "pass") return <CircleCheck className="h-4 w-4 text-success" aria-label="Pass" />;
  if (status === "warn") return <CircleAlert className="h-4 w-4 text-warning" aria-label="Needs attention" />;
  return <CircleX className="h-4 w-4 text-danger" aria-label="Fails" />;
}
