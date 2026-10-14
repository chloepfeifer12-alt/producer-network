"use client";

import { useMemo } from "react";
import Link from "next/link";
import { CalendarDays, Heart, MapPin, MessageSquare, Video } from "lucide-react";
import type { Database, Post } from "@/lib/data/types";
import { TOPIC_LABEL } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { feedPosts } from "@/lib/services/network";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { EmptyState } from "@/components/ui/feedback";
import { GroupPreviewCard } from "@/components/marketing/group-card";
import { formatEventDate, isFuture, relativeDay } from "@/lib/utils/dates";

function authorMeta(db: Database, authorId: string) {
  const u = db.users.find((x) => x.id === authorId);
  const p = db.profiles.find((x) => x.userId === authorId);
  const org = u?.orgId ? db.organizations.find((o) => o.id === u.orgId) : undefined;
  return {
    name: u?.name ?? "Member",
    tone: p?.avatarTone ?? 0,
    headline: p?.headline ?? (org ? `${org.name}` : "Member"),
  };
}

function PostPreview({ post, db }: { post: Post; db: Database }) {
  const a = authorMeta(db, post.authorId);
  const group = post.groupId ? db.groups.find((g) => g.id === post.groupId) : undefined;
  return (
    <article className="flex flex-col rounded-2xl border border-line bg-surface p-6 shadow-card">
      <header className="flex items-start gap-3">
        <Avatar name={a.name} tone={a.tone} size={40} />
        <div className="min-w-0 flex-1">
          <div className="text-[14px] font-semibold text-ink">{a.name}</div>
          <div className="truncate text-[12.5px] text-ink-3">{a.headline}</div>
        </div>
        <span className="shrink-0 text-xs text-ink-4" suppressHydrationWarning>{relativeDay(post.createdAt)}</span>
      </header>
      <p className="mt-4 line-clamp-6 text-[14.5px] leading-relaxed text-ink-2">{post.body}</p>
      <footer className="mt-auto flex flex-wrap items-center gap-x-4 gap-y-2 pt-5 text-xs text-ink-3">
        <Badge tone="neutral">{TOPIC_LABEL[post.topic]}</Badge>
        {group && <span className="truncate">in {group.name}</span>}
        <span className="ml-auto flex items-center gap-3 tabular-nums">
          <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" aria-hidden />{post.likes.length}<span className="sr-only"> likes</span></span>
          <span className="inline-flex items-center gap-1"><MessageSquare className="h-3.5 w-3.5" aria-hidden />{post.comments.length}<span className="sr-only"> comments</span></span>
        </span>
      </footer>
    </article>
  );
}

export function CommunityPosts() {
  const db = useDb();
  const posts = useMemo(() => {
    // Favor substantive conversations for the public preview.
    return feedPosts(db)
      .filter((p) => p.body.length > 120)
      .slice(0, 4);
  }, [db]);
  if (!posts.length) return <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="No conversations yet" description="Be the first to start one." />;
  return (
    <div className="grid gap-4 md:grid-cols-2">
      {posts.map((p) => <PostPreview key={p.id} post={p} db={db} />)}
    </div>
  );
}

export function CommunityGroups() {
  const db = useDb();
  const groups = useMemo(() => [...db.groups].sort((a, b) => b.memberIds.length - a.memberIds.length).slice(0, 6), [db]);
  if (!groups.length) return <EmptyState icon={<MessageSquare className="h-5 w-5" />} title="No groups yet" />;
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {groups.map((g) => <GroupPreviewCard key={g.id} group={g} db={db} />)}
    </div>
  );
}

export function CommunityEvents() {
  const db = useDb();
  const events = useMemo(
    () => db.events.filter((e) => isFuture(e.startsAt)).sort((a, b) => a.startsAt.localeCompare(b.startsAt)).slice(0, 4),
    [db],
  );
  if (!events.length) {
    return <EmptyState icon={<CalendarDays className="h-5 w-5" />} title="No upcoming events" description="New sessions are added by groups throughout the month." />;
  }
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface shadow-card">
      {events.map((e) => {
        const d = formatEventDate(e.startsAt);
        return (
          <li key={e.id} className="flex gap-5 p-5 sm:p-6">
            <div className="flex w-14 shrink-0 flex-col items-center justify-center rounded-xl border border-line bg-subtle py-2 text-center">
              <span className="text-[10.5px] font-semibold tracking-[0.12em] text-gold-ink">{d.month}</span>
              <span className="font-display text-[26px] leading-none text-ink tabular-nums">{d.day}</span>
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{e.title}</h3>
              <p className="mt-1 text-[13.5px] leading-relaxed text-ink-3">{e.description}</p>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-ink-3">
                <span>{d.weekday} · {d.time}</span>
                <span className="inline-flex items-center gap-1">
                  {e.format === "virtual" ? <Video className="h-3.5 w-3.5" /> : <MapPin className="h-3.5 w-3.5" />}
                  {e.location}
                </span>
                <span>Hosted by {e.host}</span>
              </div>
            </div>
          </li>
        );
      })}
      <li className="bg-subtle/60 px-6 py-3.5 text-[13px] text-ink-3">
        Members RSVP from <Link href="/network/events" className="font-medium text-navy-600 hover:text-navy">Events</Link> in the network.
      </li>
    </ul>
  );
}
