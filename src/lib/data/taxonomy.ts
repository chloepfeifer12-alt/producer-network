import type {
  CareerCategory,
  CompensationModel,
  EngagementType,
  ExperienceLevel,
  InsuranceLine,
  LeadsPolicy,
  LicenseRequirement,
  LineSlug,
  OpportunityKind,
  OrgCategory,
  PipelineStage,
  PostTopic,
  RecruitingStatus,
  ReportReason,
  WorkArrangement,
  Availability,
  ProfileVisibility,
  OpportunityStatus,
  OrgListingStatus,
} from "./types";

/**
 * Insurance career categories. Descriptions are original editorial copy and
 * intentionally general — licensing rules vary by state and must be confirmed
 * with the applicable state department of insurance.
 */
export const INSURANCE_LINES: InsuranceLine[] = [
  {
    sector: "insurance",
    slug: "life",
    name: "Life Insurance",
    shortName: "Life",
    icon: "HeartPulse",
    summary: "Help families and business owners plan for the long term.",
    description:
      "Life insurance careers center on needs analysis, long-horizon planning and trusted client relationships. Producers work with households, business owners and estate-planning professionals, often alongside annuity and living-benefits conversations.",
    careerPaths: ["Field producer", "Brokerage manager", "Advanced markets consultant", "Agency builder"],
    typicalRoles: ["Life Insurance Producer", "Brokerage Sales Associate", "Case Design Specialist"],
    skills: ["Needs analysis", "Long-term relationship building", "Underwriting coordination"],
    licensingNote: "Typically requires a state life line of authority. Confirm requirements with your state.",
  },
  {
    sector: "insurance",
    slug: "accident-health",
    name: "Accident & Health",
    shortName: "A&H",
    icon: "Stethoscope",
    summary: "Guide individuals and families through health and supplemental coverage.",
    description:
      "Accident & health professionals help clients navigate individual health, supplemental, disability and critical-illness coverage. The work rewards clear explanation, compliance discipline and responsive service.",
    careerPaths: ["Individual health advisor", "Supplemental benefits producer", "Disability specialist"],
    typicalRoles: ["Health Insurance Advisor", "Supplemental Benefits Producer", "Enrollment Specialist"],
    skills: ["Plan comparison", "Compliance awareness", "Enrollment-season planning"],
    licensingNote: "Typically requires a state accident & health (or sickness) line of authority.",
  },
  {
    sector: "insurance",
    slug: "property-casualty",
    name: "Property & Casualty",
    shortName: "P&C",
    icon: "Umbrella",
    summary: "Protect homes, vehicles, businesses and the things people build.",
    description:
      "Property & casualty is the broadest corner of the industry — from household auto and homeowners coverage to complex commercial programs. Careers span sales, account management, underwriting and risk consulting.",
    careerPaths: ["Personal lines producer", "Commercial producer", "Account manager", "Agency principal"],
    typicalRoles: ["P&C Producer", "Account Manager", "Customer Service Representative"],
    skills: ["Coverage analysis", "Renewal management", "Carrier relationships"],
    licensingNote: "Typically requires property and casualty lines of authority.",
  },
  {
    sector: "insurance",
    slug: "personal-lines",
    name: "Personal Lines",
    shortName: "Personal",
    icon: "House",
    summary: "Homeowners, auto, renters and umbrella coverage for households.",
    description:
      "Personal lines teams serve households with auto, homeowners, renters and umbrella coverage. It is a common entry point to the industry, with clear training paths and steady relationship-driven work.",
    careerPaths: ["Personal lines CSR", "Personal lines producer", "High-net-worth specialist"],
    typicalRoles: ["Personal Lines Account Manager", "Personal Lines Producer", "Service Associate"],
    skills: ["Policy servicing", "Cross-line conversations", "Retention"],
    licensingNote: "Often requires a personal lines or P&C license depending on the state.",
  },
  {
    sector: "insurance",
    slug: "commercial",
    name: "Commercial Insurance",
    shortName: "Commercial",
    icon: "Building2",
    summary: "Advise businesses on property, liability, fleet and workers' comp.",
    description:
      "Commercial insurance professionals help businesses understand and manage risk — property, general liability, workers' compensation, fleet, cyber and more. Careers reward technical depth and consultative selling.",
    careerPaths: ["Commercial account manager", "Commercial producer", "Industry-vertical specialist", "Risk advisor"],
    typicalRoles: ["Commercial Lines Producer", "Commercial Account Executive", "Risk Consultant"],
    skills: ["Exposure analysis", "Submissions & marketing", "Industry specialization"],
    licensingNote: "Typically requires property and casualty lines of authority.",
  },
  {
    sector: "insurance",
    slug: "medicare",
    name: "Medicare-Related Careers",
    shortName: "Medicare",
    icon: "Landmark",
    summary: "Help people approaching 65 understand their coverage options.",
    description:
      "Medicare-related careers focus on educating beneficiaries about their options during defined enrollment periods. The work is heavily regulated and rewards patience, clarity and strict adherence to marketing and compliance rules.",
    careerPaths: ["Medicare advisor", "Call-center benefits advisor", "Field Medicare specialist", "Compliance lead"],
    typicalRoles: ["Licensed Benefits Advisor", "Medicare Field Specialist", "Enrollment Advisor"],
    skills: ["Regulatory compliance", "Patient education", "Annual enrollment planning"],
    licensingNote: "Typically requires a health line of authority plus program-specific certifications, which change annually.",
  },
  {
    sector: "insurance",
    slug: "annuities",
    name: "Annuities",
    shortName: "Annuities",
    icon: "PiggyBank",
    summary: "Support retirement-income planning conversations.",
    description:
      "Annuity professionals help clients understand retirement-income products and how they fit a broader plan. Suitability and best-interest standards make training and documentation central to the work.",
    careerPaths: ["Retirement-income specialist", "Annuity wholesaler", "Brokerage support"],
    typicalRoles: ["Annuity Specialist", "Internal Wholesaler", "Retirement Income Advisor"],
    skills: ["Suitability documentation", "Product comparison", "Retirement planning fluency"],
    licensingNote: "Typically requires a life line of authority and state-specific annuity training.",
  },
  {
    sector: "insurance",
    slug: "employee-benefits",
    name: "Employee Benefits",
    shortName: "Benefits",
    icon: "Users",
    summary: "Design and service group benefits for employers.",
    description:
      "Employee benefits professionals advise employers on group health, dental, vision, life and voluntary benefits, then support enrollment and year-round service. Strong fit for consultative, analytical people.",
    careerPaths: ["Benefits account manager", "Benefits consultant", "Enrollment manager", "Benefits producer"],
    typicalRoles: ["Benefits Account Manager", "Employee Benefits Consultant", "Enrollment Coordinator"],
    skills: ["Renewal analysis", "Employer communication", "Enrollment technology"],
    licensingNote: "Typically requires life and accident & health lines of authority.",
  },
  {
    sector: "insurance",
    slug: "specialty",
    name: "Specialty Insurance",
    shortName: "Specialty",
    icon: "Gem",
    summary: "Niche programs — cyber, professional liability, marine and more.",
    description:
      "Specialty insurance covers risks that don't fit standard markets: cyber, professional liability, transportation, entertainment, marine and program business. Expect deep technical learning and close underwriter collaboration.",
    careerPaths: ["Program specialist", "Cyber liability broker", "Professional liability underwriter"],
    typicalRoles: ["Specialty Broker", "Program Underwriter", "Specialty Account Executive"],
    skills: ["Technical underwriting", "Niche industry knowledge", "Manuscript coverage review"],
    licensingNote: "Requirements vary by program; commonly P&C lines of authority.",
  },
  {
    sector: "insurance",
    slug: "surplus-lines",
    name: "Surplus Lines",
    shortName: "E&S",
    icon: "Waves",
    summary: "Place hard-to-insure risks in the excess & surplus market.",
    description:
      "Surplus lines (E&S) professionals place risks that admitted markets decline. Wholesale brokers and MGAs work with retail agents to structure placements, often on tight timelines.",
    careerPaths: ["Wholesale broker", "Broker assistant", "E&S underwriter", "Program manager"],
    typicalRoles: ["Wholesale Broker", "Brokerage Assistant", "E&S Underwriting Associate"],
    skills: ["Market access", "Speed and precision", "Retail-agent relationships"],
    licensingNote: "Often requires a separate surplus lines license in addition to P&C authority.",
  },
  {
    sector: "insurance",
    slug: "claims-operations",
    name: "Claims & Insurance Operations",
    shortName: "Claims & Ops",
    icon: "ClipboardList",
    summary: "Keep promises — adjusting, operations and service excellence.",
    description:
      "Claims and operations careers are where coverage becomes real for policyholders. Adjusters, examiners and operations specialists keep the industry running with accuracy and empathy.",
    careerPaths: ["Field adjuster", "Desk adjuster", "Claims examiner", "Agency operations manager"],
    typicalRoles: ["Claims Adjuster", "Claims Examiner", "Agency Operations Specialist"],
    skills: ["Investigation", "Documentation", "Customer empathy"],
    licensingNote: "Many states require an adjuster license; operations roles often do not.",
  },
  {
    sector: "insurance",
    slug: "agency-leadership",
    name: "Agency Leadership & Recruiting",
    shortName: "Leadership",
    icon: "Crown",
    summary: "Build teams, lead agencies and develop the next generation.",
    description:
      "Leadership and recruiting roles focus on building and developing teams — agency principals, sales managers, recruiters and training directors. Success is measured by the people you develop.",
    careerPaths: ["Sales manager", "Agency principal", "Recruiting director", "Training director"],
    typicalRoles: ["Sales Manager", "Talent Acquisition Partner", "Director of Producer Development"],
    skills: ["Coaching", "Hiring and onboarding", "Operational leadership"],
    licensingNote: "Leadership roles often require the licenses held by the teams being led.",
  },
  {
    sector: "financial_services",
    slug: "financial-planning",
    name: "Financial Planning & Advisory",
    shortName: "Planning",
    icon: "Compass",
    summary: "Help households build plans across saving, protection and retirement.",
    description:
      "Financial planning careers combine technical knowledge with long-term client relationships. Paraplanners, associate planners and lead advisors build and maintain plans that often include insurance, retirement and investment components.",
    careerPaths: ["Paraplanner", "Associate planner", "Lead financial planner", "Practice owner"],
    typicalRoles: ["Associate Financial Planner", "Paraplanner", "Client Service Associate"],
    skills: ["Planning software", "Client discovery", "Plain-language explanation"],
    licensingNote: "Roles may require state investment adviser representative registration (often via the Series 65 or 66) and/or insurance licenses. Professional designations are optional and earned separately.",
  },
  {
    sector: "financial_services",
    slug: "wealth-management",
    name: "Wealth Management",
    shortName: "Wealth",
    icon: "Gem",
    summary: "Serve families and business owners with complex financial lives.",
    description:
      "Wealth management teams coordinate investments, planning, insurance and estate considerations for clients with more complex needs. Careers range from client service and operations to advisor and team-lead roles.",
    careerPaths: ["Client associate", "Associate advisor", "Wealth advisor", "Team lead"],
    typicalRoles: ["Client Service Associate", "Associate Wealth Advisor", "Portfolio Operations Associate"],
    skills: ["Relationship management", "Operational precision", "Team coordination"],
    licensingNote: "Many roles require FINRA registrations sponsored by a firm and/or state registrations. Requirements vary by role and firm.",
  },
  {
    sector: "financial_services",
    slug: "retirement-plans",
    name: "Retirement Plans",
    shortName: "Retirement",
    icon: "PiggyBank",
    summary: "Support employer-sponsored retirement plans and participants.",
    description:
      "Retirement plan professionals help employers run workplace retirement plans and help participants understand their options. Roles include plan consultants, relationship managers, participant educators and plan administrators.",
    careerPaths: ["Plan administrator", "Participant educator", "Plan consultant", "Relationship manager"],
    typicalRoles: ["Retirement Plan Consultant", "Participant Education Specialist", "Plan Administrator"],
    skills: ["Plan administration", "Group education", "Employer relationships"],
    licensingNote: "Some roles require securities registrations or insurance licenses; administration roles often do not.",
  },
  {
    sector: "financial_services",
    slug: "investments-securities",
    name: "Investments & Securities",
    shortName: "Securities",
    icon: "ChartLine",
    summary: "Registered roles at broker-dealers and advisory firms.",
    description:
      "Securities careers include registered representatives, advisors and the operations and compliance teams that support them. Firms commonly sponsor registrations for new hires.",
    careerPaths: ["Registered client associate", "Financial advisor", "Branch leader", "Compliance analyst"],
    typicalRoles: ["Financial Advisor", "Registered Client Associate", "Compliance Analyst"],
    skills: ["Regulatory discipline", "Client communication", "Product knowledge"],
    licensingNote: "FINRA registrations (e.g., SIE plus Series 6 or 7, and state exams such as Series 63/65/66) generally require firm sponsorship. This is a general overview, not licensing advice.",
  },
  {
    sector: "financial_services",
    slug: "bank-financial-services",
    name: "Bank & Credit Union Financial Services",
    shortName: "Bank programs",
    icon: "Landmark",
    summary: "Insurance and investment programs inside banks and credit unions.",
    description:
      "Banks and credit unions offer insurance and investment services to their members through licensed bankers and program advisors. These roles blend branch relationships with structured, compliance-heavy processes.",
    careerPaths: ["Licensed banker", "Program advisor", "Branch financial services manager"],
    typicalRoles: ["Licensed Banker", "Credit Union Financial Advisor", "Insurance Program Specialist"],
    skills: ["Referral partnerships", "Member service", "Compliance processes"],
    licensingNote: "Typically requires insurance licenses and, for investment roles, firm-sponsored securities registrations.",
  },
];

