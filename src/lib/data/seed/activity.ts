import type { Application, ApplicationShare, PipelineStage } from "../types";
import { daysAgo, daysFromNow } from "@/lib/utils/dates";
import { STAGE_LABEL } from "../taxonomy";

const FULL_SHARE: ApplicationShare = { contactEmail: true, licenses: true, npn: true, experience: true };
const LIMITED_SHARE: ApplicationShare = { contactEmail: true, licenses: true, npn: false, experience: true };

const ORDER: PipelineStage[] = ["new", "under_review", "interview", "offer", "hired"];

let n = 0;
function app(a: {
  applicant: string;
  opp: string;
  org: string;
  reviewer: string;
  stage: PipelineStage;
  submitted: number;
  note: string;
  share?: ApplicationShare;
  interviewIn?: number;
  orgNotes?: string[];
  messages?: { from: "org" | "applicant"; body: string; ago: number }[];
}): Application {
  n += 1;
  const id = `app_${n}`;
  // Build a plausible, ordered activity trail up to the current stage.
  const activity: Application["activity"] = [
    { id: `${id}_a0`, at: daysAgo(a.submitted, 14), actorId: a.applicant, message: "Application submitted" },
  ];
  const stageIdx = a.stage === "closed" ? 1 : ORDER.indexOf(a.stage);
  for (let i = 1; i <= stageIdx; i++) {
    const at = daysAgo(Math.max(0, a.submitted - i * Math.max(1, Math.floor(a.submitted / (stageIdx + 1)))), 16);
    activity.push({ id: `${id}_a${i}`, at, actorId: a.reviewer, message: `Moved to ${STAGE_LABEL[ORDER[i]!]}` });
  }
  if (a.stage === "closed") {
    activity.push({ id: `${id}_ac`, at: daysAgo(Math.max(0, a.submitted - 3), 16), actorId: a.reviewer, message: "Moved to Closed" });
  }
  return {
    id,
    opportunityId: a.opp,
    orgId: a.org,
    applicantId: a.applicant,
    stage: a.stage,
    coverNote: a.note,
    preferredStartWindow: "Within 30 days",
    share: a.share ?? FULL_SHARE,
    notes: (a.orgNotes ?? []).map((body, i) => ({ id: `${id}_n${i}`, authorId: a.reviewer, body, createdAt: daysAgo(Math.max(0, a.submitted - 1 - i), 17) })),
    messages: (a.messages ?? []).map((m, i) => ({ id: `${id}_m${i}`, authorId: m.from === "org" ? a.reviewer : a.applicant, body: m.body, createdAt: daysAgo(m.ago, 18) })),
    activity: activity.sort((x, y) => x.at.localeCompare(y.at)),
    interview: a.interviewIn != null ? { at: daysFromNow(a.interviewIn, 15), format: "video", with: "Hiring team" } : undefined,
    withdrawn: false,
    submittedAt: daysAgo(a.submitted, 14),
    updatedAt: activity[activity.length - 1]!.at,
    isDemo: true,
  };
}

