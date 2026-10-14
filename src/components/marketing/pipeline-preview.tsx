"use client";

import { useMemo } from "react";
import { CalendarClock, ShieldCheck } from "lucide-react";
import type { PipelineStage } from "@/lib/data/types";
import { STAGE_LABEL } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { Avatar } from "@/components/ui/avatar";
import { DemoTag } from "@/components/ui/feedback";
import { OrgLogo } from "@/components/brand/org-logo";
import { relativeDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

const STAGES: PipelineStage[] = ["new", "under_review", "interview", "offer"];

/**
 * Read-only product preview: a miniature recruiting pipeline rendered from
 * the synthetic seed data of one demo organization. Purely illustrative.
 */
export function PipelinePreview({ orgId = "org_kestrelwood", className }: { orgId?: string; className?: string }) {
  const db = useDb();
  const { org, columns } = useMemo(() => {
    const org = db.organizations.find((o) => o.id === orgId) ?? db.organizations[0];
    const apps = db.applications.filter((a) => a.orgId === org?.id && !a.withdrawn);
    const columns = STAGES.map((stage) => ({
      stage,
      items: apps
        .filter((a) => a.stage === stage)
        .slice(0, 3)
        .map((a) => {
          const u = db.users.find((x) => x.id === a.applicantId);
          const p = db.profiles.find((x) => x.userId === a.applicantId);
          const opp = db.opportunities.find((x) => x.id === a.opportunityId);
          return { id: a.id, name: u?.name ?? "Applicant", tone: p?.avatarTone ?? 0, role: opp?.title ?? "Opportunity", submittedAt: a.submittedAt, licenses: a.share.licenses, interview: a.interview?.at };
        }),
      total: apps.filter((a) => a.stage === stage).length,
    }));
    return { org, columns };
  }, [db, orgId]);

  if (!org) return null;

  return (
    <figure className={cn("overflow-hidden rounded-[22px] border border-line bg-surface shadow-pop", className)} aria-label="Illustrative recruiting pipeline preview using demo data">
      <div className="flex items-center justify-between gap-3 border-b border-line bg-subtle/70 px-4 py-3 sm:px-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="hidden gap-1.5 sm:flex" aria-hidden>
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
            <span className="h-2.5 w-2.5 rounded-full bg-line-strong" />
          </div>
          <OrgLogo brand={org.brand} name={org.name} size={24} />
          <span className="truncate text-[13px] font-medium text-ink">{org.name}</span>
          <span className="hidden text-[13px] text-ink-4 sm:inline">/ Pipeline</span>
        </div>
        <DemoTag />
      </div>
      <div className="overflow-x-auto">
        <div className="grid min-w-[720px] grid-cols-4 gap-3 p-4 sm:p-5">
          {columns.map((c) => (
            <div key={c.stage} className="min-w-0 rounded-xl bg-subtle p-2.5">
              <div className="mb-2.5 flex items-center justify-between px-1">
                <span className="truncate text-[12px] font-medium text-ink-2">{STAGE_LABEL[c.stage]}</span>
                <span className="rounded-full bg-surface px-1.5 text-[11px] tabular-nums text-ink-3 ring-1 ring-line">{c.total}</span>
              </div>
              <div className="space-y-2">
                {c.items.map((it) => (
                  <div key={it.id} className="rounded-lg border border-line bg-surface p-3 shadow-card">
                    <div className="flex items-center gap-2.5">
                      <Avatar name={it.name} tone={it.tone} size={26} />
                      <div className="min-w-0">
                        <div className="truncate text-[12.5px] font-medium text-ink">{it.name}</div>
                        <div className="truncate text-[11px] text-ink-3">{it.role}</div>
                      </div>
                    </div>
                    <div className="mt-2.5 flex items-center justify-between gap-2 text-[10.5px] text-ink-4">
                      {it.interview ? (
                        <span className="inline-flex items-center gap-1 text-gold-ink"><CalendarClock className="h-3 w-3" />Interview set</span>
                      ) : (
                        <span suppressHydrationWarning>{relativeDay(it.submittedAt)}</span>
                      )}
                      {it.licenses && (
                        <span className="inline-flex items-center gap-1" title="Applicant chose to share license records (self-reported)">
                          <ShieldCheck className="h-3 w-3" /> Shared
                        </span>
                      )}
                    </div>
                  </div>
                ))}
                {c.items.length === 0 && <div className="rounded-lg border border-dashed border-line-strong px-3 py-5 text-center text-[11px] text-ink-4">No candidates</div>}
              </div>
            </div>
          ))}
        </div>
      </div>
      <figcaption className="border-t border-line px-4 py-3 text-[11.5px] leading-relaxed text-ink-3 sm:px-5">
        Demo data — fictional organization and candidates. Candidates appear only after they apply, and see only what they chose to share.
      </figcaption>
    </figure>
  );
}