export const LINE_BY_SLUG: Record<LineSlug, InsuranceLine> = Object.fromEntries(
  INSURANCE_LINES.map((l) => [l.slug, l]),
) as Record<LineSlug, InsuranceLine>;

export function lineName(slug: LineSlug, short = false) {
  const l = LINE_BY_SLUG[slug];
  return l ? (short ? l.shortName : l.name) : slug;
}

export const SECTOR_LABEL = { insurance: "Insurance", financial_services: "Financial services" } as const;
export const LINES_BY_SECTOR = {
  insurance: INSURANCE_LINES.filter((l) => l.sector === "insurance"),
  financial_services: INSURANCE_LINES.filter((l) => l.sector === "financial_services"),
};

export const ARRANGEMENT_LABEL: Record<WorkArrangement, string> = {
  remote: "Remote",
  hybrid: "Hybrid",
  in_person: "In person",
};

export const ENGAGEMENT_LABEL: Record<EngagementType, string> = {
  w2: "W-2 employment",
  independent_contractor: "Independent contractor",
};

export const KIND_LABEL: Record<OpportunityKind, string> = {
  employment: "Job · Employment",
  contracting: "Affiliation · Contracting",
};

export const EXPERIENCE_LABEL: Record<ExperienceLevel, string> = {
  no_license: "No license yet",
  newly_licensed: "Newly licensed",
  early: "1–3 years",
  mid: "3–7 years",
  senior: "7+ years",
  leadership: "Leadership",
};

