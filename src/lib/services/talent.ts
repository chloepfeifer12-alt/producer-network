import type { Database, User } from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";
import { assertCan } from "@/lib/auth/permissions";
import { newId } from "@/lib/utils/ids";
import { nowISO } from "@/lib/utils/dates";
import { attempt, invariant } from "./result";
import { audit, notify } from "./_helpers";
import { discoverableCandidates } from "./privacy";

export function introductionsForOrg(db: Database, orgId: string) {
  return db.introductions.filter((i) => i.orgId === orgId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function introductionsForMember(db: Database, userId: string) {
  return db.introductions.filter((i) => i.userId === userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/** Organizations may only contact members who opted into recruiter contact. */
export function sendIntroduction(actor: User | null, orgId: string, userId: string, message: string, opportunityId?: string) {
  return attempt(() => {
    assertCan(actor, "org:discover_talent", orgId);
    invariant(message.trim().length >= 20, "Write a short, personal note (at least 20 characters).");
    commit((d) => {
      const eligible = discoverableCandidates(d).some((p) => p.userId === userId);
      invariant(eligible, "This member has not consented to recruiter contact.");
      invariant(!d.introductions.some((i) => i.orgId === orgId && i.userId === userId && i.status === "sent"), "You already have an open introduction with this member.");
      const org = d.organizations.find((o) => o.id === orgId);
      invariant(org?.listingStatus === "approved", "Your organization must be approved before contacting members.");
      d.introductions.unshift({ id: newId("intro"), orgId, senderId: actor.id, userId, opportunityId, message: message.trim(), status: "sent", createdAt: nowISO() });
      notify(d, userId, `Introduction from ${org.name}`, "An organization would like to connect about an opportunity.", "/me");
      audit(d, actor, "talent.introduction_sent", "user", userId, org.name);
    });
  });
}
