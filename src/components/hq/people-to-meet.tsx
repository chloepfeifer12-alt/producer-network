"use client";

import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { SectionHead } from "@/components/editorial";
import { BareHead } from "./calm";
import { EmptyState } from "@/components/ui/feedback";
import { ButtonLink } from "@/components/ui/button";
import { ConnectionAction } from "@/components/network/connection-action";
import { MentorshipButton } from "./actions";
import type { PersonPick } from "./hq-data";

function PersonRow({ p, action, detail }: { p: PersonPick; action: React.ReactNode; detail?: React.ReactNode }) {
  const href = `/people/${p.profile.userId}`;
  return (
    <li className="flex items-start gap-3.5 py-4">
      <Link href={href} tabIndex={-1} aria-hidden className="shrink-0">
        <Avatar name={p.name} tone={p.profile.avatarTone} size={44} decorative />
      </Link>
      <div className="min-w-0 flex-1">
        <Link href={href} className="text-[14.5px] font-semibold tracking-[-0.005em] text-ink decoration-1 underline-offset-4 hover:underline">{p.name}</Link>
        <p className="mt-0.5 line-clamp-1 text-[13px] text-ink-3">{p.profile.headline}</p>
        {detail}
        <div className="mt-2.5">{action}</div>
      </div>
    </li>
  );
}

export function PeopleToMeet({ suggestions, mentorPicks, mentorsFirst, showMentors = true, bare }: { suggestions: PersonPick[]; mentorPicks: PersonPick[]; mentorsFirst?: boolean; showMentors?: boolean; bare?: boolean }) {
  const connect = (
    <div key="connect">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Professionals to connect with</div>
      {suggestions.length ? (
        <ul className="mt-1 divide-y divide-line border-b border-line">
          {suggestions.map((p) => (
            <PersonRow
              key={p.profile.userId}
              p={p}
              detail={p.why && <p className="mt-1 text-[12px] text-ink-4">{p.why}</p>}
              action={<ConnectionAction otherId={p.profile.userId} otherName={p.name} size="sm" />}
            />
          ))}
        </ul>
      ) : (
        <EmptyState compact className="mt-3" title="You've met everyone we'd suggest" description="Browse the directory by specialty or state." action={<ButtonLink href="/people" size="sm" variant="secondary">Open People</ButtonLink>} />
      )}
    </div>
  );

  const mentorBlock = showMentors ? (
    <div key="mentors">
      <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Mentors available</div>
      {mentorPicks.length ? (
        <ul className="mt-1 divide-y divide-line border-b border-line">
          {mentorPicks.map((p) => (
            <PersonRow
              key={p.profile.userId}
              p={p}
              detail={<p className="mt-1 text-[12px] text-gold-ink">Offers mentorship · {p.why}</p>}
              action={<MentorshipButton mentor={p.profile} name={p.name} />}
            />
          ))}
        </ul>
      ) : (
        <EmptyState compact className="mt-3" title="No mentors listed right now" description="Mentors set their own availability. Check People for office hours." />
      )}
    </div>
  ) : null;

  return (
    <section aria-label="People">
      {bare ? <BareHead dek={mentorsFirst ? "Mentors and members who can help you get started." : "Members who share your focus, and mentors who make time."} href="/people" label="Open People" /> : <SectionHead kicker="People" title={mentorsFirst ? "People who can help you start" : "Your next good conversation"} href="/people" linkLabel="Open People" size="sm" />}
      <div className="space-y-9">{mentorsFirst ? [mentorBlock, connect] : [connect, mentorBlock]}</div>
    </section>
  );
}
