"use client";

import { useMemo, useState } from "react";
import { EyeOff, Search, Sprout, Users, X } from "lucide-react";
import type { Availability, ExperienceLevel, LineSlug } from "@/lib/data/types";
import { AVAILABILITY_LABEL, EXPERIENCE_LABEL, INSURANCE_LINES, lineName, stateName } from "@/lib/data/taxonomy";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
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
  onJoin,
}: {
  entries: MemberEntry[];
  filters: DirectoryFilters;
  onChange: (f: DirectoryFilters) => void;
  signedIn: boolean;
  /** Members-only profiles a visitor can't see (count only). */
  hiddenCount: number;
  onJoin: () => void;
}) {
  const [limit, setLimit] = useState(PAGE);
  const set = <K extends keyof DirectoryFilters>(k: K, v: DirectoryFilters[K]) => {
    setLimit(PAGE);
    onChange({ ...filters, [k]: v });
  };

  const states = useMemo(() => Array.from(new Set(entries.map((m) => m.profile.state))).sort(), [entries]);

  const results = useMemo(() => {
    const needle = filters.q.trim().toLowerCase();
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
        return b.shared.length - a.shared.length || b.mutual - a.mutual || b.features.length - a.features.length || a.name.localeCompare(b.name);
      });
  }, [entries, filters]);

  const active = !!(filters.q || filters.line || filters.state || filters.level || filters.availability || filters.mentors);
  const clear = () => {
    setLimit(PAGE);
    onChange({ ...EMPTY_FILTERS, sort: filters.sort });
  };
  const shown = results.slice(0, limit);

  return (
    <div>
      <div className="grid gap-4 border-y border-line py-5 lg:grid-cols-12 lg:items-end">
        <div className="lg:col-span-4">
          <Label htmlFor="people-search">Search the directory</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" strokeWidth={1.75} />
            <Input
              id="people-search"
              type="search"
              value={filters.q}
              onChange={(e) => set("q", e.target.value)}
              placeholder="Name, city, expertise: “cyber”, “fleet”…"
              className="pl-9"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:col-span-8">
          <div>
            <Label htmlFor="f-line">Specialty</Label>
            <Select id="f-line" value={filters.line} onChange={(e) => set("line", e.target.value as LineSlug | "")}>
              <option value="">All specialties</option>
              {INSURANCE_LINES.map((l) => <option key={l.slug} value={l.slug}>{l.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-state">State</Label>
            <Select id="f-state" value={filters.state} onChange={(e) => set("state", e.target.value)}>
              <option value="">All states</option>
              {states.map((s) => <option key={s} value={s}>{stateName(s)}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-level">Experience</Label>
            <Select id="f-level" value={filters.level} onChange={(e) => set("level", e.target.value)}>
              <option value="">Any experience</option>
              <optgroup label="Career stage">
                {STAGES.map((s) => <option key={s.key} value={`stage:${s.key}`}>{s.label}</option>)}
              </optgroup>
              <optgroup label="Experience level">
                {EXPERIENCE.map((x) => <option key={x} value={x}>{EXPERIENCE_LABEL[x]}</option>)}
              </optgroup>
            </Select>
          </div>
          <div>
            <Label htmlFor="f-avail">Availability</Label>
            <Select id="f-avail" value={filters.availability} onChange={(e) => set("availability", e.target.value as Availability | "")}>
              <option value="">Any availability</option>
              {AVAILABILITY.map((x) => <option key={x} value={x}>{AVAILABILITY_LABEL[x]}</option>)}
            </Select>
          </div>
        </div>
      </div>

      <div className="mb-6 mt-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            aria-pressed={filters.mentors}
            onClick={() => set("mentors", !filters.mentors)}
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition",
              filters.mentors ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4 hover:text-ink",
            )}
          >
            <Sprout className="h-3.5 w-3.5" strokeWidth={1.75} /> Open to mentoring
          </button>
          <p className="text-[13px] text-ink-3" aria-live="polite">
            <span className="font-medium text-ink-2">{pluralize(results.length, "professional")}</span>
            {filters.line && <> in {lineName(filters.line)}</>}
            {filters.state && <> · {stateName(filters.state)}</>}
            {filters.level && <> · {levelLabel(filters.level)}</>}
          </p>
          {active && (
            <Button variant="ghost" size="xs" onClick={clear}>
              <X className="h-3.5 w-3.5" /> Clear
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Label htmlFor="f-sort" className="mb-0 text-xs text-ink-3">Sort</Label>
          <Select id="f-sort" value={filters.sort} onChange={(e) => set("sort", e.target.value as DirectoryFilters["sort"])} className="h-8 w-auto text-[13px]">
            <option value="relevant">{signedIn ? "Most relevant to you" : "Featured first"}</option>
            <option value="experience">Most experienced</option>
            <option value="name">Name</option>
          </Select>
        </div>
      </div>

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
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {shown.map((m, i) => (
              <MemberCard
                key={m.profile.userId}
                profile={m.profile}
                name={m.name}
                mutual={m.mutual}
                isSelf={m.isSelf}
                reason={signedIn ? sharedReason(m.shared) : undefined}
                signedIn={signedIn}
                className={i < PAGE ? "animate-rise" : undefined}
              />
            ))}
          </div>
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
        <div className="mt-8 flex flex-col gap-4 rounded-2xl border border-line bg-subtle/60 p-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex gap-3">
            <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-ink-3" strokeWidth={1.75} />
            <div>
              <p className="text-[14.5px] font-medium text-ink">{pluralize(hiddenCount, "more professional")} share their portfolio with members only.</p>
              <p className="mt-0.5 text-[13px] text-ink-3">Members decide who sees their profile. Join to see the full directory, connect and request mentorship.</p>
            </div>
          </div>
          <Button variant="primary" size="sm" onClick={onJoin} className="shrink-0">Join the network</Button>
        </div>
      )}
    </div>
  );
}
