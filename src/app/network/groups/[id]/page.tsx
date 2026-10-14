"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { CalendarDays, Layers, Lock, MessageSquare } from "lucide-react";
import { TOPIC_LABEL, lineName } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { feedPosts } from "@/lib/services/network";
import { Badge, Tag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { Breadcrumbs } from "@/components/ui/page";
import { AvatarStack } from "@/components/ui/avatar";
import { JoinGroupButton, useGroupMembers } from "@/components/network/group-card";
import { PostComposer } from "@/components/network/post-composer";
import { PostCard } from "@/components/network/post-card";
import { PersonLine } from "@/components/network/person";
import { findGroup } from "@/components/network/people";
import { formatDate, formatEventDate, isFuture } from "@/lib/utils/dates";
import { pluralize } from "@/lib/utils/format";
import type { Group } from "@/lib/data/types";

export default function GroupPage() {
  const params = useParams<{ id: string }>();
  const db = useDb();
  const user = useCurrentUser();
  const group = useMemo(() => findGroup(db, String(params.id ?? "")), [db, params.id]);

  if (!user) return <PageSkeleton />;
  if (!group) {
    return (
      <>
        <Breadcrumbs items={[{ href: "/network", label: "Network" }, { href: "/network/groups", label: "Groups" }]} className="mb-6" />
        <EmptyState
          icon={<Layers className="h-5 w-5" strokeWidth={1.75} />}
          title="Group not found"
          description="This group may have been archived, or the link is incorrect."
          action={<ButtonLink href="/network/groups" variant="secondary" size="sm">Browse groups</ButtonLink>}
        />
      </>
    );
  }
  return <GroupView group={group} userId={user.id} />;
}

function GroupView({ group, userId }: { group: Group; userId: string }) {
  const db = useDb();
  const members = useGroupMembers(group);
  const posts = useMemo(() => feedPosts(db, { groupId: group.id }), [db, group.id]);
  const isMember = group.memberIds.includes(userId);
  const events = useMemo(
    () => db.events.filter((e) => e.host === group.name && isFuture(e.startsAt)).sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [db, group.name],
  );
  // Show the viewer first, then everyone else.
  const orderedMembers = useMemo(() => [...members].sort((a, b) => Number(b.id === userId) - Number(a.id === userId)), [members, userId]);

  return (
    <>
      <Breadcrumbs items={[{ href: "/network", label: "Network" }, { href: "/network/groups", label: "Groups" }, { label: group.name }]} className="mb-6" />

      <Card className="overflow-hidden">
        <div className="h-16 bg-[linear-gradient(120deg,var(--color-navy-50),var(--color-subtle))] sm:h-20" aria-hidden />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-7 flex items-end justify-between gap-4">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-navy text-white shadow-card ring-4 ring-surface">
              <Layers className="h-6 w-6" strokeWidth={1.6} />
            </span>
            <JoinGroupButton group={group} size="md" />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <Badge tone="navy">{TOPIC_LABEL[group.topic]}</Badge>
            {group.lines.map((l) => <Tag key={l}>{lineName(l, true)}</Tag>)}
          </div>
          <h1 className="mt-3 font-display text-[30px] leading-[1.1] text-ink sm:text-[36px]">{group.name}</h1>
          <p className="mt-2 max-w-2xl text-[15px] leading-relaxed text-ink-3">{group.description}</p>
          <div className="mt-5 flex items-center gap-3">
            <AvatarStack people={members.map((m) => ({ name: m.name, tone: m.tone }))} size={28} max={6} />
            <span className="text-[13px] text-ink-3">
              {pluralize(group.memberIds.length, "member")} · {pluralize(posts.length, "discussion")}
            </span>
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <section aria-label="Group discussions" className="min-w-0 space-y-4">
          {isMember ? (
            <PostComposer group={group} />
          ) : (
            <Notice icon={<Lock className="h-4 w-4" strokeWidth={1.75} />} title="Join to take part">
              Anyone in the network can read this group. Join to start discussions here.
            </Notice>
          )}
          {posts.length === 0 ? (
            <EmptyState
              icon={<MessageSquare className="h-5 w-5" strokeWidth={1.75} />}
              title="No discussions yet"
              description={isMember ? "Start the first conversation — a question, a lesson learned or a resource you found useful." : "Join the group to start the first conversation."}
            />
          ) : (
            posts.map((p) => <PostCard key={p.id} post={p} hideGroup />)
          )}
        </section>

        <aside className="space-y-6">
          <Card>
            <CardHeader title="About this group" />
            <CardBody className="space-y-3 pt-3 text-[13.5px] leading-relaxed text-ink-2">
              <p>{group.description}</p>
              <dl className="space-y-2 border-t border-line pt-3 text-[13px]">
                <div className="flex justify-between gap-3"><dt className="text-ink-3">Topic</dt><dd className="text-right">{TOPIC_LABEL[group.topic]}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-ink-3">Focus</dt><dd className="text-right">{group.lines.map((l) => lineName(l, true)).join(", ")}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-ink-3">Created</dt><dd className="text-right">{formatDate(group.createdAt, { month: "short", year: "numeric" })}</dd></div>
              </dl>
              <p className="border-t border-line pt-3 text-xs text-ink-3">
                Keep it professional and never share client details. See the{" "}
                <Link href="/legal/community-guidelines" className="text-navy-600 hover:underline">community guidelines</Link>.
              </p>
            </CardBody>
          </Card>

          {events.length > 0 && (
            <Card>
              <CardHeader title="Upcoming group events" />
              <CardBody className="pt-3">
                <ul className="space-y-3">
                  {events.map((e) => {
                    const d = formatEventDate(e.startsAt);
                    return (
                      <li key={e.id}>
                        <Link href="/network/events" className="-mx-2 flex items-start gap-3 rounded-lg px-2 py-1.5 transition hover:bg-subtle">
                          <CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" strokeWidth={1.75} />
                          <span className="min-w-0">
                            <span className="block text-[13px] font-medium text-ink">{e.title}</span>
                            <span className="block text-[11.5px] text-ink-4">{d.weekday}, {d.month.charAt(0) + d.month.slice(1).toLowerCase()} {d.day} · {d.time}</span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </CardBody>
            </Card>
          )}

          <Card>
            <CardHeader title="Members" description={pluralize(group.memberIds.length, "member")} />
            <CardBody className="pt-3">
              {orderedMembers.length === 0 ? (
                <p className="text-sm text-ink-3">No members yet. Be the first to join.</p>
              ) : (
                <ul className="space-y-3.5">
                  {orderedMembers.map((m) => (
                    <li key={m.id}>
                      <PersonLine
                        person={m}
                        size={34}
                        nameClassName="text-[13.5px]"
                        subtitleClassName="text-xs"
                        meta={m.id === userId ? <span className="text-[11px] font-normal text-ink-4">You</span> : undefined}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </CardBody>
          </Card>
        </aside>
      </div>
    </>
  );
}
