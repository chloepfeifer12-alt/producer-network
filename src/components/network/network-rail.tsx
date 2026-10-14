"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Bookmark, CalendarDays, Handshake, Layers, Users } from "lucide-react";
import type { User } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { connectionsOf, connectionState, mutualCount, pendingIncoming } from "@/lib/services/network";
import { directoryMembers } from "@/lib/services/privacy";
import { Avatar } from "@/components/ui/avatar";
import { Card, CardHeader } from "@/components/ui/card";
import { formatEventDate, isFuture } from "@/lib/utils/dates";
import { pluralize } from "@/lib/utils/format";
import { ConnectionAction } from "./connection-action";
import { personInfo } from "./people";

/** Members the viewer isn't connected with, ranked by mutual connections then shared specialties. */
export function useSuggestedMembers(user: User, limit = 3) {
  const db = useDb();
  return useMemo(() => {
    const mine = db.profiles.find((p) => p.userId === user.id);
    return directoryMembers(db, user)
      .filter((p) => p.userId !== user.id && connectionState(db, user.id, p.userId) === "none")
      .map((p) => ({
        profile: p,
        mutual: mutualCount(db, user.id, p.userId),
        overlap: mine ? p.specialties.filter((s) => mine.specialties.includes(s)).length : 0,
      }))
      .sort((a, b) => b.mutual - a.mutual || b.overlap - a.overlap || a.profile.userId.localeCompare(b.profile.userId))
      .slice(0, limit);
  }, [db, user, limit]);
}

function RailLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} className="inline-flex items-center gap-1 text-[13px] font-medium text-navy-600 hover:text-navy">
      {children} <ArrowRight className="h-3.5 w-3.5" />
    </Link>
  );
}

