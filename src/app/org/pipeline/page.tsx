"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Briefcase, Columns3, Hash, IdCard, Inbox, List, Mail, Search, X } from "lucide-react";
import type { Application, Database, PipelineStage } from "@/lib/data/types";
import { STAGE_LABEL, STAGE_ORDER } from "@/lib/data/taxonomy";
import { applicationsForOrg, moveApplicationStage } from "@/lib/services/applications";
import { opportunitiesForOrg } from "@/lib/services/opportunities";
import { OrgScope, OrgStatusNotice, type OrgContext } from "@/components/org/org-scope";
import { daysSince, daysSinceLabel, personName } from "@/components/org/org-utils";
import { PageHeader } from "@/components/ui/page";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { Input, Select } from "@/components/ui/form";
import { Segmented } from "@/components/ui/tabs";
import { toast } from "@/components/ui/toast";
import { StageBadge } from "@/components/domain/badges";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/dates";

const VIEW_KEY = "pn:org-pipeline-view";

export default function PipelinePage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <OrgScope>{(ctx) => <Pipeline {...ctx} />}</OrgScope>
    </Suspense>
  );
}

function isStage(v: string | null): v is PipelineStage {
  return !!v && (STAGE_ORDER as string[]).includes(v);
}

function move(ctx: OrgContext, a: Application, stage: PipelineStage) {
  if (a.stage === stage) return;
  const r = moveApplicationStage(ctx.user, a.id, stage);
  if (r.ok) toast(`Moved to ${STAGE_LABEL[stage]}`, { body: `${personName(ctx.db, a.applicantId)} was notified of the update.` });
  else toast("Couldn't move candidate", { body: r.error, tone: "error" });
}

function Pipeline(ctx: OrgContext) {
  const { db, org } = ctx;
  const router = useRouter();
  const params = useSearchParams();
  const stageParam = params.get("stage");
  const focus = isStage(stageParam) ? stageParam : null;

  const [view, setViewState] = useState<"board" | "list">("board");
  const [oppFilter, setOppFilter] = useState("");
  const [q, setQ] = useState("");

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY);
      if (v === "board" || v === "list") setViewState(v);
    } catch {
      /* storage unavailable */
    }
  }, []);
  const setView = (v: "board" | "list") => {
    setViewState(v);
    try {
      localStorage.setItem(VIEW_KEY, v);
    } catch {
      /* storage unavailable */
    }
  };

  const all = useMemo(() => applicationsForOrg(db, org.id), [db, org.id]);
  const opps = useMemo(() => opportunitiesForOrg(db, org.id).filter((o) => all.some((a) => a.opportunityId === o.id)), [db, org.id, all]);
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    return all.filter((a) => (!oppFilter || a.opportunityId === oppFilter) && (!term || personName(db, a.applicantId).toLowerCase().includes(term)));
  }, [all, oppFilter, q, db]);

  const setFocus = (s: PipelineStage | null) => router.replace(s ? `/org/pipeline?stage=${s}` : "/org/pipeline", { scroll: false });

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Pipeline"
        description="Every candidate who applied to your listings, by stage. Moving a candidate notifies them with applicant-friendly wording."
        actions={<Segmented ariaLabel="View" value={view} onChange={setView} items={[{ value: "board", label: <><Columns3 className="h-3.5 w-3.5" /> Board</> }, { value: "list", label: <><List className="h-3.5 w-3.5" /> List</> }]} />}
      />
      <OrgStatusNotice org={org} className="mb-6" />

      <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative sm:w-72">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
          <Input aria-label="Search candidates by name" placeholder="Search by name" value={q} onChange={(e) => setQ(e.target.value)} className="pl-9" />
        </div>
        <div className="sm:w-80">
          <Select aria-label="Filter by opportunity" value={oppFilter} onChange={(e) => setOppFilter(e.target.value)}>
            <option value="">All opportunities</option>
            {opps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </Select>
        </div>
        {focus && (
          <button type="button" onClick={() => setFocus(null)} className="inline-flex items-center gap-1.5 self-start rounded-full border border-navy-200 bg-navy-50 px-3 py-1 text-xs font-medium text-navy sm:self-auto">
            Focused: {STAGE_LABEL[focus]} <X className="h-3 w-3" aria-label="Clear stage focus" />
          </button>
        )}
        <span className="text-[13px] text-ink-3 sm:ml-auto">{filtered.length} of {all.length} candidates</span>
      </div>

      {all.length === 0 ? (
        <EmptyState
          icon={<Inbox className="h-5 w-5" strokeWidth={1.75} />}
          title="No applications yet"
          description="When members apply to your published listings, they'll appear here with exactly what they chose to share."
          action={<ButtonLink href="/org/opportunities" variant="secondary" size="sm"><Briefcase className="h-4 w-4" /> Manage opportunities</ButtonLink>}
        />
      ) : view === "board" ? (
        <Board ctx={ctx} apps={filtered} focus={focus} onFocus={setFocus} />
      ) : (
        <ListView ctx={ctx} apps={focus ? filtered.filter((a) => a.stage === focus) : filtered} />
      )}
    </div>
  );
}

