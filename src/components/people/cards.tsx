"use client";

import Link from "next/link";
import { ArrowRight, ArrowUpRight, MapPin, Sprout } from "lucide-react";
import type { ProducerProfile } from "@/lib/data/types";
import { lineName } from "@/lib/data/taxonomy";
import { Avatar } from "@/components/ui/avatar";
import { CoverArt } from "@/components/brand/cover-art";
import { ConnectionAction } from "@/components/network/connection-action";
import { locationLabel } from "@/components/network/people";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/format";
import { MentorAction } from "./mentorship";
import { coverFor, highlightFor, peopleHref, sharedReason, yearsLabel, type MemberEntry } from "./people-data";

function Specialties({ profile, className }: { profile: ProducerProfile; className?: string }) {
  return (
    <p className={cn("text-[12.5px] uppercase tracking-[0.1em] text-ink-3", className)}>
      {profile.specialties.slice(0, 3).map((s) => lineName(s, true)).join("  ·  ")}
    </p>
  );
}

function Reason({ entry, signedIn }: { entry: MemberEntry; signedIn: boolean }) {
  const reason = sharedReason(entry.shared);
  if (!signedIn) return null;
  const bits = [reason, entry.mutual > 0 ? pluralize(entry.mutual, "mutual connection") : undefined].filter(Boolean);
  if (!bits.length) return null;
  return <p className="text-xs font-medium text-navy-600">{bits.join(" · ")}</p>;
}

/** The dominant featured portfolio: quiet cover, large initials, one highlight. */
export function FeaturedLead({ entry, signedIn }: { entry: MemberEntry; signedIn: boolean }) {
  const { profile, name } = entry;
  const cover = coverFor(profile.userId);
  const hl = highlightFor(entry);
  const href = peopleHref(profile.userId);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl border border-line bg-surface transition duration-200 hover:border-line-strong hover:shadow-lift">
      <div className="h-28 overflow-hidden sm:h-36" aria-hidden>
        <CoverArt seed={profile.userId} variant={cover.variant} hue={cover.hue} ground={cover.ground} className="opacity-70 transition duration-500 group-hover:scale-[1.03]" />
      </div>
      <div className="flex flex-1 flex-col px-6 pb-6 sm:px-8 sm:pb-8">
        <Avatar name={name} tone={profile.avatarTone} size={96} className="relative z-10 -mt-12 ring-4 ring-surface" decorative />
        <h3 className="mt-5 font-display text-[30px] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[36px]">
          <Link href={href} className="after:absolute after:inset-0 after:content-[''] hover:text-navy-600 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-inset focus-visible:after:ring-navy-200">
            {name}
          </Link>
        </h3>
        <p className="mt-2 max-w-xl text-[15.5px] leading-relaxed text-ink-2">{profile.headline}</p>
        <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px] text-ink-3">
          <span className="inline-flex items-center gap-1"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />{locationLabel(profile)}</span>
          <span aria-hidden className="text-ink-4">·</span>
          <span>{yearsLabel(profile.yearsInIndustry)}</span>
        </div>
        <Specialties profile={profile} className="mt-4" />
        {hl && (
          <figure className="mt-6 border-t border-line pt-5">
            <figcaption className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">{hl.label}</figcaption>
            <blockquote className="mt-2 font-display text-[20px] leading-snug text-ink sm:text-[22px]">{hl.text}</blockquote>
            {hl.detail && <p className="mt-2 line-clamp-2 max-w-xl text-[13.5px] leading-relaxed text-ink-3">{hl.detail}</p>}
          </figure>
        )}
        <div className="min-h-6 flex-1" aria-hidden />
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3">
          <Reason entry={entry} signedIn={signedIn} />
          <div className="ml-auto flex flex-wrap items-center gap-2">
            <ConnectionAction otherId={profile.userId} otherName={name} size="sm" visitorPrompt />
            <Link href={href} className="inline-flex h-8 items-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-ink hover:bg-subtle">
              View portfolio <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </div>
    </article>
  );
}