export function NetworkRail({ user }: { user: User }) {
  const db = useDb();
  const connections = useMemo(() => connectionsOf(db, user.id).length, [db, user.id]);
  const pending = useMemo(() => pendingIncoming(db, user.id).length, [db, user.id]);
  const suggested = useSuggestedMembers(user, 3);
  const groups = useMemo(() => db.groups.filter((g) => g.memberIds.includes(user.id)), [db, user.id]);
  const events = useMemo(
    () => db.events.filter((e) => isFuture(e.startsAt)).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 3),
    [db],
  );
  const canSaveResources = user.kind === "producer" || user.kind === "aspiring";

  return (
    <div className="space-y-5">
      <Card>
        <CardHeader title="Your network" />
        <div className="grid grid-cols-2 gap-px px-5 pb-5 pt-4 sm:px-6">
          <Link href="/network/connections" className="group rounded-xl p-2 -m-2 transition hover:bg-subtle">
            <div className="text-[24px] font-semibold tracking-[-0.03em] tabular-nums text-ink">{connections}</div>
            <div className="text-xs text-ink-3 group-hover:text-ink">{connections === 1 ? "Connection" : "Connections"}</div>
          </Link>
          <Link href="/network/connections?tab=received" className="group rounded-xl p-2 -m-2 transition hover:bg-subtle">
            <div className="flex items-center gap-2 text-[24px] font-semibold tracking-[-0.03em] tabular-nums text-ink">
              {pending}
              {pending > 0 && <span className="h-2 w-2 rounded-full bg-gold" aria-hidden />}
            </div>
            <div className="text-xs text-ink-3 group-hover:text-ink">Pending {pending === 1 ? "request" : "requests"}</div>
          </Link>
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 border-t border-line px-5 py-3 sm:px-6">
          <RailLink href="/network/members">Find members</RailLink>
          {canSaveResources && (
            <Link href="/me/saved?tab=resources" className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
              <Bookmark className="h-3.5 w-3.5" strokeWidth={1.75} /> Saved resources
            </Link>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="People you may know" description="Based on mutual connections and shared specialties." />
        <div className="px-5 pb-5 pt-3 sm:px-6">
          {suggested.length === 0 ? (
            <p className="text-[13px] text-ink-3">You&apos;re connected with everyone we&apos;d suggest right now.</p>
          ) : (
            <ul className="divide-y divide-line">
              {suggested.map(({ profile, mutual }) => {
                const p = personInfo(db, profile.userId);
                return (
                  <li key={profile.userId} className="py-3 first:pt-1 last:pb-0">
                    <div className="flex items-start gap-3">
                      <Avatar name={p.name} tone={p.tone} size={36} />
                      <div className="min-w-0 flex-1">
                        <Link href={p.href!} className="text-[13.5px] font-semibold text-ink hover:text-navy-600">{p.name}</Link>
                        <div className="line-clamp-2 text-xs leading-relaxed text-ink-3">{p.subtitle}</div>
                        <div className="mt-1 flex items-center gap-1 text-[11.5px] text-ink-4">
                          <Users className="h-3 w-3" /> {mutual > 0 ? `${pluralize(mutual, "mutual connection")}` : "No mutual connections yet"}
                        </div>
                        <ConnectionAction otherId={p.id} otherName={p.name} size="xs" className="mt-2" />
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Your groups" action={<RailLink href="/network/groups">All</RailLink>} />
        <div className="px-5 pb-5 pt-3 sm:px-6">
          {groups.length === 0 ? (
            <p className="text-[13px] leading-relaxed text-ink-3">
              Join a group to find peers in your line of business. <Link href="/network/groups" className="text-navy-600 hover:underline">Browse groups</Link>
            </p>
          ) : (
            <ul className="space-y-1">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link href={`/network/groups/${g.slug}`} className="-mx-2 flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[13.5px] text-ink-2 transition hover:bg-subtle hover:text-ink">
                    <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-navy-50 text-navy-600"><Layers className="h-3.5 w-3.5" strokeWidth={1.75} /></span>
                    <span className="min-w-0 flex-1 truncate">{g.name}</span>
                    <span className="text-[11px] tabular-nums text-ink-4">{g.memberIds.length}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </Card>

      <Card>
        <CardHeader title="Upcoming events" action={<RailLink href="/network/events">All</RailLink>} />
        <div className="px-5 pb-5 pt-3 sm:px-6">
          {events.length === 0 ? (
            <p className="text-[13px] text-ink-3">No upcoming events.</p>
          ) : (
            <ul className="space-y-3">
              {events.map((e) => {
                const d = formatEventDate(e.startsAt);
                const going = e.attendees.includes(user.id);
                return (
                  <li key={e.id}>
                    <Link href="/network/events" className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-1.5 transition hover:bg-subtle">
                      <span className="flex w-10 shrink-0 flex-col items-center rounded-lg border border-line bg-surface py-1 leading-none">
                        <span className="text-[9.5px] font-semibold tracking-[0.1em] text-gold-ink">{d.month}</span>
                        <span className="mt-0.5 text-[15px] font-semibold tabular-nums text-ink">{d.day}</span>
                      </span>
                      <span className="min-w-0">
                        <span className="line-clamp-2 text-[13px] font-medium leading-snug text-ink">{e.title}</span>
                        <span className="mt-0.5 block text-[11.5px] text-ink-4">
                          {e.format === "virtual" ? "Virtual" : "In person"} · {going ? "You're going" : pluralize(e.attendees.length, "attendee")}
                        </span>
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </Card>
    </div>
  );
}

/** Compact quick links shown above the feed on smaller screens (rail is desktop-only). */
export function NetworkQuickLinks({ user }: { user: User }) {
  const db = useDb();
  const pending = useMemo(() => pendingIncoming(db, user.id).length, [db, user.id]);
  const items = [
    { href: "/network/members", label: "Members", icon: Users },
    { href: pending ? "/network/connections?tab=received" : "/network/connections", label: pending ? `${pending} pending` : "Connections", icon: Handshake },
    { href: "/network/groups", label: "Groups", icon: Layers },
    { href: "/network/events", label: "Events", icon: CalendarDays },
  ];
  return (
    <nav aria-label="Network shortcuts" className="scrollbar-none -mx-4 flex gap-2 overflow-x-auto px-4 xl:hidden">
      {items.map(({ href, label, icon: Icon }) => (
        <Link key={href} href={href} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg border border-line bg-surface px-3 py-2 text-[13px] text-ink-2 shadow-card transition hover:border-line-strong hover:text-ink">
          <Icon className="h-3.5 w-3.5 text-ink-4" strokeWidth={1.75} /> {label}
        </Link>
      ))}
    </nav>
  );
}
