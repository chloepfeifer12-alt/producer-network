import type { Application, ApplicationShare, Database, PipelineStage, User } from "@/lib/data/types";
import { commit } from "@/lib/store/db-store";
import { assertCan, can, canForOrg, PermissionError } from "@/lib/auth/permissions";
import { STAGE_LABEL, STAGE_LABEL_APPLICANT } from "@/lib/data/taxonomy";
import { newId } from "@/lib/utils/ids";
import { nowISO } from "@/lib/utils/dates";
import { attempt, invariant } from "./result";
import { audit, findOrThrow, notify, notifyOrg } from "./_helpers";
import { isPublic } from "./opportunities";

/* ---------------- Queries ---------------- */

export function applicationsForApplicant(db: Database, userId: string) {
  return db.applications.filter((a) => a.applicantId === userId).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

export function applicationsForOrg(db: Database, orgId: string) {
  return db.applications.filter((a) => a.orgId === orgId && !a.withdrawn).sort((a, b) => b.submittedAt.localeCompare(a.submittedAt));
}

export function existingApplication(db: Database, userId: string | undefined, oppId: string) {
  return userId ? db.applications.find((a) => a.applicantId === userId && a.opportunityId === oppId && !a.withdrawn) : undefined;
}

/** Returns the application only if the viewer is the applicant or a member of the receiving org. */
export function getApplicationFor(db: Database, viewer: User | null, appId: string): Application | undefined {
  const a = db.applications.find((x) => x.id === appId);
  if (!a || !viewer) return undefined;
  if (a.applicantId === viewer.id) return a;
  if (canForOrg(viewer, "org:review_applications", a.orgId)) return a;
  return undefined;
}

/** Strip organization-private fields before showing an application to its applicant. */
export function applicantSafeView(a: Application): Omit<Application, "notes"> {
  const { notes: _notes, ...rest } = a;
  return rest;
}

/* ---------------- Commands ---------------- */

export interface ApplyInput {
  opportunityId: string;
  coverNote: string;
  preferredStartWindow: string;
  share: ApplicationShare;
  consentAcknowledged: boolean;
}

export function submitApplication(actor: User | null, input: ApplyInput) {
  return attempt(() => {
    assertCan(actor, "member:apply");
    invariant(input.consentAcknowledged, "Please confirm what you're sharing with this organization.");
    invariant(input.coverNote.trim().length >= 20, "Add a short note to the organization (at least 20 characters).");
    invariant(input.coverNote.length <= 2000, "Keep your note under 2,000 characters.");
    let id = "";
    commit((d) => {
      const o = findOrThrow(d.opportunities, input.opportunityId, "Opportunity");
      invariant(isPublic(o, d), "This opportunity is no longer accepting applications.");
      invariant(!d.applications.some((a) => a.applicantId === actor.id && a.opportunityId === o.id && !a.withdrawn), "You've already applied to this opportunity.");
      id = newId("app");
      const now = nowISO();
      d.applications.unshift({
        id,
        opportunityId: o.id,
        orgId: o.orgId,
        applicantId: actor.id,
        stage: "new",
        coverNote: input.coverNote.trim(),
        preferredStartWindow: input.preferredStartWindow,
        share: { ...input.share },
        notes: [],
        messages: [],
        activity: [{ id: newId("act"), at: now, actorId: actor.id, message: "Application submitted" }],
        withdrawn: false,
        submittedAt: now,
        updatedAt: now,
        isDemo: true,
      });
      notifyOrg(d, o.orgId, "New application", `${actor.name} applied to ${o.title}.`, `/org/applications/${id}`);
      notify(d, actor.id, "Application submitted", `Your application for ${o.title} was delivered (demo).`, `/me/applications/${id}`);
      audit(d, actor, "application.submitted", "application", id, o.title);
    });
    return id;
  });
}

export function withdrawApplication(actor: User | null, appId: string) {
  return attempt(() => {
    commit((d) => {
      const a = findOrThrow(d.applications, appId, "Application");
      if (!actor || a.applicantId !== actor.id) throw new PermissionError();
      invariant(!["hired", "closed"].includes(a.stage), "This application is already closed.");
      a.withdrawn = true;
      a.stage = "closed";
      a.updatedAt = nowISO();
      a.activity.push({ id: newId("act"), at: nowISO(), actorId: actor.id, message: "Applicant withdrew the application" });
      const o = d.opportunities.find((x) => x.id === a.opportunityId);
      notifyOrg(d, a.orgId, "Application withdrawn", `${actor.name} withdrew from ${o?.title ?? "an opportunity"}.`);
    });
  });
}

export function moveApplicationStage(actor: User | null, appId: string, stage: PipelineStage) {
  return attempt(() => {
    commit((d) => {
      const a = findOrThrow(d.applications, appId, "Application");
      assertCan(actor, "org:review_applications", a.orgId);
      invariant(!a.withdrawn, "The applicant withdrew this application.");
      if (a.stage === stage) return;
      const from = a.stage;
      a.stage = stage;
      a.updatedAt = nowISO();
      a.activity.push({ id: newId("act"), at: nowISO(), actorId: actor.id, message: `Moved from ${STAGE_LABEL[from]} to ${STAGE_LABEL[stage]}` });
      const o = d.opportunities.find((x) => x.id === a.opportunityId);
      const org = d.organizations.find((x) => x.id === a.orgId);
      notify(d, a.applicantId, "Application update", `${org?.name ?? "An organization"} updated your application for ${o?.title ?? "an opportunity"}: ${STAGE_LABEL_APPLICANT[stage]}.`, `/me/applications/${a.id}`);
      audit(d, actor, "application.stage_changed", "application", a.id, `${from} → ${stage}`);
    });
  });
}

export function addApplicationNote(actor: User | null, appId: string, body: string) {
  return attempt(() => {
    invariant(body.trim().length > 0, "Note can't be empty.");
    commit((d) => {
      const a = findOrThrow(d.applications, appId, "Application");
      assertCan(actor, "org:review_applications", a.orgId);
      a.notes.push({ id: newId("note"), authorId: actor.id, body: body.trim(), createdAt: nowISO() });
      a.activity.push({ id: newId("act"), at: nowISO(), actorId: actor.id, message: "Added an internal note" });
    });
  });
}

export function sendApplicationMessage(actor: User | null, appId: string, body: string) {
  return attempt(() => {
    invariant(body.trim().length > 0, "Message can't be empty.");
    invariant(body.length <= 2000, "Keep messages under 2,000 characters.");
    commit((d) => {
      const a = findOrThrow(d.applications, appId, "Application");
      const isApplicant = actor?.id === a.applicantId;
      const isOrg = canForOrg(actor, "org:review_applications", a.orgId);
      if (!actor || (!isApplicant && !isOrg)) throw new PermissionError();
      invariant(!a.withdrawn, "This application was withdrawn.");
      a.messages.push({ id: newId("msg"), authorId: actor.id, body: body.trim(), createdAt: nowISO() });
      a.updatedAt = nowISO();
      const o = d.opportunities.find((x) => x.id === a.opportunityId);
      if (isApplicant) notifyOrg(d, a.orgId, "New message from applicant", `${actor.name} · ${o?.title ?? ""}`, `/org/applications/${a.id}`);
      else {
        const org = d.organizations.find((x) => x.id === a.orgId);
        notify(d, a.applicantId, `Message from ${org?.name ?? "an organization"}`, o?.title ?? "", `/me/applications/${a.id}`);
      }
    });
  });
}

export function scheduleInterview(actor: User | null, appId: string, at: string, format: "video" | "phone" | "in_person", withWhom: string) {
  return attempt(() => {
    invariant(at, "Choose a date and time.");
    commit((d) => {
      const a = findOrThrow(d.applications, appId, "Application");
      assertCan(actor, "org:review_applications", a.orgId);
      a.interview = { at: new Date(at).toISOString(), format, with: withWhom || "Hiring team" };
      if (["new", "under_review"].includes(a.stage)) a.stage = "interview";
      a.updatedAt = nowISO();
      a.activity.push({ id: newId("act"), at: nowISO(), actorId: actor.id, message: `Scheduled a ${format.replace("_", "-")} interview` });
      const o = d.opportunities.find((x) => x.id === a.opportunityId);
      notify(d, a.applicantId, "Interview scheduled", `An interview was scheduled for ${o?.title ?? "your application"} (demo — no calendar invite is sent).`, `/me/applications/${a.id}`);
    });
  });
}

export function canReviewAny(user: User | null) {
  return can(user, "org:review_applications");
}
