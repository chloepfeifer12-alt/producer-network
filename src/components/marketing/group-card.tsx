"use client";

import Link from "next/link";
import { Users } from "lucide-react";
import type { Database, Group } from "@/lib/data/types";
import { AvatarStack } from "@/components/ui/avatar";
import { TOPIC_LABEL } from "@/lib/data/taxonomy";
import { cn } from "@/lib/utils/cn";

/** Compact public preview of a network group (links to the members-only groups area). */
export function GroupPreviewCard({ group, db, className }: { group: Group; db: Database; className?: string }) {
  const people = group.memberIds.map((id) => ({
    name: db.users.find((u) => u.id === id)?.name ?? "Member",
    tone: db.profiles.find((p) => p.userId === id)?.avatarTone ?? 0,
  }));
  return (
    <article className={cn("group relative flex flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:border-line-strong hover:shadow-lift", className)}>
      <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">{TOPIC_LABEL[group.topic]}</div>
      <h3 className="mt-2 text-[15.5px] font-semibold tracking-[-0.01em] text-ink">
        <Link href="/network/groups" className="after:absolute after:inset-0 after:rounded-2xl focus-visible:outline-none">{group.name}</Link>
      </h3>
      <p className="mt-1.5 line-clamp-3 text-[13.5px] leading-relaxed text-ink-3">{group.description}</p>
      <div className="mt-auto flex items-center justify-between gap-3 pt-5">
        <AvatarStack people={people} size={26} max={4} />
        <span className="inline-flex items-center gap-1 text-xs text-ink-3">
          <Users className="h-3.5 w-3.5" /> {group.memberIds.length} members
        </span>
      </div>
    </article>
  );
}
