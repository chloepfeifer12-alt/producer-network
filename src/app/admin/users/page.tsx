"use client";

import { Suspense, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Search, UserCheck, Users, UserX } from "lucide-react";
import type { AccountStatus, User, UserKind } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { setUserStatus } from "@/lib/services/admin";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Avatar } from "@/components/ui/avatar";
import { Field, Input, Select } from "@/components/ui/form";
import { EmptyState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { toastResult } from "@/components/ui/toast";
import { GuardedButton, NoteDialog, PermissionNotice, profileTone, TableShell, Td, Th } from "@/components/admin/admin-kit";
import { formatDate, relativeDay } from "@/lib/utils/dates";

const STATUS_TONE: Record<AccountStatus, BadgeTone> = { active: "success", pending: "gold", suspended: "danger" };
const KIND_LABEL: Record<UserKind, string> = { producer: "Producers", aspiring: "Aspiring producers", organization: "Organization accounts", admin: "Platform staff" };

export default function AdminUsersPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <UsersTable />
    </Suspense>
  );
}

function UsersTable() {
  const db = useDb();
  const actor = useCurrentUser();
  const params = useSearchParams();
  const [q, setQ] = useState(params.get("q") ?? "");
  const [kind, setKind] = useState<"all" | UserKind>("all");
  const [status, setStatus] = useState<"all" | AccountStatus>("all");
  const [target, setTarget] = useState<{ user: User; to: "active" | "suspended" } | null>(null);

  const rows = useMemo(() => {
    const term = q.trim().toLowerCase();
    return db.users
      .filter((u) => kind === "all" || u.kind === kind)
      .filter((u) => status === "all" || u.status === status)
      .filter((u) => {
        if (!term) return true;
        const org = u.orgId ? db.organizations.find((o) => o.id === u.orgId)?.name ?? "" : "";
        return `${u.name} ${u.email} ${org}`.toLowerCase().includes(term);
      })
      .sort((a, b) => b.lastActiveAt.localeCompare(a.lastActiveAt));
  }, [db, q, kind, status]);

  const suspendedCount = db.users.filter((u) => u.status === "suspended").length;
  const pendingCount = db.users.filter((u) => u.status === "pending").length;

  const blockedReason = (u: User): string | undefined => {
    if (actor && u.id === actor.id) return "You can't change your own account status.";
    if (u.kind === "admin" && actor?.adminRole !== "superadmin") return "Only super-admins can change admin accounts.";
    if (u.status === "pending") return "Pending organization accounts activate when the organization is approved.";
    return undefined;
  };

  return (
    <div>
      <PageHeader
        eyebrow="People & access"
        title="Users"
        description="Every account on the platform. Suspending an account immediately removes its access and hides its member profile; it can be reactivated at any time."
      />
      <PermissionNotice user={actor} permission="admin:manage_users" what="user accounts" />

      <Card>
        <div className="grid gap-3 border-b border-line px-5 py-4 sm:grid-cols-[minmax(0,1fr)_200px_170px] sm:px-6">
          <Field id="user-search" label="Search">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" />
              <Input id="user-search" className="pl-9" placeholder="Name, email or organization" value={q} onChange={(e) => setQ(e.target.value)} />
            </div>
          </Field>
          <Field id="user-kind" label="Account type">
            <Select id="user-kind" value={kind} onChange={(e) => setKind(e.target.value as typeof kind)}>
              <option value="all">All types</option>
              {(Object.keys(KIND_LABEL) as UserKind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </Select>
          </Field>
          <Field id="user-status" label="Status">
            <Select id="user-status" value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
              <option value="all">All statuses</option>
              <option value="active">Active</option>
              <option value="pending">Pending ({pendingCount})</option>
              <option value="suspended">Suspended ({suspendedCount})</option>
            </Select>
          </Field>
        </div>

        {rows.length === 0 ? (
          <div className="p-5 sm:p-6">
            <EmptyState compact icon={<Users className="h-5 w-5" />} title="No users match these filters" description="Try clearing the search or changing the filters." />
          </div>
        ) : (
          <TableShell minWidth={980}>
            <thead>
              <tr><Th>Name</Th><Th>Role</Th><Th>Organization</Th><Th>Status</Th><Th>Joined</Th><Th>Last active</Th><Th className="text-right">Actions</Th></tr>
            </thead>
            <tbody>
              {rows.map((u) => {
                const org = u.orgId ? db.organizations.find((o) => o.id === u.orgId) : undefined;
                const blocked = blockedReason(u);
                const isSelf = actor?.id === u.id;
                return (
                  <tr key={u.id} className={u.status === "suspended" ? "bg-danger-50/30" : undefined}>
                    <Td>
                      <div className="flex items-center gap-3">
                        <Avatar name={u.name} tone={profileTone(db, u.id)} size={32} />
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 font-medium text-ink">
                            {u.kind === "producer" || u.kind === "aspiring" ? <Link href={`/network/members/${u.id}`} className="hover:text-navy">{u.name}</Link> : u.name}
                            {isSelf && <Badge tone="navy">You</Badge>}
                          </div>
                          <div className="font-mono text-[11.5px] text-ink-3">{u.email}</div>
                        </div>
                      </div>
                    </Td>
                    <Td className="whitespace-nowrap">{ROLE_LABEL(u)}</Td>
                    <Td>{org ? <Link href={`/admin/organizations/${org.id}`} className="hover:text-navy">{org.name}</Link> : <span className="text-ink-4">—</span>}</Td>
                    <Td><Badge tone={STATUS_TONE[u.status]}>{u.status}</Badge></Td>
                    <Td className="whitespace-nowrap">{formatDate(u.createdAt)}</Td>
                    <Td className="whitespace-nowrap">{relativeDay(u.lastActiveAt)}</Td>
                    <Td className="text-right">
                      {u.status === "suspended" ? (
                        <GuardedButton user={actor} permission="admin:manage_users" disabledReason={blocked} variant="secondary" size="xs" onClick={() => setTarget({ user: u, to: "active" })}>
                          <UserCheck className="h-3 w-3" /> Reactivate
                        </GuardedButton>
                      ) : (
                        <GuardedButton user={actor} permission="admin:manage_users" disabledReason={blocked} variant="danger" size="xs" onClick={() => setTarget({ user: u, to: "suspended" })}>
                          <UserX className="h-3 w-3" /> Suspend
                        </GuardedButton>
                      )}
                    </Td>
                  </tr>
                );
              })}
            </tbody>
          </TableShell>
        )}
        <p className="px-5 py-3 text-xs text-ink-4 sm:px-6">
          {rows.length} of {db.users.length} accounts · All emails use the reserved <code className="font-mono">.invalid</code> domain and cannot receive mail.
        </p>
      </Card>

      {target && (
        <NoteDialog
          open
          onClose={() => setTarget(null)}
          title={target.to === "suspended" ? `Suspend ${target.user.name}?` : `Reactivate ${target.user.name}?`}
          description={
            target.to === "suspended"
              ? "The account loses all access immediately: no sign-in, applications, messages or organization actions. Their member profile is hidden from directories."
              : "The account regains the access its role allows."
          }
          confirmLabel={target.to === "suspended" ? "Suspend account" : "Reactivate account"}
          tone={target.to === "suspended" ? "danger" : "accent"}
          noteLabel="Reason"
          notePlaceholder={target.to === "suspended" ? "e.g. Repeated misleading outreach confirmed in report review." : "e.g. Appeal reviewed; issue resolved."}
          minLength={10}
          onConfirm={(note) => toastResult(setUserStatus(actor, target.user.id, target.to, note), target.to === "suspended" ? "Account suspended" : "Account reactivated", `${target.user.name} · logged to the audit trail.`)}
        >
          <div className="flex items-center gap-3 rounded-xl border border-line p-3">
            <Avatar name={target.user.name} tone={profileTone(db, target.user.id)} size={34} />
            <div className="min-w-0 text-[13px]">
              <div className="font-medium text-ink">{target.user.name}</div>
              <div className="text-ink-3">{ROLE_LABEL(target.user)} · {target.user.email}</div>
            </div>
          </div>
          {target.to === "suspended" && target.user.kind === "organization" && (
            <Notice tone="info">This suspends one team account only. To remove the organization and its listings, suspend it from the <Link href={`/admin/organizations/${target.user.orgId}`} className="font-medium underline">organization page</Link>.</Notice>
          )}
        </NoteDialog>
      )}
    </div>
  );
}
