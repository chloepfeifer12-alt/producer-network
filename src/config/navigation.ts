import type { UserKind } from "@/lib/data/types";

export interface NavItem {
  href: string;
  label: string;
  icon: string; // lucide icon name (resolved in AppShell)
  /** Match nested routes as active. */
  prefix?: boolean;
}
export interface NavGroup {
  label?: string;
  items: NavItem[];
}

export const PUBLIC_NAV = [
  { href: "/opportunities", label: "Opportunities" },
  { href: "/organizations", label: "Organizations" },
  { href: "/explore", label: "Explore the industry" },
  { href: "/community", label: "Community" },
  { href: "/for-organizations", label: "For organizations" },
];

export const MEMBER_NAV: NavGroup[] = [
  {
    items: [
      { href: "/me", label: "Home", icon: "LayoutDashboard" },
      { href: "/me/profile", label: "Profile", icon: "UserRound", prefix: true },
      { href: "/me/applications", label: "Applications", icon: "Send", prefix: true },
      { href: "/me/saved", label: "Saved", icon: "Bookmark" },
    ],
  },
  {
    label: "Network",
    items: [
      { href: "/network", label: "Feed", icon: "MessageSquare" },
      { href: "/network/members", label: "Members", icon: "Users", prefix: true },
      { href: "/network/connections", label: "Connections", icon: "Handshake" },
      { href: "/network/groups", label: "Groups", icon: "Layers", prefix: true },
      { href: "/network/events", label: "Events", icon: "CalendarDays" },
    ],
  },
  {
    label: "Discover",
    items: [
      { href: "/opportunities", label: "Opportunities", icon: "Briefcase", prefix: true },
      { href: "/organizations", label: "Organizations", icon: "Building2", prefix: true },
      { href: "/resources", label: "Resources", icon: "BookOpen", prefix: true },
    ],
  },
  { label: "Account", items: [{ href: "/me/settings", label: "Privacy & consent", icon: "ShieldCheck" }] },
];

export const ORG_NAV: NavGroup[] = [
  {
    items: [
      { href: "/org", label: "Dashboard", icon: "LayoutDashboard" },
      { href: "/org/pipeline", label: "Pipeline", icon: "KanbanSquare", prefix: true },
      { href: "/org/opportunities", label: "Opportunities", icon: "Briefcase", prefix: true },
      { href: "/org/talent", label: "Talent discovery", icon: "Compass" },
      { href: "/org/analytics", label: "Analytics", icon: "ChartLine" },
    ],
  },
  {
    label: "Organization",
    items: [
      { href: "/org/profile", label: "Public profile", icon: "Building2" },
      { href: "/org/billing", label: "Plan & billing", icon: "CreditCard" },
    ],
  },
  { label: "Community", items: [{ href: "/network", label: "Industry feed", icon: "MessageSquare", prefix: true }] },
];

export const ADMIN_NAV: NavGroup[] = [
  { items: [{ href: "/admin", label: "Overview", icon: "LayoutDashboard" }] },
  {
    label: "Trust & safety",
    items: [
      { href: "/admin/organizations", label: "Organizations", icon: "Building2", prefix: true },
      { href: "/admin/opportunities", label: "Listing moderation", icon: "Gavel" },
      { href: "/admin/reports", label: "Reports", icon: "Flag" },
    ],
  },
  {
    label: "Marketplace",
    items: [
      { href: "/admin/sponsored", label: "Sponsored placements", icon: "Megaphone" },
      { href: "/admin/plans", label: "Plans (preview)", icon: "Receipt" },
      { href: "/admin/analytics", label: "Platform analytics", icon: "ChartLine" },
    ],
  },
  {
    label: "People & access",
    items: [
      { href: "/admin/users", label: "Users", icon: "Users" },
      { href: "/admin/consent", label: "Consent status", icon: "ShieldCheck" },
      { href: "/admin/access", label: "Access & permissions", icon: "KeyRound" },
      { href: "/admin/audit", label: "Audit log", icon: "ScrollText" },
    ],
  },
];

export function navFor(kind: UserKind | undefined): NavGroup[] {
  if (kind === "organization") return ORG_NAV;
  if (kind === "admin") return ADMIN_NAV;
  return MEMBER_NAV;
}
