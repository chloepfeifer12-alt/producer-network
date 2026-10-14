"use client";

import { useCallback, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Building2, Columns3, GraduationCap, ListFilter, Users } from "lucide-react";
import type { EngagementType, OrgCategory, RecruitingStatus, WorkArrangement } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { activeSponsored, approvedOrganizations, orgOpenOpportunities, searchOrganizations, type OrgFilters } from "@/lib/services/organizations";
import {
  ARRANGEMENT_LABEL,
  ENGAGEMENT_LABEL,
  INSURANCE_LINES,
  ORG_CATEGORY_DESCRIPTION,
  ORG_CATEGORY_LABEL,
  RECRUITING_LABEL,
  US_STATES,
  lineName,
  stateName,
} from "@/lib/data/taxonomy";
import { Button, ButtonLink } from "@/components/ui/button";
import { Drawer } from "@/components/ui/dialog";
import { EmptyState } from "@/components/ui/feedback";
import { Kicker } from "@/components/editorial";
import { Container } from "@/components/ui/page";
import { pluralize } from "@/lib/utils/format";
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
import { MAX_COMPARE } from "./compare-config";
import { DiscoverOrgCard } from "@/components/discover/discover-org-card";
import { CompareTray, useCompareSelection } from "@/components/discover/compare-tray";
import { readFlag, readList, useSyncedState, useUrlParams } from "./url-state";

const CATEGORIES = Object.keys(ORG_CATEGORY_LABEL) as OrgCategory[];
const LINES = INSURANCE_LINES.map((l) => l.slug);
const ARRANGEMENTS: WorkArrangement[] = ["remote", "hybrid", "in_person"];
const ENGAGEMENTS: EngagementType[] = ["w2", "independent_contractor"];
const RECRUITING: RecruitingStatus[] = ["actively_recruiting", "selective", "not_recruiting"];
const WHERE_OPTIONS = [{ value: "", label: "Anywhere in the US" }, ...US_STATES.map((s) => ({ value: s.code, label: s.name }))];

type FacetCount = <K extends keyof OrgFilters>(key: K, value: OrgFilters[K]) => number;