/** Secondary featured portfolio for the rail. */
export function FeaturedCompact({ entry, signedIn }: { entry: MemberEntry; signedIn: boolean }) {
  const { profile, name } = entry;
  const hl = highlightFor(entry);
  const href = peopleHref(profile.userId);
  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-line bg-surface p-6 transition duration-200 hover:border-line-strong hover:shadow-lift">
      <div className="flex items-start gap-4">
        <Avatar name={name} tone={profile.avatarTone} size={64} decorative />
        <div className="min-w-0 flex-1">
          <h3 className="font-display text-[24px] leading-[1.1] tracking-[-0.01em] text-ink">
            <Link href={href} className="after:absolute after:inset-0 after:rounded-2xl after:content-[''] hover:text-navy-600 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-navy-200">
              {name}
            </Link>
          </h3>
          <p className="mt-1 line-clamp-2 text-[13.5px] leading-relaxed text-ink-2">{profile.headline}</p>
          <p className="mt-1.5 text-xs text-ink-3">{locationLabel(profile)} · {yearsLabel(profile.yearsInIndustry)}</p>
        </div>
      </div>
      <Specialties profile={profile} className="mt-4 text-[11.5px]" />
      {hl && (
        <div className="mt-4 border-t border-line pt-4">
          <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">{hl.label}</div>
          <p className="mt-1.5 line-clamp-2 font-display text-[17px] leading-snug text-ink">{hl.text}</p>
        </div>
      )}
      <div className="min-h-4 flex-1" aria-hidden />
      <div className="relative z-10 mt-4 flex flex-wrap items-center justify-between gap-3">
        <Reason entry={entry} signedIn={signedIn} />
        <ConnectionAction otherId={profile.userId} otherName={name} size="sm" visitorPrompt className="ml-auto" />
      </div>
    </article>
  );
}

/** A mentor as an editorial row: who, what they offer, and the ask. */
export function MentorRow({ entry, signedIn }: { entry: MemberEntry; signedIn: boolean }) {
  const { profile, name } = entry;
  const mentor = profile.mentor!;
  return (
    <li className="grid gap-4 py-6 first:pt-0 last:pb-0 sm:grid-cols-[minmax(0,1fr)_auto] sm:gap-8">
      <div className="flex min-w-0 gap-4">
        <Link href={peopleHref(profile.userId)} tabIndex={-1} aria-hidden className="shrink-0">
          <Avatar name={name} tone={profile.avatarTone} size={52} decorative />
        </Link>
        <div className="min-w-0">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <Link href={peopleHref(profile.userId)} className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink hover:text-navy-600">{name}</Link>
            <span className="text-[13px] text-ink-3">{yearsLabel(profile.yearsInIndustry)}</span>
          </div>
          <p className="mt-0.5 text-[13px] text-ink-3">{profile.headline}</p>
          <p className="mt-3 font-display text-[18px] italic leading-snug text-ink">&ldquo;{mentor.note}&rdquo;</p>
          <p className="mt-2.5 text-[12.5px] text-ink-2">
            <span className="text-ink-4">Topics </span>
            {mentor.topics.join(" · ")}
          </p>
          {signedIn && sharedReason(entry.shared) && <p className="mt-1.5 text-xs font-medium text-navy-600">{sharedReason(entry.shared)}</p>}
        </div>
      </div>
      <div className="flex items-start sm:justify-end sm:pt-1">
        <MentorAction mentorId={profile.userId} mentorName={name} mentor={mentor} />
      </div>
    </li>
  );
}

export function MentorBadge({ className }: { className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 rounded-full border border-success/20 bg-success-50 px-2.5 py-0.5 text-[12px] font-medium text-success", className)}>
      <Sprout className="h-3.5 w-3.5" strokeWidth={1.75} /> Offers mentorship
    </span>
  );
}

export function ArticleLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  return (
    <Link href={href} className={cn("group inline-flex items-center gap-1 text-[13px] font-medium text-ink-2 hover:text-ink", className)}>
      {children} <ArrowUpRight className="h-3.5 w-3.5 transition group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
    </Link>
  );
}
