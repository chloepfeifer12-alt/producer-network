"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ArrowRight, Check, CircleCheck, Lock, Minus, UserRoundPlus } from "lucide-react";
import type { ApplicationShare, Opportunity, Organization } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can, ROLE_LABEL } from "@/lib/auth/permissions";
import { existingApplication, submitApplication } from "@/lib/services/applications";
import { getProfile } from "@/lib/services/profiles";
import { LICENSE_REQ_LABEL } from "@/lib/data/taxonomy";
import { Dialog } from "@/components/ui/dialog";
import { Button, ButtonLink } from "@/components/ui/button";
import { Checkbox, Field, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { OrgLogo } from "@/components/brand/org-logo";
import { DemoApplicationDisclaimer } from "@/components/domain/disclaimers";
import { KindBadge, StageBadge, UnverifiedLicenseBadge } from "@/components/domain/badges";
import { toast } from "@/components/ui/toast";
import { formatDate } from "@/lib/utils/dates";
import { pluralize } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";

export const START_WINDOWS = ["Immediately", "Within 2 weeks", "Within 30 days", "In 1–3 months", "Flexible — exploring options"];

const MIN_NOTE = 20;
const MAX_NOTE = 2000;

/** Apply flow. State resets each time the dialog opens. */
export function ApplyDialog({ open, onClose, opportunity, org }: { open: boolean; onClose: () => void; opportunity: Opportunity; org?: Organization }) {
  if (!open) return null;
  return <ApplyDialogInner onClose={onClose} o={opportunity} org={org} />;
}

function ApplyDialogInner({ onClose, o, org }: { onClose: () => void; o: Opportunity; org?: Organization }) {
  const db = useDb();
  const user = useCurrentUser();
  const [submittedId, setSubmittedId] = useState<string | null>(null);
  const existing = useMemo(() => existingApplication(db, user?.id, o.id), [db, user?.id, o.id]);
  const orgName = org?.name ?? "this organization";

  const header = (
    <div className="flex items-center gap-3">
      {org && <OrgLogo brand={org.brand} name={org.name} size={36} />}
      <div className="min-w-0">
        <div className="truncate text-[12.5px] font-normal text-ink-3">{orgName}</div>
        <div className="truncate">{o.title}</div>
      </div>
    </div>
  );

  // 1) Confirmation (takes priority — the new application now "exists").
  if (submittedId) {
    const app = db.applications.find((a) => a.id === submittedId);
    return (
      <Dialog open onClose={onClose} title="Application submitted" size="lg">
        <Confirmation appId={submittedId} share={app?.share} o={o} orgName={orgName} npnConsent={!!getProfile(db, user?.id)?.consent.shareNpnOnApply} onClose={onClose} />
      </Dialog>
    );
  }

  // 2) Visitors.
  if (!user) {
    return (
      <Dialog open onClose={onClose} title="Choose a demo role to apply" size="md">
        <div className="flex flex-col items-center px-2 py-4 text-center">
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-navy-50 text-navy-600 ring-1 ring-navy-100">
            <UserRoundPlus className="h-5 w-5" strokeWidth={1.75} />
          </span>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-2">
            Applying requires a member account. This prototype uses fictional personas instead of real sign-in — pick a producer or aspiring
            producer persona, or walk through joining.
          </p>
          <div className="mt-6 flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <ButtonLink href="/join?step=persona" variant="primary">
              Choose a demo role <ArrowRight className="h-4 w-4" />
            </ButtonLink>
            <ButtonLink href="/join" variant="secondary">
              Join the network
            </ButtonLink>
          </div>
          <p className="mt-5 text-xs text-ink-4">You&apos;ll come back to this listing from Opportunities once you&apos;ve chosen a role.</p>
        </div>
      </Dialog>
    );
  }

  // 3) Organization / admin roles (or anyone without member:apply).
  if (!can(user, "member:apply")) {
    const ownOrg = user.kind === "organization" && user.orgId === o.orgId;
    return (
      <Dialog open onClose={onClose} title="Applications are for member accounts" size="md" footer={<Button variant="secondary" onClick={onClose}>Close</Button>}>
        <div className="flex gap-4">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-subtle text-ink-3 ring-1 ring-line">
            <Lock className="h-[18px] w-[18px]" strokeWidth={1.75} />
          </span>
          <div className="text-sm leading-relaxed text-ink-2">
            <p>
              You&apos;re viewing as <span className="font-medium text-ink">{user.name}</span> ({ROLE_LABEL(user)}). Only producer and aspiring producer
              accounts can apply to opportunities.
            </p>
            {ownOrg ? (
              <p className="mt-3">
                This listing belongs to your organization. Manage it and review applicants from your{" "}
                <Link href="/org/opportunities" className="font-medium text-navy-600 underline-offset-4 hover:underline">
                  recruiting workspace
                </Link>
                .
              </p>
            ) : (
              <p className="mt-3 text-ink-3">Switch to a member persona with the demo role switcher to try the applicant experience.</p>
            )}
          </div>
        </div>
      </Dialog>
    );
  }

  // 4) Already applied.
  if (existing) {
    return (
      <Dialog
        open
        onClose={onClose}
        title="You've already applied"
        size="md"
        footer={
          <>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
            <ButtonLink href={`/me/applications/${existing.id}`}>
              View application <ArrowRight className="h-4 w-4" />
            </ButtonLink>
          </>
        }
      >
        <div className="rounded-xl border border-line bg-subtle/60 p-4">
          {header}
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-line pt-4 text-[13px] text-ink-3">
            <span className="flex items-center gap-2">
              Status <StageBadge stage={existing.stage} audience="applicant" withdrawn={existing.withdrawn} />
            </span>
            <span>Submitted {formatDate(existing.submittedAt)}</span>
          </div>
        </div>
        <p className="mt-4 text-[13px] leading-relaxed text-ink-3">Follow progress, read messages from {orgName} or withdraw from your application page.</p>
      </Dialog>
    );
  }

  return <ApplyForm o={o} org={org} header={header} onClose={onClose} onSubmitted={setSubmittedId} />;
}

/* ------------------------------------------------------------------ */

function ApplyForm({
  o,
  org,
  header,
  onClose,
  onSubmitted,
}: {
  o: Opportunity;
  org?: Organization;
  header: React.ReactNode;
  onClose: () => void;
  onSubmitted: (id: string) => void;
}) {
  const db = useDb();
  const user = useCurrentUser();
  const profile = useMemo(() => getProfile(db, user?.id), [db, user?.id]);
  const orgName = org?.name ?? "this organization";

  const [note, setNote] = useState("");
  const [start, setStart] = useState(START_WINDOWS[1]!);
  const [share, setShare] = useState<ApplicationShare>({ contactEmail: false, licenses: false, npn: false, experience: false });
  const [ack, setAck] = useState(false);
  const [touched, setTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  const licenses = profile?.licenses ?? [];
  const npnConsent = !!profile?.consent.shareNpnOnApply;
  const hasNpn = !!profile?.npn;
  const needsLicense = o.licenseRequirement === "required" || o.licenseRequirement === "required_within_90_days";
  const lacksLicense = user?.kind === "aspiring" || licenses.length === 0;
  const noteError = touched && note.trim().length < MIN_NOTE ? `Add at least ${MIN_NOTE} characters (${note.trim().length}/${MIN_NOTE}).` : undefined;
  const set = (k: keyof ApplicationShare) => (v: boolean) => setShare((s) => ({ ...s, [k]: v }));

  const submit = () => {
    setTouched(true);
    setError(null);
    if (note.trim().length < MIN_NOTE) {
      setError("Add a short note to the organization (at least 20 characters).");
      return;
    }
    if (!ack) {
      setError("Please confirm the sharing acknowledgement to submit.");
      return;
    }
    setBusy(true);
    const r = submitApplication(user, { opportunityId: o.id, coverNote: note, preferredStartWindow: start, share, consentAcknowledged: ack });
    setBusy(false);
    if (r.ok) {
      toast("Application submitted", { body: `${orgName} can now see what you chose to share (demo).` });
      onSubmitted(r.data);
    } else {
      setError(r.error);
      toast("Couldn't submit application", { body: r.error, tone: "error" });
    }
  };

  return (
    <Dialog
      open
      onClose={onClose}
      title="Apply to this opportunity"
      description="You decide exactly what this organization can see."
      size="lg"
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} disabled={busy}>
            Submit application
          </Button>
        </>
      }
    >
      <div className="space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line bg-subtle/60 px-4 py-3">
          {header}
          <KindBadge kind={o.kind} />
        </div>

        {needsLicense && lacksLicense && (
          <Notice tone="warning" title={`${LICENSE_REQ_LABEL[o.licenseRequirement]} for this role`}>
            {o.licenseRequirement === "required"
              ? "This listing requires an active license and your profile doesn't show one yet. You can still apply — be upfront in your note about where you are in the licensing process."
              : "This listing expects you to be licensed within 90 days of starting. You can still apply — mention your licensing timeline in your note."}{" "}
            Licensing rules vary by state.
          </Notice>
        )}

        <Field
          id="apply-note"
          label="Note to the organization"
          error={noteError}
          hint={`Why this role, and what you'd bring. ${note.length.toLocaleString()}/${MAX_NOTE.toLocaleString()} characters.`}
        >
          <Textarea
            id="apply-note"
            value={note}
            maxLength={MAX_NOTE}
            onChange={(e) => setNote(e.target.value)}
            onBlur={() => setTouched(true)}
            rows={5}
            aria-invalid={!!noteError}
            placeholder={`Hi ${org?.recruitingContact.name.split(" ")[0] ?? "there"} — I'm interested in this role because…`}
          />
        </Field>

        <Field id="apply-start" label="Preferred start window">
          <Select id="apply-start" value={start} onChange={(e) => setStart(e.target.value)}>
            {START_WINDOWS.map((w) => (
              <option key={w}>{w}</option>
            ))}
          </Select>
        </Field>

        <fieldset>
          <legend className="text-[13px] font-medium text-ink-2">Choose what to share with {orgName}</legend>
          <p className="mt-1 text-xs leading-relaxed text-ink-3">
            Always included: your name, profile headline, location, specialties and the note above. Everything else is off unless you turn it on.
          </p>
          <div className="mt-3 divide-y divide-line rounded-xl border border-line">
            <ShareRow>
              <Checkbox checked={share.contactEmail} onChange={set("contactEmail")} label="Contact email" description={user?.email} />
            </ShareRow>
            <ShareRow>
              <Checkbox
                checked={share.licenses}
                onChange={set("licenses")}
                label={
                  <span className="flex flex-wrap items-center gap-2">
                    License records <UnverifiedLicenseBadge compact />
                  </span>
                }
                description={licenses.length ? `${pluralize(licenses.length, "self-reported license")} (${licenses.map((l) => l.state).join(", ")})` : "You haven't added license records to your profile."}
              />
            </ShareRow>
            <ShareRow>
              <Checkbox
                checked={share.npn}
                onChange={set("npn")}
                label="National Producer Number (NPN)"
                description={
                  !hasNpn ? (
                    "No NPN on your profile."
                  ) : npnConsent ? (
                    "Shared only with this organization. Never shown publicly."
                  ) : (
                    <span className="text-warning">
                      Your privacy settings don&apos;t allow sharing your NPN with applications, so it won&apos;t be shared even if checked. Change this in{" "}
                      <Link href="/me/settings" className="font-medium underline underline-offset-2">
                        Privacy &amp; consent
                      </Link>
                      .
                    </span>
                  )
                }
              />
            </ShareRow>
            <ShareRow>
              <Checkbox
                checked={share.experience}
                onChange={set("experience")}
                label="Work history"
                description={profile?.experience.length ? pluralize(profile.experience.length, "role") + " from your profile" : "Your profile has no work history entries yet."}
              />
            </ShareRow>
          </div>
        </fieldset>

        <div className={cn("rounded-xl border p-4 transition", ack ? "border-navy-200 bg-navy-50/60" : "border-line-strong bg-surface")}>
          <Checkbox
            checked={ack}
            onChange={setAck}
            label={
              <span className="font-medium">
                I understand my selected profile information will be shared only with this organization ({orgName}), and I can withdraw my
                application at any time.
              </span>
            }
            description="Required. Nothing is shared with other organizations or made public."
          />
        </div>

        {error && (
          <Notice tone="danger" title="Couldn't submit yet">
            {error}
          </Notice>
        )}

        <DemoApplicationDisclaimer />
      </div>
    </Dialog>
  );
}

