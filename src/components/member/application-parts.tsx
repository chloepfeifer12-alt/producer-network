"use client";

import Link from "next/link";
import { CalendarClock, Check, ChevronRight, CircleX, Minus } from "lucide-react";
import type { Application, ApplicationShare, Opportunity, Organization, PipelineStage } from "@/lib/data/types";
import { OrgLogo } from "@/components/brand/org-logo";
import { StageBadge } from "@/components/domain/badges";
import { STAGE_LABEL } from "@/lib/data/taxonomy";
import { formatDate, formatDateTime, relativeDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { hasUpcomingInterview, INTERVIEW_FORMAT_LABEL } from "./utils";

type SafeApplication = Omit<Application, "notes">;

/* ------------------------------------------------------------------ */
/* Row used in the tracker and on the dashboard                        */
/* ------------------------------------------------------------------ */

export function ApplicationRow({ app, opp, org, compact }: { app: SafeApplication; opp?: Opportunity; org?: Organization; compact?: boolean }) {
  const upcoming = hasUpcomingInterview(app);
  return (
    <li className="group relative">
      <div className={cn("flex items-start gap-4 transition group-hover:bg-subtle/50", compact ? "px-5 py-4 sm:px-6" : "px-5 py-5 sm:px-6")}>
        {org ? <OrgLogo brand={org.brand} name={org.name} size={compact ? 36 : 42} /> : <span className="h-10 w-10 rounded-xl bg-sunken" />}
        <div className="min-w-0 flex-1">
          <div className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
            <div className="min-w-0">
              <h3 className="text-[14.5px] font-semibold leading-snug tracking-[-0.01em] text-ink">
                <Link href={`/me/applications/${app.id}`} className="after:absolute after:inset-0 focus-visible:outline-none">
                  {opp?.title ?? "Opportunity no longer listed"}
                </Link>
              </h3>
              <div className="mt-0.5 truncate text-[13px] text-ink-3">{org?.name ?? "Organization"}</div>
            </div>
            <div className="shrink-0">
              <StageBadge stage={app.stage} audience="applicant" withdrawn={app.withdrawn} />
            </div>
          </div>
          <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3" suppressHydrationWarning>
            <span>Submitted {formatDate(app.submittedAt)}</span>
            <span aria-hidden className="text-ink-4">·</span>
            <span>Updated {relativeDay(app.updatedAt).toLowerCase()}</span>
            {!compact && app.messages.length > 0 && (
              <>
                <span aria-hidden className="text-ink-4">·</span>
                <span>{app.messages.length} {app.messages.length === 1 ? "message" : "messages"}</span>
              </>
            )}
          </div>
          {upcoming && app.interview && (
            <div className="mt-3 inline-flex items-center gap-2 rounded-lg bg-gold-50 px-2.5 py-1.5 text-xs text-gold-ink ring-1 ring-inset ring-gold-200" suppressHydrationWarning>
              <CalendarClock className="h-3.5 w-3.5" />
              Interview {relativeDay(app.interview.at).toLowerCase()} · {formatDateTime(app.interview.at)} · {INTERVIEW_FORMAT_LABEL[app.interview.format]}
            </div>
          )}
        </div>
        <ChevronRight className="mt-1 hidden h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink-3 sm:block" />
      </div>
    </li>
  );
}

/* ------------------------------------------------------------------ */
/* Stage progress                                                      */
/* ------------------------------------------------------------------ */

const PROGRESS: { stage: PipelineStage; label: string }[] = [
  { stage: "new", label: "Submitted" },
  { stage: "under_review", label: "In review" },
  { stage: "interview", label: "Interview" },
  { stage: "offer", label: "Offer / contract" },
  { stage: "hired", label: "Hired / affiliated" },
];

/** Furthest stage reached before a close, inferred from the activity trail. */
function furthestReached(app: SafeApplication) {
  if (app.stage !== "closed") return PROGRESS.findIndex((p) => p.stage === app.stage);
  let max = 0;
  for (const e of app.activity) {
    PROGRESS.forEach((p, i) => {
      if (i > max && e.message.includes(STAGE_LABEL[p.stage])) max = i;
    });
  }
  return max;
}

export function StageProgress({ app }: { app: SafeApplication }) {
  const closed = app.stage === "closed" || app.withdrawn;
  const reached = furthestReached(app);
  return (
    <div>
      <ol className="grid gap-3 sm:grid-cols-5 sm:gap-2" aria-label="Application progress">
        {PROGRESS.map((p, i) => {
          const done = closed ? i <= reached : i < reached;
          const active = !closed && i === reached;
          return (
            <li key={p.stage} className="relative flex items-center gap-3 sm:flex-col sm:items-start sm:gap-2.5" aria-current={active ? "step" : undefined}>
              {i < PROGRESS.length - 1 && (
                <span
                  aria-hidden
                  className={cn(
                    "absolute left-[13px] top-7 h-[calc(100%-4px)] w-px sm:left-7 sm:top-[13px] sm:h-px sm:w-[calc(100%-20px)]",
                    i < reached ? (closed ? "bg-ink-4" : "bg-navy") : "bg-line-strong",
                  )}
                />
              )}
              <span
                className={cn(
                  "relative z-[1] flex h-[27px] w-[27px] shrink-0 items-center justify-center rounded-full ring-4 ring-surface",
                  done ? (closed ? "bg-ink-4 text-white" : "bg-navy text-white") : active ? "border-2 border-navy bg-surface" : "border border-line-strong bg-surface",
                )}
              >
                {done ? <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> : active ? <span className="h-2 w-2 rounded-full bg-navy" /> : null}
              </span>
              <span className={cn("text-[13px]", active ? "font-medium text-ink" : done ? "text-ink-2" : "text-ink-4")}>
                {p.label}
                {active && <span className="sr-only"> (current stage)</span>}
              </span>
            </li>
          );
        })}
      </ol>
      {closed && (
        <div className="mt-5 flex items-start gap-2.5 rounded-xl border border-line bg-subtle/70 px-4 py-3 text-[13px] text-ink-2">
          <CircleX className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" />
          <span>
            {app.withdrawn
              ? "You withdrew this application. The organization can no longer view your profile through it."
              : "This application was closed by the organization. Closed applications stay here for your records."}
          </span>
        </div>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* What you shared                                                     */
/* ------------------------------------------------------------------ */

export function shareRows(share: ApplicationShare, npnConsent: boolean) {
  return [
    { key: "contactEmail", label: "Contact email", shared: share.contactEmail, note: share.contactEmail ? undefined : "Organization uses platform messages instead" },
    { key: "licenses", label: "License records", shared: share.licenses, note: share.licenses ? "Self-reported — not verified" : undefined },
    {
      key: "npn",
      label: "NPN",
      shared: share.npn && npnConsent,
      note: share.npn && !npnConsent ? "Hidden — NPN sharing is off in your privacy settings" : undefined,
    },
    { key: "experience", label: "Work history", shared: share.experience, note: undefined },
  ];
}

export function ShareIcon({ shared, label }: { shared: boolean; label?: string }) {
  return shared ? (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-success-50 text-success ring-1 ring-inset ring-success/15" title={label ? `${label}: shared` : "Shared"}>
      <Check className="h-3 w-3" strokeWidth={2.5} />
      <span className="sr-only">Shared</span>
    </span>
  ) : (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-subtle text-ink-4 ring-1 ring-inset ring-line" title={label ? `${label}: not shared` : "Not shared"}>
      <Minus className="h-3 w-3" strokeWidth={2.5} />
      <span className="sr-only">Not shared</span>
    </span>
  );
}

export function SharedList({ share, npnConsent }: { share: ApplicationShare; npnConsent: boolean }) {
  return (
    <ul className="divide-y divide-line">
      {shareRows(share, npnConsent).map((r) => (
        <li key={r.key} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
          <span className="mt-0.5"><ShareIcon shared={r.shared} /></span>
          <div className="min-w-0">
            <div className={cn("text-sm", r.shared ? "text-ink" : "text-ink-3")}>{r.label}</div>
            {r.note && <div className="mt-0.5 text-xs leading-relaxed text-ink-3">{r.note}</div>}
          </div>
        </li>
      ))}
    </ul>
  );
}
