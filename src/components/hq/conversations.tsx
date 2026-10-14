"use client";

import Link from "next/link";
import { ArrowRight, MessageCircle } from "lucide-react";
import type { Database, Group, Post } from "@/lib/data/types";
import { Avatar } from "@/components/ui/avatar";
import { Kicker } from "@/components/editorial";
import { EmptyState } from "@/components/ui/feedback";
import { personInfo, relativeTime } from "@/components/network/people";
import { JoinGroupButton } from "@/components/network/group-card";
import { cn } from "@/lib/utils/cn";
import { LikeButton } from "./actions";

function excerpt(text: string, max: number) {
  if (text.length <= max) return text;
  const cut = text.slice(0, max);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,.;:—-]+$/, "") + "…";
}

function Quote({ db, post, lead }: { db: Database; post: Post; lead?: boolean }) {
  const author = personInfo(db, post.authorId);
  const group = post.groupId ? db.groups.find((g) => g.id === post.groupId) : undefined;
  return (
    <figure className="flex h-full flex-col">
      <blockquote className={cn("font-display text-ink", lead ? "text-[24px] leading-[1.32] sm:text-[30px]" : "text-[18px] leading-[1.4] sm:text-[19px]")}>
        <span aria-hidden className="mr-0.5 text-gold">“</span>
        {excerpt(post.body, lead ? 260 : 150)}
        <span aria-hidden className="text-gold">”</span>
      </blockquote>
      <figcaption className={cn("mt-auto flex items-center gap-3", lead ? "pt-6" : "pt-4")}>
        <Avatar name={author.name} tone={author.tone} size={lead ? 38 : 30} decorative />
        <div className="min-w-0 flex-1 text-[13px] leading-snug">
          {author.href ? (
            <Link href={author.href} className="font-medium text-ink decoration-1 underline-offset-4 hover:underline">{author.name}</Link>
          ) : (
            <span className="font-medium text-ink">{author.name}</span>
          )}
          <div className="truncate text-[12px] text-ink-4">
            {group ? <>in <Link href={`/network/groups/${group.slug}`} className="hover:text-ink-2 hover:underline">{group.name}</Link> · </> : null}
            {relativeTime(post.createdAt)}
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <LikeButton post={post} />
          <Link href="/network/conversations" className="inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] text-ink-3 transition hover:bg-sunken hover:text-ink" aria-label={`${post.comments.length} comments — open conversations`}>
            <MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />
            <span className="tabular-nums">{post.comments.length}</span>
          </Link>
        </div>
      </figcaption>
    </figure>
  );
}

export function Conversations({ db, posts, group }: { db: Database; posts: Post[]; group?: { g: Group; n: number; mine: boolean } }) {
  const [lead, ...rest] = posts;
  return (
    <section aria-labelledby="hq-conv" className="rounded-[28px] bg-subtle px-5 py-10 sm:px-10 sm:py-12 lg:px-14">
      <Kicker className="mb-5"><span id="hq-conv">Industry conversations</span></Kicker>
      <div className="mb-9 flex flex-wrap items-end justify-between gap-4">
        <h2 className="max-w-2xl font-display text-[28px] leading-[1.08] tracking-[-0.015em] text-ink sm:text-[34px]">What the industry is talking about</h2>
        <Link href="/network/conversations" className="group inline-flex items-center gap-1.5 text-[13px] font-medium text-ink-2 hover:text-ink">
          Join the conversation <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>

      {!lead ? (
        <EmptyState compact title="It's quiet in here" description="Start a conversation — ask a question or share something you learned this week." />
      ) : (
        <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-14">
          <div className="lg:col-span-7">
            <Quote db={db} post={lead} lead />
          </div>
          <div className="flex flex-col gap-8 lg:col-span-5 lg:border-l lg:border-line-strong/60 lg:pl-12">
            {rest.map((p, i) => (
              <div key={p.id} className={cn(i > 0 && "border-t border-line-strong/60 pt-8")}>
                <Quote db={db} post={p} />
              </div>
            ))}
          </div>
        </div>
      )}

      {group && group.n > 0 && (
        <div className="mt-10 flex flex-col gap-4 border-t border-line-strong/60 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13.5px] text-ink-3">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">Most active group</span>
            <span className="mx-2 text-ink-4">·</span>
            <Link href={`/network/groups/${group.g.slug}`} className="font-medium text-ink decoration-1 underline-offset-4 hover:underline">{group.g.name}</Link>
            <span className="text-ink-4"> — {group.n} posts and replies in the last two weeks · {group.g.memberIds.length} members{group.mine ? " · You're a member" : ""}</span>
          </p>
          <JoinGroupButton group={group.g} />
        </div>
      )}
    </section>
  );
}