export const CATEGORY_LABEL: Record<CareerCategory, string> = {
  sales: "Sales & Production",
  account_management: "Account Management",
  client_service: "Client Service",
  leadership: "Leadership",
  recruiting: "Recruiting & Talent",
  underwriting: "Underwriting",
  claims: "Claims",
  operations: "Operations",
  training: "Training & Development",
};

export const COMP_MODEL_LABEL: Record<CompensationModel, string> = {
  salary: "Salary",
  salary_plus_incentive: "Salary + incentive",
  hourly: "Hourly",
  commission_only: "Commission only",
  draw_against_commission: "Draw against commission",
};

export const LEADS_LABEL: Record<LeadsPolicy, string> = {
  provided: "Leads provided",
  available_at_cost: "Leads available at producer cost",
  not_provided: "Self-generated book",
};

export const LICENSE_REQ_LABEL: Record<LicenseRequirement, string> = {
  required: "License required",
  required_within_90_days: "License within 90 days",
  not_required: "No license required",
  licensing_support_available: "Licensing support available",
};

export const ORG_CATEGORY_LABEL: Record<OrgCategory, string> = {
  independent_agency: "Independent Agency",
  imo: "IMO",
  fmo: "FMO",
  carrier_recruiting: "Carrier Recruiting",
  benefits_brokerage: "Benefits Brokerage",
  wholesale_broker: "Wholesale Broker",
  mga: "MGA",
  claims_services: "Claims Services",
  agency_network: "Agency Network",
  ria: "Registered Investment Adviser",
  broker_dealer: "Broker-Dealer",
  bank_program: "Bank / Credit Union Program",
};

