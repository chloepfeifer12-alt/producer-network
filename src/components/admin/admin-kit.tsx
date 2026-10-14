"use client";

/**
 * Shared building blocks for the Administrator Control Center.
 * Kept inside src/components/admin so the admin console can evolve without
 * touching the shared design system.
 */
import { useState, type ReactNode, type ThHTMLAttributes, type TdHTMLAttributes } from "react";
import Link from "next/link";
import { Lock } from "lucide-react";
import type { AuditEvent, Database, User } from "@/lib/data/types";
import type { Permission } from "@/lib/auth/permissions";
import { can, ROLE_LABEL } from "@/lib/auth/permissions";
import { Button, type ButtonProps } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { cn } from "@/lib/utils/cn";

/* ------------------------------------------------------------------ */
/* Permissions                                                         */
/* ------------------------------------------------------------------ */

export const PERMISSION_LABEL: Record<Permission, string> = {
  "member:edit_own_profile": "Edit own profile",
  "member:apply": "Apply to opportunities",
  "member:save": "Save opportunities & organizations",
  "network:participate": "Participate in the network",
  "org:view_dashboard": "View recruiting dashboard",
  "org:edit_profile": "Edit organization profile",
  "org:manage_opportunities": "Create & manage opportunities",
  "org:review_applications": "Review applications",
  "org:discover_talent": "Consent-based talent discovery",
  "org:manage_billing": "Manage plan & billing",
  "admin:access": "Open the admin console",
  "admin:moderate_content": "Moderate listings & reports",
  "admin:manage_organizations": "Approve / suspend organizations",
  "admin:manage_users": "Suspend / reactivate users",
  "admin:manage_sponsored": "Manage sponsored placements",
  "admin:configure_plans": "Configure plans (illustrative)",
  "admin:view_audit": "View the audit log",
  "admin:view_consent": "View member consent settings",
};

/** Human explanation used for disabled actions. */
export function deniedReason(user: User | null, permission: Permission) {
  const role = user ? ROLE_LABEL(user) : "This role";
  return `${role} accounts can't do this — requires “${PERMISSION_LABEL[permission]}” (${permission}).`;
}

/** A button that is disabled (with an explanation) when the actor lacks a permission. */
export function GuardedButton({
  user,
  permission,
  disabledReason,
  children,
  ...props
}: ButtonProps & { user: User | null; permission: Permission; disabledReason?: string }) {
  const allowed = can(user, permission);
  const reason = !allowed ? deniedReason(user, permission) : disabledReason;
  const disabled = !allowed || !!disabledReason || props.disabled;
  return (
    <span title={reason} className="inline-flex">
      <Button {...props} disabled={disabled} aria-disabled={disabled}>
        {!allowed && <Lock className="h-3.5 w-3.5" aria-hidden />}
        {children}
        {reason && <span className="sr-only"> ({reason})</span>}
      </Button>
    </span>
  );
}

/** Inline notice shown at the top of a page when the actor's role is read-only here. */
export function PermissionNotice({ user, permission, what }: { user: User | null; permission: Permission; what: string }) {
  if (can(user, permission)) return null;
  return (
    <Notice tone="warning" title="Read-only for your role" className="mb-6">
      {user ? ROLE_LABEL(user) : "This role"} accounts can view {what} but can&apos;t change it. Actions require the <code className="font-mono text-[12px]">{permission}</code> permission.
    </Notice>
  );
}

/* ------------------------------------------------------------------ */
/* Tables                                                              */
/* ------------------------------------------------------------------ */

export function TableShell({ children, minWidth = 760, className }: { children: ReactNode; minWidth?: number; className?: string }) {
  return (
    <div className={cn("overflow-x-auto", className)}>
      <table className="w-full border-collapse text-left text-sm" style={{ minWidth }}>
        {children}
      </table>
    </div>
  );
}

export function Th({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th scope="col" className={cn("whitespace-nowrap border-b border-line bg-subtle/60 px-4 py-2.5 text-[11.5px] font-medium uppercase tracking-[0.08em] text-ink-3 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6", className)} {...props} />;
}

export function Td({ className, ...props }: TdHTMLAttributes<HTMLTableCellElement>) {
  return <td className={cn("border-b border-line px-4 py-3 align-middle text-ink-2 first:pl-5 last:pr-5 sm:first:pl-6 sm:last:pr-6", className)} {...props} />;
}

/* ------------------------------------------------------------------ */
/* Decision dialog with a required note                                */
/* ------------------------------------------------------------------ */

export interface NoteDialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  description?: ReactNode;
  noteLabel?: string;
  notePlaceholder?: string;
  initialNote?: string;
  /** Minimum characters. 0 = optional note. */
  minLength?: number;
  confirmLabel: string;
  tone?: "accent" | "danger" | "primary";
  /** Return true to close the dialog (e.g. service call succeeded). */
  onConfirm: (note: string) => boolean;
  children?: ReactNode;
  size?: "sm" | "md" | "lg";
}

export function NoteDialog(props: NoteDialogProps) {
  if (!props.open) return null;
  return <NoteDialogInner {...props} />;
}

