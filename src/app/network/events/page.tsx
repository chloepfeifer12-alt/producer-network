"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CalendarCheck, CalendarDays, ChevronDown, Clock, MapPin, Plus, Video } from "lucide-react";
import type { EventItem } from "@/lib/data/types";
import { lineName } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { toggleEventRsvp } from "@/lib/services/network";
import { PageHeader } from "@/components/ui/page";
import { Badge, Tag } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AvatarStack } from "@/components/ui/avatar";
import { EmptyState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { personInfo } from "@/components/network/people";
import { formatEventDate, isFuture } from "@/lib/utils/dates";
import { pluralize } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export default function EventsPage() {
  const db = useDb();
  const user = useCurrentUser();
  const [showPast, setShowPast] = useState(false);
  const { upcoming, past } = useMemo(() => {
    const up = db.events.filter((e) => isFuture(e.startsAt)).sort((a, b) => a.startsAt.localeCompare(b.startsAt));
    const pa = db.events.filter((e) => !isFuture(e.startsAt)).sort((a, b) => b.startsAt.localeCompare(a.startsAt));
    return { upcoming: up, past: pa };
  }, [db]);
  const going = useMemo(() => (user ? upcoming.filter((e) => e.attendees.includes(user.id)).length : 0), [upcoming, user]);

  if (!user) return <PageSkeleton />;

  return (
    <>
      <PageHeader
        eyebrow="Professional network"
        title="Events"
        description="Roundtables, office hours and meetups hosted by groups across the network."
        actions={going > 0 ? <Badge tone="success" icon={<CalendarCheck className="h-3 w-3" />}>{pluralize(going, "upcoming RSVP")}</Badge> : undefined}
      />

      <Notice tone="demo" className="mb-6" title="Demonstration events">
        These are fictional events for the prototype. RSVPs are stored only in this browser, and no calendar invitations or emails are sent.
      </Notice>

      <section aria-labelledby="upcoming-heading">
        <h2 id="upcoming-heading" className="sr-only">Upcoming events</h2>
        {upcoming.length === 0 ? (
          <EmptyState icon={<CalendarDays className="h-5 w-5" strokeWidth={1.75} />} title="No upcoming events" description="New events from groups will appear here." />
        ) : (
          <div className="space-y-4">
            {upcoming.map((e) => <EventCard key={e.id} event={e} />)}
          </div>
        )}
      </section>

      {past.length > 0 && (
        <section className="mt-10" aria-labelledby="past-heading">
          <button
            type="button"
            onClick={() => setShowPast((v) => !v)}
            aria-expanded={showPast}
            aria-controls="past-events"
            className="flex w-full items-center justify-between rounded-xl border border-line bg-surface px-4 py-3 text-left transition hover:border-line-strong"
          >
            <span id="past-heading" className="text-sm font-medium text-ink-2">Past events · {past.length}</span>
            <ChevronDown className={cn("h-4 w-4 text-ink-4 transition-transform", showPast && "rotate-180")} />
          </button>
          {showPast && (
            <div id="past-events" className="mt-4 space-y-4">
              {past.map((e) => <EventCard key={e.id} event={e} past />)}
            </div>
          )}
        </section>
      )}
    </>
  );
}

function EventCard({ event, past }: { event: EventItem; past?: boolean }) {
  const db = useDb();
  const user = useCurrentUser();
  const d = formatEventDate(event.startsAt);
  const attendees = useMemo(() => event.attendees.map((id) => personInfo(db, id)), [db, event.attendees]);
  const hostGroup = useMemo(() => db.groups.find((g) => g.name === event.host), [db, event.host]);
  const going = !!user && event.attendees.includes(user.id);

  const rsvp = () => {
    const r = toggleEventRsvp(user, event.id);
    if (!r.ok) return toast("Couldn't update your RSVP", { body: r.error, tone: "error" });
    if (going) toast("RSVP removed", { tone: "info" });
    else toast("You're on the list", { body: "Demo event — no calendar invitation is sent." });
  };

  return (
    <article className={cn("flex flex-col gap-5 rounded-2xl border border-line bg-surface p-5 shadow-card transition hover:border-line-strong sm:flex-row sm:p-6", past && "opacity-75")}>
      <div className="flex shrink-0 items-center gap-4 sm:w-20 sm:flex-col sm:items-stretch sm:gap-0">
        <div className="flex w-16 flex-col items-center overflow-hidden rounded-xl border border-line bg-surface text-center sm:w-full">
          <div className={cn("w-full py-1 text-[10.5px] font-semibold tracking-[0.12em]", past ? "bg-sunken text-ink-3" : "bg-navy text-white")}>{d.month}</div>
          <div className="py-1.5 text-[26px] font-semibold leading-none tracking-[-0.03em] tabular-nums text-ink">{d.day}</div>
        </div>
        <div className="text-xs text-ink-3 sm:mt-2 sm:text-center">{d.weekday}</div>
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone={event.format === "virtual" ? "navy" : "gold"} icon={event.format === "virtual" ? <Video className="h-3 w-3" /> : <MapPin className="h-3 w-3" />}>
            {event.format === "virtual" ? "Virtual" : "In person"}
          </Badge>
          {past && <Badge tone="outline">Ended</Badge>}
        </div>
        <h3 className="mt-2.5 text-[17px] font-semibold leading-snug tracking-[-0.01em] text-ink">{event.title}</h3>
        <div className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-[13px] text-ink-3">
          <span className="inline-flex items-center gap-1.5"><Clock className="h-3.5 w-3.5" strokeWidth={1.75} />{d.time}</span>
          <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />{event.location}</span>
        </div>
        <p className="mt-3 text-[14px] leading-relaxed text-ink-2">{event.description}</p>
        <div className="mt-3 flex flex-wrap items-center gap-1.5 text-[13px] text-ink-3">
          Hosted by{" "}
          {hostGroup ? (
            <Link href={`/network/groups/${hostGroup.slug}`} className="font-medium text-ink-2 hover:text-navy-600">{event.host}</Link>
          ) : (
            <span className="font-medium text-ink-2">{event.host}</span>
          )}
          {event.lines.length > 0 && <span aria-hidden className="mx-1 text-ink-4">·</span>}
          {event.lines.map((l) => <Tag key={l}>{lineName(l, true)}</Tag>)}
        </div>

        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4">
          <div className="flex items-center gap-2.5">
            {attendees.length > 0 && <AvatarStack people={attendees.map((a) => ({ name: a.name, tone: a.tone }))} size={26} max={5} />}
            <span className="text-xs text-ink-3">
              {attendees.length === 0 ? "Be the first to RSVP" : `${pluralize(attendees.length, past ? "attendee" : "person", past ? "attendees" : "people")}${past ? "" : " going"}`}
            </span>
          </div>
          {!past && (
            <Button variant={going ? "secondary" : "accent"} size="sm" aria-pressed={going} onClick={rsvp} aria-label={`RSVP to ${event.title}`}>
              {going ? <><CalendarCheck className="h-3.5 w-3.5 text-success" strokeWidth={1.75} /> Going</> : <><Plus className="h-3.5 w-3.5" strokeWidth={2} /> RSVP</>}
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
