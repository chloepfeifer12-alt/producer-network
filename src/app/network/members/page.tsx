"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { EyeOff, Search, Users, X } from "lucide-react";
import type { Availability, ExperienceLevel, LineSlug } from "@/lib/data/types";
import { AVAILABILITY_LABEL, EXPERIENCE_LABEL, INSURANCE_LINES, lineName, stateName } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { directoryMembers } from "@/lib/services/privacy";
import { mutualCount } from "@/lib/services/network";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input, Label, Select } from "@/components/ui/form";
import { EmptyState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { MemberCard } from "@/components/network/member-card";
import { pluralize } from "@/lib/utils/format";

const EXPERIENCE = Object.keys(EXPERIENCE_LABEL) as ExperienceLevel[];
const AVAILABILITY = Object.keys(AVAILABILITY_LABEL) as Availability[];

export default function MembersDirectoryPage() {
  const db = useDb();
  const user = useCurrentUser();
  const [q, setQ] = useState("");
  const [line, setLine] = useState<LineSlug | "">("");
  const [state, setState] = useState("");
  const [level, setLevel] = useState<ExperienceLevel | "">("");
  const [availability, setAvailability] = useState<Availability | "">("");

  const members = useMemo(() => {
    if (!user) return [];
    return directoryMembers(db, user)
      .filter((p) => p.userId !== user.id)
      .map((p) => ({
        profile: p,
        name: db.users.find((u) => u.id === p.userId)?.name ?? "Member",
        mutual: mutualCount(db, user.id, p.userId),
      }));
  }, [db, user]);

  const states = useMemo(() => Array.from(new Set(members.map((m) => m.profile.state))).sort(), [members]);

  const results = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return members
      .filter(({ profile, name }) => {
        if (needle && !`${name} ${profile.headline}`.toLowerCase().includes(needle)) return false;
        if (line && !profile.specialties.includes(line)) return false;
        if (state && profile.state !== state) return false;
        if (level && profile.experienceLevel !== level) return false;
        if (availability && profile.availability !== availability) return false;
        return true;
      })
      .sort((a, b) => b.mutual - a.mutual || a.name.localeCompare(b.name));
  }, [members, q, line, state, level, availability]);

  const active = !!(q || line || state || level || availability);
  const clear = () => {
    setQ("");
    setLine("");
    setState("");
    setLevel("");
    setAvailability("");
  };

  if (!user) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        eyebrow="Professional network"
        title="Member directory"
        description="Find producers, account managers, leaders and people new to the industry. Only members who chose to appear in the directory are listed."
      />

      <Card className="p-4 sm:p-5">
        <div>
          <Label htmlFor="member-search">Search members</Label>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" strokeWidth={1.75} />
            <Input id="member-search" type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name or headline, e.g. “commercial” or “benefits”" className="pl-9" />
          </div>
        </div>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <Label htmlFor="f-line">Insurance category</Label>
            <Select id="f-line" value={line} onChange={(e) => setLine(e.target.value as LineSlug | "")}>
              <option value="">All categories</option>
              {INSURANCE_LINES.map((l) => <option key={l.slug} value={l.slug}>{l.name}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-state">State</Label>
            <Select id="f-state" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">All states</option>
              {states.map((s) => <option key={s} value={s}>{stateName(s)}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-level">Experience level</Label>
            <Select id="f-level" value={level} onChange={(e) => setLevel(e.target.value as ExperienceLevel | "")}>
              <option value="">Any experience</option>
              {EXPERIENCE.map((x) => <option key={x} value={x}>{EXPERIENCE_LABEL[x]}</option>)}
            </Select>
          </div>
          <div>
            <Label htmlFor="f-avail">Availability</Label>
            <Select id="f-avail" value={availability} onChange={(e) => setAvailability(e.target.value as Availability | "")}>
              <option value="">Any availability</option>
              {AVAILABILITY.map((x) => <option key={x} value={x}>{AVAILABILITY_LABEL[x]}</option>)}
            </Select>
          </div>
        </div>
      </Card>

      <div className="mb-4 mt-6 flex flex-wrap items-center justify-between gap-3">
        <p className="text-[13px] text-ink-3" aria-live="polite">
          {pluralize(results.length, "member")}
          {line && <> in {lineName(line)}</>}
          {state && <> · {stateName(state)}</>}
        </p>
        {active && (
          <Button variant="ghost" size="sm" onClick={clear}>
            <X className="h-3.5 w-3.5" /> Clear filters
          </Button>
        )}
      </div>

      {results.length === 0 ? (
        <EmptyState
          icon={<Users className="h-5 w-5" strokeWidth={1.75} />}
          title="No members match those filters"
          description="Try a broader search or remove a filter. Members with private profiles never appear in the directory."
          action={active ? <Button variant="secondary" size="sm" onClick={clear}>Clear filters</Button> : undefined}
        />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {results.map((m) => (
            <MemberCard key={m.profile.userId} profile={m.profile} name={m.name} mutual={m.mutual} />
          ))}
        </div>
      )}

      <Notice className="mt-8" icon={<EyeOff className="h-4 w-4" strokeWidth={1.75} />} title="Privacy by design">
        Members control whether they appear here. Private profiles and members who opted out of the directory are never listed, and license
        numbers or contact details are never shown in the network.{" "}
        {(user.kind === "producer" || user.kind === "aspiring") && (
          <Link href="/me/profile" className="font-medium underline underline-offset-2">Review your profile</Link>
        )}
      </Notice>
    </>
  );
}
