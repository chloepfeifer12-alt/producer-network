/** Internal helpers used inside `commit()` recipes. */
import type { Database, User } from "@/lib/data/types";
import { newId } from "@/lib/utils/ids";
import { nowISO } from "@/lib/utils/dates";

export function audit(d: Database, actor: User, action: string, targetType: string, targetId: string, detail: string) {
  d.audit.unshift({ id: newId("aud"), at: nowISO(), actorId: actor.id, action, targetType, targetId, detail });
}

export function notify(d: Database, userId: string, title: string, body: string, href?: string) {
  d.notifications.unshift({ id: newId("ntf"), userId, title, body, href, createdAt: nowISO(), read: false });
}

/** Notify every team member of an organization. */
export function notifyOrg(d: Database, orgId: string, title: string, body: string, href?: string) {
  d.users.filter((u) => u.orgId === orgId).forEach((u) => notify(d, u.id, title, body, href));
}

export function notifyAdmins(d: Database, title: string, body: string, href?: string) {
  d.users.filter((u) => u.kind === "admin").forEach((u) => notify(d, u.id, title, body, href));
}

export function findOrThrow<T extends { id: string }>(list: T[], id: string, what = "Record"): T {
  const item = list.find((x) => x.id === id);
  if (!item) throw new Error(`${what} not found.`);
  return item;
}
