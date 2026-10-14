import type { Database, User } from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";

export function notificationsFor(db: Database, userId: string | undefined) {
  return userId ? db.notifications.filter((n) => n.userId === userId) : [];
}

export function markNotificationRead(actor: User | null, id: string) {
  if (!actor) return;
  commit((d) => {
    const n = d.notifications.find((x) => x.id === id && x.userId === actor.id);
    if (n) n.read = true;
  });
}

export function markAllNotificationsRead(actor: User | null) {
  if (!actor) return;
  commit((d) => {
    d.notifications.forEach((n) => {
      if (n.userId === actor.id) n.read = true;
    });
  });
}
