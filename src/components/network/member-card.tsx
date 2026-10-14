"use client";

import Link from "next/link";
import { MapPin, Users } from "lucide-react";
import type { ProducerProfile } from "@/lib/data/types";
import { AVAILABILITY_LABEL, EXPERIENCE_LABEL, lineName } from "@/lib/data/taxonomy";
import { Avatar } from "@/components/ui/avatar";
import { Tag } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/format";
import { ConnectionAction } from "./connection-action";
import { locationLabel } from "./people";

export function AvailabilityDot({ value, className }: { value: ProducerProfile["availability"]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-ink-3", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", value === "actively_looking" ? "bg-success" : value === "open" ? "bg-gold" : "bg-ink-4")} aria-hidden />
      {AVAILABILITY_LABEL[value]}
    </span>
  );
}

export function MemberCard({ profile, name, mutual, isSelf }: { profile: ProducerProfile; name: string; mutual: number; isSelf?: boolean }) {
  const href = `/network/members/${profile.userId}`;
  return (
    <article className="group flex h-full flex-col rounded-2xl border border-line bg-surface p-5 shadow-card transition duration-200 hover:border-line-strong hover:shadow-lift">
      <div className="flex items-start gap-3.5">
        <Link href={href} tabIndex={-1} aria-hidden className="shrink-0">
          <Avatar name={name} tone={profile.avatarTone} size={48} />
        </Link>
        <div className="min-w-0 flex-1">
          <h3 className="text-[15.5px] font-semibold leading-snug tracking-[-0.01em]">
            <Link href={href} className="rounded-sm text-ink hover:text-navy-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-navy-200">
              {name}
            </Link>
            {isSelf && <span className="ml-2 text-xs font-normal text-ink-4">You</span>}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-ink-3">{profile.headline}</p>
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />{locationLabel(profile)}</span>
        <span>{EXPERIENCE_LABEL[profile.experienceLevel]}</span>
        <AvailabilityDot value={profile.availability} />
      </div>
      <div className="mt-3.5 flex flex-wrap gap-1.5">
        {profile.specialties.slice(0, 3).map((s) => <Tag key={s}>{lineName(s, true)}</Tag>)}
        {profile.specialties.length > 3 && <Tag>+{profile.specialties.length - 3}</Tag>}
      </div>
      <div className="min-h-5 flex-1" aria-hidden />
      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
          <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
          {mutual > 0 ? pluralize(mutual, "mutual connection") : "No mutual connections"}
        </span>
        {isSelf ? (
          <Link href="/me/profile" className="text-[13px] font-medium text-navy-600 hover:text-navy">Edit profile</Link>
        ) : (
          <ConnectionAction otherId={profile.userId} otherName={name} size="sm" />
        )}
      </div>
    </article>
  );
}
