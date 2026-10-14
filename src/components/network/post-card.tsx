"use client";

import { useCallback, useId, useMemo, useState } from "react";
import Link from "next/link";
import { Ellipsis, Flag, Heart, Layers, MessageCircle, Send, Trash2 } from "lucide-react";
import type { Post } from "@/lib/data/types";
import { TOPIC_LABEL } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { addComment, deleteOwnPost, looksLikeClientData, toggleLike } from "@/lib/services/network";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { Popover, MenuItem } from "@/components/ui/menu";
import { toast, toastResult } from "@/components/ui/toast";
import { formatDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { personInfo, relativeTime } from "./people";
import { PersonLine } from "./person";
import { ReportDialog } from "./report-dialog";

/** Renders user-authored text as paragraphs, preserving single line breaks. */
export function Paragraphs({ text, className }: { text: string; className?: string }) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  return (
    <div className={cn("space-y-3", className)}>
      {paras.map((p, i) => (
        <p key={i} className="whitespace-pre-line break-words">{p}</p>
      ))}
    </div>
  );
}

const CLAMP_AT = 520;

export function PostCard({ post, hideGroup, className }: { post: Post; hideGroup?: boolean; className?: string }) {
  const db = useDb();
  const user = useCurrentUser();
  const uid = useId();
  const author = useMemo(() => personInfo(db, post.authorId), [db, post.authorId]);
  const group = useMemo(() => (post.groupId ? db.groups.find((g) => g.id === post.groupId) : undefined), [db, post.groupId]);
  const [showComments, setShowComments] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [comment, setComment] = useState("");
  const [reportOpen, setReportOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const closeReport = useCallback(() => setReportOpen(false), []);
  const closeDelete = useCallback(() => setConfirmDelete(false), []);

  const liked = !!user && post.likes.includes(user.id);
  const isOwn = user?.id === post.authorId;
  const long = post.body.length > CLAMP_AT;
  const commentsId = `${uid}-comments`;

  const like = () => {
    const r = toggleLike(user, post.id);
    if (!r.ok) toast("Couldn't update", { body: r.error, tone: "error" });
  };

  const submitComment = (e: React.FormEvent) => {
    e.preventDefault();
    const r = addComment(user, post.id, comment);
    if (r.ok) {
      setComment("");
      toast("Comment added");
    } else toast("Couldn't add your comment", { body: r.error, tone: "error" });
  };

  const remove = () => {
    if (toastResult(deleteOwnPost(user, post.id), "Post deleted")) setConfirmDelete(false);
  };

  return (
    <Card className={cn("overflow-visible", className)}>
      <article aria-labelledby={`${uid}-author`}>
        <div className="flex items-start gap-3 px-5 pt-5 sm:px-6">
          <div id={`${uid}-author`} className="min-w-0 flex-1">
            <PersonLine
              person={author}
              size={42}
              meta={
                <time dateTime={post.createdAt} title={formatDateTime(post.createdAt)} className="text-xs font-normal text-ink-4">
                  {relativeTime(post.createdAt)}
                </time>
              }
            />
          </div>
          <Popover
            label="Post actions"
            className="w-52 p-1.5"
            trigger={({ open, toggle }) => (
              <button
                type="button"
                onClick={toggle}
                aria-expanded={open}
                aria-label="Post actions"
                className="-mr-2 -mt-1 inline-flex h-8 w-8 items-center justify-center rounded-lg text-ink-4 transition hover:bg-sunken/70 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-100"
              >
                <Ellipsis className="h-4 w-4" />
              </button>
            )}
          >
            {(close) => (
              <div>
                {!isOwn && (
                  <MenuItem icon={<Flag className="h-4 w-4" strokeWidth={1.75} />} onClick={() => { close(); setReportOpen(true); }}>
                    Report post
                  </MenuItem>
                )}
                {isOwn && (
                  <MenuItem danger icon={<Trash2 className="h-4 w-4 text-danger" strokeWidth={1.75} />} onClick={() => { close(); setConfirmDelete(true); }}>
                    Delete post
                  </MenuItem>
                )}
                {author.href && (
                  <Link href={author.href} onClick={close} className="flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left text-sm text-ink-2 transition hover:bg-subtle hover:text-ink">
                    View {isOwn ? "your" : `${author.name.split(" ")[0]}'s`} profile
                  </Link>
                )}
              </div>
            )}
          </Popover>
        </div>

        <div className="flex flex-wrap items-center gap-1.5 px-5 pt-3 sm:px-6">
          <Badge tone="navy">{TOPIC_LABEL[post.topic]}</Badge>
          {group && !hideGroup && (
            <Link
              href={`/network/groups/${group.slug}`}
              className="inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[12px] font-medium text-ink-3 transition hover:bg-subtle hover:text-ink"
            >
              <Layers className="h-3.5 w-3.5" strokeWidth={1.75} />
              {group.name}
            </Link>
          )}
        </div>

        <div className="px-5 pt-3 text-[14.5px] leading-[1.65] text-ink-2 sm:px-6">
          <div className={cn(long && !expanded && "line-clamp-6")}>
            <Paragraphs text={post.body} />
          </div>
          {long && (
            <button type="button" onClick={() => setExpanded((v) => !v)} className="mt-1 text-[13px] font-medium text-navy-600 hover:text-navy">
              {expanded ? "Show less" : "Show more"}
            </button>
          )}
        </div>

        <div className="mt-4 flex items-center gap-1 border-t border-line px-3 py-2 sm:px-4">
          <button
            type="button"
            onClick={like}
            aria-pressed={liked}
            aria-label={`${liked ? "Unlike" : "Like"} post · ${post.likes.length} ${post.likes.length === 1 ? "like" : "likes"}`}
            className={cn(
              "inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium transition focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-100",
              liked ? "text-danger hover:bg-danger-50" : "text-ink-3 hover:bg-sunken/70 hover:text-ink",
            )}
          >
            <Heart className={cn("h-4 w-4 transition-transform", liked && "scale-110 fill-current")} strokeWidth={1.75} />
            <span className="tabular-nums">{post.likes.length}</span>
            <span className="hidden sm:inline">{liked ? "Liked" : "Like"}</span>
          </button>
          <button
            type="button"
            onClick={() => setShowComments((v) => !v)}
            aria-expanded={showComments}
            aria-controls={commentsId}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-medium text-ink-3 transition hover:bg-sunken/70 hover:text-ink focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-navy-100"
          >
            <MessageCircle className="h-4 w-4" strokeWidth={1.75} />
            <span className="tabular-nums">{post.comments.length}</span>
            <span className="hidden sm:inline">{post.comments.length === 1 ? "Comment" : "Comments"}</span>
          </button>
        </div>

        {showComments && (
          <div id={commentsId} className="border-t border-line bg-subtle/40 px-5 py-4 sm:px-6">
            {post.comments.length === 0 ? (
              <p className="pb-3 text-[13px] text-ink-3">No comments yet. Start the conversation.</p>
            ) : (
              <ul className="space-y-3 pb-4">
                {post.comments.map((c) => {
                  const p = personInfo(db, c.authorId);
                  return (
                    <li key={c.id} className="flex gap-2.5">
                      <Avatar name={p.name} tone={p.tone} size={30} />
                      <div className="min-w-0 flex-1 rounded-xl bg-surface px-3.5 py-2.5 ring-1 ring-line">
                        <div className="flex flex-wrap items-baseline gap-x-2 text-[13px]">
                          {p.href ? (
                            <Link href={p.href} className="font-semibold text-ink hover:text-navy-600">{p.name}</Link>
                          ) : (
                            <span className="font-semibold text-ink">{p.name}</span>
                          )}
                          <time dateTime={c.createdAt} className="text-[11.5px] text-ink-4">{relativeTime(c.createdAt)}</time>
                        </div>
                        <div className="truncate text-[11.5px] text-ink-4">{p.subtitle}</div>
                        <Paragraphs text={c.body} className="mt-1.5 text-[13.5px] leading-relaxed text-ink-2" />
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
            {user && (
              <form onSubmit={submitComment} className="flex items-start gap-2.5">
                <Avatar name={user.name} tone={personInfo(db, user.id).tone} size={30} />
                <div className="min-w-0 flex-1">
                  <label htmlFor={`${uid}-comment`} className="sr-only">Add a comment</label>
                  <div className="flex gap-2">
                    <input
                      id={`${uid}-comment`}
                      value={comment}
                      onChange={(e) => setComment(e.target.value)}
                      maxLength={1500}
                      placeholder="Add a thoughtful comment…"
                      className="h-9 w-full min-w-0 rounded-lg border border-line-strong bg-surface px-3 text-sm text-ink placeholder:text-ink-4 transition focus:border-navy-400 focus:outline-none focus:ring-4 focus:ring-navy-100"
                    />
                    <Button type="submit" size="sm" variant="primary" className="h-9 shrink-0" disabled={!comment.trim()} aria-label="Post comment">
                      <Send className="h-3.5 w-3.5" strokeWidth={1.75} />
                      <span className="hidden sm:inline">Reply</span>
                    </Button>
                  </div>
                  {looksLikeClientData(comment) && (
                    <p className="mt-1.5 text-xs text-danger">Please remove client or policy information before commenting.</p>
                  )}
                </div>
              </form>
            )}
          </div>
        )}
      </article>

      <ReportDialog open={reportOpen} onClose={closeReport} targetType="post" targetId={post.id} subject="this post" />
      <Dialog
        open={confirmDelete}
        onClose={closeDelete}
        title="Delete this post?"
        description="The post and its comments will be removed from the feed. This can't be undone."
        size="sm"
        footer={
          <>
            <Button variant="ghost" onClick={() => setConfirmDelete(false)}>Keep post</Button>
            <Button variant="danger" onClick={remove}>
              <Trash2 className="h-4 w-4" strokeWidth={1.75} /> Delete post
            </Button>
          </>
        }
      />
    </Card>
  );
}

export function PostSkeletonList({ count = 3 }: { count?: number }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-label="Loading posts">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <div className="skeleton h-10 w-10 rounded-full" />
            <div className="flex-1 space-y-2">
              <div className="skeleton h-3.5 w-40" />
              <div className="skeleton h-3 w-64 max-w-full" />
            </div>
          </div>
          <div className="mt-5 space-y-2">
            <div className="skeleton h-3 w-full" />
            <div className="skeleton h-3 w-11/12" />
            <div className="skeleton h-3 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  );
}
