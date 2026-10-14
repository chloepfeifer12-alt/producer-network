/**
 * DEMO ACCOUNT CREATION — creates local records only. There is no email
 * verification, password, identity proofing or organization verification.
 * Production requires a real identity provider and an organization
 * verification workflow before any of these records become active.
 */
import type { ExperienceLevel, LineSlug, OrgCategory, Organization, User } from "@/lib/data/types";
import { commit, getDb, setSessionUser } from "@/lib/store/db-store";
import { newId, slugify } from "@/lib/utils/ids";
import { nowISO } from "@/lib/utils/dates";
import { attempt, invariant } from "./result";
import { notifyAdmins } from "./_helpers";

export interface MemberSignup {
  name: string;
  kind: "producer" | "aspiring";
  headline: string;
  city: string;
  state: string;
  specialties: LineSlug[];
  experienceLevel: ExperienceLevel;
  yearsInIndustry: number;
  availability: "actively_looking" | "open" | "not_looking";
  recruiterContact: boolean;
  showInDirectory: boolean;
  acceptedTerms: boolean;
}

export function createMemberAccount(input: MemberSignup) {
  return attempt(() => {
    invariant(input.name.trim().length >= 2, "Enter your name.");
    invariant(input.state, "Choose your state.");
    invariant(input.specialties.length > 0, "Choose at least one area of interest.");
    invariant(input.acceptedTerms, "Please acknowledge the prototype terms placeholder.");
    const id = newId("u");
    const handle = slugify(input.name).replace(/-/g, ".") || "member";
    commit((d) => {
      const user: User = {
        id,
        kind: input.kind,
        name: input.name.trim(),
        email: `${handle}.${id.slice(-4)}@demo.producer-network.invalid`,
        status: "active",
        createdAt: nowISO(),
        lastActiveAt: nowISO(),
      };
      d.users.push(user);
      d.profiles.push({
        userId: id,
        headline: input.headline.trim(),
        city: input.city.trim(),
        state: input.state,
        bio: "",
        avatarTone: Math.floor(Math.random() * 8),
        specialties: input.specialties,
        experienceLevel: input.kind === "aspiring" ? "no_license" : input.experienceLevel,
        yearsInIndustry: input.kind === "aspiring" ? 0 : input.yearsInIndustry,
        arrangementPrefs: [],
        engagementPrefs: [],
        licenses: [],
        careerInterests: [],
        expertise: [],
        experience: [],
        education: [],
        certifications: [],
        accomplishments: [],
        awards: [],
        availability: input.availability,
        visibility: "members",
        consent: {
          recruiterContact: input.recruiterContact,
          showInDirectory: input.showInDirectory,
          showLicenses: false,
          shareNpnOnApply: false,
          updatedAt: nowISO(),
        },
        aspiring: input.kind === "aspiring" ? { stage: "exploring", targetLines: input.specialties, motivation: "" } : undefined,
        updatedAt: nowISO(),
      });
      d.notifications.unshift({ id: newId("ntf"), userId: id, title: "Welcome to the network", body: "Complete your profile to get better recommendations.", href: "/me/profile", createdAt: nowISO(), read: false });
      d.audit.unshift({ id: newId("aud"), at: nowISO(), actorId: id, action: "member.created_demo", targetType: "user", targetId: id, detail: `${input.kind} account (demo)` });
    });
    setSessionUser(id);
    return id;
  });
}

export interface OrganizationSignup {
  ownerName: string;
  ownerTitle: string;
  orgName: string;
  category: OrgCategory;
  hqCity: string;
  hqState: string;
  lines: LineSlug[];
  tagline: string;
  about: string;
  acceptedTerms: boolean;
}

const MARKS: Organization["brand"]["mark"][] = ["arch", "circle", "diamond", "stack", "wave", "split", "ring", "chevron"];
const COLORS = ["#2F4A3A", "#3B2F5C", "#1F3B57", "#7A3E2A", "#24525A", "#4A3B2C", "#23395B", "#6B2E3A"];

export function createOrganizationAccount(input: OrganizationSignup) {
  return attempt(() => {
    invariant(input.ownerName.trim().length >= 2, "Enter your name.");
    invariant(input.orgName.trim().length >= 3, "Enter the organization name.");
    invariant(input.hqState, "Choose a headquarters state.");
    invariant(input.lines.length > 0, "Choose at least one insurance category.");
    invariant(input.tagline.trim().length >= 10, "Add a one-line description (at least 10 characters).");
    invariant(input.about.trim().length >= 60, "Describe the organization in at least 60 characters.");
    invariant(input.acceptedTerms, "Please acknowledge the organization terms placeholder.");
    invariant(!getDb().organizations.some((o) => o.name.toLowerCase() === input.orgName.trim().toLowerCase()), "An organization with this name already exists in the demo.");
    const orgId = newId("org");
    const userId = newId("u");
    commit((d) => {
      const pick = Math.floor(Math.random() * MARKS.length);
      let slug = slugify(input.orgName);
      if (d.organizations.some((o) => o.slug === slug)) slug = `${slug}-${orgId.slice(-4)}`;
      d.organizations.push({
        id: orgId,
        slug,
        name: input.orgName.trim(),
        category: input.category,
        tagline: input.tagline.trim(),
        about: input.about.trim(),
        founded: new Date().getUTCFullYear(),
        hqCity: input.hqCity.trim(),
        hqState: input.hqState,
        footprint: "regional",
        statesServed: [input.hqState],
        lines: input.lines,
        arrangements: ["hybrid"],
        engagementTypes: ["w2"],
        teamSize: "Not provided",
        trainingAvailable: false,
        trainingPrograms: [],
        mentorship: { available: false, description: "" },
        leadProgram: { policy: "not_provided", description: "" },
        compensationApproach: "",
        culture: { summary: "", values: [] },
        leadership: [{ id: newId("ld"), name: input.ownerName.trim(), title: input.ownerTitle.trim() || "Owner", bio: "" }],
        recruitingStatus: "actively_recruiting",
        recruitingContact: { name: input.ownerName.trim(), title: input.ownerTitle.trim() || "Owner" },
        brand: { color: COLORS[pick % COLORS.length]!, tint: "#ECE9E1", mark: MARKS[pick]! },
        listingStatus: "pending",
        plan: "directory",
        createdAt: nowISO(),
        updatedAt: nowISO(),
        isDemo: true,
      });
      d.users.push({
        id: userId,
        kind: "organization",
        name: input.ownerName.trim(),
        email: `${slugify(input.ownerName).replace(/-/g, ".")}.${userId.slice(-4)}@demo.producer-network.invalid`,
        orgId,
        orgRole: "owner",
        status: "active",
        createdAt: nowISO(),
        lastActiveAt: nowISO(),
      });
      d.orgProfileViews[orgId] = 0;
      notifyAdmins(d, "New organization application", `${input.orgName.trim()} applied to join the directory.`, "/admin/organizations");
      d.audit.unshift({ id: newId("aud"), at: nowISO(), actorId: userId, action: "organization.applied", targetType: "organization", targetId: orgId, detail: input.orgName.trim() });
    });
    setSessionUser(userId);
    return orgId;
  });
}
