import type { Database, PostTopic, Report, User } from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";
import { assertCan, PermissionError } from "@/lib/auth/permissions";
import { newId } from "@/lib/utils/ids";
import { nowISO } from "@/lib/utils/dates";
import { attempt, invariant } from "./result";
import { audit, findOrThrow, notify, notifyAdmins } from "./_helpers";

/* ---------------- Queries ---------------- */

export type ConnectionState = "self" | "none" | "connected" | "outgoing" | "incoming";

export function connectionState(db: Database, me: string | undefined, other: string): ConnectionState {
  if (!me) return "none";
  if (me === other) return "self";
  const c = db.connections.find((x) => (x.fromId === me && x.toId === other) || (x.fromId === other && x.toId === me));
  if (!c || c.status === "declined") return "none";
  if (c.status === "accepted") return "connected";
  return c.fromId === me ? "outgoing" : "incoming";
}

export function connectionsOf(db: Database, userId: string) {
  return db.connections
    .filter((c) => c.status === "accepted" && (c.fromId === userId || c.toId === userId))
    .map((c) => ({ connection: c, otherId: c.fromId === userId ? c.toId : c.fromId }));
}

export function pendingIncoming(db: Database, userId: string) {
  return db.connections.filter((c) => c.status === "pending" && c.toId === userId);
}

export function pendingOutgoing(db: Database, userId: string) {
  return db.connections.filter((c) => c.status === "pending" && c.fromId === userId);
}

export function mutualCount(db: Database, a: string, b: string) {
  const setA = new Set(connectionsOf(db, a).map((x) => x.otherId));
  return connectionsOf(db, b).filter((x) => setA.has(x.otherId)).length;
}