export const ORG_CATEGORY_DESCRIPTION: Record<OrgCategory, string> = {
  independent_agency: "Agencies that represent multiple carriers and serve clients directly.",
  imo: "Independent marketing organizations supporting affiliated producers with contracting, training and tools.",
  fmo: "Field marketing organizations providing distribution support, often in senior markets.",
  carrier_recruiting: "Recruiting divisions of insurance companies building career distribution.",
  benefits_brokerage: "Firms advising employers on group benefits programs.",
  wholesale_broker: "Brokers giving retail agents access to specialty and surplus markets.",
  mga: "Managing general agents with delegated underwriting programs.",
  claims_services: "Independent adjusting, TPA and claims operations organizations.",
  agency_network: "Networks and alliances giving independent agencies shared resources.",
  ria: "Advisory firms providing financial planning and investment advice to clients.",
  broker_dealer: "Firms whose registered representatives offer securities products, often with advisor recruiting teams.",
  bank_program: "Banks and credit unions offering insurance and investment services to members.",
};

export const RECRUITING_LABEL: Record<RecruitingStatus, string> = {
  actively_recruiting: "Actively recruiting",
  selective: "Selectively recruiting",
  not_recruiting: "Not recruiting",
};

export const STAGE_ORDER: PipelineStage[] = ["new", "under_review", "interview", "offer", "hired", "closed"];

