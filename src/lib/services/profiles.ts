import type { ConsentPreferences, Database, LicenseRecord, ProducerProfile, User } from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";
import { assertCan } from "@/lib/auth/permissions";
import { newId } from "@/lib/utils/ids";
import { nowISO } from "@/lib/utils/dates";
import { attempt, invariant } from "./result";
import { audit, findOrThrow } from "./_helpers";

export function getProfile(db: Database, userId: string | undefined) {
  return userId ? db.profiles.find((p) => p.userId === userId) : undefined;
}

export function getUser(db: Database, userId: string | undefined) {
  return userId ? db.users.find((u) => u.id === userId) : undefined;
}

export interface CompletionItem {
  label: string;
  done: boolean;
  section: string;
}

export function profileCompletion(p: ProducerProfile, kind: User["kind"]) {
  const aspiring = kind === "aspiring";
  const items: CompletionItem[] = [
    { label: "Professional headline", done: p.headline.trim().length >= 10, section: "basics" },
    { label: "Biography (80+ characters)", done: p.bio.trim().length >= 80, section: "basics" },
    { label: "Insurance specialties", done: p.specialties.length > 0, section: "specialties" },
    { label: "Work preferences", done: p.arrangementPrefs.length > 0 && p.engagementPrefs.length > 0, section: "preferences" },
    { label: "Career interests", done: p.careerInterests.length > 0, section: "preferences" },
    { label: "Areas of expertise", done: p.expertise.length > 0, section: "portfolio" },
    { label: "Education", done: p.education.length > 0, section: "portfolio" },
    aspiring
      ? { label: "Licensing goals", done: !!p.aspiring && p.aspiring.targetLines.length > 0, section: "licensing" }
      : { label: "License records", done: p.licenses.length > 0, section: "licensing" },
    aspiring
      ? { label: "Motivation", done: !!p.aspiring?.motivation, section: "licensing" }
      : { label: "Work experience", done: p.experience.length > 0, section: "portfolio" },
    { label: "Certifications or accomplishments", done: p.certifications.length + p.accomplishments.length > 0, section: "portfolio" },
  ];
  const done = items.filter((i) => i.done).length;
  return { percent: Math.round((done / items.length) * 100), items };
}

export type ProfilePatch = Partial<Omit<ProducerProfile, "userId" | "consent" | "updatedAt">> & { name?: string };

const NPN_RE = /^(\d{1,10}|DEMO-\d{4,10})$/;

export function updateProfile(actor: User | null, patch: ProfilePatch) {
  return attempt(() => {
    assertCan(actor, "member:edit_own_profile");
    const { name, ...rest } = patch;
    if (name != null) invariant(name.trim().length >= 2, "Name is required.");
    if (rest.headline != null) invariant(rest.headline.trim().length <= 140, "Headline must be 140 characters or fewer.");
    if (rest.bio != null) invariant(rest.bio.length <= 1500, "Biography must be 1,500 characters or fewer.");
    if (rest.npn) invariant(NPN_RE.test(rest.npn.trim()), "NPN should be up to 10 digits.");
    if (rest.yearsInIndustry != null) invariant(rest.yearsInIndustry >= 0 && rest.yearsInIndustry <= 60, "Years in the industry must be between 0 and 60.");
    if (rest.licenses) {
      for (const l of rest.licenses) invariant(l.state, "Every license record needs a state.");
      // Verification status can never be changed through profile editing.
      rest.licenses = rest.licenses.map((l) => ({ ...l, verification: "self_reported_unverified" as const }));
    }
    commit((d) => {
      const target = d.profiles.find((x) => x.userId === actor.id);
      if (!target) throw new Error("Profile not found.");
      Object.assign(target, structuredClone(rest), { updatedAt: nowISO() });
      const u = d.users.find((x) => x.id === actor.id);
      if (u && name) u.name = name.trim();
    });
  });
}

export function newLicense(): LicenseRecord {
  return { id: newId("lic"), state: "", residency: "resident", linesOfAuthority: [], status: "active", verification: "self_reported_unverified" };
}

export function updateConsent(actor: User | null, consent: Omit<ConsentPreferences, "updatedAt">, visibility: ProducerProfile["visibility"]) {
  return attempt(() => {
    assertCan(actor, "member:edit_own_profile");
    commit((d) => {
      const p = d.profiles.find((x) => x.userId === actor.id);
      if (!p) throw new Error("Profile not found.");
      const before = { ...p.consent, visibility: p.visibility };
      p.consent = { ...consent, updatedAt: nowISO() };
      p.visibility = visibility;
      const changes = (Object.keys(consent) as (keyof typeof consent)[])
        .filter((k) => before[k] !== consent[k])
        .map((k) => `${k}: ${before[k]} → ${consent[k]}`);
      if (before.visibility !== visibility) changes.push(`visibility: ${before.visibility} → ${visibility}`);
      audit(d, actor, "member.consent_updated", "user", actor.id, changes.join(", ") || "No changes");
    });
  });
}

/** Producer response to an organization introduction. */
export function respondToIntroduction(actor: User | null, introId: string, status: "interested" | "declined") {
  return attempt(() => {
    assertCan(actor, "member:edit_own_profile");
    commit((d) => {
      const i = findOrThrow(d.introductions, introId, "Introduction");
      invariant(i.userId === actor.id, "This introduction was sent to another member.");
      i.status = status;
      const org = d.organizations.find((o) => o.id === i.orgId);
      d.users.filter((u) => u.orgId === i.orgId).forEach((u) =>
        d.notifications.unshift({
          id: newId("ntf"),
          userId: u.id,
          title: status === "interested" ? "Candidate is interested" : "Introduction declined",
          body: `${actor.name} ${status === "interested" ? "is interested in learning more" : "declined your introduction"}${org ? ` to ${org.name}` : ""}.`,
          href: "/org/talent",
          createdAt: nowISO(),
          read: false,
        }),
      );
    });
  });
}
