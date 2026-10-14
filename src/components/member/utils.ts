/**
 * Member-workspace helpers (pure functions, no writes).
 * All writes still go through `src/lib/services/*`.
 */
import type { Application, Database, ProducerProfile, Resource, User } from "@/lib/data/types";

export type ApplicationBucket = "active" | "interviewing" | "closed";

export function isClosedApp(a: Pick<Application, "stage" | "withdrawn">) {
  return a.withdrawn || a.stage === "closed" || a.stage === "hired";
}

export function isActiveApp(a: Pick<Application, "stage" | "withdrawn">) {
  return !isClosedApp(a);
}

export function canWithdraw(a: Pick<Application, "stage" | "withdrawn">) {
  return !a.withdrawn && a.stage !== "closed" && a.stage !== "hired";
}

export function hasUpcomingInterview(a: Pick<Application, "interview" | "withdrawn" | "stage">) {
  return !!a.interview && !a.withdrawn && a.stage !== "closed" && new Date(a.interview.at).getTime() > Date.now();
}

export const INTERVIEW_FORMAT_LABEL: Record<NonNullable<Application["interview"]>["format"], string> = {
  video: "Video call",
  phone: "Phone call",
  in_person: "In person",
};

/** Applicants never see organization-internal activity (e.g. "Added an internal note"). */
export function applicantActivity(a: Pick<Application, "activity">) {
  return a.activity.filter((e) => !/internal note/i.test(e.message));
}

/** Resource audiences relevant to a member, most specific first. */
export function audiencesFor(user: Pick<User, "kind">, profile: Pick<ProducerProfile, "experienceLevel"> | undefined): Resource["audience"][] {
  if (user.kind === "aspiring" || profile?.experienceLevel === "no_license") return ["aspiring", "all"];
  switch (profile?.experienceLevel) {
    case "newly_licensed":
    case "early":
      return ["new", "all"];
    case "leadership":
      return ["leaders", "experienced", "all"];
    default:
      return ["experienced", "all", "new"];
  }
}

export function resourcesFor(db: Database, user: User, profile: ProducerProfile | undefined) {
  const order = audiencesFor(user, profile);
  const lines = new Set([...(profile?.specialties ?? []), ...(profile?.aspiring?.targetLines ?? [])]);
  return db.resources
    .filter((r) => order.includes(r.audience))
    .map((r) => ({ r, s: (order.length - order.indexOf(r.audience)) * 10 + r.lines.filter((l) => lines.has(l)).length }))
    .sort((a, b) => b.s - a.s)
    .map((x) => x.r);
}

/** Masked NPN display: "•••• 7203". */
export function maskNpn(npn: string) {
  const digits = npn.replace(/\D/g, "");
  const tail = (digits || npn).slice(-4);
  return `•••• ${tail}`;
}

export const RESOURCE_KIND_LABEL: Record<Resource["kind"], string> = {
  guide: "Guide",
  article: "Article",
  checklist: "Checklist",
  webinar: "Webinar",
  template: "Template",
};

/* ---------------- "Preview as" synthetic viewers ---------------- */

export type PreviewMode = "self" | "public" | "member" | "org";

const NOW = "2026-01-01T00:00:00.000Z";

/** A generic signed-in member who is not connected to the profile owner. */
export function syntheticMemberViewer(): User {
  return { id: "u_preview_member", kind: "producer", name: "A signed-in member", email: "preview@example.invalid", status: "active", createdAt: NOW, lastActiveAt: NOW };
}

/**
 * An organization viewer. Prefers the organization the member most recently
 * applied to (so the preview reflects real application share choices).
 */
export function syntheticOrgViewer(db: Database, memberId: string): { viewer: User; orgId?: string; orgName?: string; app?: Application } {
  const app = db.applications
    .filter((a) => a.applicantId === memberId && !a.withdrawn)
    .sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
  if (app) {
    const org = db.organizations.find((o) => o.id === app.orgId);
    const teammate = db.users.find((u) => u.kind === "organization" && u.orgId === app.orgId);
    const viewer: User = teammate ?? {
      id: "u_preview_org",
      kind: "organization",
      orgId: app.orgId,
      orgRole: "recruiter",
      name: `${org?.name ?? "Organization"} recruiter`,
      email: "preview-org@example.invalid",
      status: "active",
      createdAt: NOW,
      lastActiveAt: NOW,
    };
    return { viewer, orgId: app.orgId, orgName: org?.name, app };
  }
  return {
    viewer: { id: "u_preview_org", kind: "organization", orgId: "org_preview_none", orgRole: "recruiter", name: "An organization", email: "preview-org@example.invalid", status: "active", createdAt: NOW, lastActiveAt: NOW },
  };
}
