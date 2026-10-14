"use client";

import Link from "next/link";
import { Sprout } from "lucide-react";
import { Avatar } from "@/components/ui/avatar";
import { cn } from "@/lib/utils/cn";
import { MentorAction } from "./mentorship";
import { peopleHref, sharedReason, yearsLabel, type MemberEntry } from "./people-data";

/** A mentor as a compact row: who, the topics they cover, and the ask. */
export function MentorRow({ entry, signedIn }: { entry: MemberEntry; signedIn: boolean }) {
  const { profile, name } = entry;
  const mentor = profile.mentor!;
  const reason = signedIn ? sharedReason(entry.shared) : undefined;
  return (
    <li className="group relative grid gap-3 py-5 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center sm:gap-8">
      <div className="flex min-w-0 gap-4">
        <Avatar name={name} tone={profile.avatarTone} size={44} decorative />
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link
              href={peopleHref(profile.userId)}
              className="text-[15px] font-semibold tracking-[-0.01em] text-ink after:absolute after:inset-0 after:content-[''] hover:text-navy-600"
            >
              {name}
            </Link>
            <span className="text-[12.5px] text-ink-4">{yearsLabel(profile.yearsInIndustry)}</span>
          </div>
          <p className="truncate text-[13.5px] text-ink-2">{profile.headline}</p>
          <p className="mt-1 text-[12.5px] leading-relaxed text-ink-3">
            {mentor.topics.join(" · ")}
            {reason && <span className="text-navy-600"> · {reason}</span>}
          </p>
        </div>
      </div>
      <div className="relative z-10 flex items-start pl-[60px] sm:justify-end sm:pl-0">
        <MentorAction mentorId={profile.userId} mentorName={name} mentor={mentor} />
      </div>
    </li>
  );
}

export function MentorBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-[13px] text-ink-2", className)}>
      <Sprout className="h-3.5 w-3.5 text-success" strokeWidth={1.75} /> Offers mentorship
    </span>
  );
}
