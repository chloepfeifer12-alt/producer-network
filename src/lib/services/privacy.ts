/**
 * Privacy & consent rules.
 *
 * Organizations never receive producer data automatically. What a viewer can
 * see is computed here from (a) the producer's visibility + consent settings
 * and (b) any application where the producer explicitly chose what to share.
 * Production must enforce the same rules server-side (RLS / API filters).
 */
import type { Application, Database, LicenseRecord, ProducerProfile, User } from "@/lib/data/types";
import { can } from "@/lib/auth/permissions";

export interface ProfileView {
  visible: boolean;
  /** Why the profile or fields are hidden — rendered to the viewer. */
  hidden: string[];
  showLicenses: boolean;
  licenses: LicenseRecord[];
  npn?: string;
  email?: string;
  showExperience: boolean;
  /** The application that grants this viewer access, if any. */
  viaApplication?: Application;
  isSelf: boolean;
}

export function applicationsBetween(db: Database, orgId: string, userId: string) {
  return db.applications.filter((a) => a.orgId === orgId && a.applicantId === userId && !a.withdrawn);
}

export function viewProfile(db: Database, viewer: User | null, profile: ProducerProfile): ProfileView {
  const owner = db.users.find((u) => u.id === profile.userId);
  const isSelf = viewer?.id === profile.userId;
  const base: ProfileView = { visible: false, hidden: [], showLicenses: false, licenses: [], showExperience: false, isSelf };

  if (!owner || owner.status === "suspended") return { ...base, hidden: ["This member is unavailable."] };

  if (isSelf) {
    return { ...base, visible: true, showLicenses: true, licenses: profile.licenses, npn: profile.npn, email: owner.email, showExperience: true };
  }

  // Organization viewer with an application from this member: share only what the applicant chose.
  if (viewer?.kind === "organization" && viewer.orgId) {
    const app = applicationsBetween(db, viewer.orgId, profile.userId).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt))[0];
    if (app) {
      const hidden: string[] = [];
      if (!app.share.licenses) hidden.push("License records were not shared with this application.");
      if (!(app.share.npn && profile.consent.shareNpnOnApply)) hidden.push("NPN was not shared with this application.");
      if (!app.share.contactEmail) hidden.push("Email was not shared — use platform messages.");
      if (!app.share.experience) hidden.push("Work history was not shared with this application.");
      return {
        ...base,
        visible: true,
        hidden,
        viaApplication: app,
        showLicenses: app.share.licenses,
        licenses: app.share.licenses ? profile.licenses : [],
        npn: app.share.npn && profile.consent.shareNpnOnApply ? profile.npn : undefined,
        email: app.share.contactEmail ? owner.email : undefined,
        showExperience: app.share.experience,
      };
    }
  }

  // Platform support staff may view settings for support purposes (logged in the audit trail in production).
  if (viewer?.kind === "admin" && can(viewer, "admin:view_consent")) {
    return { ...base, visible: true, showLicenses: true, licenses: profile.licenses, showExperience: true, hidden: ["NPN and email are hidden from admin views in this prototype."] };
  }

  const allowed =
    profile.visibility === "public" || (profile.visibility === "members" && !!viewer);
  if (!allowed) {
    return { ...base, hidden: [profile.visibility === "private" ? "This member's profile is private." : "Sign in (demo role switcher) to view member profiles."] };
  }

  const hidden: string[] = ["NPN is never shown publicly.", "Contact details are not shared outside applications."];
  const showLicenses = profile.consent.showLicenses && !!viewer;
  if (!showLicenses) hidden.push("License records are hidden by this member's settings.");
  return { ...base, visible: true, hidden, showLicenses, licenses: showLicenses ? profile.licenses : [], showExperience: true };
}

/** Member directory listing: only members who opted in AND whose visibility allows the viewer. */
export function directoryMembers(db: Database, viewer: User | null) {
  return db.profiles.filter((p) => {
    if (!p.consent.showInDirectory) return false;
    const u = db.users.find((x) => x.id === p.userId);
    if (!u || u.status !== "active") return false;
    if (p.visibility === "private") return false;
    if (p.visibility === "members" && !viewer) return false;
    return true;
  });
}

/** Talent discovery for organizations: explicit recruiter-contact consent required. */
export function discoverableCandidates(db: Database) {
  return db.profiles.filter((p) => {
    const u = db.users.find((x) => x.id === p.userId);
    return (
      !!u && u.status === "active" &&
      p.consent.showInDirectory && p.consent.recruiterContact &&
      p.visibility !== "private" && p.availability !== "not_looking"
    );
  });
}