function ShareIndicators({ a }: { a: Application }) {
  const items = [
    { on: a.share.contactEmail, icon: Mail, label: "Email" },
    { on: a.share.licenses, icon: IdCard, label: "Licenses" },
    { on: a.share.npn, icon: Hash, label: "NPN" },
    { on: a.share.experience, icon: Briefcase, label: "Work history" },
  ];
  const shared = items.filter((i) => i.on).map((i) => i.label);
  return (
    <span className="inline-flex items-center gap-1" title={`Shared with consent: ${shared.join(", ") || "profile basics only"}`}>
      <span className="sr-only">Shared: {shared.join(", ") || "profile basics only"}</span>
      {items.map((i) => (
        <i.icon key={i.label} aria-hidden className={cn("h-3.5 w-3.5", i.on ? "text-navy-400" : "text-line-strong")} strokeWidth={1.75} />
      ))}
    </span>
  );
}

function StageSelect({ ctx, a, className }: { ctx: OrgContext; a: Application; className?: string }) {
  return (
    <Select aria-label={`Stage for ${personName(ctx.db, a.applicantId)}`} value={a.stage} onChange={(e) => move(ctx, a, e.target.value as PipelineStage)} className={cn("h-8 text-xs", className)}>
      {STAGE_ORDER.map((s) => <option key={s} value={s}>{STAGE_LABEL[s]}</option>)}
    </Select>
  );
}

function candidateInfo(db: Database, a: Application) {
  return {
    name: personName(db, a.applicantId),
    profile: db.profiles.find((p) => p.userId === a.applicantId),
    opp: db.opportunities.find((o) => o.id === a.opportunityId),
  };
}