function NoteDialogInner({ onClose, title, description, noteLabel = "Note", notePlaceholder, initialNote = "", minLength = 10, confirmLabel, tone = "accent", onConfirm, children, size = "md" }: NoteDialogProps) {
  const [note, setNote] = useState(initialNote);
  const [touched, setTouched] = useState(false);
  const tooShort = minLength > 0 && note.trim().length < minLength;
  const error = touched && tooShort ? `Please write at least ${minLength} characters — this note is stored in the audit log${tone === "danger" ? " and shared with the affected party" : ""}.` : undefined;
  const submit = () => {
    setTouched(true);
    if (tooShort) return;
    if (onConfirm(note.trim())) onClose();
  };
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant={tone === "danger" ? "danger" : tone} onClick={submit}>{confirmLabel}</Button>
        </>
      }
    >
      <div className="space-y-5">
        {children}
        <Field id="admin-note" label={noteLabel} optional={minLength === 0} error={error} hint={minLength > 0 ? `Required · minimum ${minLength} characters · recorded in the audit log.` : "Recorded in the audit log."}>
          <Textarea id="admin-note" value={note} onChange={(e) => setNote(e.target.value)} onBlur={() => setTouched(true)} placeholder={notePlaceholder} aria-invalid={!!error} />
        </Field>
      </div>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Lookups & formatting                                                */
/* ------------------------------------------------------------------ */

export function userName(db: Database, id: string) {
  return db.users.find((u) => u.id === id)?.name ?? id;
}

export function profileTone(db: Database, userId: string) {
  return db.profiles.find((p) => p.userId === userId)?.avatarTone ?? (userId.length % 8);
}

const ACTION_TONE: Record<string, BadgeTone> = {
  organization: "navy",
  opportunity: "neutral",
  report: "warning",
  sponsored: "gold",
  user: "outline",
  member: "outline",
  billing: "gold",
  plan: "gold",
  application: "neutral",
  talent: "neutral",
};

export function auditActionParts(action: string) {
  const [scope = action, ...rest] = action.split(".");
  return { scope, verb: rest.join(".").replace(/_/g, " ") || scope };
}

export function AuditActionBadge({ action }: { action: string }) {
  const { scope } = auditActionParts(action);
  return (
    <Badge tone={ACTION_TONE[scope] ?? "neutral"} className="font-mono text-[11px]">
      {action}
    </Badge>
  );
}

/** Resolve an audit target to a label + admin link. */
export function auditTarget(db: Database, e: Pick<AuditEvent, "targetType" | "targetId">): { label: string; href?: string } {
  switch (e.targetType) {
    case "organization": {
      const o = db.organizations.find((x) => x.id === e.targetId);
      return { label: o?.name ?? e.targetId, href: `/admin/organizations/${e.targetId}` };
    }
    case "opportunity": {
      const o = db.opportunities.find((x) => x.id === e.targetId);
      return { label: o?.title ?? e.targetId, href: `/admin/opportunities?review=${e.targetId}` };
    }
    case "report":
      return { label: `Report ${e.targetId.replace(/^rep_/, "#")}`, href: "/admin/reports" };
    case "sponsored": {
      const s = db.sponsored.find((x) => x.id === e.targetId);
      const org = s && db.organizations.find((o) => o.id === s.orgId);
      return { label: org ? `${org.name} placement` : e.targetId, href: "/admin/sponsored" };
    }
    case "user": {
      const u = db.users.find((x) => x.id === e.targetId);
      return { label: u?.name ?? e.targetId, href: u ? `/admin/users?q=${encodeURIComponent(u.name)}` : "/admin/users" };
    }
    case "plan": {
      const p = db.plans.find((x) => x.id === e.targetId);
      return { label: p ? `${p.name} plan` : e.targetId, href: "/admin/plans" };
    }
    case "application":
      return { label: "Application" };
    default:
      return { label: e.targetId };
  }
}

export function TargetLink({ db, event }: { db: Database; event: Pick<AuditEvent, "targetType" | "targetId"> }) {
  const t = auditTarget(db, event);
  if (!t.href) return <span className="text-ink-2">{t.label}</span>;
  return <Link href={t.href} className="text-ink-2 underline-offset-4 hover:text-navy hover:underline">{t.label}</Link>;
}

/** Simple section label with a count used above lists. */
export function SectionLabel({ children, count, action }: { children: ReactNode; count?: number; action?: ReactNode }) {
  return (
    <div className="mb-3 flex items-center justify-between gap-3">
      <h2 className="flex items-center gap-2 text-[15px] font-semibold tracking-[-0.01em] text-ink">
        {children}
        {count != null && <span className="rounded-full bg-sunken px-1.5 text-[11px] font-medium tabular-nums text-ink-3">{count}</span>}
      </h2>
      {action}
    </div>
  );
}

export function DemoDataNote({ children }: { children?: ReactNode }) {
  return <p className="text-xs text-ink-4">{children ?? "Demonstration data — synthetic records stored only in this browser."}</p>;
}
