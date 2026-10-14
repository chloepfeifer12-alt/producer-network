/**
 * New Producer Portal — a curated space where newly licensed (and soon-to-be
 * licensed) members discover companies that hire and train new producers,
 * and "raise their hand" to several at once. Expressing interest is an
 * explicit, per-company consent to share the selected profile fields.
 */
import type { ApplicationShare, Database, LineSlug, Organization, PortalInterest, PortalShowcase, User } from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";
import { assertCan, PermissionError } from "@/lib/auth/permissions";
import { newId } from "@/lib/utils/ids";
import { nowISO } from "@/lib/utils/dates";
import { attempt, invariant } from "./result";
import { audit, findOrThrow, notify, notifyOrg } from "./_helpers";
import { orgOpenOpportunities } from "./organizations";

export interface PortalFilters {
  q?: string;
  state?: string;
  lines?: LineSlug[];
  noLicenseYet?: boolean;
}

export function portalCompanies(db: Database, f: PortalFilters = {}) {
  const q = f.q?.trim().toLowerCase();
  return db.organizations
    .filter((o): o is Organization & { portal: NonNullable<Organization["portal"]> } => o.listingStatus === "approved" && !!o.portal?.participating)
    .filter((o) => {
      if (q && ![o.name, o.tagline, o.portal.headline].some((t) => t.toLowerCase().includes(q))) return false;
      if (f.state && !(o.portal.statesHiring.includes("ALL") || o.portal.statesHiring.includes(f.state))) return false;
      if (f.lines?.length && !o.lines.some((l) => f.lines!.includes(l))) return false;
      if (f.noLicenseYet && !orgOpenOpportunities(db, o.id).some((x) => x.licenseRequirement === "licensing_support_available" || x.licenseRequirement === "not_required" || x.experienceLevel === "no_license")) return false;
      return true;
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function interestsForUser(db: Database, userId: string | undefined) {
  return userId ? db.portalInterests.filter((i) => i.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt)) : [];
}

export function interestsForOrg(db: Database, orgId: string) {
  return db.portalInterests.filter((i) => i.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function expressInterest(actor: User | null, input: { orgIds: string[]; note: string; share: ApplicationShare; consentAcknowledged: boolean }) {
  return attempt(() => {
    assertCan(actor, "member:apply");
    invariant(input.orgIds.length > 0, "Select at least one company.");
    invariant(input.orgIds.length <= 10, "You can reach out to up to 10 companies at a time.");
    invariant(input.consentAcknowledged, "Please confirm what you're sharing with these companies.");
    invariant(input.note.trim().length >= 10, "Add a short introduction (at least 10 characters).");
    let created = 0;
    commit((d) => {
      for (const orgId of input.orgIds) {
        const org = findOrThrow(d.organizations, orgId, "Company");
        invariant(org.listingStatus === "approved" && org.portal?.participating, `${org.name} isn't taking portal introductions.`);
        if (d.portalInterests.some((i) => i.userId === actor.id && i.orgId === orgId && i.status !== "closed")) continue;
        const id = newId("pi");
        d.portalInterests.unshift({ id, userId: actor.id, orgId, note: input.note.trim(), share: { ...input.share }, status: "sent", createdAt: nowISO() });
        notifyOrg(d, orgId, "New Producer Portal interest", `${actor.name} raised their hand to ${org.name}.`, "/org/portal");
        audit(d, actor, "portal.interest_sent", "organization", orgId, "Shared selected profile fields with consent");
        created++;
      }
      invariant(created > 0, "You've already reached out to the selected companies.");
      notify(d, actor.id, "Interest sent", `Your introduction was delivered to ${created} ${created === 1 ? "company" : "companies"} (demo).`, "/launch#my-interest");
    });
    return created;
  });
}

export function withdrawInterest(actor: User | null, id: string) {
  return attempt(() => {
    commit((d) => {
      const i = findOrThrow(d.portalInterests, id, "Interest");
      if (!actor || i.userId !== actor.id) throw new PermissionError();
      i.status = "closed";
    });
  });
}

export function setInterestStatus(actor: User | null, id: string, status: PortalInterest["status"]) {
  return attempt(() => {
    commit((d) => {
      const i = findOrThrow(d.portalInterests, id, "Interest");
      assertCan(actor, "org:review_applications", i.orgId);
      i.status = status;
      if (status === "contacted") {
        const org = d.organizations.find((o) => o.id === i.orgId);
        notify(d, i.userId, `${org?.name ?? "A company"} wants to talk`, "They responded to your New Producer Portal introduction (demo — check back here for next steps).", "/launch#my-interest");
      }
      audit(d, actor, `portal.interest_${status}`, "user", i.userId, i.orgId);
    });
  });
}

export function updatePortalShowcase(actor: User | null, orgId: string, showcase: PortalShowcase) {
  return attempt(() => {
    assertCan(actor, "org:edit_profile", orgId);
    invariant(showcase.headline.trim().length >= 10, "Add a showcase headline (at least 10 characters).");
    invariant(showcase.whyJoin.filter((w) => w.trim()).length >= 2, "List at least two reasons new producers should join.");
    invariant(showcase.firstYear.trim().length >= 30, "Describe the first year (at least 30 characters).");
    invariant(showcase.statesHiring.length > 0, "Choose at least one state you're hiring in.");
    commit((d) => {
      const o = findOrThrow(d.organizations, orgId, "Organization");
      o.portal = { ...showcase, whyJoin: showcase.whyJoin.filter((w) => w.trim()), idealFor: showcase.idealFor.filter((w) => w.trim()) };
      audit(d, actor, "portal.showcase_updated", "organization", orgId, showcase.participating ? "Participating" : "Not participating");
    });
  });
}
