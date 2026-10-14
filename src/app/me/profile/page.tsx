"use client";

import { useEffect, useMemo, useState } from "react";
import { ArrowRight, Building2, Check, Eye, EyeOff, Globe, Lock, ShieldCheck, UserRound, Users } from "lucide-react";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { getProfile, profileCompletion } from "@/lib/services/profiles";
import { viewProfile } from "@/lib/services/privacy";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Button, ButtonLink } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { ProgressRing } from "@/components/ui/stat";
import { cn } from "@/lib/utils/cn";
import { formatDate } from "@/lib/utils/dates";
import { ProfileResume, type EditTarget } from "@/components/member/profile-display";
import {
  AspiringEditor,
  BasicsEditor,
  ExpertiseEditor,
  LicensesEditor,
  NpnEditor,
  PortfolioEditor,
  PreferencesEditor,
  SpecialtiesEditor,
  type PortfolioKey,
} from "@/components/member/profile-editors";
import { syntheticMemberViewer, syntheticOrgViewer, type PreviewMode } from "@/components/member/utils";

const PORTFOLIO_KEYS: PortfolioKey[] = ["experience", "education", "certifications", "awards", "accomplishments"];

/** Completion item → the editor that resolves it. */
const COMPLETION_TARGET: Record<string, EditTarget> = {
  "Professional headline": "basics",
  "Biography (80+ characters)": "basics",
  "Insurance specialties": "specialties",
  "Work preferences": "preferences",
  "Career interests": "preferences",
  "Areas of expertise": "expertise",
  Education: "education",
  "License records": "licenses",
  "Licenses & registrations": "licenses",
  "Licensing goals": "aspiring",
  Motivation: "aspiring",
  "Work experience": "experience",
  "Certifications or accomplishments": "certifications",
};

const MODES: { value: PreviewMode; label: string; short: string; icon: typeof Globe }[] = [
  { value: "self", label: "You (editing)", short: "You", icon: UserRound },
  { value: "public", label: "Public visitor", short: "Public", icon: Globe },
  { value: "member", label: "Signed-in member", short: "Member", icon: Users },
  { value: "org", label: "An employer you applied to", short: "Employer", icon: Building2 },
];

