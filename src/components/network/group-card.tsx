"use client";

import { useMemo } from "react";
import Link from "next/link";
import { Check, Layers, Plus } from "lucide-react";
import type { Group } from "@/lib/data/types";
import { TOPIC_LABEL, lineName } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { toggleGroupMembership } from "@/lib/services/network";
import { AvatarStack } from "@/components/ui/avatar";
import { Badge, Tag } from "@/components/ui/badge";
import { Button, type ButtonSize } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { pluralize } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { personInfo } from "./people";

export function JoinGroupButton({ group, size = "sm", className }: { group: Group; size?: ButtonSize; className?: string }) {
  const user = useCurrentUser();
  const joined = !!user && group.memberIds.includes(user.id);
  const onClick = () => {
    const r = toggleGroupMembership(user, group.id);
    if (!r.ok) return toast("Couldn't update membership", { body: r.error, tone: "error" });
    if (r.data) toast(`Joined ${group.name}`, { body: "You can now post in this group." });
    else toast(`Left ${group.name}`, { tone: "info" });
  };
  return (
    <Button
      variant={joined ? "secondary" : "accent"}
      size={size}
      aria-pressed={joined}
      onClick={onClick}
      className={cn("group/join", className)}
      aria-label={`Join ${group.name}`}
      title={joined ? "Leave group" : undefined}
    >
      {joined ? (
        <>
          <Check className="h-3.5 w-3.5 group-hover/join:hidden group-focus-visible/join:hidden" strokeWidth={2} />
          <span className="group-hover/join:hidden group-focus-visible/join:hidden">Joined</span>
          <span className="hidden group-hover/join:inline group-focus-visible/join:inline">Leave</span>
        </>
      ) : (
        <>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} /> Join
        </>
      )}
    </Button>
  );
}

export function useGroupMembers(group: Group) {
  const db = useDb();
  return useMemo(() => group.memberIds.map((id) => personInfo(db, id)), [db, group.memberIds]);
}

export function GroupCard({ group }: { group: Group }) {
  const members = useGroupMembers(group);
  const href = `/network/groups/${group.slug}`;
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition duration-200 hover:-translate-y-0.5 hover:border-line-strong hover:shadow-lift sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-navy-50 text-navy-600 ring-1 ring-navy-100">
          <Layers className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </span>
        <Badge tone="navy">{TOPIC_LABEL[group.topic]}</Badge>
      </div>
      <h3 className="mt-4 text-[16.5px] font-semibold leading-snug tracking-[-0.01em]">
        <Link href={href} className="text-ink after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none focus-visible:after:ring-4 focus-visible:after:ring-navy-100">
          {group.name}
        </Link>
      </h3>
      <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-ink-3">{group.description}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {group.lines.slice(0, 3).map((l) => <Tag key={l}>{lineName(l, true)}</Tag>)}
      </div>
      <div className="min-h-5 flex-1" aria-hidden />
      <div className="flex items-center justify-between gap-3 border-t border-line pt-4">
        <div className="flex items-center gap-2.5">
          <AvatarStack people={members.map((m) => ({ name: m.name, tone: m.tone }))} size={26} max={4} />
          <span className="text-xs text-ink-3">{pluralize(group.memberIds.length, "member")}</span>
        </div>
        {/* Sits above the stretched link so it stays clickable. */}
        <div className="relative z-10">
          <JoinGroupButton group={group} size="xs" />
        </div>
      </div>
    </article>
  );
}