export const STAGE_LABEL: Record<PipelineStage, string> = {
  new: "New Application",
  under_review: "Under Review",
  interview: "Interview",
  offer: "Offer / Contract Discussion",
  hired: "Hired / Affiliated",
  closed: "Closed",
};

/** Producer-facing wording for the same stages. */
export const STAGE_LABEL_APPLICANT: Record<PipelineStage, string> = {
  new: "Submitted",
  under_review: "In review",
  interview: "Interviewing",
  offer: "Offer / contract discussion",
  hired: "Hired / affiliated",
  closed: "Closed",
};

export const TOPIC_LABEL: Record<PostTopic, string> = {
  career_development: "Career Development",
  agency_leadership: "Agency Leadership",
  producer_training: "Producer Training",
  independent_vs_captive: "Independent vs. Captive",
  networking: "Industry Networking",
  mentorship: "Mentorship",
  industry: "Industry",
};

export const REPORT_REASON_LABEL: Record<ReportReason, string> = {
  misleading_income_claim: "Misleading or unsubstantiated income claim",
  undisclosed_fees: "Undisclosed fees or producer costs",
  misrepresentation: "Misrepresents the organization or role",
  spam: "Spam",
  harassment: "Harassment",
  privacy: "Shares private or client information",
  other: "Other",
};

export const AVAILABILITY_LABEL: Record<Availability, string> = {
  actively_looking: "Actively looking",
  open: "Open to conversations",
  not_looking: "Not looking",
};

export const VISIBILITY_LABEL: Record<ProfileVisibility, string> = {
  public: "Public",
  members: "Members only",
  private: "Private",
};

export const OPP_STATUS_LABEL: Record<OpportunityStatus, string> = {
  draft: "Draft",
  pending_review: "In review",
  published: "Published",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  archived: "Archived",
};

export const LISTING_STATUS_LABEL: Record<OrgListingStatus, string> = {
  pending: "Pending approval",
  approved: "Approved",
  changes_requested: "Changes requested",
  rejected: "Rejected",
  suspended: "Suspended",
};

/** Self-reported lines of authority offered in the license editor. */
export const LINES_OF_AUTHORITY = [
  "Life",
  "Accident & Health",
  "Property",
  "Casualty",
  "Personal Lines",
  "Variable Life & Annuities",
  "Surplus Lines",
  "Adjuster",
  "SIE (securities)",
  "Series 6",
  "Series 7",
  "Series 63",
  "Series 65",
  "Series 66",
];

export const US_STATES: { code: string; name: string }[] = [
  ["AL", "Alabama"], ["AK", "Alaska"], ["AZ", "Arizona"], ["AR", "Arkansas"], ["CA", "California"],
  ["CO", "Colorado"], ["CT", "Connecticut"], ["DE", "Delaware"], ["DC", "District of Columbia"], ["FL", "Florida"],
  ["GA", "Georgia"], ["HI", "Hawaii"], ["ID", "Idaho"], ["IL", "Illinois"], ["IN", "Indiana"],
  ["IA", "Iowa"], ["KS", "Kansas"], ["KY", "Kentucky"], ["LA", "Louisiana"], ["ME", "Maine"],
  ["MD", "Maryland"], ["MA", "Massachusetts"], ["MI", "Michigan"], ["MN", "Minnesota"], ["MS", "Mississippi"],
  ["MO", "Missouri"], ["MT", "Montana"], ["NE", "Nebraska"], ["NV", "Nevada"], ["NH", "New Hampshire"],
  ["NJ", "New Jersey"], ["NM", "New Mexico"], ["NY", "New York"], ["NC", "North Carolina"], ["ND", "North Dakota"],
  ["OH", "Ohio"], ["OK", "Oklahoma"], ["OR", "Oregon"], ["PA", "Pennsylvania"], ["RI", "Rhode Island"],
  ["SC", "South Carolina"], ["SD", "South Dakota"], ["TN", "Tennessee"], ["TX", "Texas"], ["UT", "Utah"],
  ["VT", "Vermont"], ["VA", "Virginia"], ["WA", "Washington"], ["WV", "West Virginia"], ["WI", "Wisconsin"],
  ["WY", "Wyoming"],
].map(([code, name]) => ({ code, name }));

export function stateName(code: string) {
  if (code === "US" || code === "ALL") return "Nationwide";
  return US_STATES.find((s) => s.code === code)?.name ?? code;
}