export default function ProfilePage() {
  const db = useDb();
  const user = useCurrentUser();
  const profile = useMemo(() => getProfile(db, user?.id), [db, user?.id]);
  const [mode, setMode] = useState<PreviewMode>("self");
  const [editing, setEditing] = useState<EditTarget | null>(null);

  const orgPreview = useMemo(() => (user ? syntheticOrgViewer(db, user.id) : undefined), [db, user]);
  const memberViewer = useMemo(() => syntheticMemberViewer(), []);

  const view = useMemo(() => {
    if (!profile || !user) return undefined;
    const viewer = mode === "self" ? user : mode === "public" ? null : mode === "member" ? memberViewer : orgPreview!.viewer;
    return viewProfile(db, viewer, profile);
  }, [db, user, profile, mode, memberViewer, orgPreview]);

  const completion = useMemo(() => (profile && user ? profileCompletion(profile, user.kind) : undefined), [profile, user]);

  // Section anchors (e.g. /me/profile#licensing) after the gated content renders.
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;
    const t = setTimeout(() => document.getElementById(hash)?.scrollIntoView({ behavior: "smooth", block: "start" }), 60);
    return () => clearTimeout(t);
  }, []);

  if (!user || !profile || !view || !completion) {
    return (
      <EmptyState
        icon={<UserRound className="h-5 w-5" />}
        title="Profile not found"
        description="We couldn't find a member profile for this demo account. Try switching personas from the role switcher."
        action={<ButtonLink href="/me" variant="secondary">Back to home</ButtonLink>}
      />
    );
  }

  const editable = mode === "self";
  const closeEditor = () => setEditing(null);
  const missing = completion.items.filter((i) => !i.done);
  const activeMode = MODES.find((m) => m.value === mode)!;

  return (
    <div>
      <PageHeader
        eyebrow="Your profile"
        title="Your profile"
        description="Your résumé for insurance and financial services employers. You decide who sees what — preview it from any viewer's perspective."
        actions={
          <ButtonLink href="/me/settings" variant="secondary" size="sm">
            <ShieldCheck className="h-4 w-4" /> Privacy & consent
          </ButtonLink>
        }
      />

      {!editable && (
        <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-gold-200 bg-gold-50 px-5 py-4 sm:flex-row sm:items-center sm:justify-between" role="status">
          <div className="flex items-start gap-3">
            <Eye className="mt-0.5 h-4 w-4 shrink-0 text-gold-ink" />
            <div className="text-[13.5px] leading-relaxed text-gold-ink">
              <span className="font-semibold">Previewing as: {activeMode.label}.</span> This is a read-only rendering of exactly what this viewer can see.
            </div>
          </div>
          <Button variant="secondary" size="sm" onClick={() => setMode("self")} className="self-start sm:self-auto">Exit preview</Button>
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px] lg:items-start">
        {/* Rail: on mobile it sits above the profile, on desktop it's a sticky sidebar. */}
        <aside className="space-y-6 lg:sticky lg:top-20 lg:order-2">
          <Card>
            <CardHeader title="Preview as" description="Computed from your visibility, consent settings and application share choices." />
            <CardBody className="pt-4">
              <div role="radiogroup" aria-label="Preview profile as" className="grid grid-cols-2 gap-1.5 lg:grid-cols-1">
                {MODES.map((m) => {
                  const Icon = m.icon;
                  const active = m.value === mode;
                  return (
                    <button
                      key={m.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setMode(m.value)}
                      className={cn(
                        "flex items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] transition",
                        active ? "border-navy bg-navy-50 font-medium text-navy" : "border-line text-ink-2 hover:border-line-strong hover:bg-subtle",
                      )}
                    >
                      <Icon className="h-4 w-4 shrink-0" strokeWidth={1.75} />
                      <span className="lg:hidden">{m.short}</span>
                      <span className="hidden lg:inline">{m.label}</span>
                    </button>
                  );
                })}
              </div>
              {mode === "org" && (
                <p className="mt-4 text-xs leading-relaxed text-ink-3">
                  {orgPreview?.app
                    ? `Showing ${orgPreview.orgName ?? "the organization"}, which you applied to on ${formatDate(orgPreview.app.submittedAt)}. They see only what you chose to share with that application.`
                    : "You haven't applied anywhere yet, so this shows an organization with no application — the same as a signed-in member. Organizations only receive more when you apply and choose to share."}
                </p>
              )}
              {mode !== "self" && view.hidden.length > 0 && (
                <div className="mt-4 border-t border-line pt-4">
                  <div className="mb-2 flex items-center gap-1.5 text-xs font-medium text-ink-2"><EyeOff className="h-3.5 w-3.5 text-ink-4" />Hidden from this viewer</div>
                  <ul className="space-y-1.5">
                    {view.hidden.map((h) => (
                      <li key={h} className="flex gap-2 text-xs leading-relaxed text-ink-3"><span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-4" />{h}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardBody>
          </Card>

          {editable && (
            <Card>
              <CardBody>
                <div className="flex items-center gap-4">
                  <ProgressRing value={completion.percent} size={60} />
                  <div className="min-w-0">
                    <div className="text-[15px] font-semibold tracking-[-0.01em]">Profile strength</div>
                    <div className="text-[13px] text-ink-3">{missing.length === 0 ? "Everything's in place." : `${missing.length} ${missing.length === 1 ? "item" : "items"} to finish`}</div>
                  </div>
                </div>
                <ul className="mt-4 space-y-0.5">
                  {completion.items.map((i) => (
                    <li key={i.label}>
                      {i.done ? (
                        <div className="flex items-center gap-2.5 px-2 py-1.5 text-[13px] text-ink-3">
                          <Check className="h-3.5 w-3.5 text-success" strokeWidth={2.5} />
                          <span className="line-through decoration-ink-4/60">{i.label}</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => setEditing(COMPLETION_TARGET[i.label] ?? null)}
                          className="group flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-left text-[13px] text-ink transition hover:bg-subtle"
                        >
                          <span className="h-3.5 w-3.5 rounded-full border border-dashed border-ink-4" />
                          <span className="flex-1">{i.label}</span>
                          <ArrowRight className="h-3.5 w-3.5 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink-2" />
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              </CardBody>
            </Card>
          )}
        </aside>

        <div className="min-w-0 space-y-6 lg:order-1">
          {view.visible ? (
            <>
              <ProfileResume user={user} profile={profile} view={view} editable={editable} onEdit={setEditing} />
            </>
          ) : (
            <Card>
              <CardBody className="flex flex-col items-center px-6 py-14 text-center">
                <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-subtle text-ink-3 ring-1 ring-line"><Lock className="h-5 w-5" /></span>
                <h2 className="font-display text-[26px] leading-tight">This viewer can&apos;t see your profile</h2>
                <ul className="mt-2 space-y-1 text-sm text-ink-3">{view.hidden.map((h) => <li key={h}>{h}</li>)}</ul>
                <p className="mt-4 max-w-md text-[13px] leading-relaxed text-ink-3">Change who can see your profile in privacy settings at any time.</p>
                <ButtonLink href="/me/settings" variant="secondary" size="sm" className="mt-5">Open privacy settings</ButtonLink>
              </CardBody>
            </Card>
          )}
          {!editable && (
            <Notice tone="demo">Preview is computed with the same privacy rules organizations and members are subject to in this prototype.</Notice>
          )}
        </div>
      </div>

      {editable && editing === "basics" && <BasicsEditor user={user} profile={profile} onClose={closeEditor} aspiring={user.kind === "aspiring"} />}
      {editable && editing === "specialties" && <SpecialtiesEditor user={user} profile={profile} onClose={closeEditor} />}
      {editable && editing === "preferences" && <PreferencesEditor user={user} profile={profile} onClose={closeEditor} />}
      {editable && editing === "licenses" && <LicensesEditor user={user} profile={profile} onClose={closeEditor} />}
      {editable && editing === "npn" && <NpnEditor user={user} profile={profile} onClose={closeEditor} />}
      {editable && editing === "aspiring" && <AspiringEditor user={user} profile={profile} onClose={closeEditor} />}
      {editable && editing === "expertise" && <ExpertiseEditor user={user} profile={profile} onClose={closeEditor} />}
      {editable && editing && (PORTFOLIO_KEYS as string[]).includes(editing) && (
        <PortfolioEditor which={editing as PortfolioKey} user={user} profile={profile} onClose={closeEditor} />
      )}
    </div>
  );
}
