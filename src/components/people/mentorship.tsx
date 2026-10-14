"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Clock, Sprout } from "lucide-react";
import type { ProducerProfile } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { connectionState, requestMentorship } from "@/lib/services/network";
import { Button, type ButtonSize } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { toastResult } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { useStableCallback } from "@/components/network/use-stable-callback";
import { JoinPromptDialog } from "./join-prompt";
import { firstName } from "./people-data";

const GOAL_MIN = 20;
const GOAL_MAX = 600;

export function MentorRequestDialog({
  open,
  onClose: onCloseProp,
  mentorId,
  mentorName,
  mentor,
}: {
  open: boolean;
  onClose: () => void;
  mentorId: string;
  mentorName: string;
  mentor: NonNullable<ProducerProfile["mentor"]>;
}) {
  const user = useCurrentUser();
  const onClose = useStableCallback(onCloseProp);
  const [topic, setTopic] = useState<string | null>(null);
  const [goal, setGoal] = useState("");
  const [error, setError] = useState<string>();
  const first = firstName(mentorName);
  const send = () => {
    const text = goal.trim();
    if (text.length < GOAL_MIN) {
      setError(`Share a little more about what you'd like help with (at least ${GOAL_MIN} characters).`);
      return;
    }
    const r = requestMentorship(user, mentorId, topic ? `[${topic}] ${text}` : text);
    if (toastResult(r, "Mentorship request sent", `${first} will see your note under Connections.`)) {
      setGoal("");
      setTopic(null);
      setError(undefined);
      onClose();
    } else if (!r.ok) setError(r.error);
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Ask ${first} for mentorship`}
      description="Mentorship requests arrive as a connection request with your note attached. Be specific: a clear goal makes it easy to say yes."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={send}>
            <Sprout className="h-4 w-4" strokeWidth={1.75} /> Send request
          </Button>
        </>
      }
    >
      <figure className="mb-5 border-l-2 border-ink pl-4">
        <blockquote className="font-display text-[17px] italic leading-snug text-ink">{mentor.note}</blockquote>
        <figcaption className="mt-1.5 text-xs text-ink-3">{mentorName}</figcaption>
      </figure>
      <fieldset className="mb-5">
        <legend className="mb-2 text-[13px] font-medium text-ink-2">What would you like to focus on?</legend>
        <div className="flex flex-wrap gap-1.5">
          {mentor.topics.map((t) => {
            const active = topic === t;
            return (
              <button
                key={t}
                type="button"
                aria-pressed={active}
                onClick={() => setTopic(active ? null : t)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-[13px] transition",
                  active ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4 hover:text-ink",
                )}
              >
                {active && <Check className="h-3 w-3" strokeWidth={2.5} />}
                {t}
              </button>
            );
          })}
        </div>
      </fieldset>
      <Field
        label="Your goal"
        id={`goal-${mentorId}`}
        error={error}
        hint={`${goal.trim().length}/${GOAL_MAX} · Never include client or policy details.`}
      >
        <Textarea
          id={`goal-${mentorId}`}
          value={goal}
          maxLength={GOAL_MAX}
          rows={4}
          onChange={(e) => {
            setGoal(e.target.value);
            if (error) setError(undefined);
          }}
          placeholder={`e.g. I'm two years into personal lines and want a plan for moving into small commercial. Could we talk through how you built your niche?`}
        />
      </Field>
    </Dialog>
  );
}

/**
 * Mentorship control reflecting the connection between viewer and mentor.
 * Visitors are invited to join; existing requests show their state.
 */
export function MentorAction({
  mentorId,
  mentorName,
  mentor,
  size = "sm",
  variant = "secondary",
  className,
  block,
  onlyWhenAvailable,
}: {
  mentorId: string;
  mentorName: string;
  mentor: ProducerProfile["mentor"];
  size?: ButtonSize;
  variant?: "secondary" | "accent" | "primary" | "quiet";
  className?: string;
  block?: boolean;
  /** Render nothing unless a request can be sent (e.g. next to a ConnectionAction that already shows state). */
  onlyWhenAvailable?: boolean;
}) {
  const db = useDb();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const state = useMemo(() => connectionState(db, user?.id, mentorId), [db, user?.id, mentorId]);
  const pendingIsMentorship = useMemo(() => {
    if (!user) return false;
    const c = db.connections.find((x) => x.status === "pending" && x.fromId === user.id && x.toId === mentorId);
    return !!c?.message?.startsWith("Mentorship request");
  }, [db, user, mentorId]);

  if (!mentor?.available || state === "self") return null;
  const first = firstName(mentorName);
  const wide = block ? "w-full" : undefined;

  if (!user) {
    return (
      <>
        <Button variant={variant} size={size} className={cn(wide, className)} onClick={() => setOpen(true)}>
          <Sprout className="h-4 w-4" strokeWidth={1.75} /> Request mentorship
        </Button>
        <JoinPromptDialog
          open={open}
          onClose={() => setOpen(false)}
          title={`Join to ask ${first} for mentorship`}
          reason="Mentors offer their time to members of the network. Create a profile, or explore as one of the demo members to send a request."
        />
      </>
    );
  }

  if (!can(user, "network:participate")) return null;
  if (onlyWhenAvailable && state !== "none") return null;

  if (state === "outgoing") {
    return (
      <span className={cn("inline-flex h-8 items-center justify-center gap-1.5 rounded-lg bg-subtle px-3 text-[13px] font-medium text-ink-3 ring-1 ring-inset ring-line", wide, className)}>
        <Clock className="h-4 w-4" strokeWidth={1.75} /> {pendingIsMentorship ? "Mentorship requested" : "Request pending"}
      </span>
    );
  }
  if (state === "incoming") {
    return (
      <Link href="/network/connections?tab=received" className={cn("inline-flex h-8 items-center justify-center gap-1.5 rounded-lg px-3 text-[13px] font-medium text-navy-600 hover:text-navy", wide, className)}>
        {first} asked to connect · respond
      </Link>
    );
  }
  if (state === "connected") {
    return (
      <span className={cn("inline-flex h-8 items-center justify-center gap-1.5 text-[13px] text-ink-3", wide, className)}>
        <Check className="h-4 w-4 text-success" strokeWidth={2} /> Connected · ask directly
      </span>
    );
  }
  return (
    <>
      <Button variant={variant} size={size} className={cn(wide, className)} onClick={() => setOpen(true)}>
        <Sprout className="h-4 w-4" strokeWidth={1.75} /> Request mentorship
      </Button>
      <MentorRequestDialog open={open} onClose={() => setOpen(false)} mentorId={mentorId} mentorName={mentorName} mentor={mentor} />
    </>
  );
}
