import type { LicenseRecord, ProducerProfile, User } from "../types";
import { daysAgo } from "@/lib/utils/dates";

/**
 * Fictional people. Names are invented; emails use the reserved `.invalid`
 * TLD so nothing can ever be delivered to a real inbox.
 */
const email = (handle: string) => `${handle}@demo.producer-network.invalid`;

type UserSeed = Omit<User, "email" | "status" | "createdAt" | "lastActiveAt"> & {
  handle: string;
  joined: number;
  active?: number;
  status?: User["status"];
};

function user(u: UserSeed): User {
  const { handle, joined, active, ...rest } = u;
  return {
    status: "active",
    ...rest,
    email: email(handle),
    createdAt: daysAgo(joined),
    lastActiveAt: daysAgo(active ?? 0, 13),
  };
}

export const seedUsers: User[] = [
  // ---- Demo personas -------------------------------------------------
  user({ id: "u_maya", kind: "producer", name: "Maya Okafor", handle: "maya.okafor", joined: 410, demoPersona: "Experienced producer" }),
  user({ id: "u_jordan", kind: "producer", name: "Jordan Reyes", handle: "jordan.reyes", joined: 96, demoPersona: "Newly licensed producer" }),
  user({ id: "u_priya", kind: "aspiring", name: "Priya Natarajan", handle: "priya.n", joined: 21, demoPersona: "Aspiring producer" }),
  user({ id: "u_daniel", kind: "organization", name: "Daniel Whitfield", handle: "daniel.whitfield", joined: 380, orgId: "org_kestrelwood", orgRole: "owner", demoPersona: "Independent agency recruiter" }),
  user({ id: "u_renee", kind: "organization", name: "Renée Castillo", handle: "renee.castillo", joined: 520, orgId: "org_lanternway", orgRole: "owner", demoPersona: "IMO agent development" }),
  user({ id: "u_admin", kind: "admin", name: "Morgan Ellery", handle: "morgan.ellery", joined: 600, adminRole: "superadmin", demoPersona: "Platform administrator" }),

  // ---- Members ---------------------------------------------------------
  user({ id: "u_marcus", kind: "producer", name: "Marcus Bell", handle: "marcus.bell", joined: 300, active: 1 }),
  user({ id: "u_elena", kind: "producer", name: "Elena Vasquez", handle: "elena.v", joined: 280, active: 2 }),
  user({ id: "u_tom", kind: "producer", name: "Thomas Nakamura", handle: "t.nakamura", joined: 350, active: 3 }),
  user({ id: "u_aisha", kind: "producer", name: "Aisha Rahman", handle: "aisha.rahman", joined: 190, active: 1 }),
  user({ id: "u_grace", kind: "producer", name: "Grace Whitaker", handle: "grace.whitaker", joined: 450, active: 4 }),
  user({ id: "u_devon", kind: "producer", name: "Devon Carter", handle: "devon.carter", joined: 140, active: 0 }),
  user({ id: "u_sofia", kind: "producer", name: "Sofia Lindqvist", handle: "sofia.l", joined: 260, active: 5 }),
  user({ id: "u_kwame", kind: "producer", name: "Kwame Asante", handle: "kwame.asante", joined: 230, active: 2 }),
  user({ id: "u_hannah", kind: "producer", name: "Hannah Brooks", handle: "hannah.brooks", joined: 60, active: 0 }),
  user({ id: "u_luis", kind: "producer", name: "Luis Ortega", handle: "luis.ortega", joined: 170, active: 1 }),
  user({ id: "u_megan", kind: "producer", name: "Megan O'Donnell", handle: "megan.od", joined: 200, active: 6 }),
  user({ id: "u_ben", kind: "producer", name: "Benjamin Hart", handle: "ben.hart", joined: 320, active: 3 }),
  user({ id: "u_nina", kind: "aspiring", name: "Nina Park", handle: "nina.park", joined: 35, active: 1 }),
  user({ id: "u_omar", kind: "producer", name: "Omar Haddad", handle: "omar.haddad", joined: 110, active: 2 }),
  user({ id: "u_claire", kind: "producer", name: "Claire Dubois", handle: "claire.dubois", joined: 500, active: 7 }),
  user({ id: "u_jamal", kind: "producer", name: "Jamal Washington", handle: "jamal.w", joined: 410, active: 2 }),
  user({ id: "u_rachel", kind: "producer", name: "Rachel Kim", handle: "rachel.kim", joined: 240, active: 4 }),
  user({ id: "u_tyler", kind: "producer", name: "Tyler Grant", handle: "tyler.grant", joined: 75, active: 0 }),
  user({ id: "u_imani", kind: "producer", name: "Imani Johnson", handle: "imani.j", joined: 150, active: 3 }),
  user({ id: "u_samuel", kind: "producer", name: "Samuel Whitlock", handle: "sam.whitlock", joined: 210, active: 9 }),
  user({ id: "u_ines", kind: "aspiring", name: "Inés Moreau", handle: "ines.moreau", joined: 12, active: 1 }),

  // ---- Organization team members --------------------------------------
  user({ id: "u_lena", kind: "organization", name: "Lena Marsh", handle: "lena.marsh", joined: 330, orgId: "org_tidewell", orgRole: "owner", active: 2 }),
  user({ id: "u_owen", kind: "organization", name: "Owen Achterberg", handle: "owen.a", joined: 300, orgId: "org_corvane", orgRole: "owner", active: 4 }),
  user({ id: "u_felix", kind: "organization", name: "Felix Amari", handle: "felix.amari", joined: 260, orgId: "org_ashgrove", orgRole: "recruiter", active: 3 }),
  user({ id: "u_patrice", kind: "organization", name: "Patrice Lowell", handle: "patrice.lowell", joined: 290, orgId: "org_meridale", orgRole: "owner", active: 1 }),
  user({ id: "u_kit", kind: "organization", name: "Kit Alvarado", handle: "kit.alvarado", joined: 120, orgId: "org_kestrelwood", orgRole: "recruiter", active: 0 }),
  user({ id: "u_paul", kind: "organization", name: "Paul Sandoval", handle: "paul.sandoval", joined: 4, orgId: "org_wrenfield", orgRole: "owner", status: "pending", active: 4 }),
  user({ id: "u_victor", kind: "organization", name: "Victor Lane", handle: "victor.lane", joined: 3, orgId: "org_velorum", orgRole: "owner", status: "pending", active: 3 }),
  user({ id: "u_dana", kind: "organization", name: "Dana Whitcombe", handle: "dana.w", joined: 9, orgId: "org_sablecrest", orgRole: "owner", status: "pending", active: 6 }),

  // ---- Platform team ----------------------------------------------------
  user({ id: "u_riley", kind: "admin", name: "Riley Chen", handle: "riley.chen", joined: 540, adminRole: "moderator", active: 0 }),
  user({ id: "u_sasha", kind: "admin", name: "Sasha Imbert", handle: "sasha.imbert", joined: 200, adminRole: "support", active: 1 }),
];

