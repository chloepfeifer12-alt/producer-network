/**
 * View helpers for the professional network UI.
 *
 * These are presentation-only derivations (labels, links, tones) on top of the
 * service layer. They never expose fields the privacy rules would hide: the
 * only profile field surfaced here is the public professional headline, and
 * only when the member's profile is not private.
 */
import type { Database, Group, Organization, ProducerProfile, User } from "@/lib/data/types";
import { relativeDay } from "@/lib/utils/dates";
import { hashString } from "@/lib/utils/format";

export interface PersonInfo {
  id: string;
  name: string;
  tone: number;
  /** One-line context: headline for members, "Org · Organization" for org users. */
  subtitle: string;
  /** Network profile link, when there is a page to show. */
  href?: string;
  kind: User["kind"] | "unknown";
  user?: User;
  profile?: ProducerProfile;
  org?: Organization;
  /** Org public page, only for approved (publicly listed) organizations. */
  orgHref?: string;
}

export function personInfo(db: Database, userId: string): PersonInfo {
  const user = db.users.find((u) => u.id === userId);
  if (!user) return { id: userId, name: "Former member", tone: 0, subtitle: "No longer on the network", kind: "unknown" };
  const tone = hashString(user.id) % 8;
  if (user.kind === "organization") {
    const org = db.organizations.find((o) => o.id === user.orgId);
    return {
      id: user.id,
      name: user.name,
      tone,
      subtitle: org ? `${org.name} · Organization` : "Organization",
      href: user.status === "active" ? `/network/members/${user.id}` : undefined,
      kind: user.kind,
      user,
      org,
      orgHref: org && org.listingStatus === "approved" ? `/organizations/${org.slug}` : undefined,
    };
  }
  if (user.kind === "admin") {
    return { id: user.id, name: user.name, tone, subtitle: "Platform team", kind: user.kind, user };
  }
  const profile = db.profiles.find((p) => p.userId === user.id);
  const showHeadline = !!profile && profile.visibility !== "private";
  return {
    id: user.id,
    name: user.name,
    tone: profile?.avatarTone ?? tone,
    subtitle: showHeadline ? profile!.headline : user.kind === "aspiring" ? "Aspiring producer" : "Producer",
    href: `/network/members/${user.id}`,
    kind: user.kind,
    user,
    profile,
  };
}

/** Finds a group by id or slug (route params accept either). */
export function findGroup(db: Database, idOrSlug: string): Group | undefined {
  const key = decodeURIComponent(idOrSlug);
  return db.groups.find((g) => g.id === key || g.slug === key);
}

/** Hour-level relative time for activity, falling back to day labels. */
export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 0) return relativeDay(iso);
  const min = Math.floor(diff / 60_000);
  if (min < 1) return "Just now";
  if (min < 60) return `${min}m ago`;
  const hours = Math.floor(min / 60);
  if (hours < 24) return `${hours}h ago`;
  return relativeDay(iso);
}

export function locationLabel(p: Pick<ProducerProfile, "city" | "state">) {
  return [p.city, p.state].filter(Boolean).join(", ");
}

export const ASPIRING_STAGE_LABEL: Record<NonNullable<ProducerProfile["aspiring"]>["stage"], string> = {
  exploring: "Exploring the industry",
  studying: "Studying for licensing",
  exam_scheduled: "Exam scheduled",
  exam_passed: "Exam passed",
};
