import type { Database } from "../types";
import { seedUsers, seedProfiles } from "./people";
import { seedOrganizations } from "./organizations";
import { seedOpportunities } from "./opportunities";
import { seedApplications } from "./activity";
import { seedConnections, seedEvents, seedGroups, seedPosts, seedResources } from "./network";
import { seedAudit, seedInvoices, seedNotifications, seedOrgProfileViews, seedPlans, seedReports, seedSponsored } from "./platform";
import { daysAgo } from "@/lib/utils/dates";
import { seedArticles } from "./insider";
import { financialOpportunities, financialOrganizations, portalShowcases, seedPortalInterests } from "./financial";

const MENTORS: Record<string, { available: boolean; topics: string[]; note: string }> = {
  u_grace: { available: true, topics: ["Agency leadership", "Hiring & onboarding", "Perpetuation"], note: "Monthly office hours for aspiring agency leaders." },
  u_claire: { available: true, topics: ["First-year development plans", "Sales coaching", "Career changers"], note: "Two office-hour slots each month — bring a goal." },
  u_marcus: { available: true, topics: ["Commercial specialization", "Transportation risks"], note: "Happy to talk through building a niche." },
  u_elena: { available: true, topics: ["Senior-market compliance", "Enrollment season"], note: "For newly licensed advisors in health and Medicare-related work." },
  u_tom: { available: true, topics: ["Employee benefits careers", "Career changers"], note: "Especially glad to help teachers and analysts exploring benefits." },
  u_maya: { available: true, topics: ["Commercial lines", "Renewal workflows"], note: "Quarterly coffee chats for newer account managers." },
};

/** Bump when the seed shape changes; persisted demo data is reset on mismatch. */
export const SCHEMA_VERSION = 5;

/** Builds a fresh, fully synthetic database. */
export function buildSeedDatabase(): Database {
  return structuredClone({
    schemaVersion: SCHEMA_VERSION,
    users: seedUsers,
    profiles: seedProfiles.map((p) => (MENTORS[p.userId] ? { ...p, mentor: MENTORS[p.userId] } : p)),
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
    articles: seedArticles,
    follows: [
      { userId: "u_maya", targetId: "org_ashgrove", savedAt: daysAgo(20) },
      { userId: "u_maya", targetId: "org_oriel", savedAt: daysAgo(9) },
      { userId: "u_jordan", targetId: "org_lanternway", savedAt: daysAgo(7) },
      { userId: "u_priya", targetId: "org_corvane", savedAt: daysAgo(3) },
    ],
    fitAnswers: {
      u_maya: { stage: "established", lines: ["commercial", "specialty", "surplus-lines"], model: "employed", training: "mentorship", leads: "own_book", environment: "hybrid", ambitions: ["specialist", "lead_team"], state: "NC", updatedAt: daysAgo(6) },
    },
  });
}
