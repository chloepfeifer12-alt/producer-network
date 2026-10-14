"use client";

import { useId, useMemo, useState } from "react";
import Link from "next/link";
import { ShieldAlert } from "lucide-react";
import type { Group, PostTopic } from "@/lib/data/types";
import { TOPIC_LABEL } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { createPost, looksLikeClientData } from "@/lib/services/network";
import { Avatar } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { personInfo } from "./people";

const MAX = 3000;
const TOPICS = Object.keys(TOPIC_LABEL) as PostTopic[];

/**
 * Post composer. Pass `group` to lock posting into a single group (group
 * pages); otherwise members may optionally choose one of their groups.
 */
export function PostComposer({ group, defaultTopic, className }: { group?: Group; defaultTopic?: PostTopic; className?: string }) {
  const db = useDb();
  const user = useCurrentUser();
  const uid = useId();
  const [body, setBody] = useState("");
  const [topic, setTopic] = useState<PostTopic>(defaultTopic ?? group?.topic ?? "career_development");
  const [groupId, setGroupId] = useState<string>("");
  const [focused, setFocused] = useState(false);

  const me = useMemo(() => (user ? personInfo(db, user.id) : null), [db, user]);
  const myGroups = useMemo(() => (user ? db.groups.filter((g) => g.memberIds.includes(user.id)) : []), [db, user]);
  const flagged = useMemo(() => looksLikeClientData(body), [body]);

  if (!user || !me) return null;

  const trimmed = body.trim().length;
  const expanded = focused || body.length > 0;

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    const r = createPost(user, { body, topic, groupId: group?.id ?? (groupId || undefined) });
    if (r.ok) {
      setBody("");
      setFocused(false);
      const target = group ?? myGroups.find((g) => g.id === groupId);
      toast("Posted", { body: target ? `Shared with ${target.name}.` : "Your post is live in the industry feed." });
      setGroupId("");
    } else {
      toast("Couldn't publish your post", { body: r.error, tone: "error" });
    }
  };

  return (
    <Card className={cn("p-4 sm:p-5", className)}>
      <form onSubmit={submit} aria-label={group ? `Post in ${group.name}` : "Start a discussion"}>
        <div className="flex gap-3">
          <Avatar name={me.name} tone={me.tone} size={40} className="hidden sm:inline-flex" />
          <div className="min-w-0 flex-1">
            <label htmlFor={`${uid}-body`} className="sr-only">
              {group ? `Share something with ${group.name}` : "Start a discussion"}
            </label>
            <Textarea
              id={`${uid}-body`}
              value={body}
              maxLength={MAX}
              onChange={(e) => setBody(e.target.value)}
              onFocus={() => setFocused(true)}
              rows={expanded ? 5 : 2}
              aria-invalid={flagged || undefined}
              aria-describedby={`${uid}-guard`}
              placeholder={group ? `Share a question or insight with ${group.name}…` : "Share a lesson, ask a question, or start a professional discussion…"}
              className={cn("resize-y transition-[min-height]", expanded ? "min-h-[128px]" : "min-h-[64px]", flagged && "border-danger/50 focus:border-danger focus:ring-danger-50")}
            />
            <p id={`${uid}-guard`} className={cn("mt-2 flex items-start gap-1.5 text-xs leading-relaxed", flagged ? "text-danger" : "text-ink-3")}>
              <ShieldAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" strokeWidth={1.75} />
              {flagged ? (
                <span>This looks like it may include client or policy details (policy numbers, SSNs or dates of birth). Remove them before posting.</span>
              ) : (
                <span>
                  Never post client names, policy numbers or personal information. Keep it professional —{" "}
                  <Link href="/legal/community-guidelines" className="text-navy-600 underline-offset-2 hover:underline">community guidelines</Link>.
                </span>
              )}
            </p>

            {expanded && (
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <div>
                  <Label htmlFor={`${uid}-topic`}>Topic</Label>
                  <Select id={`${uid}-topic`} value={topic} onChange={(e) => setTopic(e.target.value as PostTopic)}>
                    {TOPICS.map((t) => (
                      <option key={t} value={t}>{TOPIC_LABEL[t]}</option>
                    ))}
                  </Select>
                </div>
                {group ? (
                  <div>
                    <span className="mb-1.5 block text-[13px] font-medium text-ink-2">Posting in</span>
                    <div className="flex h-10 items-center truncate rounded-lg border border-line bg-subtle px-3 text-sm text-ink-2">{group.name}</div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor={`${uid}-group`} optional>Group</Label>
                    <Select id={`${uid}-group`} value={groupId} onChange={(e) => setGroupId(e.target.value)} disabled={myGroups.length === 0}>
                      <option value="">{myGroups.length ? "Entire network" : "Join a group to post there"}</option>
                      {myGroups.map((g) => (
                        <option key={g.id} value={g.id}>{g.name}</option>
                      ))}
                    </Select>
                  </div>
                )}
              </div>
            )}

            <div className="mt-4 flex items-center justify-between gap-3">
              <span className={cn("text-xs tabular-nums", body.length > MAX * 0.9 ? "text-warning" : "text-ink-4")} aria-live="polite">
                {body.length > 0 ? `${body.length.toLocaleString()} / ${MAX.toLocaleString()}` : ""}
              </span>
              <div className="flex items-center gap-2">
                {expanded && (
                  <Button variant="ghost" size="sm" onClick={() => { setBody(""); setFocused(false); }}>
                    Cancel
                  </Button>
                )}
                <Button type="submit" variant="accent" size="sm" disabled={trimmed < 10}title={trimmed < 10 ? "Posts need at least 10 characters" : undefined}>
                  Post
                </Button>
              </div>
            </div>
          </div>
        </div>
      </form>
    </Card>
  );
}