export function feedPosts(db: Database, opts: { topic?: PostTopic; groupId?: string } = {}) {
  return db.posts
    .filter((p) => !p.hidden && (!opts.topic || p.topic === opts.topic) && (!opts.groupId || p.groupId === opts.groupId))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/* ---------------- Commands ---------------- */

export function requestConnection(actor: User | null, toId: string, message?: string) {
  return attempt(() => {
    assertCan(actor, "network:participate");
    invariant(actor.id !== toId, "You can't connect with yourself.");
    commit((d) => {
      const state = connectionState(d, actor.id, toId);
      invariant(state === "none", "A connection or request already exists.");
      // Remove any previously declined record so a fresh request can be made.
      d.connections = d.connections.filter((c) => !((c.fromId === actor.id && c.toId === toId) || (c.fromId === toId && c.toId === actor.id)));
      d.connections.unshift({ id: newId("con"), fromId: actor.id, toId, status: "pending", message: message?.trim() || undefined, createdAt: nowISO() });
      notify(d, toId, "New connection request", `${actor.name} wants to connect.`, "/network/connections");
    });
  });
}

export function respondToConnection(actor: User | null, connectionId: string, accept: boolean) {
  return attempt(() => {
    assertCan(actor, "network:participate");
    commit((d) => {
      const c = findOrThrow(d.connections, connectionId, "Request");
      if (c.toId !== actor.id) throw new PermissionError();
      c.status = accept ? "accepted" : "declined";
      c.respondedAt = nowISO();
      if (accept) notify(d, c.fromId, "Connection accepted", `${actor.name} accepted your request.`, `/people/${actor.id}`);
    });
  });
}

export function withdrawConnection(actor: User | null, connectionId: string) {
  return attempt(() => {
    assertCan(actor, "network:participate");
    commit((d) => {
      const c = findOrThrow(d.connections, connectionId, "Connection");
      if (c.fromId !== actor.id && c.toId !== actor.id) throw new PermissionError();
      d.connections = d.connections.filter((x) => x.id !== connectionId);
    });
  });
}

const CLIENT_INFO_PATTERNS = [/\bpolicy\s*(number|#|no\.?)\s*[:#]?\s*[A-Z0-9-]{5,}/i, /\b\d{3}-\d{2}-\d{4}\b/, /\bDOB\b|\bdate of birth\b/i];

/** Guards against posting obviously confidential client data. */
export function looksLikeClientData(text: string) {
  return CLIENT_INFO_PATTERNS.some((re) => re.test(text));
}

export function createPost(actor: User | null, input: { body: string; topic: PostTopic; groupId?: string }) {
  return attempt(() => {
    assertCan(actor, "network:participate");
    const body = input.body.trim();
    invariant(body.length >= 10, "Posts need at least 10 characters.");
    invariant(body.length <= 3000, "Posts are limited to 3,000 characters.");
    invariant(!looksLikeClientData(body), "This looks like it may contain client or policy information. Please remove confidential details.");
    let id = "";
    commit((d) => {
      if (input.groupId) {
        const g = findOrThrow(d.groups, input.groupId, "Group");
        invariant(g.memberIds.includes(actor.id), "Join this group to post in it.");
      }
      id = newId("post");
      d.posts.unshift({ id, authorId: actor.id, groupId: input.groupId, topic: input.topic, body, likes: [], comments: [], createdAt: nowISO() });
    });
    return id;
  });
}

export function toggleLike(actor: User | null, postId: string) {
  return attempt(() => {
    assertCan(actor, "network:participate");
    commit((d) => {
      const p = findOrThrow(d.posts, postId, "Post");
      const i = p.likes.indexOf(actor.id);
      if (i >= 0) p.likes.splice(i, 1);
      else p.likes.push(actor.id);
    });
  });
}

export function addComment(actor: User | null, postId: string, body: string) {
  return attempt(() => {
    assertCan(actor, "network:participate");
    invariant(body.trim().length > 0, "Comment can't be empty.");
    invariant(!looksLikeClientData(body), "Please remove client or policy information.");
    commit((d) => {
      const p = findOrThrow(d.posts, postId, "Post");
      p.comments.push({ id: newId("cmt"), authorId: actor.id, body: body.trim(), createdAt: nowISO() });
      if (p.authorId !== actor.id) notify(d, p.authorId, "New comment", `${actor.name} commented on your post.`, "/network/conversations");
    });
  });
}

export function deleteOwnPost(actor: User | null, postId: string) {
  return attempt(() => {
    commit((d) => {
      const p = findOrThrow(d.posts, postId, "Post");
      if (!actor || p.authorId !== actor.id) throw new PermissionError();
      d.posts = d.posts.filter((x) => x.id !== postId);
    });
  });
}

export function toggleGroupMembership(actor: User | null, groupId: string) {
  return attempt(() => {
    assertCan(actor, "network:participate");
    let joined = false;
    commit((d) => {
      const g = findOrThrow(d.groups, groupId, "Group");
      const i = g.memberIds.indexOf(actor.id);
      if (i >= 0) g.memberIds.splice(i, 1);
      else {
        g.memberIds.push(actor.id);
        joined = true;
      }
    });
    return joined;
  });
}

export function toggleSaveResource(actor: User | null, resourceId: string) {
  return attempt(() => {
    assertCan(actor, "member:save");
    commit((d) => {
      const i = d.savedResources.findIndex((s) => s.userId === actor.id && s.targetId === resourceId);
      if (i >= 0) d.savedResources.splice(i, 1);
      else d.savedResources.unshift({ userId: actor.id, targetId: resourceId, savedAt: nowISO() });
    });
  });
}

export function toggleEventRsvp(actor: User | null, eventId: string) {
  return attempt(() => {
    assertCan(actor, "network:participate");
    commit((d) => {
      const e = findOrThrow(d.events, eventId, "Event");
      const i = e.attendees.indexOf(actor.id);
      if (i >= 0) e.attendees.splice(i, 1);
      else e.attendees.push(actor.id);
    });
  });
}

/** Any signed-in user can report content. Reports go to the admin review queue. */
export function submitReport(actor: User | null, input: Pick<Report, "targetType" | "targetId" | "reason" | "details">) {
  return attempt(() => {
    if (!actor) throw new PermissionError("Choose a demo role to report content.");
    invariant(input.details.trim().length >= 5, "Add a few words of detail.");
    commit((d) => {
      const id = newId("rep");
      d.reports.unshift({ id, ...input, details: input.details.trim(), reporterId: actor.id, status: "open", createdAt: nowISO() });
      notifyAdmins(d, "New report", `A ${input.targetType} was reported.`, "/admin/reports");
      audit(d, actor, "report.submitted", input.targetType, input.targetId, input.reason);
    });
  });
}

/* ---------------- Mentorship ---------------- */

export function mentors(db: Database) {
  return db.profiles.filter((p) => p.mentor?.available && p.visibility !== "private" && p.consent.showInDirectory);
}

/** A mentorship request is a connection request carrying an explicit note. */
export function requestMentorship(actor: User | null, mentorId: string, goal: string) {
  return attempt(() => {
    assertCan(actor, "network:participate");
    invariant(goal.trim().length >= 20, "Share what you'd like help with (at least 20 characters).");
    commit((d) => {
      const m = d.profiles.find((p) => p.userId === mentorId);
      invariant(m?.mentor?.available, "This member isn't offering mentorship right now.");
      const existing = d.connections.find((c) => (c.fromId === actor.id && c.toId === mentorId) || (c.fromId === mentorId && c.toId === actor.id));
      invariant(!existing || existing.status === "declined", existing?.status === "accepted" ? "You're already connected — message them from Connections." : "You already have a pending request with this member.");
      d.connections = d.connections.filter((c) => c !== existing);
      d.connections.unshift({ id: newId("con"), fromId: actor.id, toId: mentorId, status: "pending", message: `Mentorship request: ${goal.trim()}`, createdAt: nowISO() });
      notify(d, mentorId, "Mentorship request", `${actor.name} asked for mentorship.`, "/network/connections?tab=received");
    });
  });
}
