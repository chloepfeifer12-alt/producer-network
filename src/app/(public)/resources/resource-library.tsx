"use client";

import { useMemo, useState } from "react";
import { BookOpen } from "lucide-react";
import type { Resource } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { ChipGroup } from "@/components/ui/form";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/feedback";
import { RESOURCE_AUDIENCE_LABEL, RESOURCE_KIND_LABEL, ResourceCard } from "@/components/marketing/resource-card";

type Audience = Resource["audience"];
type Kind = Resource["kind"];

const AUDIENCES: Audience[] = ["aspiring", "new", "experienced", "leaders", "all"];
const KINDS: Kind[] = ["guide", "article", "checklist", "template", "webinar"];

export function ResourceLibrary() {
  const db = useDb();
  const [audience, setAudience] = useState<Audience[]>([]);
  const [kind, setKind] = useState<Kind[]>([]);

  const results = useMemo(
    () =>
      db.resources.filter(
        (r) =>
          // "Everyone" resources match any audience filter.
          (!audience.length || audience.includes(r.audience) || r.audience === "all") &&
          (!kind.length || kind.includes(r.kind)),
      ),
    [db.resources, audience, kind],
  );

  const filtered = audience.length > 0 || kind.length > 0;
  const [lead, ...rest] = results;

  return (
    <div>
      <div className="mb-10 grid gap-6 rounded-2xl border border-line bg-surface p-5 shadow-card sm:p-6 md:grid-cols-[auto_1fr] md:gap-x-8">
        <div className="pt-1.5 text-[13px] font-medium text-ink-2" id="aud-label">I am…</div>
        <ChipGroup
          ariaLabel="Filter by audience"
          options={AUDIENCES.filter((a) => a !== "all").map((a) => ({ value: a, label: RESOURCE_AUDIENCE_LABEL[a] }))}
          value={audience}
          onChange={setAudience}
          size="sm"
        />
        <div className="pt-1.5 text-[13px] font-medium text-ink-2">Format</div>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <ChipGroup ariaLabel="Filter by format" options={KINDS.map((k) => ({ value: k, label: RESOURCE_KIND_LABEL[k] }))} value={kind} onChange={setKind} size="sm" />
          {filtered && (
            <Button variant="ghost" size="xs" onClick={() => { setAudience([]); setKind([]); }}>
              Clear filters
            </Button>
          )}
        </div>
      </div>

      <p className="mb-5 text-[13px] text-ink-3" aria-live="polite">
        {results.length} {results.length === 1 ? "resource" : "resources"}
        {filtered ? " match your filters" : " in the library"}
      </p>

      {results.length === 0 ? (
        <EmptyState
          icon={<BookOpen className="h-5 w-5" />}
          title="Nothing matches those filters"
          description="Try a different combination — the library is still growing."
          action={<Button variant="secondary" onClick={() => { setAudience([]); setKind([]); }}>Clear filters</Button>}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {lead && <ResourceCard r={lead} featured={!filtered} className={!filtered ? "md:col-span-2 lg:row-span-1" : undefined} />}
          {rest.map((r) => <ResourceCard key={r.id} r={r} />)}
        </div>
      )}
    </div>
  );
}
