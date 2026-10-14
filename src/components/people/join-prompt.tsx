"use client";

import { ArrowRight, FlaskConical } from "lucide-react";
import { DEMO_PERSONAS, signInAsDemo } from "@/lib/auth/session";
import { useDb } from "@/lib/store/db-store";
import { Avatar } from "@/components/ui/avatar";
import { ButtonLink } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";
import { useStableCallback } from "@/components/network/use-stable-callback";

/** Member personas a visitor can step into without leaving the page. */
const MEMBER_PERSONAS = DEMO_PERSONAS.filter((p) => ["u_maya", "u_jordan", "u_priya"].includes(p.userId));

/** Persona picker list (demo sign-in that keeps the visitor where they are). */
export function PersonaChoices({ onChosen }: { onChosen?: () => void }) {
  const db = useDb();
  return (
    <ul className="divide-y divide-line overflow-hidden rounded-xl border border-line">
      {MEMBER_PERSONAS.map((p) => {
        const u = db.users.find((x) => x.id === p.userId);
        const prof = db.profiles.find((x) => x.userId === p.userId);
        return (
          <li key={p.userId}>
            <button
              type="button"
              onClick={() => {
                signInAsDemo(p.userId);
                toast(`Now viewing as ${u?.name ?? p.label}`, { body: "Demo role — not real authentication.", tone: "info" });
                onChosen?.();
              }}
              className="group flex w-full items-center gap-3 bg-surface px-4 py-3 text-left transition hover:bg-subtle focus-visible:bg-subtle focus-visible:outline-none"
            >
              <Avatar name={u?.name ?? p.label} tone={prof?.avatarTone ?? 1} size={34} decorative />
              <span className="min-w-0 flex-1">
                <span className="block text-[13.5px] font-medium text-ink">{p.label}</span>
                <span className="block truncate text-xs text-ink-3">{p.description}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink" strokeWidth={1.75} />
            </button>
          </li>
        );
      })}
    </ul>
  );
}

/** Shown when a visitor tries to connect, request mentorship or message. */
export function JoinPromptDialog({ open, onClose: onCloseProp, title, reason }: { open: boolean; onClose: () => void; title: string; reason: string }) {
  const onClose = useStableCallback(onCloseProp);
  return (
    <Dialog
      open={open}
      onClose={onClose}
      size="sm"
      title={title}
      description={reason}
      footer={
        <>
          <span className="mr-auto inline-flex items-center gap-1.5 text-xs text-ink-3">
            <FlaskConical className="h-3.5 w-3.5" strokeWidth={1.75} /> Demo personas, not real sign-in
          </span>
          <ButtonLink href="/join" variant="primary" size="sm" onClick={onClose}>
            Create a profile
          </ButtonLink>
        </>
      }
    >
      <p className="mb-3 text-[13px] text-ink-3">Explore as a member:</p>
      <PersonaChoices onChosen={onClose} />
    </Dialog>
  );
}
