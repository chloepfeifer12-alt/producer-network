/**
 * Producer Network — domain model.
 *
 * These types describe the platform's core entities. They are intentionally
 * shaped like relational records (flat, ID-referenced) so they can be mapped
 * directly onto PostgreSQL tables later (see /db/schema.sql).
 *
 * PROTOTYPE NOTE: every record in this prototype is synthetic. Nothing here
 * represents a real person, organization, license, or compensation figure.
 */

export type ID = string;
export type ISODate = string;

/* ------------------------------------------------------------------ */
/* Taxonomy                                                            */
/* ------------------------------------------------------------------ */

/**
 * Discoverable career / product categories. These are a navigation taxonomy,
 * NOT a legal classification of producer license types or lines of authority.
 */
export type LineSlug =
  | "life"
  | "accident-health"
  | "property-casualty"
  | "personal-lines"
  | "commercial"
  | "medicare"
  | "annuities"
  | "employee-benefits"
  | "specialty"
  | "surplus-lines"
  | "claims-operations"
  | "agency-leadership";

export interface InsuranceLine {
  slug: LineSlug;
  name: string;
  shortName: string;
  summary: string;
  description: string;
  careerPaths: string[];
  typicalRoles: string[];
  skills: string[];
  licensingNote: string;
  icon: string; // lucide icon name, resolved in UI
}

export type WorkArrangement = "remote" | "hybrid" | "in_person";
/** W-2 employment vs. independent contractor / affiliation. */
export type EngagementType = "w2" | "independent_contractor";
export type OpportunityKind = "employment" | "contracting";

export type ExperienceLevel =
  | "no_license" // exploring / pre-license
  | "newly_licensed" // licensed < 1 year
  | "early" // 1–3 years
  | "mid" // 3–7 years
  | "senior" // 7+ years
  | "leadership";

export type CareerCategory =
  | "sales"
  | "account_management"
  | "client_service"
  | "leadership"
  | "recruiting"
  | "underwriting"
  | "claims"
  | "operations"
  | "training";

export type CompensationModel =
  | "salary"
  | "salary_plus_incentive"
  | "hourly"
  | "commission_only"
  | "draw_against_commission";

export type LeadsPolicy = "provided" | "available_at_cost" | "not_provided";

export type LicenseRequirement =
  | "required"
  | "required_within_90_days"
  | "not_required"
  | "licensing_support_available";

/* ------------------------------------------------------------------ */
/* Users & sessions                                                    */
/* ------------------------------------------------------------------ */

export type UserKind = "producer" | "aspiring" | "organization" | "admin";
export type OrgMemberRole = "owner" | "recruiter";
export type AdminRole = "superadmin" | "moderator" | "support";
export type AccountStatus = "active" | "suspended" | "pending";

export interface User {
  id: ID;
  kind: UserKind;
  name: string;
  email: string; // always an *.invalid / example domain in seed data
  orgId?: ID;
  orgRole?: OrgMemberRole;
  adminRole?: AdminRole;
  status: AccountStatus;
  createdAt: ISODate;
  lastActiveAt: ISODate;
  /** Persona label shown in the demo role switcher. */
  demoPersona?: string;
}

/* ------------------------------------------------------------------ */
/* Producer profile                                                    */
/* ------------------------------------------------------------------ */

/**
 * The ONLY verification state the prototype can produce. A real verification
 * workflow (e.g. an authorized licensing data provider + consent) must exist
 * before any other value is introduced.
 */
export type LicenseVerification = "self_reported_unverified";

export interface LicenseRecord {
  id: ID;
  state: string; // USPS code
  residency: "resident" | "non_resident";
  linesOfAuthority: string[];
  status: "active" | "pending" | "inactive"; // as reported by the member
  expiresOn?: ISODate;
  verification: LicenseVerification;
}

export interface ExperienceEntry {
  id: ID;
  title: string;
  organization: string;
  start: string; // "2019"
  end?: string; // undefined = present
  description: string;
}

export interface EducationEntry {
  id: ID;
  institution: string;
  credential: string;
  year?: string;
}

export interface CertificationEntry {
  id: ID;
  name: string;
  issuer: string;
  year?: string;
  status: "self_reported" | "in_progress";
}

