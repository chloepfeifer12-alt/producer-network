"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, ArrowUpRight, Compass } from "lucide-react";
import type { Database, FitAnswers, ProducerProfile, User } from "@/lib/data/types";
import { lineName, stateName } from "@/lib/data/taxonomy";
import { applicationsForApplicant, applicationsForOrg } from "@/lib/services/applications";
import { interestsForOrg, interestsForUser } from "@/lib/services/portal";
import { introductionsForMember } from "@/lib/services/talent";
import { opportunitiesForOrg } from "@/lib/services/opportunities";
import { pendingIncoming } from "@/lib/services/network";
import { StageBadge } from "@/components/domain/badges";
import { OrgLogo } from "@/components/brand/org-logo";
import { relativeDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { FIT_AMBITION, FIT_ENV, FIT_MODEL, FIT_TRAINING, shortName, type HqMode } from "./hq-data";

function DeskHead({ children }: { children: React.ReactNode }) {
  return <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{children}</div>;
}

function DeskLink({ href, label, value, hint }: { href: string; label: string; value?: React.ReactNode; hint?: string }) {
  return (
    <Link href={href} className="group flex items-baseline justify-between gap-3 py-2.5 text-[13.5px] text-ink-2 transition hover:text-ink">
      <span className="min-w-0">
        <span className="decoration-1 underline-offset-4 group-hover:underline">{label}</span>
        {hint && <span className="block truncate text-[12px] text-ink-4">{hint}</span>}
      </span>
      {value != null && <span className="shrink-0 font-display text-[19px] leading-none tabular-nums text-ink">{value}</span>}
    </Link>
  );
}

const PORTAL_STATUS: Record<string, string> = { sent: "Sent", viewed: "Viewed", contacted: "They replied", closed: "Closed" };

/** Quiet quick-access rail for members: saved, applications, introductions, portal. */
export function MemberDesk({ db, user, mode }: { db: Database; user: User; mode: HqMode }) {
  const data = useMemo(() => {
    const savedOpps = db.savedOpportunities.filter((s) => s.userId === user.id).length;
    const savedOrgs = db.savedOrganizations.filter((s) => s.userId === user.id).length;
    const apps = applicationsForApplicant(db, user.id).filter((a) => !a.withdrawn).slice(0, 2);
    const portal = interestsForUser(db, user.id).filter((i) => i.status !== "closed");
    const intros = introductionsForMember(db, user.id).filter((i) => i.status === "sent");
    const requests = pendingIncoming(db, user.id).length;
    return { savedOpps, savedOrgs, apps, portal, intros, requests };
  }, [db, user.id]);
  const showPortal = mode === "new" || mode === "aspiring";

  return (
    <div className="text-[13.5px]">
      <DeskHead>Your desk</DeskHead>
      <div className="mt-2 divide-y divide-line border-b border-line">
        <DeskLink href="/me/saved" label="Saved" hint={`${data.savedOpps} opportunit${data.savedOpps === 1 ? "y" : "ies"} · ${data.savedOrgs} organization${data.savedOrgs === 1 ? "" : "s"}`} value={data.savedOpps + data.savedOrgs} />
        {data.requests > 0 && <DeskLink href="/network/connections" label="Connection requests" hint="Waiting for your reply" value={data.requests} />}
        {data.intros.length > 0 && <DeskLink href="/me" label="Introductions" hint={`From ${data.intros.map((i) => db.organizations.find((o) => o.id === i.orgId)?.name ?? "an organization").join(", ")}`} value={data.intros.length} />}
      </div>

      <div className="mt-6">
        <div className="flex items-baseline justify-between">
          <DeskHead>Applications</DeskHead>
          <Link href="/me/applications" className="text-[12.5px] text-ink-3 hover:text-ink">All</Link>
        </div>
        {data.apps.length ? (
          <ul className="mt-2 divide-y divide-line border-b border-line">
            {data.apps.map((a) => {
              const opp = db.opportunities.find((o) => o.id === a.opportunityId);
              const org = db.organizations.find((o) => o.id === a.orgId);
              return (
                <li key={a.id}>
                  <Link href={`/me/applications/${a.id}`} className="group flex items-start gap-3 py-3">
                    {org && <OrgLogo brand={org.brand} name={org.name} size={28} className="mt-0.5" />}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-[13.5px] font-medium text-ink decoration-1 underline-offset-4 group-hover:underline">{opp?.title ?? "Opportunity"}</span>
                      <span className="mt-0.5 block truncate text-[12px] text-ink-4">{org ? shortName(org) : ""} · {relativeDay(a.updatedAt)}</span>
                    </span>
                    <StageBadge stage={a.stage} audience="applicant" withdrawn={a.withdrawn} />
                  </Link>
                </li>
              );
            })}
          </ul>
        ) : (
          <p className="mt-2 border-b border-line pb-3 text-[13px] leading-relaxed text-ink-3">
            No applications yet. <Link href="/opportunities" className="text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">Browse opportunities</Link> when you&apos;re ready.
          </p>
        )}
      </div>

      {showPortal && (
        <div className="mt-6">
          <div className="flex items-baseline justify-between">
            <DeskHead>New Producer Portal</DeskHead>
            <Link href="/launch" className="text-[12.5px] text-ink-3 hover:text-ink">Open</Link>
          </div>
          {data.portal.length ? (
            <ul className="mt-2 divide-y divide-line border-b border-line">
              {data.portal.slice(0, 3).map((i) => {
                const org = db.organizations.find((o) => o.id === i.orgId);
                return (
                  <li key={i.id} className="flex items-center justify-between gap-3 py-2.5">
                    <span className="truncate text-ink-2">{org ? shortName(org) : "Company"}</span>
                    <span className={cn("shrink-0 text-[12px]", i.status === "contacted" ? "font-medium text-success" : "text-ink-4")}>{PORTAL_STATUS[i.status]}</span>
                  </li>
                );
              })}
            </ul>
          ) : (
            <p className="mt-2 border-b border-line pb-3 text-[13px] leading-relaxed text-ink-3">
              {mode === "aspiring" ? "When you're close to licensed, raise your hand to companies that train new producers." : "Raise your hand to several companies that train new producers — one introduction, your consent."}{" "}
              <Link href="/launch" className="whitespace-nowrap text-ink underline decoration-line-strong underline-offset-4 hover:decoration-ink">Visit the Portal</Link>
            </p>
          )}
        </div>
      )}
    </div>
  );
}

/** Organization variant: a quiet pointer back to the recruiting workspace. */
export function OrgDesk({ db, user }: { db: Database; user: User }) {
  const org = db.organizations.find((o) => o.id === user.orgId);
  const data = useMemo(() => {
    if (!user.orgId) return { open: 0, fresh: 0, interest: 0 };
    return {
      open: opportunitiesForOrg(db, user.orgId).filter((o) => o.status === "published").length,
      fresh: applicationsForOrg(db, user.orgId).filter((a) => a.stage === "new").length,
      interest: interestsForOrg(db, user.orgId).filter((i) => i.status === "sent").length,
    };
  }, [db, user.orgId]);
  return (
    <div>
      <DeskHead>Your recruiting workspace</DeskHead>
      {org && (
        <Link href="/org" className="group mt-4 flex items-center gap-3">
          <OrgLogo brand={org.brand} name={org.name} size={40} />
          <span className="min-w-0">
            <span className="block truncate text-[15px] font-semibold tracking-[-0.01em] text-ink decoration-1 underline-offset-4 group-hover:underline">{org.name}</span>
            <span className="block text-[12.5px] text-ink-4">You&apos;re browsing the Network as {user.orgRole === "owner" ? "an owner" : "a recruiter"}</span>
          </span>
        </Link>
      )}
      <div className="mt-4 divide-y divide-line border-y border-line">
        <DeskLink href="/org/opportunities" label="Published listings" value={data.open} />
        <DeskLink href="/org/pipeline?stage=new" label="New applications" value={data.fresh} />
        <DeskLink href="/org/portal" label="Portal hand-raises" value={data.interest} />
      </div>
      <Link href="/org" className="mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-600 hover:text-navy">
        Open the workspace <ArrowRight className="h-3.5 w-3.5" />
      </Link>
      <p className="mt-5 text-[12.5px] leading-relaxed text-ink-4">
        Members see your organization through its public profile. Candidate details only reach you through applications and consented introductions.
      </p>
    </div>
  );
}

/** Industry Fit: an invitation when absent, a short summary of the member's focus when present. */
export function FitPanel({ fit, profile, mode }: { fit?: FitAnswers; profile?: ProducerProfile; mode: HqMode }) {
  if (!fit) {
    return (
      <Link href="/fit" className="group relative block overflow-hidden rounded-2xl bg-navy p-6 text-white">
        <svg aria-hidden className="pointer-events-none absolute -right-10 -top-10 h-48 w-48 text-white/10 transition-transform duration-700 group-hover:rotate-12" viewBox="0 0 200 200">
          {[30, 52, 74, 96].map((r) => <circle key={r} cx="100" cy="100" r={r} fill="none" stroke="currentColor" strokeWidth="1.2" />)}
          <circle cx="152" cy="74" r="6" fill="currentColor" />
        </svg>
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-white/60">
          <Compass className="h-3.5 w-3.5" strokeWidth={1.75} /> Your Industry Fit
        </div>
        <p className="relative mt-3 font-display text-[24px] leading-[1.15]">
          {mode === "aspiring" ? "Not sure where you'd fit yet? Start here." : "Where do you fit best in the industry?"}
        </p>
        <p className="relative mt-2 text-[13.5px] leading-relaxed text-white/70">
          A few questions about how you like to work. Every match comes with its reasons — no black box, no hiring decisions.
        </p>
        <span className="relative mt-5 inline-flex items-center gap-1.5 text-[13px] font-medium">
          Find your fit <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </span>
      </Link>
    );
  }
  const lines = fit.lines.slice(0, 3).map((l) => lineName(l, true));
  return (
    <div className="rounded-2xl border border-line bg-surface p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">
          <Compass className="h-3.5 w-3.5" strokeWidth={1.75} /> Your Industry Fit
        </div>
        <span className="text-[11.5px] text-ink-4">Updated {relativeDay(fit.updatedAt).toLowerCase()}</span>
      </div>
      <p className="mt-3 font-display text-[21px] leading-[1.25] text-ink">
        {lines.join(", ")}
        <span className="text-ink-3"> — {FIT_MODEL[fit.model].toLowerCase()}, with {FIT_TRAINING[fit.training]}.</span>
      </p>
      <dl className="mt-4 grid grid-cols-2 gap-x-4 gap-y-2 border-t border-line pt-4 text-[12.5px]">
        <div>
          <dt className="text-ink-4">Setting</dt>
          <dd className="text-ink-2">{FIT_ENV[fit.environment]}{fit.state ? ` · ${stateName(fit.state)}` : profile?.state ? ` · ${profile.state}` : ""}</dd>
        </div>
        <div>
          <dt className="text-ink-4">Aiming to</dt>
          <dd className="text-ink-2">{fit.ambitions.map((a) => FIT_AMBITION[a]).join(", ") || "Keep options open"}</dd>
        </div>
      </dl>
      <p className="mt-4 text-[12px] leading-relaxed text-ink-4">Recommendations on this page use these answers. Preference matching only — never an employment decision.</p>
      <Link href="/fit" className="mt-3 inline-flex items-center gap-1.5 text-[13px] font-medium text-navy-600 hover:text-navy">
        Revisit your Fit <ArrowRight className="h-3.5 w-3.5" />
      </Link>
    </div>
  );
}
