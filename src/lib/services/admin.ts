/**
 * Administrator commands. Every command re-checks admin permissions and
 * writes to the audit log. Organization/producer roles can never reach these.
 */
import type { OrgListingStatus, PlanId, Plan, ReportReason, SponsoredPlacement, SponsoredSurface, User } from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";
import { assertCan } from "@/lib/auth/permissions";
import { newId } from "@/lib/utils/ids";
import { nowISO } from "@/lib/utils/dates";
import { attempt, invariant } from "./result";
import { audit, findOrThrow, notify, notifyOrg } from "./_helpers";

/* ---------------- Opportunity moderation ---------------- */

export const REJECTION_REASONS: { code: ReportReason | "incomplete"; label: string; message: string }[] = [
  { code: "misleading_income_claim", label: "Unsubstantiated income claim", message: "Listings may not include earnings claims, projections or 'top earner' figures without a documented, reviewable basis." },
  { code: "undisclosed_fees", label: "Undisclosed producer costs", message: "Any producer-paid costs (leads, fees, technology, training) must be disclosed clearly in the listing." },
  { code: "misrepresentation", label: "Misrepresents the role", message: "The title, engagement type or description does not accurately represent the opportunity (e.g. contracting presented as a salaried job)." },
  { code: "incomplete", label: "Incomplete information", message: "Please complete compensation approach, licensing requirements and training details." },
];

export function approveOpportunity(actor: User | null, oppId: string, note?: string) {
  return attempt(() => {
    assertCan(actor, "admin:moderate_content");
    commit((d) => {
      const o = findOrThrow(d.opportunities, oppId, "Opportunity");
      const org = findOrThrow(d.organizations, o.orgId, "Organization");
      invariant(org.listingStatus === "approved", "Approve the organization before publishing its listings.");
      o.status = "published";
      o.postedAt = o.postedAt ?? nowISO();
      o.updatedAt = nowISO();
      o.moderation = { flags: o.moderation?.flags ?? [], reviewerNote: note || "Approved after review.", reviewedAt: nowISO(), reviewedBy: actor.id };
      notifyOrg(d, o.orgId, "Listing approved", `${o.title} is now live.`, "/org/opportunities");
      audit(d, actor, "opportunity.approved", "opportunity", o.id, note || o.title);
    });
  });
}

export function returnOpportunity(actor: User | null, oppId: string, decision: "changes_requested" | "rejected", reasonCode: string, note: string) {
  return attempt(() => {
    assertCan(actor, "admin:moderate_content");
    invariant(note.trim().length >= 10, "Explain the decision to the organization (at least 10 characters).");
    commit((d) => {
      const o = findOrThrow(d.opportunities, oppId, "Opportunity");
      const reason = REJECTION_REASONS.find((r) => r.code === reasonCode);
      o.status = decision;
      o.updatedAt = nowISO();
      o.moderation = { flags: o.moderation?.flags ?? [], reviewerNote: `${reason ? reason.label + ": " : ""}${note.trim()}`, reviewedAt: nowISO(), reviewedBy: actor.id };
      notifyOrg(d, o.orgId, decision === "rejected" ? "Listing rejected" : "Changes requested", `${o.title}: ${note.trim()}`, "/org/opportunities");
      audit(d, actor, `opportunity.${decision}`, "opportunity", o.id, `${reasonCode}: ${note.trim()}`);
    });
  });
}

export function unpublishOpportunity(actor: User | null, oppId: string, note: string) {
  return returnOpportunity(actor, oppId, "changes_requested", "misrepresentation", note);
}

/* ---------------- Organizations ---------------- */

export function setOrganizationStatus(actor: User | null, orgId: string, status: OrgListingStatus, note: string) {
  return attempt(() => {
    assertCan(actor, "admin:manage_organizations");
    if (status !== "approved") invariant(note.trim().length >= 10, "Add a note explaining the decision.");
    commit((d) => {
      const o = findOrThrow(d.organizations, orgId, "Organization");
      o.listingStatus = status;
      o.listingNote = note.trim() || undefined;
      o.updatedAt = nowISO();
      // Team accounts follow organization approval.
      d.users.filter((u) => u.orgId === orgId).forEach((u) => {
        if (status === "approved" && u.status === "pending") u.status = "active";
      });
      if (status === "suspended" || status === "rejected") {
        d.opportunities.filter((x) => x.orgId === orgId && x.status === "published").forEach((x) => {
          x.status = "archived";
          x.updatedAt = nowISO();
        });
      }
      notifyOrg(d, orgId, `Organization ${status.replace("_", " ")}`, note || "Your organization listing was approved.", "/org/profile");
      audit(d, actor, `organization.${status}`, "organization", orgId, note || o.name);
    });
  });
}