function ShareRow({ children }: { children: React.ReactNode }) {
  return <div className="px-4 py-3">{children}</div>;
}

/* ------------------------------------------------------------------ */

function Confirmation({
  appId,
  share,
  o,
  orgName,
  npnConsent,
  onClose,
}: {
  appId: string;
  share?: ApplicationShare;
  o: Opportunity;
  orgName: string;
  npnConsent: boolean;
  onClose: () => void;
}) {
  const shared: { label: string; on: boolean; note?: string }[] = [
    { label: "Name, headline, location & specialties", on: true },
    { label: "Your note & start window", on: true },
    { label: "Contact email", on: !!share?.contactEmail },
    { label: "License records (self-reported)", on: !!share?.licenses },
    {
      label: "NPN",
      on: !!share?.npn && npnConsent,
      note: share?.npn && !npnConsent ? "Not shared — blocked by your privacy settings" : undefined,
    },
    { label: "Work history", on: !!share?.experience },
  ];
  return (
    <div>
      <div className="flex items-start gap-4">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-success-50 text-success ring-1 ring-success/15">
          <CircleCheck className="h-5 w-5" strokeWidth={1.75} />
        </span>
        <div>
          <p className="text-[15px] font-medium text-ink">
            Your application for {o.title} is with {orgName}.
          </p>
          <p className="mt-1 text-[13px] text-ink-3">You&apos;ll find it, with live status, under Applications in your workspace.</p>
        </div>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2">
        <div>
          <h3 className="eyebrow mb-3">What happens next</h3>
          <ol className="space-y-3 text-[13px] leading-relaxed text-ink-2">
            {[
              `${orgName} reviews it in their recruiting pipeline.`,
              "You're notified as the status changes — in review, interviewing, offer or contract discussion.",
              "Messages from the organization appear on your application page. You can withdraw at any time.",
            ].map((t, i) => (
              <li key={i} className="flex gap-3">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-navy-50 text-[11px] font-semibold text-navy-600 ring-1 ring-navy-100">{i + 1}</span>
                {t}
              </li>
            ))}
          </ol>
        </div>
        <div>
          <h3 className="eyebrow mb-3">What you shared</h3>
          <ul className="space-y-2 text-[13px]">
            {shared.map((s) => (
              <li key={s.label} className="flex items-start gap-2.5">
                {s.on ? (
                  <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-success" strokeWidth={2.5} />
                ) : (
                  <Minus className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-4" strokeWidth={2.5} />
                )}
                <span className={s.on ? "text-ink" : "text-ink-4"}>
                  {s.label}
                  {s.note && <span className="block text-xs text-warning">{s.note}</span>}
                </span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      <Notice tone="demo" title="Demo — not transmitted to a real organization" className="mt-6">
        <DemoApplicationDisclaimer className="text-gold-ink/90" />
      </Notice>

      <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
        <ButtonLink href="/opportunities" variant="secondary" onClick={onClose}>
          Continue browsing
        </ButtonLink>
        <ButtonLink href={`/me/applications/${appId}`}>
          View application <ArrowRight className="h-4 w-4" />
        </ButtonLink>
      </div>
    </div>
  );
}
