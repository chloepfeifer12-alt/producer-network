"use client";

import { Fragment, useMemo } from "react";
import { Check, Fingerprint, KeyRound, Lock, Server, ShieldCheck } from "lucide-react";
import type { User } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { permissionsFor, ROLE_LABEL, type Permission } from "@/lib/auth/permissions";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Notice } from "@/components/ui/feedback";
import { PERMISSION_LABEL, TableShell, Td, Th } from "@/components/admin/admin-kit";
import { cn } from "@/lib/utils/cn";

interface RoleColumn {
  key: string;
  label: string;
  group: "Members" | "Organizations" | "Platform staff";
  template: Pick<User, "kind" | "orgRole" | "adminRole">;
  exampleId: string;
}

const ROLES: RoleColumn[] = [
  { key: "producer", label: "Producer", group: "Members", template: { kind: "producer" }, exampleId: "u_maya" },
  { key: "aspiring", label: "Aspiring producer", group: "Members", template: { kind: "aspiring" }, exampleId: "u_priya" },
  { key: "org_owner", label: "Org admin (owner)", group: "Organizations", template: { kind: "organization", orgRole: "owner" }, exampleId: "u_daniel" },
  { key: "org_recruiter", label: "Recruiter", group: "Organizations", template: { kind: "organization", orgRole: "recruiter" }, exampleId: "u_kit" },
  { key: "superadmin", label: "Super-admin", group: "Platform staff", template: { kind: "admin", adminRole: "superadmin" }, exampleId: "u_admin" },
  { key: "moderator", label: "Moderator", group: "Platform staff", template: { kind: "admin", adminRole: "moderator" }, exampleId: "u_riley" },
  { key: "support", label: "Support", group: "Platform staff", template: { kind: "admin", adminRole: "support" }, exampleId: "u_sasha" },
];

const GROUPS: { label: string; prefix: string }[] = [
  { label: "Member capabilities", prefix: "member:" },
  { label: "Network", prefix: "network:" },
  { label: "Organization workspace", prefix: "org:" },
  { label: "Admin console", prefix: "admin:" },
];

function representative(role: RoleColumn): User {
  return { id: `rep_${role.key}`, name: role.label, email: "", status: "active", createdAt: "", lastActiveAt: "", ...role.template };
}

const PRODUCTION_NOTES = [
  { icon: Server, title: "Server-side enforcement", body: "The same permission map runs in API authorization middleware. Client checks shape the UI only and are never a security boundary." },
  { icon: ShieldCheck, title: "Row-level security", body: "PostgreSQL RLS policies scope organization data to members of that organization and member data to consented views." },
  { icon: Fingerprint, title: "MFA for admins & organizations", body: "Admin and organization accounts require phishing-resistant MFA (passkeys / WebAuthn); admin sessions are short-lived." },
  { icon: KeyRound, title: "SSO & provisioning", body: "Staff sign in through the company IdP (OIDC/SAML) with SCIM de-provisioning; organizations can bring their own SSO on Premier." },
];

export default function AdminAccessPage() {
  const db = useDb();
  const user = useCurrentUser();
  const matrix = useMemo(() => ROLES.map((r) => ({ role: r, perms: permissionsFor(representative(r)) })), []);
  const allPerms = Object.keys(PERMISSION_LABEL) as Permission[];
  const mine = useMemo(() => permissionsFor(user), [user]);

  return (
    <div>
      <PageHeader
        eyebrow="People & access"
        title="Access & permissions"
        description="The role-based access model, generated directly from the permission map the product enforces. Read-only in this prototype."
        actions={<Badge tone="outline" icon={<Lock className="h-3 w-3" />}>Read-only</Badge>}
      />

      <Notice tone="demo" title="Changing roles requires production RBAC" className="mb-6">
        Role assignments can&apos;t be edited here. In production, staff roles are granted through the identity provider with approval and are audit-logged; organization roles are managed by each organization&apos;s owner.
      </Notice>

      <Card>
        <CardHeader title="Role × permission matrix" description={`You are signed in as ${user ? `${user.name} · ${ROLE_LABEL(user)}` : "—"} with ${mine.size} permissions.`} />
        <TableShell minWidth={940} className="mt-4 border-t border-line">
          <thead>
            <tr>
              <Th className="w-[34%]">Permission</Th>
              {matrix.map(({ role }) => (
                <Th key={role.key} className="text-center normal-case tracking-normal">
                  <div className="text-[10.5px] uppercase tracking-[0.08em] text-ink-4">{role.group}</div>
                  <div className="mt-0.5 text-[12.5px] font-medium text-ink-2">{role.label}</div>
                  <div className="text-[11px] font-normal text-ink-4">e.g. {db.users.find((u) => u.id === role.exampleId)?.name.split(" ")[0] ?? "—"}</div>
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {GROUPS.map((g) => {
              const perms = allPerms.filter((p) => p.startsWith(g.prefix));
              if (!perms.length) return null;
              return (
                <Fragment key={g.prefix}>
                  <tr>
                    <td colSpan={matrix.length + 1} className="border-b border-line bg-subtle/40 px-5 py-2 text-[11.5px] font-semibold uppercase tracking-[0.1em] text-ink-3 sm:px-6">{g.label}</td>
                  </tr>
                  {perms.map((p) => (
                    <tr key={p} className={cn(mine.has(p) && "bg-navy-50/30")}>
                      <Td>
                        <div className="text-[13.5px] text-ink">{PERMISSION_LABEL[p]}</div>
                        <code className="font-mono text-[11px] text-ink-4">{p}</code>
                      </Td>
                      {matrix.map(({ role, perms: set }) => (
                        <Td key={role.key} className="text-center">
                          {set.has(p) ? (
                            <span className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-navy text-white" aria-label={`${role.label}: granted`}>
                              <Check className="h-3.5 w-3.5" strokeWidth={2.5} />
                            </span>
                          ) : (
                            <span className="text-ink-4" aria-label={`${role.label}: not granted`}>·</span>
                          )}
                        </Td>
                      ))}
                    </tr>
                  ))}
                </Fragment>
              );
            })}
          </tbody>
        </TableShell>
        <p className="px-5 py-3 text-xs text-ink-4 sm:px-6">Highlighted rows are permissions your current account holds. Suspended accounts hold no permissions.</p>
      </Card>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader title="The admin console is isolated" />
          <CardBody className="space-y-3 text-sm leading-relaxed text-ink-2">
            <p>Only accounts of kind <code className="font-mono text-[12.5px]">admin</code> receive any <code className="font-mono text-[12.5px]">admin:*</code> permission. No producer or organization role — including an organization owner — can be granted one, so the console is never reachable through a member or organization account.</p>
            <p>Within staff, duties are separated: moderators handle content and organizations; support handles accounts and consent questions; only super-admins manage sponsored placements and plan configuration, or change other admin accounts.</p>
          </CardBody>
        </Card>
        <Card>
          <CardHeader title="Production notes" />
          <CardBody>
            <ul className="space-y-4">
              {PRODUCTION_NOTES.map(({ icon: Icon, title, body }) => (
                <li key={title} className="flex gap-3">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-subtle text-ink-3 ring-1 ring-line"><Icon className="h-4 w-4" strokeWidth={1.75} /></span>
                  <div className="text-[13px]">
                    <div className="font-medium text-ink">{title}</div>
                    <div className="mt-0.5 leading-relaxed text-ink-3">{body}</div>
                  </div>
                </li>
              ))}
            </ul>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