export function OrganizationDirectory() {
  const db = useDb();
  const { params, update, clear } = useUrlParams();

  const filters = useMemo<OrgFilters>(() => {
    const state = params.get("state") ?? "";
    return {
      q: params.get("q")?.trim() || undefined,
      category: readList(params, "cat", CATEGORIES),
      lines: readList(params, "lines", LINES),
      state: US_STATES.some((s) => s.code === state) ? state : undefined,
      arrangement: readList(params, "arr", ARRANGEMENTS),
      engagement: readList(params, "eng", ENGAGEMENTS),
      recruiting: readList(params, "rec", RECRUITING),
      training: readFlag(params, "training") || undefined,
      mentorship: readFlag(params, "mentorship") || undefined,
    };
  }, [params]);

  const [what, setWhat] = useSyncedState(filters.q ?? "");
  const [where, setWhere] = useSyncedState(filters.state ?? "");
  const runSearch = () => update({ q: what.trim(), state: where || null });

  const results = useMemo(() => searchOrganizations(db, filters), [db, filters]);
  const totalOrgs = useMemo(() => approvedOrganizations(db).length, [db]);
  const openCounts = useMemo(() => new Map(db.organizations.map((o) => [o.id, orgOpenOpportunities(db, o.id).length])), [db]);
  const categoryCounts = useMemo(() => {
    const m = new Map<OrgCategory, number>();
    approvedOrganizations(db).forEach((o) => m.set(o.category, (m.get(o.category) ?? 0) + 1));
    return m;
  }, [db]);
  const sponsored = useMemo(() => {
    const ids = new Set(results.map((r) => r.id));
    const seen = new Set<string>();
    return activeSponsored(db, "directory_top").filter((s) => {
      if (!ids.has(s.org.id) || seen.has(s.org.id)) return false;
      seen.add(s.org.id);
      return true;
    });
  }, [db, results]);

  const facetCount: FacetCount = useCallback((key, value) => searchOrganizations(db, { ...filters, [key]: value }).length, [db, filters]);

  /* ----- compare selection (session only, shared with /discover) ----- */
  const compare = useCompareSelection();

  /* ----- chips ----- */
  const chips: ActiveChip[] = [];
  const listChip = <T extends string>(key: string, values: T[] | undefined, label: (v: T) => string) =>
    values?.forEach((v) => chips.push({ key: `${key}:${v}`, label: label(v), onRemove: () => update({ [key]: values.filter((x) => x !== v) }) }));
  if (filters.q) chips.push({ key: "q", label: `“${filters.q}”`, onRemove: () => update({ q: null }) });
  if (filters.state) chips.push({ key: "state", label: `Serves ${stateName(filters.state)}`, onRemove: () => update({ state: null }) });
  listChip("cat", filters.category, (v) => ORG_CATEGORY_LABEL[v]);
  listChip("lines", filters.lines, (v) => lineName(v, true));
  listChip("arr", filters.arrangement, (v) => ARRANGEMENT_LABEL[v]);
  listChip("eng", filters.engagement, (v) => ENGAGEMENT_LABEL[v]);
  listChip("rec", filters.recruiting, (v) => RECRUITING_LABEL[v]);
  if (filters.training) chips.push({ key: "training", label: "Training programs", onRemove: () => update({ training: null }) });
  if (filters.mentorship) chips.push({ key: "mentorship", label: "Mentorship", onRemove: () => update({ mentorship: null }) });
  const filterCount = chips.filter((c) => c.key !== "q" && c.key !== "state" && !c.key.startsWith("cat:")).length;
  const [drawer, setDrawer] = useState(false);

  const opts = <T extends string>(key: keyof OrgFilters, values: readonly T[], label: (v: T) => string, extra?: (v: T) => Partial<FacetOption<T>>): FacetOption<T>[] =>
    values.map((v) => ({ value: v, label: label(v), count: facetCount(key, [v] as never), ...extra?.(v) }));
  const singleCat = filters.category?.length === 1 ? filters.category[0]! : undefined;

  return (
    <>
      {/* ---------- Search band ---------- */}
      <section className="border-b border-line">
        <Container className="pb-6 pt-8 sm:pt-12">
          <div className="mb-6">
            <Kicker>
              <Link href="/discover" className="inline-flex items-center gap-1.5 hover:text-ink">
                <ArrowLeft className="h-3 w-3" /> Discover
              </Link>
              <span className="mx-2 text-ink-4">/</span>The directory
            </Kicker>
            <div className="mt-5 flex flex-wrap items-end justify-between gap-x-8 gap-y-2">
              <h1 className="font-display text-[34px] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[46px]">Every company, A–Z</h1>
              <p className="pb-1.5 text-[13px] text-ink-3">{pluralize(totalOrgs, "reviewed organization")} · Fictional demo data</p>
            </div>
          </div>
          <WhatWhereSearch
            what={what}
            onWhat={setWhat}
            where={where}
            onWhere={setWhere}
            whereOptions={WHERE_OPTIONS}
            onSubmit={runSearch}
            whatLabel="Company, specialty or city"
            whatPlaceholder="Company, specialty or city"
          />

          {/* Category pills */}
          <nav aria-label="Browse by organization type" className="scrollbar-none -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:flex-wrap sm:px-0">
            <CategoryPill active={!filters.category?.length} onClick={() => update({ cat: [] })} label="All types" count={totalOrgs} />
            {CATEGORIES.map((c) => {
              const active = !!filters.category?.includes(c);
              return (
                <CategoryPill
                  key={c}
                  active={active}
                  label={ORG_CATEGORY_LABEL[c]}
                  count={categoryCounts.get(c) ?? 0}
                  title={ORG_CATEGORY_DESCRIPTION[c]}
                  onClick={() => update({ cat: active ? filters.category!.filter((x) => x !== c) : [...(filters.category ?? []), c] })}
                />
              );
            })}
          </nav>
          {singleCat && (
            <p className="mt-2 text-[13px] text-ink-3">
              <span className="font-medium text-ink-2">{ORG_CATEGORY_LABEL[singleCat]}:</span> {ORG_CATEGORY_DESCRIPTION[singleCat]}
            </p>
          )}

          {/* Filter pills (md+) */}
          <div className="mt-3 hidden flex-wrap items-center gap-2 md:flex" role="group" aria-label="Filters">
            <FilterPill label="Specialty" count={filters.lines?.length} onClear={() => update({ lines: [] })} width={340}>
              <GroupedLineFacet value={filters.lines ?? []} onChange={(v) => update({ lines: v })} count={(l) => facetCount("lines", [l])} />
            </FilterPill>
            <FilterPill label="Work arrangement" count={filters.arrangement?.length} onClear={() => update({ arr: [] })} width={260}>
              <FacetList ariaLabel="Work arrangement" options={opts("arrangement", ARRANGEMENTS, (v) => ARRANGEMENT_LABEL[v])} value={filters.arrangement ?? []} onChange={(v) => update({ arr: v })} />
            </FilterPill>
            <FilterPill label="Engagement type" count={filters.engagement?.length} onClear={() => update({ eng: [] })} width={280}>
              <FacetList ariaLabel="Engagement type" options={opts("engagement", ENGAGEMENTS, (v) => ENGAGEMENT_LABEL[v])} value={filters.engagement ?? []} onChange={(v) => update({ eng: v })} />
            </FilterPill>
            <TogglePill label="Training programs" pressed={!!filters.training} onChange={(v) => update({ training: v })} icon={<GraduationCap className="h-3.5 w-3.5" strokeWidth={1.75} />} />
            <TogglePill label="Mentorship" pressed={!!filters.mentorship} onChange={(v) => update({ mentorship: v })} icon={<Users className="h-3.5 w-3.5" strokeWidth={1.75} />} />
            <FilterPill label="Recruiting status" count={filters.recruiting?.length} onClear={() => update({ rec: [] })} width={260}>
              <FacetList ariaLabel="Recruiting status" options={opts("recruiting", RECRUITING, (v) => RECRUITING_LABEL[v])} value={filters.recruiting ?? []} onChange={(v) => update({ rec: v })} />
            </FilterPill>
            {filterCount > 0 && (
              <button type="button" onClick={() => clear(["q", "state", "cat"])} className="ml-1 rounded px-1.5 py-1 text-[13px] font-medium text-ink-3 underline-offset-4 hover:text-ink hover:underline">
                Clear filters
              </button>
            )}
          </div>

          <div className="mt-3 md:hidden">
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
          </div>
        </Container>
      </section>

      <Container className="pb-32 pt-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-[15px] font-semibold tracking-[-0.01em] text-ink" aria-live="polite">
              {pluralize(results.length, "company", "companies")}
              {filters.state && <span className="font-normal text-ink-3"> serving {stateName(filters.state)}</span>}
            </h2>
            <p className="mt-0.5 text-[12.5px] text-ink-3">Listed A–Z. Plans and sponsorship never change organic order.</p>
          </div>
          <span className="inline-flex items-center gap-1.5 text-[12.5px] text-ink-3">
            <Columns3 className="h-3.5 w-3.5" /> Select up to {MAX_COMPARE} to compare
          </span>
        </div>

        <ActiveFilterChips chips={chips} onClearAll={() => clear()} className="mt-3" />

        {sponsored.length > 0 && (
          <section aria-labelledby="sponsored-orgs" className="mt-6 rounded-2xl border border-gold-200 bg-gold-50/50 p-4 sm:p-5">
            <div className="flex flex-wrap items-baseline justify-between gap-3 pb-4">
              <div>
                <h2 id="sponsored-orgs" className="text-[11px] font-semibold uppercase tracking-[0.14em] text-gold-ink">
                  Sponsored · Paid placement
                </h2>
                <p className="mt-1 max-w-xl text-[12.5px] leading-relaxed text-ink-3">
                  Shown separately. The directory below is alphabetical and is never affected by payment or plan.
                </p>
              </div>
              <Link href="/for-organizations#sponsored" className="shrink-0 text-[12.5px] font-medium text-gold-ink underline-offset-4 hover:underline">
                About sponsorship
              </Link>
            </div>
            <div className={cn("grid gap-4", sponsored.length > 1 && "sm:grid-cols-2 lg:grid-cols-3")}>
              {sponsored.map((s) => (
                <DiscoverOrgCard
                  key={s.placement.id}
                  org={s.org}
                  sponsored
                  orientation={sponsored.length === 1 ? "horizontal" : "vertical"}
                  openCount={openCounts.get(s.org.id) ?? 0}
                  compare={{ selected: compare.has(s.org.id), onToggle: () => compare.toggle(s.org.id) }}
                />
              ))}
            </div>
          </section>
        )}

        <section aria-label="Directory results" className="mt-6">
          {sponsored.length > 0 && results.length > 0 && (
            <Kicker className="mb-5">All companies · A–Z</Kicker>
          )}
          {results.length === 0 ? (
            <EmptyState
              icon={<Building2 className="h-5 w-5" strokeWidth={1.75} />}
              title="No companies match your search"
              description="Try a different name or location, or remove a filter. The directory only lists organizations that have been reviewed and approved."
              action={<Button onClick={() => clear()}>Reset search</Button>}
            />
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {results.map((org) => (
                <DiscoverOrgCard key={org.id} org={org} openCount={openCounts.get(org.id) ?? 0} compare={{ selected: compare.has(org.id), onToggle: () => compare.toggle(org.id) }} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-16 flex flex-col gap-4 border-t border-line pt-8 sm:flex-row sm:items-center sm:justify-between sm:gap-6">
          <div>
            <h2 className="font-display text-[22px] text-ink">Recruiting for your organization?</h2>
            <p className="mt-1 text-[13.5px] leading-relaxed text-ink-3">Create a reviewed profile, publish transparent listings and manage applicants in one workspace.</p>
          </div>
          <ButtonLink href="/for-organizations" variant="secondary" className="shrink-0">
            For organizations <ArrowRight className="h-4 w-4" />
          </ButtonLink>
        </div>
      </Container>

      <CompareTray />

      <Drawer
        open={drawer}
        onClose={() => setDrawer(false)}
        title="Filters"
        side="left"
        footer={
          <div className="flex gap-2">
            {filterCount > 0 && (
              <Button variant="ghost" onClick={() => clear(["q", "state", "cat"])}>
                Clear
              </Button>
            )}
            <Button className="flex-1" onClick={() => setDrawer(false)}>
              Show {pluralize(results.length, "company", "companies")}
            </Button>
          </div>
        }
      >
        <FilterSection title="Specialty" activeCount={filters.lines?.length}>
          <GroupedLineFacet value={filters.lines ?? []} onChange={(v) => update({ lines: v })} count={(l) => facetCount("lines", [l])} />
        </FilterSection>
        <FilterSection title="Work arrangement" activeCount={filters.arrangement?.length}>
          <FacetList ariaLabel="Work arrangement" options={opts("arrangement", ARRANGEMENTS, (v) => ARRANGEMENT_LABEL[v])} value={filters.arrangement ?? []} onChange={(v) => update({ arr: v })} />
        </FilterSection>
        <FilterSection title="Engagement type" activeCount={filters.engagement?.length}>
          <FacetList ariaLabel="Engagement type" options={opts("engagement", ENGAGEMENTS, (v) => ENGAGEMENT_LABEL[v])} value={filters.engagement ?? []} onChange={(v) => update({ eng: v })} />
        </FilterSection>
        <FilterSection title="Development" activeCount={(filters.training ? 1 : 0) + (filters.mentorship ? 1 : 0)}>
          <div className="space-y-2">
            <FilterToggle label="Training programs" checked={!!filters.training} onChange={(v) => update({ training: v })} description={`${facetCount("training", true)} organizations`} />
            <FilterToggle label="Mentorship available" checked={!!filters.mentorship} onChange={(v) => update({ mentorship: v })} description={`${facetCount("mentorship", true)} organizations`} />
          </div>
        </FilterSection>
        <FilterSection title="Recruiting status" activeCount={filters.recruiting?.length}>
          <FacetList ariaLabel="Recruiting status" options={opts("recruiting", RECRUITING, (v) => RECRUITING_LABEL[v])} value={filters.recruiting ?? []} onChange={(v) => update({ rec: v })} />
        </FilterSection>
      </Drawer>
    </>
  );
}

function CategoryPill({ active, label, count, title, onClick }: { active: boolean; label: string; count: number; title?: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={active}
      title={title}
      onClick={onClick}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3.5 py-1.5 text-[13px] transition",
        active ? "border-ink bg-ink text-white" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4 hover:text-ink",
      )}
    >
      {label}
      <span className={cn("text-[11px] tabular-nums", active ? "text-white/70" : "text-ink-4")}>{count}</span>
    </button>
  );
}
