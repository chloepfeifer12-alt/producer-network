"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, MapPin, Video } from "lucide-react";
import { useDb, useHydrated } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { toggleEventRsvp } from "@/lib/services/network";
import { formatEventDate, isFuture } from "@/lib/utils/dates";
import { pluralize } from "@/lib/utils/format";
import { RoleSwitcher } from "@/components/layout/role-switcher";
import { Button, ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, Skeleton } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

/** Upcoming Network events as a dated listing, with RSVP for signed-in members. */
export function EventsListing({ limit = 5 }: { limit?: number }) {
  const db = useDb();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const [chooseRole, setChooseRole] = useState(false);
  const events = useMemo(
    () =>
      db.events
        .filter((e) => isFuture(e.startsAt))
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt))
        .slice(0, limit),
    [db.events, limit],
  );

  if (!hydrated) {
    return (
      <div className="divide-y divide-line border-t border-line">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex gap-6 py-5">
            <Skeleton className="h-14 w-14" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-5 w-2/3" />
              <Skeleton className="h-4 w-1/3" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!events.length) {
    return (
      <EmptyState
        compact
        title="No upcoming events on the calendar"
        description="New gatherings are added by communities across the Network."
        action={
          <ButtonLink href="/community" variant="secondary" size="sm">
            Explore communities
          </ButtonLink>
        }
      />
    );
  }

  const onRsvp = (eventId: string, going: boolean, title: string) => {
    if (!user) {
      setChooseRole(true);
      return;
    }
    if (!can(user, "network:participate")) {
      toast("RSVPs are for Network members", { body: "Switch to a member persona to save a seat.", tone: "info" });
      return;
    }
    const res = toggleEventRsvp(user, eventId);
    if (res.ok) toast(going ? "RSVP withdrawn" : "You’re on the list", { body: going ? undefined : `${title} · find it under Events in the Network.` });
    else toast("Couldn’t update your RSVP", { body: res.error, tone: "error" });
  };

  return (
    <>
      <ol className="border-t border-ink">
        {events.map((e) => {
          const d = formatEventDate(e.startsAt);
          const going = !!user && e.attendees.includes(user.id);
          return (
            <li key={e.id} className="grid grid-cols-[56px_minmax(0,1fr)] gap-x-5 gap-y-3 border-b border-line py-5 sm:grid-cols-[64px_minmax(0,1fr)_auto] sm:items-center">
              <div className="text-center leading-none">
                <div className="text-[10.5px] font-semibold tracking-[0.14em] text-ink-3">{d.month}</div>
                <div className="mt-1 font-display text-[34px] tabular-nums text-ink">{d.day}</div>
              </div>
              <div className="min-w-0">
                <h4 className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink">{e.title}</h4>
                <p className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[12.5px] text-ink-3">
                  <span>
                    {d.weekday} · {d.time}
                  </span>
                  <span aria-hidden className="text-ink-4">
                    ·
                  </span>
                  <span className="inline-flex items-center gap-1">
                    {e.format === "virtual" ? <Video className="h-3.5 w-3.5" strokeWidth={1.75} /> : <MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />}
                    {e.location}
                  </span>
                </p>
                <p className="mt-1 text-[12.5px] text-ink-4">
                  Hosted by {e.host} · {pluralize(e.attendees.length, "member")} going
                </p>
              </div>
              <div className="col-start-2 sm:col-start-3">
                <Button size="sm" variant={going ? "secondary" : "primary"} aria-pressed={going} onClick={() => onRsvp(e.id, going, e.title)} className={cn("min-w-[104px]", going && "text-success")}>
                  {going ? (
                    <>
                      <Check className="h-3.5 w-3.5" strokeWidth={2} /> Going
                    </>
                  ) : (
                    "RSVP"
                  )}
                </Button>
              </div>
            </li>
          );
        })}
      </ol>
      <Link
        href={user && can(user, "network:participate") ? "/network/events" : "/community"}
        className="group mt-4 inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink"
      >
        {user && can(user, "network:participate") ? "Your events calendar" : "Explore the community"} <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
      </Link>

      <Dialog
        open={chooseRole}
        onClose={() => setChooseRole(false)}
        title="Choose a role to RSVP"
        description="Event RSVPs are for Network members. In this prototype, pick a demo persona — or create your own member profile."
        footer={
          <>
            <Button variant="ghost" onClick={() => setChooseRole(false)}>
              Not now
            </Button>
            <ButtonLink href="/join">Join the Network</ButtonLink>
          </>
        }
      >
        <div className="-mx-2">
          <RoleSwitcher variant="panel" />
        </div>
        <p className="mt-3 text-xs text-ink-3">Demo personas are not real authentication.</p>
      </Dialog>
    </>
  );
}
