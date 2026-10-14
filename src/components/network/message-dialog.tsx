"use client";

import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { useStableCallback } from "./use-stable-callback";

/** Direct messaging isn't part of the prototype — explain rather than dead-link. */
export function MessagePlaceholderDialog({ open, onClose: onCloseProp, name }: { open: boolean; onClose: () => void; name: string }) {
  const onClose = useStableCallback(onCloseProp);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title="Direct messaging is coming"
      footer={<Button variant="primary" onClick={onClose}>Got it</Button>}
    >
      <div className="flex gap-3">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-50 text-navy-600 ring-1 ring-navy-100">
          <MessageSquare className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div className="space-y-2 text-sm leading-relaxed text-ink-2">
          <p>
            Private one-to-one messaging with {name} is planned for a future release. It will include clear controls over who can message you, and
            reminders never to share client or policy information.
          </p>
          <p className="text-ink-3">
            For now, you can reply to their posts in the{" "}
            <Link href="/network" className="text-navy-600 underline-offset-2 hover:underline" onClick={onClose}>industry feed</Link> or meet in a shared group.
          </p>
        </div>
      </div>
    </Dialog>
  );
}