export const seedApplications: Application[] = [
  // ---- Kestrelwood pipeline ---------------------------------------------
  app({ applicant: "u_hannah", opp: "opp_kw_pl_am", org: "org_kestrelwood", reviewer: "u_daniel", stage: "interview", submitted: 9, interviewIn: 2,
    note: "I recently earned my P&C license after four years in retail banking, where I helped clients through account reviews every day. I'd love to bring that same care to household clients — and the Foundations Residency is exactly the structure I'm looking for.",
    orgNotes: ["Strong service background; asked thoughtful questions about the residency.", "Schedule panel with Kit and a senior AM."],
    messages: [
      { from: "org", body: "Hi Hannah — thanks for applying. We'd love to set up a video conversation with our personal lines team. Does Thursday afternoon work?", ago: 4 },
      { from: "applicant", body: "Thursday afternoon works perfectly. Looking forward to it!", ago: 3 },
    ] }),
  app({ applicant: "u_devon", opp: "opp_kw_pl_am", org: "org_kestrelwood", reviewer: "u_kit", stage: "under_review", submitted: 5,
    note: "Two years in personal lines at a captive office. I'm looking for an independent agency with more carrier options and a path toward small commercial.",
    orgNotes: ["Good fit for pod B; check interest in commercial track."] }),
  app({ applicant: "u_tyler", opp: "opp_kw_pl_am", org: "org_kestrelwood", reviewer: "u_kit", stage: "closed", submitted: 21,
    note: "Newly licensed and eager to learn.", orgNotes: ["Candidate relocating out of state — closed by mutual agreement."] }),
  app({ applicant: "u_ben", opp: "opp_kw_cl_producer", org: "org_kestrelwood", reviewer: "u_daniel", stage: "offer", submitted: 24,
    note: "Ten years in construction-focused commercial lines. I'm drawn to a true vertical practice with dedicated service support.",
    orgNotes: ["Excellent technical depth.", "Offer discussion scheduled; relocation questions outstanding."],
    messages: [{ from: "org", body: "Ben — we've shared the written offer details by email (demo). Happy to walk through any questions.", ago: 2 }] }),
  app({ applicant: "u_marcus", opp: "opp_kw_cl_producer", org: "org_kestrelwood", reviewer: "u_daniel", stage: "under_review", submitted: 6,
    note: "Transportation specialist exploring construction. Open to the Carolinas.", share: LIMITED_SHARE }),
  app({ applicant: "u_rachel", opp: "opp_kw_cl_producer", org: "org_kestrelwood", reviewer: "u_daniel", stage: "new", submitted: 1,
    note: "Specialty broker interested in moving closer to clients. Curious how cyber fits into your construction practice.", share: LIMITED_SHARE }),
  app({ applicant: "u_nina", opp: "opp_kw_csr", org: "org_kestrelwood", reviewer: "u_kit", stage: "new", submitted: 2,
    note: "I have my P&C exam scheduled next month and I'm looking for a service role where I can learn the business properly.",
    share: { contactEmail: true, licenses: false, npn: false, experience: true } }),
  app({ applicant: "u_ines", opp: "opp_kw_csr", org: "org_kestrelwood", reviewer: "u_kit", stage: "new", submitted: 0,
    note: "Operations background, exploring insurance. The licensing sponsorship is a big draw.", share: { contactEmail: true, licenses: false, npn: false, experience: true } }),
  app({ applicant: "u_samuel", opp: "opp_kw_csr", org: "org_kestrelwood", reviewer: "u_kit", stage: "hired", submitted: 48,
    note: "Three years of personal lines service experience.", share: { contactEmail: true, licenses: true, npn: false, experience: true } }),

  // ---- Lanternway pipeline ----------------------------------------------
  app({ applicant: "u_jordan", opp: "opp_lw_affiliate", org: "org_lanternway", reviewer: "u_renee", stage: "interview", submitted: 8, interviewIn: 3,
    note: "Newly licensed in life and A&H. I'm looking for strong training and transparent expectations — especially around optional costs. Bilingual English/Spanish.",
    orgNotes: ["Asked directly about lead costs — appreciated the transparency question.", "Good candidate for the next First 90 cohort."],
    messages: [
      { from: "org", body: "Hi Jordan! Thanks for your thoughtful questions. Let's do an intro call to walk through the First 90 program and our written cost disclosures.", ago: 5 },
      { from: "applicant", body: "That sounds great — thank you for being upfront about the costs.", ago: 4 },
    ] }),
  app({ applicant: "u_luis", opp: "opp_lw_affiliate", org: "org_lanternway", reviewer: "u_renee", stage: "offer", submitted: 19,
    note: "Three years in family protection, looking for stronger case design support.", orgNotes: ["Affiliation paperwork review in progress (demo)."] }),
  app({ applicant: "u_aisha", opp: "opp_lw_affiliate", org: "org_lanternway", reviewer: "u_renee", stage: "hired", submitted: 52,
    note: "Experienced life & annuity producer looking for case design support." }),
  app({ applicant: "u_omar", opp: "opp_lw_health", org: "org_lanternway", reviewer: "u_renee", stage: "under_review", submitted: 4,
    note: "First year in the field; interested in health and Medicare-related work." }),
  app({ applicant: "u_imani", opp: "opp_lw_health", org: "org_lanternway", reviewer: "u_renee", stage: "new", submitted: 1,
    note: "Two years in a contact-center advisor role; ready for independent practice.", share: LIMITED_SHARE }),
  app({ applicant: "u_tyler", opp: "opp_lw_affiliate", org: "org_lanternway", reviewer: "u_renee", stage: "new", submitted: 2,
    note: "Just licensed and looking for training-first support." }),
  app({ applicant: "u_elena", opp: "opp_lw_health", org: "org_lanternway", reviewer: "u_renee", stage: "closed", submitted: 30,
    note: "Exploring options.", orgNotes: ["Candidate decided to stay with current FMO."] }),

  // ---- Other organizations ----------------------------------------------
  app({ applicant: "u_maya", opp: "opp_ag_broker", org: "org_ashgrove", reviewer: "u_felix", stage: "interview", submitted: 11, interviewIn: 4,
    note: "Nine years in commercial lines with a growing interest in E&S placements for contractors. I'd love to learn the wholesale side.",
    messages: [{ from: "org", body: "Maya — we'd like to schedule a conversation with our habitational practice lead. Sending a few times now.", ago: 3 }] }),
  app({ applicant: "u_maya", opp: "opp_or_uw", org: "org_oriel", reviewer: "u_admin", stage: "closed", submitted: 40,
    note: "Exploring the underwriting side of specialty.", }),
  app({ applicant: "u_jordan", opp: "opp_md_associate", org: "org_meridale", reviewer: "u_patrice", stage: "under_review", submitted: 3,
    note: "Phoenix-based and interested in a salaried development path." }),
  app({ applicant: "u_megan", opp: "opp_cv_consultant", org: "org_corvane", reviewer: "u_owen", stage: "under_review", submitted: 10, note: "Five years in benefits account management." }),
  app({ applicant: "u_tom", opp: "opp_cv_consultant", org: "org_corvane", reviewer: "u_owen", stage: "interview", submitted: 14, interviewIn: 6, note: "Eleven years in mid-market benefits consulting." }),
  app({ applicant: "u_imani", opp: "opp_td_callcenter", org: "org_tidewell", reviewer: "u_lena", stage: "under_review", submitted: 1, note: "Contact-center experience." }),
];
