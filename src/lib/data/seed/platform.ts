import type { AuditEvent, Invoice, Notification, Plan, Report, SponsoredPlacement } from "../types";
import { daysAgo, daysFromNow } from "@/lib/utils/dates";

/** ILLUSTRATIVE pricing only. No billing is connected. */
export const seedPlans: Plan[] = [
  {
    id: "directory",
    name: "Directory",
    priceMonthly: 0,
    priceAnnual: 0,
    tagline: "Establish a credible presence in the organization directory.",
    limits: { activeOpportunities: 2, seats: 1, sponsoredSlots: 0 },
    features: ["Organization profile", "Up to 2 active opportunities", "Basic application inbox", "Standard directory placement"],
  },
  {
    id: "growth",
    name: "Growth",
    priceMonthly: 349,
    priceAnnual: 299,
    tagline: "A complete recruiting workspace for growing teams.",
    limits: { activeOpportunities: 10, seats: 5, sponsoredSlots: 1 },
    features: ["Expanded profile with culture, training & leadership", "Up to 10 active opportunities", "Recruiting pipeline & notes", "Consent-based talent discovery", "Listing analytics", "1 sponsored placement credit / quarter"],
    highlighted: true,
  },
  {
    id: "premier",
    name: "Premier",
    priceMonthly: 899,
    priceAnnual: 769,
    tagline: "Advanced recruiting, analytics and promotional tools.",
    limits: { activeOpportunities: null, seats: 15, sponsoredSlots: 4 },
    features: ["Everything in Growth", "Unlimited active opportunities", "Advanced analytics & exports (planned)", "Priority sponsored placements", "Multi-office team management", "Dedicated success contact (planned)"],
  },
];

export const seedSponsored: SponsoredPlacement[] = [
  { id: "spn_1", orgId: "org_lanternway", surface: "home_featured", status: "active", startsOn: daysAgo(10), endsOn: daysFromNow(20), createdAt: daysAgo(12) },
  { id: "spn_2", orgId: "org_corvane", surface: "directory_top", status: "active", startsOn: daysAgo(5), endsOn: daysFromNow(25), createdAt: daysAgo(7) },
  { id: "spn_3", orgId: "org_ashgrove", opportunityId: "opp_ag_broker", surface: "search_top", status: "active", startsOn: daysAgo(3), endsOn: daysFromNow(27), createdAt: daysAgo(4) },
  { id: "spn_4", orgId: "org_meridale", opportunityId: "opp_md_associate", surface: "line_page", status: "scheduled", startsOn: daysFromNow(5), endsOn: daysFromNow(35), createdAt: daysAgo(1) },
  { id: "spn_5", orgId: "org_tidewell", surface: "directory_top", status: "ended", startsOn: daysAgo(60), endsOn: daysAgo(30), createdAt: daysAgo(62) },
  { id: "spn_6", orgId: "org_kestrelwood", opportunityId: "opp_kw_cl_producer", surface: "search_top", status: "requested", startsOn: daysFromNow(2), endsOn: daysFromNow(32), createdAt: daysAgo(0, 9) },
];

export const seedInvoices: Invoice[] = [
  { id: "inv_1", orgId: "org_kestrelwood", issuedOn: daysAgo(44), description: "Growth plan — monthly (illustrative)", amount: 349, status: "demo_paid" },
  { id: "inv_2", orgId: "org_kestrelwood", issuedOn: daysAgo(14), description: "Growth plan — monthly (illustrative)", amount: 349, status: "demo_paid" },
  { id: "inv_3", orgId: "org_kestrelwood", issuedOn: daysFromNow(16), description: "Growth plan — monthly (illustrative)", amount: 349, status: "demo_upcoming" },
  { id: "inv_4", orgId: "org_lanternway", issuedOn: daysAgo(20), description: "Premier plan — annual, billed monthly (illustrative)", amount: 769, status: "demo_paid" },
  { id: "inv_5", orgId: "org_lanternway", issuedOn: daysFromNow(10), description: "Premier plan — annual, billed monthly (illustrative)", amount: 769, status: "demo_upcoming" },
];

