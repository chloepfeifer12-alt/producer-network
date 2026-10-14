"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowDown, Check, GraduationCap, ListFilter, SearchX, Sparkles, Zap } from "lucide-react";
import type { CareerCategory, ExperienceLevel, LeadsPolicy, Opportunity, OpportunityKind, Organization, WorkArrangement } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { publishedOpportunities, recordOpportunityView, searchOpportunities, type CompFilter, type OpportunityFilters } from "@/lib/services/opportunities";
import { activeSponsored } from "@/lib/services/organizations";
import { ARRANGEMENT_LABEL, CATEGORY_LABEL, EXPERIENCE_LABEL, INSURANCE_LINES, KIND_LABEL, LEADS_LABEL, US_STATES, lineName, stateName } from "@/lib/data/taxonomy";
import { OrgLogo } from "@/components/brand/org-logo";
import { KindBadge } from "@/components/domain/badges";
import { SaveButton } from "@/components/domain/save-button";
import { opportunityLocation } from "@/components/domain/opportunity-card";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState, SponsoredTag } from "@/components/ui/feedback";
import { Container } from "@/components/ui/page";
import { compensationLabel, pluralize } from "@/lib/utils/format";
import { relativeDay, demoToday, DAY_MS } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import {
  ActiveFilterChips,
  FacetList,
  FilterPill,
  FilterSection,
  FilterToggle,
  GroupedLineFacet,
  TogglePill,
  WhatWhereSearch,
  type ActiveChip,
  type FacetOption,
} from "./filter-ui";
import { readFlag, readList, useSyncedState, useUrlParams } from "./url-state";
import { OpportunityPane } from "./opportunity-posting";

const KINDS: OpportunityKind[] = ["employment", "contracting"];
const LINES = INSURANCE_LINES.map((l) => l.slug);
const ARRANGEMENTS: WorkArrangement[] = ["remote", "hybrid", "in_person"];
const EXPERIENCE: ExperienceLevel[] = ["no_license", "newly_licensed", "early", "mid", "senior", "leadership"];
const CATEGORIES = Object.keys(CATEGORY_LABEL) as CareerCategory[];
const LEADS: LeadsPolicy[] = ["provided", "available_at_cost", "not_provided"];
const COMP: CompFilter[] = ["salary_based", "commission_based"];
const COMP_LABEL: Record<CompFilter, string> = { salary_based: "Salary-based", commission_based: "Commission-based" };
const COMP_DESC: Record<CompFilter, string> = {
  salary_based: "Salary, hourly, or salary + incentive",
  commission_based: "Commission only or draw against commission",
};
const KIND_DESC: Record<OpportunityKind, string> = {
  employment: "W-2 employee roles",
  contracting: "Independent contractor (1099)",
};
const WHERE_OPTIONS = [
  { value: "", label: "Anywhere in the US" },
  { value: "remote", label: "Remote" },
  ...US_STATES.map((s) => ({ value: s.code, label: s.name })),
];
const PAGE = 15;
const DESKTOP = "(min-width: 1024px)";

type Sort = "relevance" | "newest";
type Update = ReturnType<typeof useUrlParams>["update"];
type FacetCount = <K extends keyof OpportunityFilters>(key: K, value: OpportunityFilters[K]) => number;

const isOnlyRemote = (arr?: WorkArrangement[]) => arr?.length === 1 && arr[0] === "remote";

