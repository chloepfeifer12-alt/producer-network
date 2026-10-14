"use client";

import { useMemo, useState } from "react";
import { CalendarCheck, CalendarPlus, Check, Clock, GraduationCap, Heart, Plus, UserCheck } from "lucide-react";
import type { EventItem, Post, ProducerProfile } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { isFollowing, toggleFollowOrganization } from "@/lib/services/organizations";
import { connectionState, requestMentorship, toggleEventRsvp, toggleLike } from "@/lib/services/network";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { toast, toastResult } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";

/** Follow / Following toggle for an organization. */
export function FollowButton({ orgId, orgName, className, tone = "light" }: { orgId: string; orgName: string; className?: string; tone?: "light" | "onImage" }) {
  const db = useDb();
  const user = useCurrentUser();
  const following = useMemo(() => isFollowing(db, user?.id, orgId), [db, user?.id, orgId]);
  const onClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const r = toggleFollowOrganization(user, orgId);
    if (r.ok) toast(r.data ? `Following ${orgName}` : `Unfollowed ${orgName}`, { body: r.data ? "Their news and new roles will surface on your Network." : undefined });
    else toast("Couldn't update", { body: r.error, tone: "error" });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={following}
      className={cn(
        "relative z-10 inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-[12.5px] font-medium transition duration-150",
        following
          ? "bg-ink text-white hover:bg-[#2a2d35]"
          : tone === "onImage"
            ? "bg-surface/90 text-ink ring-1 ring-inset ring-black/5 backdrop-blur hover:bg-surface"
            : "border border-line-strong bg-surface text-ink hover:border-ink-4",
        className,
      )}
    >
      {following ? <Check className="h-3.5 w-3.5" strokeWidth={2} /> : <Plus className="h-3.5 w-3.5" strokeWidth={2} />}
      {following ? "Following" : "Follow"}
    </button>
  );
}

/** Quiet heart toggle for a post. */
export function LikeButton({ post, className }: { post: Post; className?: string }) {
  const user = useCurrentUser();
  const liked = !!user && post.likes.includes(user.id);
  const onClick = () => {
    const r = toggleLike(user, post.id);
    if (r.ok) toast(liked ? "Like removed" : "Liked", { body: liked ? undefined : "The author will see your appreciation." });
    else toast("Couldn't update", { body: r.error, tone: "error" });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={liked}
      aria-label={liked ? "Unlike post" : "Like post"}
      className={cn("inline-flex items-center gap-1.5 rounded-full px-2 py-1 text-[12.5px] transition", liked ? "text-[#a03a32]" : "text-ink-3 hover:bg-sunken hover:text-ink", className)}
    >
      <Heart className={cn("h-3.5 w-3.5", liked && "fill-current")} strokeWidth={1.75} />
      <span className="tabular-nums">{post.likes.length}</span>
    </button>
  );
}

/** RSVP toggle for a network event. */
export function RsvpButton({ event, className }: { event: EventItem; className?: string }) {
  const user = useCurrentUser();
  const going = !!user && event.attendees.includes(user.id);
  const onClick = () => {
    const r = toggleEventRsvp(user, event.id);
    if (r.ok) toast(going ? "RSVP removed" : "You're on the list", { body: going ? undefined : `${event.title} — added to your Network (demo, no calendar invite is sent).` });
    else toast("Couldn't update", { body: r.error, tone: "error" });
  };
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={going}
      className={cn(
        "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[12.5px] font-medium transition",
        going ? "bg-navy-50 text-navy ring-1 ring-inset ring-navy-200" : "border border-line-strong bg-surface text-ink hover:border-ink-4",
        className,
      )}
    >
      {going ? <CalendarCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> : <CalendarPlus className="h-3.5 w-3.5" strokeWidth={1.75} />}
      {going ? "Going" : "RSVP"}
    </button>
  );
}

const GOAL_MIN = 20;

/** Request mentorship: a connection request carrying an explicit goal. */
export function MentorshipButton({ mentor, name, className }: { mentor: ProducerProfile; name: string; className?: string }) {
  const db = useDb();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const state = useMemo(() => connectionState(db, user?.id, mentor.userId), [db, user?.id, mentor.userId]);
  const first = name.split(" ")[0];

  if (state === "connected")
    return (
      <span className={cn("inline-flex h-8 items-center gap-1.5 text-[12.5px] font-medium text-success", className)}>
        <UserCheck className="h-3.5 w-3.5" strokeWidth={1.75} /> Connected
      </span>
    );
  if (state === "outgoing" || state === "incoming")
    return (
      <span className={cn("inline-flex h-8 items-center gap-1.5 text-[12.5px] font-medium text-ink-3", className)}>
        <Clock className="h-3.5 w-3.5" strokeWidth={1.75} /> {state === "outgoing" ? "Request pending" : "Wants to connect"}
      </span>
    );

  const send = () => {
    const r = requestMentorship(user, mentor.userId, goal);
    if (toastResult(r, "Mentorship request sent", `${first} will see your goal with the request.`)) {
      setGoal("");
      setOpen(false);
    }
  };

  return (
    <>
      <Button variant="secondary" size="sm" className={cn("rounded-full", className)} onClick={() => setOpen(true)}>
        <GraduationCap className="h-3.5 w-3.5" strokeWidth={1.75} /> Request mentorship
      </Button>
      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={`Ask ${name} for mentorship`}
        description={mentor.mentor?.note}
        footer={
          <>
            <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
            <Button variant="accent" onClick={send} disabled={goal.trim().length < GOAL_MIN}>Send request</Button>
          </>
        }
      >
        {mentor.mentor && (
          <div className="mb-5 flex flex-wrap gap-1.5">
            {mentor.mentor.topics.map((t) => (
              <span key={t} className="rounded-full bg-subtle px-2.5 py-1 text-[12px] text-ink-2 ring-1 ring-inset ring-line">{t}</span>
            ))}
          </div>
        )}
        <Field
          id={`goal-${mentor.userId}`}
          label="What would you like help with?"
          hint={`${goal.trim().length < GOAL_MIN ? `${GOAL_MIN - goal.trim().length} more characters to go · ` : ""}Never include client or policy details.`}
        >
          <Textarea
            id={`goal-${mentor.userId}`}
            rows={5}
            maxLength={600}
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            placeholder={`Hi ${first} — I'm working toward… and would value your perspective on…`}
          />
        </Field>
        <p className="mt-3 text-[12.5px] leading-relaxed text-ink-4">Mentorship on the network is informal and voluntary. It is not career, legal or licensing advice.</p>
      </Dialog>
    </>
  );
}
