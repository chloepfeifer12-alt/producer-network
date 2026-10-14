"use client";

import { useMemo, useState } from "react";
import { SlidersHorizontal, Users, X } from "lucide-react";
import type { Availability, ExperienceLevel, LineSlug } from "@/lib/data/types";
import { AVAILABILITY_LABEL, EXPERIENCE_LABEL, INSURANCE_LINES, lineName, stateName } from "@/lib/data/taxonomy";
import { Button } from "@/components/ui/button";
import { Label, Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { MemberCard } from "@/components/network/member-card";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/format";
import { sharedReason, STAGES, type MemberEntry } from "./people-data";

export interface DirectoryFilters {
  q: string;
  line: LineSlug | "";
  state: string;
  /** An experience level, or a stage key from STAGES (e.g. "stage:building"). */
  level: string;
  availability: Availability | "";
  mentors: boolean;
  sort: "relevant" | "name" | "experience";
}

export const EMPTY_FILTERS: DirectoryFilters = { q: "", line: "", state: "", level: "", availability: "", mentors: false, sort: "relevant" };

const EXPERIENCE = Object.keys(EXPERIENCE_LABEL) as ExperienceLevel[];
const AVAILABILITY = Object.keys(AVAILABILITY_LABEL) as Availability[];
const PAGE = 12;
const CONTROL = "h-10 text-[13.5px]";

function levelMatches(level: string, value: ExperienceLevel) {
  if (!level) return true;
  if (level.startsWith("stage:")) return STAGES.find((s) => `stage:${s.key}` === level)?.levels.includes(value) ?? true;
  return level === value;
}

export function levelLabel(level: string) {
  if (level.startsWith("stage:")) return STAGES.find((s) => `stage:${s.key}` === level)?.label ?? "";
  return EXPERIENCE_LABEL[level as ExperienceLevel] ?? "";
}

export function PeopleDirectory({
  entries,
  filters,
  onChange,
  signedIn,
  hiddenCount,
  suggestedIds = [],
  onJoin,
}: {
  entries: MemberEntry[];
  filters: DirectoryFilters;
  onChange: (f: DirectoryFilters) => void;
  signedIn: boolean;
  /** Members-only profiles a visitor can't see (count only). */
  hiddenCount: number;
  /** Featured professionals, shown first when nothing is filtered. */
  suggestedIds?: string[];
  onJoin: () => void;
}) {
  const [limit, setLimit] = useState(PAGE);
  const moreActive = !!(filters.state || filters.availability || filters.mentors || filters.sort !== "relevant");
  const [moreOpen, setMoreOpen] = useState(moreActive);
  const set = <K extends keyof DirectoryFilters>(k: K, v: DirectoryFilters[K]) => {
    setLimit(PAGE);
    onChange({ ...filters, [k]: v });
  };

  const states = useMemo(() => Array.from(new Set(entries.map((m) => m.profile.state))).sort(), [entries]);
  const active = !!(filters.q || filters.line || filters.state || filters.level || filters.availability || filters.mentors);
  const showSuggested = !active && filters.sort === "relevant" && suggestedIds.length > 0;

  const results = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
    const rank = (id: string) => (showSuggested && suggestedIds.includes(id) ? suggestedIds.indexOf(id) : Infinity);
    return entries
      .filter(({ profile, name }) => {
        if (needle) {
          const hay = [name, profile.headline, profile.city, ...profile.expertise, ...profile.specialties.map((s) => lineName(s)), ...(profile.mentor?.topics ?? [])].join(" ").toLowerCase();
          if (!hay.includes(needle)) return false;
        }
        if (filters.line && !profile.specialties.includes(filters.line)) return false;
        if (filters.state && profile.state !== filters.state) return false;
        if (!levelMatches(filters.level, profile.experienceLevel)) return false;
        if (filters.availability && profile.availability !== filters.availability) return false;
        if (filters.mentors && !profile.mentor?.available) return false;
        return true;
      })
      .sort((a, b) => {
        if (a.isSelf !== b.isSelf) return a.isSelf ? 1 : -1;
        if (filters.sort === "name") return a.name.localeCompare(b.name);
        if (filters.sort === "experience") return b.profile.yearsInIndustry - a.profile.yearsInIndustry || a.name.localeCompare(b.name);
        const ra = rank(a.profile.userId);
        const rb = rank(b.profile.userId);
        if (ra !== rb) return ra < rb ? -1 : 1;
        return b.shared.length - a.shared.length || b.mutual - a.mutual || b.features.length - a.features.length || a.name.localeCompare(b.name);
      });
  }, [entries, filters, showSuggested, suggestedIds]);

  const clear = () => {
    setLimit(PAGE);
    onChange({ ...EMPTY_FILTERS, sort: filters.sort });
  };
  const shown = results.slice(0, limit);
  const moreCount = [filters.state, filters.availability, filters.mentors].filter(Boolean).length;

  return (
    <div>
      {/* One compact filter row */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3" aria-live="polite">
          <span>
            <span className="font-medium text-ink-2">{pluralize(results.length, "professional")}</span>
            {filters.q && <> matching &ldquo;{filters.q}&rdquo;</>}
            {filters.line && <> in {lineName(filters.line)}</>}
            {filters.state && <> · {stateName(filters.state)}</>}
            {filters.level && <> · {levelLabel(filters.level)}</>}
            {filters.mentors && <> · open to mentoring</>}
          </span>
          {active && (
            <button type="button" onClick={clear} className="inline-flex items-center gap-1 font-medium text-ink-2 hover:text-ink">
              <X className="h-3.5 w-3.5" /> Clear
            </button>
          )}
        </div>
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center">
          <div>
            <Label htmlFor="f-line" className="sr-only">Specialty</Label>
            <Select id="f-line" value={filters.line} onChange={(e) => set("line", e.target.value as LineSlug | "")} className={cn(CONTROL, "sm:w-48")}>
              <option value="">All specialties</option>
              {INSURANCE_LINES.map((l) => <option key={l.slug} value={l.slug}>{l.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-level" className="sr-only">Career stage or experience</Label>
            <Select id="f-level" value={filters.level} onChange={(e) => set("level", e.target.value)} className={cn(CONTROL, "sm:w-44")}>
              <option value="">Any stage</option>
              <optgroup label="Career stage">
                {STAGES.map((s) => <option key={s.key} value={`stage:${s.key}`}>{s.label}</option>)}
              </optgroup>
              <optgroup label="Experience level">
                {EXPERIENCE.map((x) => <option key={x} value={x}>{EXPERIENCE_LABEL[x]}</option>)}
              </optgroup>
            </Select>
          </div>
        </div>
        <button
          type="button"
          aria-expanded={moreOpen}
          aria-controls="more-filters"
          onClick={() => setMoreOpen((o) => !o)}
          className={cn(
            "inline-flex h-10 items-center gap-1.5 self-start rounded-lg px-3 text-[13.5px] font-medium transition sm:self-auto",
            moreOpen ? "bg-subtle text-ink" : "text-ink-2 hover:bg-subtle hover:text-ink",
          )}
        >
          <SlidersHorizontal className="h-4 w-4" strokeWidth={1.75} />
          More filters{moreCount > 0 && <span className="text-ink-3">· {moreCount}</span>}
        </button>
        </div>
      </div>

      {moreOpen && (
        <div id="more-filters" className="mt-3 grid grid-cols-2 gap-3 border-t border-line pt-4 sm:flex sm:flex-wrap sm:items-end">
          <div>
            <Label htmlFor="f-state" className="text-xs text-ink-3">State</Label>
            <Select id="f-state" value={filters.state} onChange={(e) => set("state", e.target.value)} className={cn(CONTROL, "sm:w-44")}>
              <option value="">All states</option>
              {states.map((s) => <option key={s} value={s}>{stateName(s)}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-avail" className="text-xs text-ink-3">Availability</Label>
            <Select id="f-avail" value={filters.availability} onChange={(e) => set("availability", e.target.value as Availability | "")} className={cn(CONTROL, "sm:w-44")}>
              <option value="">Any availability</option>
              {AVAILABILITY.map((x) => <option key={x} value={x}>{AVAILABILITY_LABEL[x]}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-sort" className="text-xs text-ink-3">Sort</Label>
            <Select id="f-sort" value={filters.sort} onChange={(e) => set("sort", e.target.value as DirectoryFilters["sort"])} className={cn(CONTROL, "sm:w-48")}>
              <option value="relevant">{signedIn ? "Most relevant to you" : "Featured first"}</option>
              <option value="experience">Most experienced</option>
              <option value="name">Name</option>
            </Select>
          </div>
          <label className="col-span-2 inline-flex h-10 cursor-pointer items-center gap-2 text-[13.5px] text-ink-2 sm:col-span-1">
            <input type="checkbox" checked={filters.mentors} onChange={() => set("mentors", !filters.mentors)} className="h-4 w-4 rounded border-line-strong accent-navy" />
            Open to mentoring
          </label>
        </div>
      )}

      <div className="mt-4" />

      {results.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
          title={signedIn ? "No one matches those filters" : "No public profiles match"}
          description={
            signedIn
              ? "Try a broader search or remove a filter. Members with private profiles never appear in the directory."
              : `Most members share their portfolio with signed-in members only${hiddenCount ? ` (${hiddenCount} more professionals)` : ""}. Join to see the full directory.`
          }
          action={
            <div className="flex flex-wrap justify-center gap-2">
              {active && <Button variant="secondary" size="sm" onClick={clear}>Clear filters</Button>}
              {!signedIn && <Button variant="primary" size="sm" onClick={onJoin}>Join to see everyone</Button>}
            </div>
          }
        />
      ) : (
        <>
          <ul className="grid grid-cols-1 gap-x-12 lg:grid-cols-2">
            {shown.map((m) => {
              const suggested = showSuggested && suggestedIds.includes(m.profile.userId);
              const reason = signedIn ? sharedReason(m.shared) : undefined;
              return (
                <li key={m.profile.userId} className="border-b border-line">
                  <MemberCard
                    profile={m.profile}
                    name={m.name}
                    mutual={m.mutual}
                    isSelf={m.isSelf}
                    reason={suggested && signedIn ? ["Suggested for you", reason].filter(Boolean).join(" · ") : reason}
                    signedIn={signedIn}
                  />
                </li>
              );
            })}
          </ul>
          {results.length > limit && (
            <div className="mt-8 flex justify-center">
              <Button variant="secondary" onClick={() => setLimit((l) => l + PAGE)}>
                Show more · {results.length - limit} remaining
              </Button>
            </div>
          )}
        </>
      )}

      {!signedIn && hiddenCount > 0 && results.length > 0 && (
        <p className="mt-8 text-[13.5px] text-ink-3">
          {pluralize(hiddenCount, "more professional")} share their portfolio with members only.{" "}
          <button type="button" onClick={onJoin} className="font-medium text-ink-2 underline decoration-line-strong underline-offset-4 hover:text-ink">
            Join to see everyone
          </button>
        </p>
      )}
    </div>
  );
}
