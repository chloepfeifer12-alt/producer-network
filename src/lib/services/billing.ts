/**
 * DEMO BILLING — no payment processor is connected and no money moves.
 * Plan changes and sponsored requests only update local demo records.
 */
import type { Database, PlanId, SponsoredSurface, User } from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";
import { assertCan } from "@/lib/auth/permissions";
import { newId } from "@/lib/utils/ids";
import { daysFromNow, nowISO } from "@/lib/utils/dates";
import { attempt, invariant } from "./result";
import { audit, findOrThrow, notifyAdmins } from "./_helpers";

export function planFor(db: Database, planId: PlanId) {
  return db.plans.find((p) => p.id === planId)!;
}

export function planUsage(db: Database, orgId: string) {
  const org = db.organizations.find((o) => o.id === orgId)!;
  const plan = planFor(db, org.plan);
  const active = db.opportunities.filter((o) => o.orgId === orgId && o.status === "published").length;
  const seats = db.users.filter((u) => u.orgId === orgId).length;
  const sponsored = db.sponsored.filter((s) => s.orgId === orgId && ["active", "scheduled", "requested"].includes(s.status)).length;
  return { plan, active, seats, sponsored };
}

export function changePlanDemo(actor: User | null, orgId: string, planId: PlanId) {
  return attempt(() => {
    assertCan(actor, "org:manage_billing", orgId);
    commit((d) => {
      const org = findOrThrow(d.organizations, orgId, "Organization");
      const plan = findOrThrow(d.plans, planId, "Plan");
      const before = org.plan;
      invariant(before !== planId, "You're already on this plan.");
      org.plan = planId;
      if (plan.priceMonthly > 0) {
        d.invoices.unshift({ id: newId("inv"), orgId, issuedOn: daysFromNow(30), description: `${plan.name} plan — monthly (illustrative)`, amount: plan.priceMonthly, status: "demo_upcoming" });
      }
      audit(d, actor, "billing.plan_changed_demo", "organization", orgId, `${before} → ${planId} (no charge — demo)`);
    });
  });
}

export function requestSponsoredPlacement(actor: User | null, orgId: string, surface: SponsoredSurface, opportunityId?: string) {
  return attempt(() => {
    assertCan(actor, "org:manage_billing", orgId);
    commit((d) => {
      const org = findOrThrow(d.organizations, orgId, "Organization");
      invariant(org.listingStatus === "approved", "Your organization must be approved before requesting sponsored placements.");
      const plan = findOrThrow(d.plans, org.plan, "Plan");
      if (opportunityId) {
        const o = d.opportunities.find((x) => x.id === opportunityId);
        invariant(o && o.orgId === orgId, "That listing belongs to another organization.");
        invariant(o.status === "published", "Only published listings can be sponsored.");
      }
      const used = d.sponsored.filter((s) => s.orgId === orgId && ["active", "scheduled", "requested"].includes(s.status)).length;
      invariant(plan.limits.sponsoredSlots > 0, "Sponsored placements are available on Growth and Premier plans.");
      invariant(used < plan.limits.sponsoredSlots, `Your plan includes ${plan.limits.sponsoredSlots} sponsored placement(s); all are in use.`);
      const id = newId("spn");
      d.sponsored.unshift({ id, orgId, opportunityId, surface, status: "requested", startsOn: daysFromNow(2), endsOn: daysFromNow(32), createdAt: nowISO() });
      notifyAdmins(d, "Sponsored placement requested", `${org.name} requested a placement.`, "/admin/sponsored");
      audit(d, actor, "sponsored.requested", "sponsored", id, surface);
    });
  });
}
