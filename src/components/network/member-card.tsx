"use client";

import Link from "next/link";
import { MapPin, Sprout, Users } from "lucide-react";
import type { ProducerProfile } from "@/lib/data/types";
import { AVAILABILITY_LABEL, lineName } from "@/lib/data/taxonomy";
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

/** Directory card for a member: a person you can act on (view, connect). */
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
  /** Visitors see a join prompt instead of mutual connections. */
  signedIn?: boolean;
  className?: string;
}) {
  const href = peopleHref(profile.userId);
  return (
    <article className={cn("group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-5 transition duration-200 hover:border-line-strong hover:shadow-lift", className)}>
      <div className="flex items-start gap-3.5">
        <Avatar name={name} tone={profile.avatarTone} size={52} decorative />
        <div className="min-w-0 flex-1">
          <h3 className="text-[15.5px] font-semibold leading-snug tracking-[-0.01em]">
            <Link
              href={href}
              className="rounded-sm text-ink after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:text-navy-600 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-navy-200"
            >
              {name}
            </Link>
            {isSelf && <span className="ml-2 text-xs font-normal text-ink-4">You</span>}
          </h3>
          <p className="mt-0.5 line-clamp-2 text-[13px] leading-relaxed text-ink-3">{profile.headline}</p>
        </div>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
        <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />{locationLabel(profile)}</span>
        <span aria-hidden className="text-ink-4">·</span>
        <span>{yearsShort(profile)}</span>
        {profile.mentor?.available && (
          <>
            <span aria-hidden className="text-ink-4">·</span>
            <span className="inline-flex items-center gap-1 text-ink-2"><Sprout className="h-3.5 w-3.5 text-success" strokeWidth={1.75} />Mentor</span>
          </>
        )}
      </div>

      <p className="mt-3 text-[12.5px] leading-relaxed text-ink-2">
        {profile.specialties.slice(0, 3).map((s) => lineName(s, true)).join(" · ")}
        {profile.specialties.length > 3 && <span className="text-ink-4"> +{profile.specialties.length - 3}</span>}
      </p>

      {reason && <p className="mt-2 text-xs font-medium text-navy-600">{reason}</p>}

      <div className="min-h-4 flex-1" aria-hidden />
      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
        {signedIn ? (
          <span className="inline-flex items-center gap-1.5 text-xs text-ink-3">
            <Users className="h-3.5 w-3.5" strokeWidth={1.75} />
            {isSelf ? "Your profile" : mutual > 0 ? pluralize(mutual, "mutual connection") : "No mutual connections yet"}
          </span>
        ) : (
          <AvailabilityDot value={profile.availability} />
        )}
        {isSelf ? (
          <Link href="/me/profile" className="text-[13px] font-medium text-navy-600 hover:text-navy">Edit profile</Link>
        ) : (
          <ConnectionAction otherId={profile.userId} otherName={name} size="sm" visitorPrompt />
        )}
      </div>
    </article>
  );
}
