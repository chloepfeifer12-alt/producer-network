"use client";

import { useMemo, useState } from "react";
import { Check, Clock, UserCheck, UserPlus, X } from "lucide-react";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { connectionState, requestConnection, respondToConnection, withdrawConnection } from "@/lib/services/network";
import { Button, type ButtonSize } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { toast, toastResult } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { useStableCallback } from "./use-stable-callback";

const NOTE_MAX = 300;

/** Dialog for sending a connection request with an optional note. */
export function ConnectDialog({ open, onClose: onCloseProp, otherId, otherName }: { open: boolean; onClose: () => void; otherId: string; otherName: string }) {
  const user = useCurrentUser();
  const onClose = useStableCallback(onCloseProp);
  const [note, setNote] = useState("");
  const firstName = otherName.split(" ")[0];
  const send = () => {
    const r = requestConnection(user, otherId, note.slice(0, NOTE_MAX));
    if (toastResult(r, "Request sent", `${firstName} will see your request under Connections.`)) {
      setNote("");
      onClose();
    }
  };
  return (
    <Dialog
      open={open}
      onClose={onClose}
      title={`Connect with ${otherName}`}
      description="Connections can see each other's network activity. A short note helps — mention a shared interest or why you'd like to connect."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={send}>
            <UserPlus className="h-4 w-4" strokeWidth={1.75} /> Send request
          </Button>
        </>
      }
    >
      <Field label="Add a note" optional id={`note-${otherId}`} hint={`${note.length}/${NOTE_MAX} · Never include client or policy details.`}>
        <Textarea
          id={`note-${otherId}`}
          value={note}
          maxLength={NOTE_MAX}
          onChange={(e) => setNote(e.target.value)}
          placeholder={`Hi ${firstName} — I enjoyed your perspective on…`}
          rows={4}
        />
      </Field>
    </Dialog>
  );
}

/**
 * The connection control for another person, reflecting `connectionState`:
 * Connect → dialog · Pending · Accept/Decline for incoming · Connected.
 */
export function ConnectionAction({
  otherId,
  otherName,
  size = "sm",
  allowWithdraw,
  className,
}: {
  otherId: string;
  otherName: string;
  size?: ButtonSize;
  /** Show a withdraw control for outgoing requests (profile pages). */
  allowWithdraw?: boolean;
  className?: string;
}) {
  const db = useDb();
  const user = useCurrentUser();
  const [open, setOpen] = useState(false);
  const state = useMemo(() => connectionState(db, user?.id, otherId), [db, user?.id, otherId]);
  const record = useMemo(
    () =>
      user
        ? db.connections.find((c) => c.status !== "declined" && ((c.fromId === user.id && c.toId === otherId) || (c.fromId === otherId && c.toId === user.id)))
        : undefined,
    [db, user, otherId],
  );
  const firstName = otherName.split(" ")[0];

  if (!user || state === "self") return null;

  if (state === "connected") {
    return (
      <span className={cn("inline-flex h-8 items-center gap-1.5 rounded-lg bg-success-50 px-3 text-[13px] font-medium text-success ring-1 ring-inset ring-success/15", className)}>
        <UserCheck className="h-4 w-4" strokeWidth={1.75} /> Connected
      </span>
    );
  }

  if (state === "outgoing") {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <span className="inline-flex h-8 items-center gap-1.5 rounded-lg bg-subtle px-3 text-[13px] font-medium text-ink-3 ring-1 ring-inset ring-line" title="Waiting for a response">
          <Clock className="h-4 w-4" strokeWidth={1.75} /> Pending
        </span>
        {allowWithdraw && record && (
          <Button
            variant="ghost"
            size={size}
            onClick={() => toastResult(withdrawConnection(user, record.id), "Request withdrawn")}
          >
            Withdraw
          </Button>
        )}
      </div>
    );
  }

  if (state === "incoming" && record) {
    return (
      <div className={cn("flex flex-wrap items-center gap-2", className)}>
        <Button
          variant="accent"
          size={size}
          onClick={() => toastResult(respondToConnection(user, record.id, true), `You're now connected with ${firstName}`)}
        >
          <Check className="h-4 w-4" strokeWidth={2} /> Accept
        </Button>
        <Button
          variant="secondary"
          size={size}
          onClick={() => {
            const r = respondToConnection(user, record.id, false);
            if (r.ok) toast("Request declined", { body: `${firstName} won't be notified.`, tone: "info" });
            else toastResult(r, "");
          }}
        >
          <X className="h-4 w-4" strokeWidth={2} /> Decline
        </Button>
      </div>
    );
  }

  return (
    <>
      <Button variant="secondary" size={size} className={className} onClick={() => setOpen(true)}>
        <UserPlus className="h-4 w-4" strokeWidth={1.75} /> Connect
      </Button>
      <ConnectDialog open={open} onClose={() => setOpen(false)} otherId={otherId} otherName={otherName} />
    </>
  );
}
