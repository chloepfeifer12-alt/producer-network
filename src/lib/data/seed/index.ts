import type { Database } from "../types";
import { seedUsers, seedProfiles } from "./people";
import { seedOrganizations } from "./organizations";
import { seedOpportunities } from "./opportunities";
import { seedApplications } from "./activity";
import { seedConnections, seedEvents, seedGroups, seedPosts, seedResources } from "./network";
import { seedAudit, seedInvoices, seedNotifications, seedOrgProfileViews, seedPlans, seedReports, seedSponsored } from "./platform";
import { daysAgo } from "@/lib/utils/dates";
import { financialOpportunities, financialOrganizations, portalShowcases, seedPortalInterests } from "./financial";

/** Bump when the seed shape changes; persisted demo data is reset on mismatch. */
export const SCHEMA_VERSION = 4;

/** Builds a fresh, fully synthetic database. */
export function buildSeedDatabase(): Database {
  return structuredClone({
    schemaVersion: SCHEMA_VERSION,
    users: seedUsers,
    profiles: seedProfiles,
    organizations: [...seedOrganizations, ...financialOrganizations].map((o) => (portalShowcases[o.id] ? { ...o, portal: portalShowcases[o.id] } : o)),
    opportunities: [...seedOpportunities, ...financialOpportunities],
    applications: seedApplications,
    savedOpportunities: [
      { userId: "u_maya", targetId: "opp_kw_cl_producer", savedAt: daysAgo(2) },
      { userId: "u_maya", targetId: "opp_or_uw", savedAt: daysAgo(6) },
      { userId: "u_jordan", targetId: "opp_td_callcenter", savedAt: daysAgo(1) },
      { userId: "u_jordan", targetId: "opp_lw_health", savedAt: daysAgo(4) },
      { userId: "u_priya", targetId: "opp_cv_analyst", savedAt: daysAgo(3) },
      { userId: "u_priya", targetId: "opp_qm_fellow", savedAt: daysAgo(5) },
    ],
    savedOrganizations: [
      { userId: "u_maya", targetId: "org_ashgrove", savedAt: daysAgo(12) },
      { userId: "u_priya", targetId: "org_corvane", savedAt: daysAgo(3) },
    ],
    savedResources: [
      { userId: "u_jordan", targetId: "res_2", savedAt: daysAgo(6) },
      { userId: "u_priya", targetId: "res_5", savedAt: daysAgo(4) },
    ],
    connections: seedConnections,
    posts: seedPosts,
    groups: seedGroups,
    resources: seedResources,
    events: seedEvents,
    plans: seedPlans,
    sponsored: seedSponsored,
    invoices: seedInvoices,
    reports: seedReports,
    audit: seedAudit,
    notifications: seedNotifications,
    introductions: [
      { id: "intro_1", orgId: "org_kestrelwood", senderId: "u_daniel", userId: "u_maya", opportunityId: "opp_kw_cl_producer", message: "Hi Maya — your contractor-focused work caught our attention. Our construction practice is growing, and we'd welcome a no-pressure conversation if you're open to it.", status: "sent", createdAt: daysAgo(1, 16) },
    ],
    orgProfileViews: { ...seedOrgProfileViews, org_haldenridge: 1460, org_brookmere: 2210, org_callowaybay: 640 },
    portalInterests: seedPortalInterests,
  });
}
