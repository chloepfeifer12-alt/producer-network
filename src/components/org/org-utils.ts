import type { Database, ModerationFlag, SponsoredSurface } from "@/lib/data/types";
import { DAY_MS, demoToday } from "@/lib/utils/dates";

/** Whole days between an ISO date and the demo "today" (never negative). */
export function daysSince(iso: string) {
  const d = new Date(iso);
  const start = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
  return Math.max(0, Math.round((demoToday() - start) / DAY_MS));
}

export function daysSinceLabel(iso: string) {
  const n = daysSince(iso);
  if (n === 0) return "Today";
  if (n === 1) return "1 day ago";
  return `${n} days ago`;
}

export function personName(db: Database, userId: string) {
  return db.users.find((u) => u.id === userId)?.name ?? "Platform team";
}

const AUDIT_LABEL: Record<string, string> = {
  "opportunity.updated": "Edited a listing",
  "opportunity.draft_created": "Created a draft",
  "opportunity.submitted_for_review": "Sent a listing for review",
  "opportunity.published": "Published a listing",
  "opportunity.archived": "Archived a listing",
  "opportunity.restored": "Restored a listing to draft",
  "opportunity.duplicated": "Duplicated a listing",
  "opportunity.changes_requested": "Platform requested changes",
  "opportunity.approved": "Platform approved a listing",
  "opportunity.rejected": "Platform rejected a listing",
  "organization.profile_updated": "Updated the public profile",
  "organization.approved": "Organization approved",
  "organization.changes_requested": "Platform requested profile changes",
  "sponsored.requested": "Requested a sponsored placement",
  "sponsored.activated": "Sponsored placement activated",
  "billing.plan_changed_demo": "Changed plan (demo)",
  "talent.introduction_sent": "Sent an introduction",
};

export function auditLabel(action: string) {
  return AUDIT_LABEL[action] ?? action.replace(/[._]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

export interface FeedItem {
  id: string;
  at: string;
  actorId: string;
  title: string;
  detail?: string;
  href?: string;
  kind: "application" | "listing" | "organization" | "billing" | "talent";
}

/** Merges application activity with this organization's audit entries, newest first. */
export function orgActivityFeed(db: Database, orgId: string, limit = 10): FeedItem[] {
  const items: FeedItem[] = [];
  const members = new Set(db.users.filter((u) => u.orgId === orgId).map((u) => u.id));
  const oppIds = new Set(db.opportunities.filter((o) => o.orgId === orgId).map((o) => o.id));
  const spnIds = new Set(db.sponsored.filter((s) => s.orgId === orgId).map((s) => s.id));

  for (const a of db.applications) {
    if (a.orgId !== orgId) continue;
    const opp = db.opportunities.find((o) => o.id === a.opportunityId);
    const applicant = personName(db, a.applicantId);
    for (const act of a.activity) {
      items.push({
        id: act.id,
        at: act.at,
        actorId: act.actorId,
        title: act.actorId === a.applicantId ? `${applicant}: ${act.message.toLowerCase()}` : `${act.message} — ${applicant}`,
        detail: opp?.title,
        href: `/org/applications/${a.id}`,
        kind: "application",
      });
    }
  }

  for (const e of db.audit) {
    if (e.action.startsWith("application.")) continue; // already covered by application activity
    const relevant =
      (e.targetType === "organization" && e.targetId === orgId) ||
      (e.targetType === "opportunity" && oppIds.has(e.targetId)) ||
      (e.targetType === "sponsored" && spnIds.has(e.targetId)) ||
      (members.has(e.actorId) && !e.action.startsWith("user."));
    if (!relevant) continue;
    const opp = e.targetType === "opportunity" ? db.opportunities.find((o) => o.id === e.targetId) : undefined;
    const kind: FeedItem["kind"] = e.action.startsWith("opportunity.")
      ? "listing"
      : e.action.startsWith("billing.") || e.action.startsWith("sponsored.")
        ? "billing"
        : e.action.startsWith("talent.")
          ? "talent"
          : "organization";
    items.push({
      id: e.id,
      at: e.at,
      actorId: e.actorId,
      title: auditLabel(e.action),
      detail: opp?.title ?? e.detail,
      href: opp ? `/org/opportunities/${opp.id}` : kind === "billing" ? "/org/billing" : kind === "talent" ? "/org/talent" : "/org/profile",
      kind,
    });
  }
  return items.sort((a, b) => b.at.localeCompare(a.at)).slice(0, limit);
}

/** Plain-language guidance for each automated pre-screen flag. */
export const FLAG_GUIDE: Record<ModerationFlag["code"], { title: string; why: string; fix: string }> = {
  income_claim: {
    title: "Unsubstantiated income claim",
    why: "Earnings figures and phrases like “six figures” or “unlimited income” imply results most people won’t see.",
    fix: "Describe the compensation model and, if you choose, a disclosed range in the Compensation section — not in marketing copy.",
  },
  guarantee_language: {
    title: "Guarantee language",
    why: "Income, leads, approvals and outcomes can’t be guaranteed. Negated phrases such as “no guaranteed income” are fine.",
    fix: "Remove or reword promises of results.",
  },
  undisclosed_costs: {
    title: "Undisclosed producer costs",
    why: "When producers pay for leads, candidates need to know before they commit.",
    fix: "Explain what leads cost, whether buying them is optional, and when costs are disclosed in writing (30+ characters).",
  },
  missing_compensation_model: {
    title: "Compensation approach not described",
    why: "Candidates deserve a plain description of how the role is paid.",
    fix: "Add compensation notes, e.g. “Salary during training, then salary plus incentive; terms confirmed in writing.”",
  },
  misleading_title: {
    title: "Promotional title",
    why: "Titles should describe the role. Exclamation marks, dollar figures and slogans read as advertising.",
    fix: "Use a descriptive title such as “Commercial Lines Producer — Construction”.",
  },
  manual_report: {
    title: "Reported by a member",
    why: "A member reported this listing for review.",
    fix: "Review the reviewer note and update the listing.",
  },
};

export const SURFACE_INFO: Record<SponsoredSurface, { label: string; description: string }> = {
  search_top: { label: "Opportunity search — top", description: "A labeled sponsored block above organic opportunity search results." },
  directory_top: { label: "Organization directory — top", description: "A labeled sponsored block above the alphabetical organization directory." },
  home_featured: { label: "Home page — featured", description: "A labeled featured slot on the public home page." },
  line_page: { label: "Insurance category pages", description: "A labeled slot on relevant insurance category (line) pages." },
};