export function OpportunityMarketplace() {
  const db = useDb();
  const user = useCurrentUser();
  const { params, update, clear } = useUrlParams();

  const filters = useMemo<OpportunityFilters>(() => {
    const state = params.get("state") ?? "";
    const sort = params.get("sort");
    return {
      q: params.get("q")?.trim() || undefined,
      kind: readList(params, "kind", KINDS),
      lines: readList(params, "lines", LINES),
      state: US_STATES.some((s) => s.code === state) ? state : undefined,
      arrangement: readList(params, "arr", ARRANGEMENTS),
      experience: readList(params, "exp", EXPERIENCE),
      category: readList(params, "cat", CATEGORIES),
      leads: readList(params, "leads", LEADS),
      comp: readList(params, "comp", COMP),
      training: readFlag(params, "training") || undefined,
      sort: sort === "newest" || sort === "relevance" ? sort : undefined,
    };
  }, [params]);

  /* ----- What / Where (applied on Search) ----- */
  const [what, setWhat] = useSyncedState(filters.q ?? "");
  const [where, setWhere] = useSyncedState(filters.state ?? (isOnlyRemote(filters.arrangement) ? "remote" : ""));
  const runSearch = () => {
    const arr = filters.arrangement ?? [];
    update({
      q: what.trim(),
      state: where && where !== "remote" ? where : null,
      arr: where === "remote" ? ["remote"] : isOnlyRemote(arr) ? [] : arr,
      jk: null,
    });
  };
  /** Filter changes reset the selected posting so the first result is shown. */
  const set: Update = useCallback((patch) => update({ ...patch, jk: null }), [update]);

  const results = useMemo(() => searchOpportunities(db, filters), [db, filters]);
  const total = useMemo(() => publishedOpportunities(db).length, [db]);
  const orgById = useMemo(() => new Map(db.organizations.map((o) => [o.id, o])), [db]);
  const applied = useMemo(() => new Set(user ? db.applications.filter((a) => a.applicantId === user.id && !a.withdrawn).map((a) => a.opportunityId) : []), [db, user]);

  // Sponsored: active search placements whose listing also satisfies the current filters. Max 2, shown above organic results.
  const sponsored = useMemo(() => {
    const byId = new Map(results.map((r) => [r.id, r]));
    const seen = new Set<string>();
    return activeSponsored(db, "search_top")
      .filter((s) => {
        const id = s.placement.opportunityId;
        if (!id || !byId.has(id) || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, 2)
      .map((s) => ({ placementId: s.placement.id, opp: byId.get(s.placement.opportunityId!)! }));
  }, [db, results]);

  const facetCount: FacetCount = useCallback((key, value) => searchOpportunities(db, { ...filters, [key]: value }).length, [db, filters]);

  /* ----- selection (split view) ----- */
  const jk = params.get("jk");
  const selected = useMemo(() => results.find((r) => r.slug === jk) ?? results[0], [results, jk]);
  const paneRef = useRef<HTMLDivElement>(null);
  const selectedId = selected?.id;
  useEffect(() => {
    paneRef.current?.scrollTo({ top: 0 });
    if (selectedId && window.matchMedia(DESKTOP).matches) recordOpportunityView(selectedId);
  }, [selectedId]);
  const select = (o: Opportunity) => update({ jk: o.slug });

  const effectiveSort: Sort = filters.sort ?? (filters.q ? "relevance" : "newest");

  /* ----- active chips ----- */
  const chips: ActiveChip[] = [];
  const listChip = <T extends string>(key: string, values: T[] | undefined, label: (v: T) => string) =>
    values?.forEach((v) => chips.push({ key: `${key}:${v}`, label: label(v), onRemove: () => set({ [key]: values.filter((x) => x !== v) }) }));
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, onRemove: () => set({ q: null }) });
  if (filters.state) chips.push({ key: "state", label: `Open in ${stateName(filters.state)}`, onRemove: () => set({ state: null }) });
  listChip("lines", filters.lines, (v) => lineName(v, true));
  listChip("kind", filters.kind, (v) => KIND_LABEL[v]);
  listChip("arr", filters.arrangement, (v) => ARRANGEMENT_LABEL[v]);
  listChip("exp", filters.experience, (v) => EXPERIENCE_LABEL[v]);
  listChip("comp", filters.comp, (v) => COMP_LABEL[v]);
  if (filters.training) chips.push({ key: "training", label: "Training provided", onRemove: () => set({ training: null }) });
  listChip("leads", filters.leads, (v) => LEADS_LABEL[v]);
  listChip("cat", filters.category, (v) => CATEGORY_LABEL[v]);
  const filterCount = chips.filter((c) => c.key !== "q" && c.key !== "state").length;
  const clearFilters = () => clear(["q", "state", "sort"]);

  const [drawer, setDrawer] = useState(false);
  const opts = <T extends string>(key: keyof OpportunityFilters, values: readonly T[], label: (v: T) => string, extra?: (v: T) => Partial<FacetOption<T>>): FacetOption<T>[] =>
    values.map((v) => ({ value: v, label: label(v), count: facetCount(key, [v] as never), ...extra?.(v) }));

  return (
    <>
      {/* ---------- Search band ---------- */}
      <section className="border-b border-line bg-surface/50">
        <Container className="pb-5 pt-7 sm:pt-9">
          <div className="mb-5 flex flex-wrap items-end justify-between gap-2">
            <h1 className="font-display text-[26px] leading-tight text-ink sm:text-[32px]">Insurance &amp; financial services jobs</h1>
            <p className="text-[13px] text-ink-3">{pluralize(total, "open listing")} · Compensation always shown as disclosed</p>
          </div>
          <WhatWhereSearch
            what={what}
            onWhat={setWhat}
            where={where}
            onWhere={setWhere}
            whereOptions={WHERE_OPTIONS}
            onSubmit={runSearch}
            whatLabel="Job title, keyword or company"
            whatPlaceholder="Job title, keyword or company"
          />

          {/* Pill filters (md+) */}
          <div className="mt-4 hidden flex-wrap items-center gap-2 md:flex" role="group" aria-label="Filters">
            <FilterPill label="Category" count={filters.lines?.length} onClear={() => set({ lines: [] })} width={340}>
              <GroupedLineFacet value={filters.lines ?? []} onChange={(v) => set({ lines: v })} count={(l) => facetCount("lines", [l])} />
            </FilterPill>
            <FilterPill label="Job type" count={filters.kind?.length} onClear={() => set({ kind: [] })}>
              <FacetList ariaLabel="Job type" options={opts("kind", KINDS, (v) => KIND_LABEL[v], (v) => ({ description: KIND_DESC[v] }))} value={filters.kind ?? []} onChange={(v) => set({ kind: v })} />
            </FilterPill>
            <FilterPill label="Work arrangement" count={filters.arrangement?.length} onClear={() => set({ arr: [] })} width={260}>
              <FacetList ariaLabel="Work arrangement" options={opts("arrangement", ARRANGEMENTS, (v) => ARRANGEMENT_LABEL[v])} value={filters.arrangement ?? []} onChange={(v) => set({ arr: v })} />
            </FilterPill>
            <FilterPill label="Experience" count={filters.experience?.length} onClear={() => set({ exp: [] })} width={260}>
              <FacetList ariaLabel="Experience level" options={opts("experience", EXPERIENCE, (v) => EXPERIENCE_LABEL[v])} value={filters.experience ?? []} onChange={(v) => set({ exp: v })} />
            </FilterPill>
            <FilterPill label="Compensation type" count={filters.comp?.length} onClear={() => set({ comp: [] })}>
              <FacetList ariaLabel="Compensation type" options={opts("comp", COMP, (v) => COMP_LABEL[v], (v) => ({ description: COMP_DESC[v] }))} value={filters.comp ?? []} onChange={(v) => set({ comp: v })} />
            </FilterPill>
            <TogglePill label="Training provided" pressed={!!filters.training} onChange={(v) => set({ training: v })} icon={<GraduationCap className="h-3.5 w-3.5" strokeWidth={1.75} />} />
            <FilterPill label="Leads" count={filters.leads?.length} onClear={() => set({ leads: [] })}>
              <FacetList ariaLabel="Leads policy" options={opts("leads", LEADS, (v) => LEADS_LABEL[v])} value={filters.leads ?? []} onChange={(v) => set({ leads: v })} />
            </FilterPill>
            <FilterPill label="Career category" count={filters.category?.length} onClear={() => set({ cat: [] })} width={280}>
              <FacetList ariaLabel="Career category" options={opts("category", CATEGORIES, (v) => CATEGORY_LABEL[v])} value={filters.category ?? []} onChange={(v) => set({ cat: v })} />
            </FilterPill>
            {filterCount > 0 && (
              <button type="button" onClick={clearFilters} className="ml-1 rounded px-1.5 py-1 text-[13px] font-medium text-ink-3 underline-offset-4 hover:text-ink hover:underline">
                Clear filters
              </button>
            )}
          </div>

          {/* Mobile: Filters pill */}
          <div className="mt-3 flex items-center gap-2 md:hidden">
            <button
              type="button"
              onClick={() => setDrawer(true)}
              className={cn(
                "inline-flex h-9 items-center gap-1.5 rounded-full border px-3.5 text-[13px] transition",
                filterCount ? "border-navy bg-navy-50 font-medium text-navy" : "border-line-strong bg-surface text-ink-2",
              )}
            >
              <ListFilter className="h-3.5 w-3.5" strokeWidth={2} /> Filters
              {filterCount > 0 && <span className="rounded-full bg-navy px-1.5 text-[10.5px] font-semibold tabular-nums text-white">{filterCount}</span>}
            </button>
            <TogglePill label="Training" pressed={!!filters.training} onChange={(v) => set({ training: v })} />
          </div>
        </Container>
      </section>

      <Container className="pb-24 pt-6">
        {/* Results header */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink" aria-live="polite">
              {pluralize(results.length, "job", "jobs")}
              {filters.q && <span className="font-normal text-ink-3"> for “{filters.q}”</span>}
              {filters.state && <span className="font-normal text-ink-3"> in {stateName(filters.state)}</span>}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-3">
              {effectiveSort === "relevance" && filters.q ? "Ranked by keyword relevance, then date." : "Newest first."} Organic results are never ranked by payment.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="opp-sort" className="text-[12.5px] text-ink-3">
              Sort by
            </label>
            <div className="w-[140px]">
              <Select id="opp-sort" value={effectiveSort} onChange={(e) => update({ sort: e.target.value as Sort })} className="h-8 rounded-lg text-[13px]">
                <option value="relevance">Relevance</option>
                <option value="newest">Date posted</option>
              </Select>
            </div>
          </div>
        </div>
        <ActiveFilterChips chips={chips} onClearAll={() => clear()} className="mt-3" />

        <p className="mt-4 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-xl border border-line bg-surface px-3.5 py-2.5 text-[12.5px] leading-relaxed text-ink-3">
          <KindBadge kind="employment" /> <span>you&apos;d be a W-2 employee.</span>
          <span aria-hidden className="mx-1 hidden h-3 w-px bg-line sm:inline-block" />
          <KindBadge kind="contracting" /> <span>you&apos;d run your own practice as an independent (1099) contractor.</span>
        </p>

        {results.length === 0 ? (
          <EmptyState
            className="mt-6"
            icon={<SearchX className="h-5 w-5" strokeWidth={1.75} />}
            title="No jobs match your search"
            description={filters.q ? "Try a broader keyword, a different location, or remove a filter or two." : "Try a different location or remove a filter or two."}
            action={
              <div className="flex flex-wrap justify-center gap-2">
                <Button onClick={() => clear()}>Reset search</Button>
                <Link href="/organizations" className="inline-flex h-10 items-center rounded-lg px-4 text-sm font-medium text-ink-2 hover:bg-sunken hover:text-ink">
                  Browse organizations
                </Link>
              </div>
            }
          />
        ) : (
          <div className="mt-5 grid gap-6 lg:grid-cols-[minmax(0,420px)_minmax(0,1fr)] xl:grid-cols-[minmax(0,460px)_minmax(0,1fr)]">
            {/* List */}
            <div className="min-w-0">
              {sponsored.length > 0 && (
                <section aria-label="Sponsored listings" className="mb-4 space-y-3">
                  {sponsored.map((s) => (
                    <JobCard key={s.placementId} o={s.opp} org={orgById.get(s.opp.orgId)} sponsored selected={false} applied={applied.has(s.opp.id)} onSelect={() => select(s.opp)} />
                  ))}
                  <p className="px-1 text-[11.5px] leading-relaxed text-ink-4">
                    Sponsored listings are paid placements, shown separately. They also appear in their natural position below.{" "}
                    <Link href="/for-organizations#sponsored" className="underline underline-offset-2 hover:text-ink">
                      About sponsorship
                    </Link>
                  </p>
                </section>
              )}
              {sponsored.length > 0 && (
                <div className="mb-3 flex items-center gap-3" aria-hidden>
                  <span className="eyebrow">All results</span>
                  <span className="h-px flex-1 bg-line" />
                </div>
              )}
              <ResultList key={JSON.stringify(filters)} results={results} orgById={orgById} selectedId={selectedId} applied={applied} onSelect={select} />
            </div>

            {/* Pane */}
            <div className="hidden min-w-0 lg:block">
              <div ref={paneRef} className="sticky top-20 h-[calc(100vh-6rem)] overflow-y-auto overscroll-contain rounded-2xl border border-line bg-surface shadow-card">
                {selected && <OpportunityPane key={selected.id} o={selected} org={orgById.get(selected.orgId)} />}
              </div>
            </div>
          </div>
        )}
      </Container>

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Filters"
        side="left"
        footer={
          <div className="flex gap-2">
            {filterCount > 0 && (
              <Button variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            )}
            <Button className="flex-1" onClick={() => setDrawer(false)}>
              Show {pluralize(results.length, "job")}
            </Button>
          </div>
        }
      >
        <FilterSection title="Category" activeCount={filters.lines?.length}>
          <GroupedLineFacet value={filters.lines ?? []} onChange={(v) => set({ lines: v })} count={(l) => facetCount("lines", [l])} />
        </FilterSection>
        <FilterSection title="Job type" activeCount={filters.kind?.length}>
          <FacetList ariaLabel="Job type" options={opts("kind", KINDS, (v) => KIND_LABEL[v], (v) => ({ description: KIND_DESC[v] }))} value={filters.kind ?? []} onChange={(v) => set({ kind: v })} />
        </FilterSection>
        <FilterSection title="Work arrangement" activeCount={filters.arrangement?.length}>
          <FacetList ariaLabel="Work arrangement" options={opts("arrangement", ARRANGEMENTS, (v) => ARRANGEMENT_LABEL[v])} value={filters.arrangement ?? []} onChange={(v) => set({ arr: v })} />
        </FilterSection>
        <FilterSection title="Experience" activeCount={filters.experience?.length}>
          <FacetList ariaLabel="Experience level" options={opts("experience", EXPERIENCE, (v) => EXPERIENCE_LABEL[v])} value={filters.experience ?? []} onChange={(v) => set({ exp: v })} />
        </FilterSection>
        <FilterSection title="Compensation type" activeCount={filters.comp?.length}>
          <FacetList ariaLabel="Compensation type" options={opts("comp", COMP, (v) => COMP_LABEL[v], (v) => ({ description: COMP_DESC[v] }))} value={filters.comp ?? []} onChange={(v) => set({ comp: v })} />
        </FilterSection>
        <FilterSection title="Training" activeCount={filters.training ? 1 : 0}>
          <FilterToggle label="Training provided" description={`${facetCount("training", true)} listings`} checked={!!filters.training} onChange={(v) => set({ training: v })} />
        </FilterSection>
        <FilterSection title="Leads" activeCount={filters.leads?.length}>
          <FacetList ariaLabel="Leads policy" options={opts("leads", LEADS, (v) => LEADS_LABEL[v])} value={filters.leads ?? []} onChange={(v) => set({ leads: v })} />
        </FilterSection>
        <FilterSection title="Career category" activeCount={filters.category?.length} defaultOpen={false}>
          <FacetList ariaLabel="Career category" options={opts("category", CATEGORIES, (v) => CATEGORY_LABEL[v])} value={filters.category ?? []} onChange={(v) => set({ cat: v })} />
        </FilterSection>
      </Drawer>
    </>
  );
}

function ResultList({
  results,
  orgById,
  selectedId,
  applied,
  onSelect,
}: {
  results: Opportunity[];
  orgById: Map<string, Organization>;
  selectedId?: string;
  applied: Set<string>;
  onSelect: (o: Opportunity) => void;
}) {
  const [visible, setVisible] = useState(PAGE);
  const shown = results.slice(0, visible);
  return (
    <>
      <ul className="space-y-3" aria-label="Search results">
        {shown.map((o) => (
          <li key={o.id}>
            <JobCard o={o} org={orgById.get(o.orgId)} selected={o.id === selectedId} applied={applied.has(o.id)} onSelect={() => onSelect(o)} />
          </li>
        ))}
      </ul>
      {results.length > visible && (
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button variant="secondary" onClick={() => setVisible((v) => v + PAGE)}>
            Show more jobs <ArrowDown className="h-4 w-4" />
          </Button>
          <p className="text-xs text-ink-4">
            Showing {shown.length} of {results.length}
          </p>
        </div>
      )}
    </>
  );
}

/** Compact, selectable job card. Desktop selects into the split pane; mobile navigates to the posting. */
function JobCard({ o, org, sponsored, selected, applied, onSelect }: { o: Opportunity; org?: Organization; sponsored?: boolean; selected: boolean; applied: boolean; onSelect: () => void }) {
  const isNew = !!o.postedAt && demoToday() - new Date(o.postedAt).getTime() < 3 * DAY_MS;
  return (
    <article
      className={cn(
        "group relative rounded-xl border p-4 transition duration-150",
        sponsored ? "border-gold-200 bg-gold-50/60" : "bg-surface",
        selected ? "border-navy shadow-lift ring-1 ring-navy" : !sponsored && "border-line hover:border-line-strong hover:shadow-card",
      )}
    >
      {selected && <span aria-hidden className="absolute -left-px bottom-3 top-3 w-[3px] rounded-r-full bg-navy" />}
      {sponsored && (
        <div className="mb-2.5 flex items-center gap-2">
          <SponsoredTag />
          <span className="text-[11px] text-gold-ink">Paid placement</span>
        </div>
      )}
      <div className="flex items-start gap-3">
        {org && <OrgLogo brand={org.brand} name={org.name} size={38} />}
        <div className="min-w-0 flex-1">
          <h3 className="text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink group-hover:underline group-hover:decoration-line-strong group-hover:underline-offset-4">
            <Link
              href={`/opportunities/${o.slug}`}
              aria-current={selected ? "true" : undefined}
              onClick={(e) => {
                if (e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
                if (window.matchMedia(DESKTOP).matches) {
                  e.preventDefault();
                  onSelect();
                }
              }}
              className="after:absolute after:inset-0 after:rounded-xl focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-navy-100"
            >
              {o.title}
            </Link>
          </h3>
          <div className="mt-0.5 truncate text-[13px] text-ink-2">{org?.name}</div>
          <div className="mt-0.5 text-[13px] text-ink-3">
            {opportunityLocation(o)} · {ARRANGEMENT_LABEL[o.arrangement]}
          </div>
        </div>
        <SaveButton targetId={o.id} className="-mr-2 -mt-2" />
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-1.5">
        <KindBadge kind={o.kind} />
        <span className="inline-flex max-w-full items-center truncate rounded-md bg-subtle px-2 py-0.5 text-[12px] font-medium text-ink-2 ring-1 ring-inset ring-line">
          {compensationLabel(o.compensation)}
        </span>
      </div>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-[12px] text-ink-3">
        {o.trainingProvided && (
          <span className="inline-flex items-center gap-1">
            <GraduationCap className="h-3.5 w-3.5 text-ink-4" strokeWidth={1.75} /> Training provided
          </span>
        )}
        {applied ? (
          <span className="inline-flex items-center gap-1 font-medium text-success">
            <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> Applied
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-navy-400" strokeWidth={1.75} /> Quick apply
          </span>
        )}
        {o.leads === "provided" && <span>Leads provided</span>}
      </div>

      <div className="mt-3 flex items-center gap-2 text-[11.5px] text-ink-4" suppressHydrationWarning>
        {isNew && (
          <span className="inline-flex items-center gap-1 font-medium text-gold-ink">
            <Sparkles className="h-3 w-3" /> New
          </span>
        )}
        <span>{o.postedAt ? `Posted ${relativeDay(o.postedAt).toLowerCase()}` : ""}</span>
      </div>
    </article>
  );
}