export interface AccomplishmentEntry {
  id: ID;
  title: string;
  year?: string;
  description: string;
}

export interface AwardEntry {
  id: ID;
  title: string;
  issuer: string;
  year?: string;
}

export type Availability = "actively_looking" | "open" | "not_looking";
export type ProfileVisibility = "public" | "members" | "private";

export interface ConsentPreferences {
  /** Organizations may contact me about opportunities without an application. */
  recruiterContact: boolean;
  /** Show my profile in the member directory and talent discovery. */
  showInDirectory: boolean;
  /** Include license records in what verified members/organizations can see. */
  showLicenses: boolean;
  /** Share my NPN with organizations I apply to. Never shown publicly. */
  shareNpnOnApply: boolean;
  updatedAt: ISODate;
}

export interface AspiringDetails {
  stage: "exploring" | "studying" | "exam_scheduled" | "exam_passed";
  targetLines: LineSlug[];
  motivation: string;
  targetDate?: string;
}

export interface ProducerProfile {
  userId: ID;
  headline: string;
  city: string;
  state: string;
  bio: string;
  avatarTone: number; // index into avatar palette
  specialties: LineSlug[];
  experienceLevel: ExperienceLevel;
  yearsInIndustry: number;
  arrangementPrefs: WorkArrangement[];
  engagementPrefs: EngagementType[];
  licenses: LicenseRecord[];
  npn?: string;
  careerInterests: string[];
  expertise: string[];
  experience: ExperienceEntry[];
  education: EducationEntry[];
  certifications: CertificationEntry[];
  accomplishments: AccomplishmentEntry[];
  awards: AwardEntry[];
  availability: Availability;
  visibility: ProfileVisibility;
  consent: ConsentPreferences;
  aspiring?: AspiringDetails;
  updatedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Organizations                                                       */
/* ------------------------------------------------------------------ */

export type OrgCategory =
  | "independent_agency"
  | "imo"
  | "fmo"
  | "carrier_recruiting"
  | "benefits_brokerage"
  | "wholesale_broker"
  | "mga"
  | "claims_services"
  | "agency_network";

export type RecruitingStatus = "actively_recruiting" | "selective" | "not_recruiting";
export type OrgListingStatus = "pending" | "approved" | "changes_requested" | "rejected" | "suspended";
export type PlanId = "directory" | "growth" | "premier";

export interface OrgBrand {
  /** Primary brand color for the fictional logo mark. */
  color: string;
  /** Secondary tone used in hero art. */
  tint: string;
  mark: "arch" | "circle" | "diamond" | "stack" | "wave" | "split" | "ring" | "chevron";
}

export interface LeaderEntry {
  id: ID;
  name: string;
  title: string;
  bio: string;
}

export interface TrainingProgram {
  id: ID;
  name: string;
  format: "virtual" | "in_person" | "blended" | "self_paced";
  duration: string;
  description: string;
}

export interface CultureValue {
  title: string;
  description: string;
}

export interface Organization {
  id: ID;
  slug: string;
  name: string;
  category: OrgCategory;
  tagline: string;
  about: string;
  founded: number;
  hqCity: string;
  hqState: string;
  footprint: "local" | "regional" | "multi_state" | "national";
  statesServed: string[]; // USPS codes; ["ALL"] for national
  lines: LineSlug[];
  arrangements: WorkArrangement[];
  engagementTypes: EngagementType[];
  teamSize: string;
  trainingAvailable: boolean;
  trainingPrograms: TrainingProgram[];
  mentorship: { available: boolean; description: string };
  leadProgram: { policy: LeadsPolicy; description: string };
  compensationApproach: string;
  culture: { summary: string; values: CultureValue[] };
  leadership: LeaderEntry[];
  recruitingStatus: RecruitingStatus;
  recruitingContact: { name: string; title: string };
  brand: OrgBrand;
  listingStatus: OrgListingStatus;
  listingNote?: string;
  plan: PlanId;
  createdAt: ISODate;
  updatedAt: ISODate;
  /** All seeded organizations are fictional. */
  isDemo: true;
}

/* ------------------------------------------------------------------ */
/* Opportunities                                                       */
/* ------------------------------------------------------------------ */

export type OpportunityStatus =
  | "draft"
  | "pending_review"
  | "published"
  | "changes_requested"
  | "rejected"
  | "archived";

export interface Compensation {
  model: CompensationModel;
  /** Whether the organization chose to disclose a range. */
  disclosed: boolean;
  min?: number;
  max?: number;
  period?: "year" | "hour";
  /** Plain-language description supplied by the organization. */
  notes: string;
}

export interface Opportunity {
  id: ID;
  slug: string;
  orgId: ID;
  title: string;
  kind: OpportunityKind;
  engagement: EngagementType;
  lines: LineSlug[];
  category: CareerCategory;
  arrangement: WorkArrangement;
  city?: string;
  state: string; // primary state; "US" for nationwide remote
  eligibleStates: string[]; // for remote / multi-state roles
  experienceLevel: ExperienceLevel;
  licenseRequirement: LicenseRequirement;
  licensesNeeded: string[];
  trainingProvided: boolean;
  trainingSummary: string;
  leads: LeadsPolicy;
  leadsNotes: string;
  compensation: Compensation;
  summary: string;
  description: string;
  responsibilities: string[];
  requirements: string[];
  support: string[];
  status: OpportunityStatus;
  moderation?: {
    flags: ModerationFlag[];
    reviewerNote?: string;
    reviewedAt?: ISODate;
    reviewedBy?: ID;
  };
  postedAt?: ISODate;
  createdAt: ISODate;
  updatedAt: ISODate;
  views: number;
  isDemo: true;
}

export interface ModerationFlag {
  code:
    | "income_claim"
    | "guarantee_language"
    | "undisclosed_costs"
    | "missing_compensation_model"
    | "misleading_title"
    | "manual_report";
  label: string;
  excerpt?: string;
}

/* ------------------------------------------------------------------ */
/* Applications & pipeline                                             */
/* ------------------------------------------------------------------ */

export type PipelineStage = "new" | "under_review" | "interview" | "offer" | "hired" | "closed";

export interface ApplicationNote {
  id: ID;
  authorId: ID;
  body: string;
  createdAt: ISODate;
}

export interface ApplicationMessage {
  id: ID;
  authorId: ID;
  body: string;
  createdAt: ISODate;
}

export interface ActivityEntry {
  id: ID;
  at: ISODate;
  actorId: ID;
  message: string;
}

/** Snapshot of what the applicant explicitly agreed to share with this org. */
export interface ApplicationShare {
  contactEmail: boolean;
  licenses: boolean;
  npn: boolean;
  experience: boolean;
}

export interface Application {
  id: ID;
  opportunityId: ID;
  orgId: ID;
  applicantId: ID;
  stage: PipelineStage;
  coverNote: string;
  preferredStartWindow: string;
  share: ApplicationShare;
  notes: ApplicationNote[]; // private to the organization
  messages: ApplicationMessage[]; // visible to both parties
  activity: ActivityEntry[];
  interview?: { at: ISODate; format: "video" | "phone" | "in_person"; with: string };
  withdrawn: boolean;
  submittedAt: ISODate;
  updatedAt: ISODate;
  isDemo: true;
}

export interface SavedItem {
  userId: ID;
  targetId: ID;
  savedAt: ISODate;
}

/* ------------------------------------------------------------------ */
/* Networking                                                          */
/* ------------------------------------------------------------------ */

export interface Connection {
  id: ID;
  fromId: ID;
  toId: ID;
  status: "pending" | "accepted" | "declined";
  message?: string;
  createdAt: ISODate;
  respondedAt?: ISODate;
}

export type PostTopic =
  | "career_development"
  | "agency_leadership"
  | "producer_training"
  | "independent_vs_captive"
  | "networking"
  | "mentorship"
  | "industry";

export interface PostComment {
  id: ID;
  authorId: ID;
  body: string;
  createdAt: ISODate;
}

export interface Post {
  id: ID;
  authorId: ID;
  groupId?: ID;
  topic: PostTopic;
  body: string;
  likes: ID[];
  comments: PostComment[];
  createdAt: ISODate;
  hidden?: boolean;
}

export interface Group {
  id: ID;
  slug: string;
  name: string;
  description: string;
  topic: PostTopic;
  lines: LineSlug[];
  memberIds: ID[];
  createdAt: ISODate;
}

export interface Resource {
  id: ID;
  slug: string;
  title: string;
  kind: "guide" | "article" | "checklist" | "webinar" | "template";
  summary: string;
  body: string[];
  lines: LineSlug[];
  audience: "aspiring" | "new" | "experienced" | "leaders" | "all";
  minutes: number;
  author: string;
}

export interface EventItem {
  id: ID;
  title: string;
  startsAt: ISODate;
  format: "virtual" | "in_person";
  location: string;
  host: string;
  description: string;
  lines: LineSlug[];
  attendees: ID[];
}

/* ------------------------------------------------------------------ */
/* Monetization                                                        */
/* ------------------------------------------------------------------ */

export interface Plan {
  id: PlanId;
  name: string;
  priceMonthly: number; // illustrative only
  priceAnnual: number; // illustrative only, per month billed annually
  tagline: string;
  limits: { activeOpportunities: number | null; seats: number; sponsoredSlots: number };
  features: string[];
  highlighted?: boolean;
}

export type SponsoredSurface = "home_featured" | "directory_top" | "search_top" | "line_page";

export interface SponsoredPlacement {
  id: ID;
  orgId: ID;
  opportunityId?: ID;
  surface: SponsoredSurface;
  status: "active" | "scheduled" | "paused" | "ended" | "requested";
  startsOn: ISODate;
  endsOn: ISODate;
  createdAt: ISODate;
}

export interface Invoice {
  id: ID;
  orgId: ID;
  issuedOn: ISODate;
  description: string;
  amount: number;
  status: "demo_paid" | "demo_upcoming";
}

/* ------------------------------------------------------------------ */
/* Trust & safety, admin, notifications                                */
/* ------------------------------------------------------------------ */

export type ReportReason =
  | "misleading_income_claim"
  | "undisclosed_fees"
  | "misrepresentation"
  | "spam"
  | "harassment"
  | "privacy"
  | "other";

export interface Report {
  id: ID;
  targetType: "opportunity" | "post" | "organization" | "user";
  targetId: ID;
  reason: ReportReason;
  details: string;
  reporterId: ID;
  status: "open" | "actioned" | "dismissed";
  resolution?: string;
  createdAt: ISODate;
  resolvedAt?: ISODate;
}

export interface AuditEvent {
  id: ID;
  at: ISODate;
  actorId: ID;
  action: string;
  targetType: string;
  targetId: ID;
  detail: string;
}

export interface Notification {
  id: ID;
  userId: ID;
  title: string;
  body: string;
  href?: string;
  createdAt: ISODate;
  read: boolean;
}

/** Organization-initiated outreach to a candidate who consented to recruiter contact. */
export interface Introduction {
  id: ID;
  orgId: ID;
  senderId: ID;
  userId: ID;
  opportunityId?: ID;
  message: string;
  status: "sent" | "interested" | "declined";
  createdAt: ISODate;
}

/** Simple time-series point for demonstration analytics. */
export interface SeriesPoint {
  date: ISODate;
  value: number;
}

/* ------------------------------------------------------------------ */
/* Database                                                            */
/* ------------------------------------------------------------------ */

export interface Database {
  schemaVersion: number;
  users: User[];
  profiles: ProducerProfile[];
  organizations: Organization[];
  opportunities: Opportunity[];
  applications: Application[];
  savedOpportunities: SavedItem[];
  savedOrganizations: SavedItem[];
  savedResources: SavedItem[];
  connections: Connection[];
  posts: Post[];
  groups: Group[];
  resources: Resource[];
  events: EventItem[];
  plans: Plan[];
  sponsored: SponsoredPlacement[];
  invoices: Invoice[];
  reports: Report[];
  audit: AuditEvent[];
  notifications: Notification[];
  introductions: Introduction[];
  /** Demo organization profile-view counters (by org id). */
  orgProfileViews: Record<ID, number>;
}