/* ---------------- Reports ---------------- */

export function resolveReport(actor: User | null, reportId: string, outcome: "actioned" | "dismissed", resolution: string, hideTarget = false) {
  return attempt(() => {
    assertCan(actor, "admin:moderate_content");
    invariant(resolution.trim().length >= 5, "Add a resolution note.");
    commit((d) => {
      const r = findOrThrow(d.reports, reportId, "Report");
      r.status = outcome;
      r.resolution = resolution.trim();
      r.resolvedAt = nowISO();
      if (hideTarget && r.targetType === "post") {
        const p = d.posts.find((x) => x.id === r.targetId);
        if (p) p.hidden = true;
      }
      if (hideTarget && r.targetType === "opportunity") {
        const o = d.opportunities.find((x) => x.id === r.targetId);
        if (o && o.status === "published") {
          o.status = "changes_requested";
          o.moderation = { flags: [{ code: "manual_report", label: "Removed after member report" }], reviewerNote: resolution.trim(), reviewedAt: nowISO(), reviewedBy: actor.id };
          notifyOrg(d, o.orgId, "Listing unpublished after review", resolution.trim(), "/org/opportunities");
        }
      }
      notify(d, r.reporterId, "Your report was reviewed", "Thank you — our team reviewed your report.", undefined);
      audit(d, actor, `report.${outcome}`, "report", r.id, resolution.trim());
    });
  });
}

/* ---------------- Users ---------------- */

export function setUserStatus(actor: User | null, userId: string, status: "active" | "suspended", note: string) {
  return attempt(() => {
    assertCan(actor, "admin:manage_users");
    invariant(userId !== actor.id, "You can't change your own account status.");
    commit((d) => {
      const u = findOrThrow(d.users, userId, "User");
      invariant(u.kind !== "admin" || actor.adminRole === "superadmin", "Only super-admins can change admin accounts.");
      u.status = status;
      audit(d, actor, `user.${status === "active" ? "reactivated" : "suspended"}`, "user", userId, note || u.name);
    });
  });
}

/* ---------------- Sponsored placements ---------------- */

export function setSponsoredStatus(actor: User | null, id: string, status: SponsoredPlacement["status"]) {
  return attempt(() => {
    assertCan(actor, "admin:manage_sponsored");
    commit((d) => {
      const s = findOrThrow(d.sponsored, id, "Placement");
      const before = s.status;
      s.status = status;
      if (status === "active" && s.startsOn > nowISO()) s.startsOn = nowISO();
      const org = d.organizations.find((o) => o.id === s.orgId);
      if (before === "requested") notifyOrg(d, s.orgId, status === "active" || status === "scheduled" ? "Sponsored placement approved" : "Sponsored placement declined", `Placement status: ${status}.`, "/org/billing");
      audit(d, actor, `sponsored.${status}`, "sponsored", id, `${org?.name ?? s.orgId}: ${before} → ${status}`);
    });
  });
}

export function createSponsoredPlacement(actor: User | null, input: { orgId: string; surface: SponsoredSurface; opportunityId?: string; startsOn: string; endsOn: string }) {
  return attempt(() => {
    assertCan(actor, "admin:manage_sponsored");
    invariant(input.orgId, "Choose an organization.");
    invariant(input.endsOn > input.startsOn, "End date must be after the start date.");
    commit((d) => {
      const org = findOrThrow(d.organizations, input.orgId, "Organization");
      invariant(org.listingStatus === "approved", "Only approved organizations can be sponsored.");
      const id = newId("spn");
      const start = new Date(input.startsOn).toISOString();
      d.sponsored.unshift({ id, ...input, startsOn: start, endsOn: new Date(input.endsOn).toISOString(), status: start <= nowISO() ? "active" : "scheduled", createdAt: nowISO() });
      audit(d, actor, "sponsored.created", "sponsored", id, `${org.name} · ${input.surface}`);
    });
  });
}

/* ---------------- Plans (illustrative configuration) ---------------- */

export function updatePlan(actor: User | null, planId: PlanId, patch: Pick<Plan, "priceMonthly" | "priceAnnual" | "limits" | "tagline">) {
  return attempt(() => {
    assertCan(actor, "admin:configure_plans");
    invariant(patch.priceMonthly >= 0 && patch.priceAnnual >= 0, "Prices can't be negative.");
    invariant(patch.limits.seats >= 1, "Plans need at least one seat.");
    commit((d) => {
      const p = findOrThrow(d.plans, planId, "Plan");
      Object.assign(p, structuredClone(patch));
      audit(d, actor, "plan.updated", "plan", planId, `$${patch.priceMonthly}/mo · ${patch.limits.activeOpportunities ?? "unlimited"} opportunities (illustrative)`);
    });
  });
}