/* ------------------------------------------------------------------ */

let licCounter = 0;
function lic(state: string, lines: string[], residency: LicenseRecord["residency"] = "resident", status: LicenseRecord["status"] = "active"): LicenseRecord {
  licCounter += 1;
  return {
    id: `lic_${licCounter}`,
    state,
    residency,
    linesOfAuthority: lines,
    status,
    verification: "self_reported_unverified",
  };
}

type ProfileSeed = Partial<ProducerProfile> &
  Pick<ProducerProfile, "userId" | "headline" | "city" | "state" | "bio" | "specialties" | "experienceLevel" | "yearsInIndustry">;

function profile(p: ProfileSeed): ProducerProfile {
  return {
    avatarTone: 0,
    arrangementPrefs: ["hybrid"],
    engagementPrefs: ["w2"],
    licenses: [],
    careerInterests: [],
    expertise: [],
    experience: [],
    education: [],
    certifications: [],
    accomplishments: [],
    awards: [],
    availability: "open",
    visibility: "members",
    consent: {
      recruiterContact: true,
      showInDirectory: true,
      showLicenses: true,
      shareNpnOnApply: false,
      updatedAt: daysAgo(30),
    },
    updatedAt: daysAgo(10),
    ...p,
  };
}

export const seedProfiles: ProducerProfile[] = [
  profile({
    userId: "u_maya",
    headline: "Commercial lines producer · Construction & light manufacturing",
    city: "Charlotte",
    state: "NC",
    avatarTone: 2,
    bio: "Commercial lines producer with nine years in the independent channel. I specialize in contractors, light manufacturing and fleet-heavy accounts, and I care about building a book that renews because clients actually understand their coverage. Currently exploring organizations with strong specialty market access and a real investment in producer development.",
    specialties: ["commercial", "property-casualty", "specialty"],
    experienceLevel: "senior",
    yearsInIndustry: 9,
    arrangementPrefs: ["hybrid", "remote"],
    engagementPrefs: ["w2"],
    licenses: [
      lic("NC", ["Property", "Casualty"]),
      lic("SC", ["Property", "Casualty"], "non_resident"),
      lic("VA", ["Property", "Casualty"], "non_resident"),
      lic("NC", ["Surplus Lines"]),
    ],
    npn: "DEMO-4417203",
    careerInterests: ["Specialty programs", "Producer mentorship", "Agency leadership track"],
    expertise: ["Contractors & construction", "Fleet risk", "Workers' compensation", "Account rounding"],
    experience: [
      { id: "exp_m1", title: "Commercial Lines Producer", organization: "Fictional regional agency (demo)", start: "2020", description: "Grew and retained a mid-market commercial book focused on contractors and manufacturers. Partnered with account managers on renewal strategy and stewardship reporting." },
      { id: "exp_m2", title: "Commercial Account Manager", organization: "Fictional independent agency (demo)", start: "2017", end: "2020", description: "Managed renewals, marketing and service for a portfolio of small-to-mid commercial accounts." },
    ],
    education: [{ id: "edu_m1", institution: "University of North Carolina (demo entry)", credential: "B.S., Business Administration", year: "2016" }],
    certifications: [
      { id: "cert_m1", name: "Commercial lines designation coursework", issuer: "Industry education program (self-reported)", year: "2021", status: "self_reported" },
      { id: "cert_m2", name: "Risk management designation", issuer: "Industry education program (self-reported)", status: "in_progress" },
    ],
    accomplishments: [
      { id: "acc_m1", title: "Built a contractor-focused niche", year: "2023", description: "Developed a repeatable discovery process for small contractors, including a plain-language coverage review checklist used across my team." },
      { id: "acc_m2", title: "Mentored two new account managers", year: "2024", description: "Informal mentor for two newly licensed colleagues through their first renewal season." },
    ],
    awards: [{ id: "aw_m1", title: "Agency service excellence recognition", issuer: "Former employer (self-reported)", year: "2022" }],
    availability: "open",
    visibility: "members",
    consent: { recruiterContact: true, showInDirectory: true, showLicenses: true, shareNpnOnApply: true, updatedAt: daysAgo(40) },
  }),
  profile({
    userId: "u_jordan",
    headline: "Newly licensed life & health producer · Bilingual (English/Spanish)",
    city: "Phoenix",
    state: "AZ",
    avatarTone: 5,
    bio: "Licensed for life and accident & health earlier this year after six years in hospitality management. I'm looking for an organization with structured training, real mentorship and transparent expectations — I'd rather grow steadily than chase hype. Bilingual in English and Spanish.",
    specialties: ["life", "accident-health", "annuities"],
    experienceLevel: "newly_licensed",
    yearsInIndustry: 0,
    arrangementPrefs: ["hybrid", "remote"],
    engagementPrefs: ["w2", "independent_contractor"],
    licenses: [lic("AZ", ["Life", "Accident & Health"])],
    npn: "DEMO-8830512",
    careerInterests: ["Structured training", "Mentorship", "Final expense & family protection", "Retirement income"],
    expertise: ["Bilingual client communication", "Customer experience", "Team scheduling"],
    experience: [
      { id: "exp_j1", title: "Front Office Manager", organization: "Fictional hotel group (demo)", start: "2018", end: "2025", description: "Led a team of 14 across guest services. Built onboarding materials and handled escalations with care." },
    ],
    education: [{ id: "edu_j1", institution: "Maricopa community college (demo entry)", credential: "A.A., Business", year: "2017" }],
    certifications: [{ id: "cert_j1", name: "Pre-licensing course completion", issuer: "Pre-licensing provider (self-reported)", year: "2026", status: "self_reported" }],
    accomplishments: [{ id: "acc_j1", title: "Passed state exams on first attempt", year: "2026", description: "Completed life and health pre-licensing while working full time." }],
    availability: "actively_looking",
    visibility: "public",
    consent: { recruiterContact: true, showInDirectory: true, showLicenses: true, shareNpnOnApply: true, updatedAt: daysAgo(20) },
  }),
  profile({
    userId: "u_priya",
    headline: "Exploring insurance careers · Former high school educator",
    city: "Columbus",
    state: "OH",
    avatarTone: 7,
    bio: "Eight years teaching economics. I love explaining complicated ideas simply, and employee benefits keeps coming up as a great fit. Researching licensing paths and organizations that train career changers.",
    specialties: ["employee-benefits", "life"],
    experienceLevel: "no_license",
    yearsInIndustry: 0,
    arrangementPrefs: ["hybrid"],
    engagementPrefs: ["w2"],
    careerInterests: ["Employee benefits", "Training programs for career changers", "Client education"],
    expertise: ["Teaching & presentation", "Curriculum design", "Data literacy"],
    education: [{ id: "edu_p1", institution: "Ohio public university (demo entry)", credential: "M.Ed., Secondary Education", year: "2017" }],
    availability: "actively_looking",
    visibility: "members",
    consent: { recruiterContact: false, showInDirectory: true, showLicenses: false, shareNpnOnApply: false, updatedAt: daysAgo(15) },
    aspiring: {
      stage: "studying",
      targetLines: ["employee-benefits", "life", "accident-health"],
      motivation: "I want a career where explaining things clearly is the job — and where I can keep growing.",
      targetDate: "Early next year",
    },
  }),
  profile({ userId: "u_marcus", headline: "Commercial producer · Transportation & logistics", city: "Atlanta", state: "GA", avatarTone: 1, bio: "Fourteen years in commercial insurance, the last eight focused on transportation and logistics. Interested in sales leadership and helping agencies build specialty practices.", specialties: ["commercial", "specialty", "agency-leadership"], experienceLevel: "senior", yearsInIndustry: 14, licenses: [lic("GA", ["Property", "Casualty"]), lic("FL", ["Property", "Casualty"], "non_resident")], careerInterests: ["Sales leadership", "Specialty practice building"], expertise: ["Trucking", "Logistics", "Cargo"], availability: "open" }),
  profile({ userId: "u_elena", headline: "Medicare advisor · Compliance-first client education", city: "Tampa", state: "FL", avatarTone: 3, bio: "Six years helping beneficiaries understand their options. Strong believer in slow, careful conversations and documentation discipline.", specialties: ["medicare", "accident-health"], experienceLevel: "mid", yearsInIndustry: 6, arrangementPrefs: ["remote"], engagementPrefs: ["independent_contractor"], licenses: [lic("FL", ["Life", "Accident & Health"]), lic("GA", ["Accident & Health"], "non_resident")], careerInterests: ["Mentoring new advisors", "Compliance training"], expertise: ["Enrollment periods", "Beneficiary education"], availability: "not_looking" }),
  profile({ userId: "u_tom", headline: "Employee benefits consultant · Mid-market employers", city: "Chicago", state: "IL", avatarTone: 4, bio: "Eleven years advising employers on benefits strategy, renewals and employee communication.", specialties: ["employee-benefits", "accident-health"], experienceLevel: "senior", yearsInIndustry: 11, licenses: [lic("IL", ["Life", "Accident & Health"])], careerInterests: ["Benefits technology", "Consulting leadership"], expertise: ["Renewal strategy", "Self-funded plans", "Employee communication"] }),
  profile({ userId: "u_aisha", headline: "Life & annuity producer · Retirement-income conversations", city: "Dallas", state: "TX", avatarTone: 6, bio: "Four years in life and annuities, focused on pre-retirees and small-business owners.", specialties: ["life", "annuities"], experienceLevel: "mid", yearsInIndustry: 4, engagementPrefs: ["independent_contractor"], arrangementPrefs: ["remote", "hybrid"], licenses: [lic("TX", ["Life", "Accident & Health"])], careerInterests: ["Advanced markets", "Case design"], expertise: ["Retirement income", "Business owner planning"], availability: "open" }),
  profile({ userId: "u_grace", headline: "Agency principal · Building teams that stay", city: "Nashville", state: "TN", avatarTone: 0, bio: "Twenty years in the business, the last twelve running an independent agency. I write about hiring, onboarding and producer development.", specialties: ["agency-leadership", "personal-lines", "commercial"], experienceLevel: "leadership", yearsInIndustry: 20, licenses: [lic("TN", ["Property", "Casualty", "Life", "Accident & Health"])], careerInterests: ["Mentoring agency leaders"], expertise: ["Agency operations", "Producer onboarding", "Perpetuation planning"], availability: "not_looking" }),
  profile({ userId: "u_devon", headline: "Personal lines producer · Growing toward commercial", city: "Raleigh", state: "NC", avatarTone: 2, bio: "Two years in personal lines and eager to learn small commercial.", specialties: ["personal-lines", "property-casualty"], experienceLevel: "early", yearsInIndustry: 2, licenses: [lic("NC", ["Property", "Casualty"])], careerInterests: ["Small commercial", "Mentorship"], expertise: ["Home & auto", "Umbrella"], availability: "actively_looking" }),
  profile({ userId: "u_sofia", headline: "Wholesale broker · Habitational & hospitality E&S", city: "Scottsdale", state: "AZ", avatarTone: 5, bio: "Eight years placing tough habitational and hospitality risks in the E&S market.", specialties: ["surplus-lines", "specialty", "commercial"], experienceLevel: "senior", yearsInIndustry: 8, licenses: [lic("AZ", ["Property", "Casualty", "Surplus Lines"])], careerInterests: ["Program business"], expertise: ["Habitational", "Hospitality", "Market access"] }),
  profile({ userId: "u_kwame", headline: "Property claims adjuster · Catastrophe deployments", city: "Houston", state: "TX", avatarTone: 1, bio: "Five years in property claims including multiple catastrophe deployments.", specialties: ["claims-operations", "property-casualty"], experienceLevel: "mid", yearsInIndustry: 5, licenses: [lic("TX", ["Adjuster"])], careerInterests: ["Large-loss adjusting", "Claims leadership"], expertise: ["CAT response", "Estimating"], availability: "open" }),
  profile({ userId: "u_hannah", headline: "Newly licensed P&C · Customer service background", city: "Charlotte", state: "NC", avatarTone: 7, bio: "Recently licensed for property & casualty after four years in retail banking. Looking for a supportive agency team.", specialties: ["personal-lines", "property-casualty"], experienceLevel: "newly_licensed", yearsInIndustry: 0, licenses: [lic("NC", ["Property", "Casualty"])], careerInterests: ["Account management", "Training"], expertise: ["Client service", "Cross-selling conversations"], availability: "actively_looking", consent: { recruiterContact: true, showInDirectory: true, showLicenses: true, shareNpnOnApply: true, updatedAt: daysAgo(50) }, npn: "DEMO-5520981" }),
  profile({ userId: "u_luis", headline: "Life producer · Family protection, bilingual", city: "San Antonio", state: "TX", avatarTone: 3, bio: "Three years helping families with life insurance. Spanish-speaking.", specialties: ["life", "accident-health"], experienceLevel: "early", yearsInIndustry: 3, engagementPrefs: ["independent_contractor"], licenses: [lic("TX", ["Life", "Accident & Health"])], careerInterests: ["Team leadership"], expertise: ["Family protection", "Bilingual service"], availability: "actively_looking", npn: "DEMO-7712044", consent: { recruiterContact: true, showInDirectory: true, showLicenses: true, shareNpnOnApply: true, updatedAt: daysAgo(30) } }),
  profile({ userId: "u_megan", headline: "Benefits account manager · Renewals & enrollment", city: "Columbus", state: "OH", avatarTone: 4, bio: "Five years managing benefits renewals and enrollment for 40+ employer groups.", specialties: ["employee-benefits"], experienceLevel: "mid", yearsInIndustry: 5, licenses: [lic("OH", ["Life", "Accident & Health"])], careerInterests: ["Benefits consulting"], expertise: ["Enrollment platforms", "Renewal analysis"] }),
  profile({ userId: "u_ben", headline: "Commercial account executive · Construction", city: "Denver", state: "CO", avatarTone: 6, bio: "Ten years in commercial insurance, mostly construction and real estate.", specialties: ["commercial", "property-casualty"], experienceLevel: "senior", yearsInIndustry: 10, licenses: [lic("CO", ["Property", "Casualty"])], careerInterests: ["Producer role at a specialty-focused agency"], expertise: ["Construction", "Real estate"], availability: "open" }),
  profile({ userId: "u_nina", headline: "Studying for P&C · Career changer from marketing", city: "Seattle", state: "WA", avatarTone: 0, bio: "Former marketing coordinator studying for my property & casualty exam.", specialties: ["property-casualty", "personal-lines"], experienceLevel: "no_license", yearsInIndustry: 0, careerInterests: ["Personal lines", "Agency marketing"], availability: "actively_looking", aspiring: { stage: "exam_scheduled", targetLines: ["property-casualty"], motivation: "Stable, people-centered work with a real ladder.", targetDate: "Next month" } }),
  profile({ userId: "u_omar", headline: "Life & health producer · First year in the field", city: "Detroit", state: "MI", avatarTone: 2, bio: "One year in, learning every day. Interested in Medicare-related careers.", specialties: ["life", "accident-health", "medicare"], experienceLevel: "newly_licensed", yearsInIndustry: 1, licenses: [lic("MI", ["Life", "Accident & Health"])], careerInterests: ["Medicare-related careers"], availability: "actively_looking", npn: "DEMO-3301985" }),
  profile({ userId: "u_claire", headline: "Director of producer training · Curriculum & coaching", city: "Hartford", state: "CT", avatarTone: 5, bio: "Fifteen years designing producer training programs. Passionate about onboarding that actually sticks.", specialties: ["agency-leadership", "life", "property-casualty"], experienceLevel: "leadership", yearsInIndustry: 15, licenses: [lic("CT", ["Life", "Accident & Health", "Property", "Casualty"])], careerInterests: ["Training leadership"], expertise: ["Curriculum design", "Sales coaching"], availability: "not_looking" }),
  profile({ userId: "u_jamal", headline: "Recruiting director · Agency growth", city: "Charlotte", state: "NC", avatarTone: 1, bio: "Twelve years recruiting and developing producers. I believe in honest job previews.", specialties: ["agency-leadership", "personal-lines"], experienceLevel: "leadership", yearsInIndustry: 12, licenses: [lic("NC", ["Property", "Casualty"])], careerInterests: ["Talent strategy"], expertise: ["Structured interviewing", "Onboarding"] }),
  profile({ userId: "u_rachel", headline: "Specialty broker · Cyber & professional liability", city: "New York", state: "NY", avatarTone: 3, bio: "Seven years placing cyber and professional liability for tech and healthcare clients.", specialties: ["specialty", "commercial"], experienceLevel: "mid", yearsInIndustry: 7, licenses: [lic("NY", ["Property", "Casualty"])], careerInterests: ["Program development"], expertise: ["Cyber", "E&O", "D&O"], availability: "open" }),
  profile({ userId: "u_tyler", headline: "Newly licensed life producer", city: "Kansas City", state: "MO", avatarTone: 4, bio: "Just licensed and looking for a training-first team.", specialties: ["life"], experienceLevel: "newly_licensed", yearsInIndustry: 0, licenses: [lic("MO", ["Life", "Accident & Health"])], careerInterests: ["Training", "Mentorship"], availability: "actively_looking" }),
  profile({ userId: "u_imani", headline: "Licensed benefits advisor · Medicare & A&H", city: "Atlanta", state: "GA", avatarTone: 6, bio: "Two years as a licensed advisor in a contact-center setting.", specialties: ["medicare", "accident-health"], experienceLevel: "early", yearsInIndustry: 2, arrangementPrefs: ["remote"], licenses: [lic("GA", ["Life", "Accident & Health"])], careerInterests: ["Field advisor role"], availability: "open", npn: "DEMO-6629013" }),
  profile({ userId: "u_samuel", headline: "Personal lines CSR · Detail-oriented service", city: "Minneapolis", state: "MN", avatarTone: 7, bio: "Three years servicing personal lines accounts.", specialties: ["personal-lines"], experienceLevel: "early", yearsInIndustry: 3, licenses: [lic("MN", ["Property", "Casualty"])], careerInterests: ["Producer track"], availability: "open", visibility: "private", consent: { recruiterContact: false, showInDirectory: false, showLicenses: false, shareNpnOnApply: false, updatedAt: daysAgo(80) } }),
  profile({ userId: "u_ines", headline: "Exploring claims & operations careers", city: "Denver", state: "CO", avatarTone: 2, bio: "Background in logistics operations; curious about claims.", specialties: ["claims-operations"], experienceLevel: "no_license", yearsInIndustry: 0, careerInterests: ["Claims"], availability: "actively_looking", aspiring: { stage: "exploring", targetLines: ["claims-operations"], motivation: "Use my operations background somewhere meaningful." } }),
];