export const seedReports: Report[] = [
  { id: "rep_1", targetType: "organization", targetId: "org_velorum", reason: "misleading_income_claim", details: "Organization tagline promises 'unlimited income' with no basis.", reporterId: "u_jamal", status: "open", createdAt: daysAgo(1, 10) },
  { id: "rep_2", targetType: "opportunity", targetId: "opp_lw_affiliate", reason: "undisclosed_fees", details: "Want to confirm whether lead costs are disclosed before purchase.", reporterId: "u_tyler", status: "open", createdAt: daysAgo(2, 9) },
  { id: "rep_3", targetType: "post", targetId: "post_9", reason: "spam", details: "Feels promotional.", reporterId: "u_devon", status: "open", createdAt: daysAgo(3, 11) },
  { id: "rep_4", targetType: "user", targetId: "u_victor", reason: "misrepresentation", details: "Sent connection requests promising guaranteed income.", reporterId: "u_hannah", status: "open", createdAt: daysAgo(0, 8) },
  { id: "rep_5", targetType: "opportunity", targetId: "opp_md_changes", reason: "misleading_income_claim", details: "Title says 'Top Earners Wanted'.", reporterId: "u_luis", status: "actioned", resolution: "Listing returned to organization with changes requested.", createdAt: daysAgo(4), resolvedAt: daysAgo(2) },
];

let a = 0;
const audit = (actorId: string, action: string, targetType: string, targetId: string, detail: string, ago: number, hour = 15): AuditEvent => ({
  id: `aud_seed_${++a}`, at: daysAgo(ago, hour), actorId, action, targetType, targetId, detail,
});

export const seedAudit: AuditEvent[] = [
  audit("u_riley", "opportunity.changes_requested", "opportunity", "opp_md_changes", "Promotional title; compensation model missing.", 2, 16),
  audit("u_riley", "report.actioned", "report", "rep_5", "Linked to listing review.", 2, 16),
  audit("u_admin", "sponsored.activated", "sponsored", "spn_3", "Search-top placement for Ashgrove approved.", 3, 10),
  audit("u_admin", "organization.changes_requested", "organization", "org_sablecrest", "Compensation approach and training missing.", 5, 14),
  audit("u_sasha", "user.consent_viewed", "user", "u_samuel", "Support ticket: confirmed private profile settings (demo).", 6, 12),
  audit("u_admin", "plan.updated", "plan", "growth", "Illustrative Growth price set to $349/mo.", 20, 11),
  audit("u_admin", "organization.approved", "organization", "org_northvale", "Listing approved.", 140, 15),
];

let nn = 0;
const note = (userId: string, title: string, body: string, ago: number, href?: string, read = false): Notification => ({
  id: `ntf_seed_${++nn}`, userId, title, body, href, createdAt: daysAgo(ago, 12), read,
});

export const seedNotifications: Notification[] = [
  note("u_maya", "Interview scheduled", "Ashgrove Specialty Brokerage scheduled a video conversation.", 3, "/me/applications"),
  note("u_maya", "New connection request", "Devon Carter wants to connect.", 2, "/network/connections"),
  note("u_maya", "Recommended for you", "A new commercial producer opportunity matches your specialties.", 3, "/opportunities/commercial-lines-producer-construction-kestrelwood", true),
  note("u_jordan", "Message from Lanternway Financial Group", "Renée Castillo replied about your application.", 5, "/me/applications"),
  note("u_jordan", "Application in review", "Meridale Mutual is reviewing your application.", 1, "/me/applications"),
  note("u_priya", "New connection request", "Nina Park wants to connect.", 2, "/network/connections"),
  note("u_priya", "Event reminder", "Career Changers Info Session is coming up.", 1, "/me", true),
  note("u_daniel", "New application", "Inés Moreau applied to Client Service Associate.", 0, "/org/pipeline"),
  note("u_daniel", "Sponsored request submitted", "Your search placement request is awaiting platform review.", 0, "/org/billing"),
  note("u_renee", "New application", "Imani Johnson applied to Independent Health & Supplemental Producer.", 1, "/org/pipeline"),
  note("u_admin", "Organization awaiting review", "Velorum Income Collective submitted a listing with flagged content.", 3, "/admin/organizations"),
];

export const seedOrgProfileViews: Record<string, number> = {
  org_kestrelwood: 2840,
  org_lanternway: 5120,
  org_corvane: 3310,
  org_meridale: 2960,
  org_tidewell: 1980,
  org_ashgrove: 2440,
  org_brightfold: 1210,
  org_quillmark: 1530,
  org_halvorsen: 870,
  org_oriel: 1340,
  org_northvale: 760,
};
