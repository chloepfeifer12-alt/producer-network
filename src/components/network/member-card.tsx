"use client";

import Link from "next/link";
import type { ProducerProfile } from "@/lib/data/types";
import { AVAILABILITY_LABEL } from "@/lib/data/taxonomy";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/format";
import { peopleHref } from "@/components/people/people-data";
import { ConnectionAction } from "./connection-action";
import { locationLabel } from "./people";

export function AvailabilityDot({ value, className }: { value: ProducerProfile["availability"]; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-xs text-ink-3", className)}>
      <span className={cn("h-1.5 w-1.5 rounded-full", value === "actively_looking" ? "bg-success" : value === "open" ? "bg-navy-400" : "bg-ink-4")} aria-hidden />
      {AVAILABILITY_LABEL[value]}
    </span>
  );
}

function yearsShort(p: ProducerProfile) {
  if (p.aspiring || p.experienceLevel === "no_license") return "Preparing to license";
  if (p.yearsInIndustry <= 0) return "First year";
  return `${p.yearsInIndustry} ${p.yearsInIndustry === 1 ? "yr" : "yrs"}`;
}

/** Compact directory row for a member: who, what they do, why they're here, Connect. */
export function MemberCard({
  profile,
  name,
  mutual,
  isSelf,
  reason,
  signedIn = true,
  className,
}: {
  profile: ProducerProfile;
  name: string;
  mutual: number;
  isSelf?: boolean;
  /** Why this member is relevant to the viewer, e.g. "Shares your Commercial focus". */
  reason?: string;
  /** Visitors see location and experience instead of mutual connections. */
  signedIn?: boolean;
  className?: string;
}) {
  const href = peopleHref(profile.userId);
  const context = [locationLabel(profile), yearsShort(profile)].join(" · ");
  const line = isSelf
    ? "Your profile"
    : signedIn
      ? reason ?? (mutual > 0 ? pluralize(mutual, "mutual connection") : context)
      : context;
  const accent = signedIn && !isSelf && (!!reason || mutual > 0);
  return (
    <article className={cn("group relative flex flex-wrap items-center gap-x-4 gap-y-3 py-4 sm:flex-nowrap", className)}>
      <Avatar name={name} tone={profile.avatarTone} size={44} decorative className="self-start sm:self-center" />
      <div className="min-w-0 flex-1">
        <h3 className="truncate text-[15px] font-semibold leading-snug tracking-[-0.01em]">
          <Link
            href={href}
            className="rounded-sm text-ink after:absolute after:inset-0 after:content-[''] hover:text-navy-600 focus-visible:outline-none focus-visible:after:rounded-lg focus-visible:after:ring-2 focus-visible:after:ring-navy-200"
          >
            {name}
          </Link>
          {isSelf && <span className="ml-2 text-xs font-normal text-ink-4">You</span>}
        </h3>
        <p className="line-clamp-2 text-[13.5px] text-ink-2 sm:line-clamp-1">{profile.headline}</p>
        <p className={cn("mt-0.5 text-[12.5px] sm:truncate", accent ? "text-navy-600" : "text-ink-3")}>{line}</p>
      </div>
      <div className="relative z-10 w-full shrink-0 pl-[60px] sm:w-auto sm:pl-0">
        {isSelf ? (
          <Link href="/me/profile" className="text-[13px] font-medium text-navy-600 hover:text-navy">Edit</Link>
        ) : (
          <ConnectionAction otherId={profile.userId} otherName={name} size="sm" visitorPrompt />
        )}
      </div>
    </article>
  );
}