function Board({ ctx, apps, focus, onFocus }: { ctx: OrgContext; apps: Application[]; focus: PipelineStage | null; onFocus: (s: PipelineStage | null) => void }) {
  const [dragId, setDragId] = useState<string | null>(null);
  const [over, setOver] = useState<PipelineStage | null>(null);
  const colRefs = useRef<Partial<Record<PipelineStage, HTMLElement | null>>>({});

  useEffect(() => {
    if (focus) colRefs.current[focus]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
  }, [focus]);

  const onDrop = (stage: PipelineStage) => {
    const a = apps.find((x) => x.id === dragId);
    setDragId(null);
    setOver(null);
    if (a) move(ctx, a, stage);
  };

  return (
    <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10">
      <div className="flex gap-3">
        {STAGE_ORDER.map((stage) => {
          const items = apps.filter((a) => a.stage === stage);
          const isFocus = focus === stage;
          return (
            <section
              key={stage}
              ref={(el) => {
                colRefs.current[stage] = el;
              }}
              aria-label={`${STAGE_LABEL[stage]}, ${items.length} candidates`}
              onDragOver={(e) => {
                if (!dragId) return;
                e.preventDefault();
                setOver(stage);
              }}
              onDragLeave={() => setOver((s) => (s === stage ? null : s))}
              onDrop={(e) => {
                e.preventDefault();
                onDrop(stage);
              }}
              className={cn(
                "flex w-[272px] shrink-0 flex-col rounded-2xl border p-2 transition",
                isFocus ? "border-navy-200 bg-navy-50/60 ring-2 ring-navy-100" : "border-line bg-subtle/60",
                over === stage && "border-navy-400 bg-navy-50",
                focus && !isFocus && "opacity-80",
              )}
            >
              <header className="flex items-center justify-between px-2 pb-2 pt-1.5">
                <button type="button" onClick={() => onFocus(isFocus ? null : stage)} aria-pressed={isFocus} className="flex min-w-0 items-center gap-2 text-left">
                  <span className="truncate text-[13px] font-semibold text-ink">{STAGE_LABEL[stage]}</span>
                  <span className="rounded-full bg-surface px-1.5 text-[11px] font-medium tabular-nums text-ink-3 ring-1 ring-line">{items.length}</span>
                </button>
              </header>
              <ul className="flex min-h-[120px] flex-1 flex-col gap-2">
                {items.length === 0 && (
                  <li className="flex flex-1 items-center justify-center rounded-xl border border-dashed border-line-strong px-3 py-6 text-center text-xs text-ink-4">
                    {dragId ? "Drop here" : "No candidates"}
                  </li>
                )}
                {items.map((a) => {
                  const { name, profile, opp } = candidateInfo(ctx.db, a);
                  const days = daysSince(a.submittedAt);
                  return (
                    <li
                      key={a.id}
                      draggable
                      onDragStart={(e) => {
                        setDragId(a.id);
                        e.dataTransfer.effectAllowed = "move";
                        e.dataTransfer.setData("text/plain", a.id);
                      }}
                      onDragEnd={() => {
                        setDragId(null);
                        setOver(null);
                      }}
                      className={cn("rounded-xl border border-line bg-surface p-3 shadow-card transition hover:border-line-strong md:cursor-grab", dragId === a.id && "opacity-50")}
                    >
                      <div className="flex items-start gap-2.5">
                        <Avatar name={name} tone={profile?.avatarTone ?? 0} size={32} />
                        <div className="min-w-0 flex-1">
                          <Link href={`/org/applications/${a.id}`} className="block truncate text-[13.5px] font-semibold text-ink hover:underline hover:underline-offset-4">{name}</Link>
                          {profile?.headline && <p className="line-clamp-2 text-xs leading-snug text-ink-3">{profile.headline}</p>}
                        </div>
                      </div>
                      <p className="mt-2.5 truncate text-xs text-ink-2" title={opp?.title}>
                        <Briefcase className="mr-1 inline h-3 w-3 text-ink-4" />
                        {opp?.title ?? "Opportunity removed"}
                      </p>
                      <div className="mt-2 flex items-center justify-between text-[11.5px] text-ink-4">
                        <span className={cn(days <= 2 && a.stage === "new" && "font-medium text-navy-600")}>{daysSinceLabel(a.submittedAt)}</span>
                        <ShareIndicators a={a} />
                      </div>
                      <StageSelect ctx={ctx} a={a} className="mt-2.5" />
                    </li>
                  );
                })}
              </ul>
            </section>
          );
        })}
      </div>
      <p className="mt-3 hidden text-xs text-ink-4 md:block">Tip: drag a card between columns, or use its stage menu.</p>
    </div>
  );
}

function ListView({ ctx, apps }: { ctx: OrgContext; apps: Application[] }) {
  if (apps.length === 0) {
    return <EmptyState compact icon={<Search className="h-5 w-5" strokeWidth={1.75} />} title="No candidates match" description="Try clearing the search, opportunity filter or stage focus." />;
  }
  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead className="border-b border-line bg-subtle/60 text-xs text-ink-3">
            <tr>
              <th scope="col" className="px-5 py-3 font-medium">Candidate</th>
              <th scope="col" className="px-4 py-3 font-medium">Opportunity</th>
              <th scope="col" className="px-4 py-3 font-medium">Applied</th>
              <th scope="col" className="px-4 py-3 font-medium">Shared</th>
              <th scope="col" className="px-4 py-3 font-medium">Stage</th>
              <th scope="col" className="w-48 px-5 py-3 font-medium"><span className="sr-only">Move</span></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {apps.map((a) => {
              const { name, profile, opp } = candidateInfo(ctx.db, a);
              return (
                <tr key={a.id} className="transition hover:bg-subtle/40">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar name={name} tone={profile?.avatarTone ?? 0} size={32} />
                      <div className="min-w-0">
                        <Link href={`/org/applications/${a.id}`} className="font-medium text-ink hover:underline hover:underline-offset-4">{name}</Link>
                        <div className="max-w-[240px] truncate text-xs text-ink-3">{profile?.headline}</div>
                      </div>
                    </div>
                  </td>
                  <td className="max-w-[220px] truncate px-4 py-3 text-ink-2">{opp?.title ?? "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-ink-3" title={formatDate(a.submittedAt)}>{daysSinceLabel(a.submittedAt)}</td>
                  <td className="px-4 py-3"><ShareIndicators a={a} /></td>
                  <td className="px-4 py-3"><StageBadge stage={a.stage} /></td>
                  <td className="px-5 py-3"><StageSelect ctx={ctx} a={a} /></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
