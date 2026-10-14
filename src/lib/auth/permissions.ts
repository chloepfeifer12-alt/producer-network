/**
 * Role-based access control.
 *
 * This is the single source of truth for what each role can do. In the
 * prototype it runs in the browser; in production the SAME rules must be
 * enforced server-side (API authorization + database row-level security).
 * Client-side checks are a UX convenience, never a security boundary.
 */
import type { User } from "@/lib/data/types";

export type Permission =
  // Members (producers & aspiring producers)
  | "member:edit_own_profile"
  | "member:apply"
  | "member:save"
  | "network:participate"
  // Organizations
  | "org:view_dashboard"
  | "org:edit_profile"
  | "org:manage_opportunities"
  | "org:review_applications"
  | "org:discover_talent"
  | "org:manage_billing"
  // Platform administration
  | "admin:access"
  | "admin:moderate_content"
  | "admin:manage_organizations"
  | "admin:manage_users"
  | "admin:manage_sponsored"
  | "admin:configure_plans"
  | "admin:view_audit"
  | "admin:view_consent";

const MEMBER: Permission[] = ["member:edit_own_profile", "member:apply", "member:save", "network:participate"];
const ORG_RECRUITER: Permission[] = ["org:view_dashboard", "org:manage_opportunities", "org:review_applications", "org:discover_talent", "network:participate"];
const ORG_OWNER: Permission[] = [...ORG_RECRUITER, "org:edit_profile", "org:manage_billing"];
const ADMIN_SUPPORT: Permission[] = ["admin:access", "admin:manage_users", "admin:view_consent", "admin:view_audit"];
const ADMIN_MODERATOR: Permission[] = ["admin:access", "admin:moderate_content", "admin:manage_organizations", "admin:view_audit"];
const ADMIN_SUPER: Permission[] = [
  "admin:access", "admin:moderate_content", "admin:manage_organizations", "admin:manage_users",
  "admin:manage_sponsored", "admin:configure_plans", "admin:view_audit", "admin:view_consent",
];

export function permissionsFor(user: User | null | undefined): Set<Permission> {
  if (!user || user.status === "suspended") return new Set();
  switch (user.kind) {
    case "producer":
    case "aspiring":
      return new Set(MEMBER);
    case "organization":
      // Pending organizations can prepare their workspace but not publish (enforced in services).
      return new Set(user.orgRole === "owner" ? ORG_OWNER : ORG_RECRUITER);
    case "admin":
      return new Set(user.adminRole === "superadmin" ? ADMIN_SUPER : user.adminRole === "moderator" ? ADMIN_MODERATOR : ADMIN_SUPPORT);
  }
}

export function can(user: User | null | undefined, permission: Permission): boolean {
  return permissionsFor(user).has(permission);
}

/** Organization-scoped check: the actor must belong to the organization. */
export function canForOrg(user: User | null | undefined, permission: Permission, orgId: string): boolean {
  return !!user && user.orgId === orgId && can(user, permission);
}

export class PermissionError extends Error {
  constructor(message = "You don't have permission to do that.") {
    super(message);
    this.name = "PermissionError";
  }
}

export function assertCan(user: User | null | undefined, permission: Permission, orgId?: string): asserts user is User {
  const ok = orgId ? canForOrg(user, permission, orgId) : can(user, permission);
  if (!ok) throw new PermissionError();
}

export const ROLE_LABEL = (u: User): string => {
  switch (u.kind) {
    case "producer": return "Producer";
    case "aspiring": return "Aspiring producer";
    case "organization": return u.orgRole === "owner" ? "Organization admin" : "Recruiter";
    case "admin": return u.adminRole === "superadmin" ? "Platform admin" : u.adminRole === "moderator" ? "Moderator" : "Support";
  }
};
