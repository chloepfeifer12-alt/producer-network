"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { Check, Download, FileText, Globe, Lock, Minus, ShieldCheck, Trash2, Users } from "lucide-react";
import type { ConsentPreferences, ProfileVisibility } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { getProfile, updateConsent } from "@/lib/services/profiles";
import { applicationsForApplicant } from "@/lib/services/applications";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Switch } from "@/components/ui/form";
import { toastResult } from "@/components/ui/toast";
import { StageBadge } from "@/components/domain/badges";
import { formatDate, formatDateTime } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { ShareIcon, shareRows } from "@/components/member/application-parts";

type ConsentDraft = Omit<ConsentPreferences, "updatedAt">;

const VISIBILITY_OPTIONS: { value: ProfileVisibility; title: string; icon: typeof Globe; body: string }[] = [
  {
    value: "public",
    title: "Public",
    icon: Globe,
    body: "Anyone can view your profile, including visitors who aren't signed in. License records still require sign-in; your NPN and contact details are never public.",
  },
  {
    value: "members",
    title: "Members only",
    icon: Users,
    body: "Only signed-in members and organizations on the platform can view your profile. Recommended for most people.",
  },
  {
    value: "private",
    title: "Private",
    icon: Lock,
    body: "Only you can see your profile. Organizations see it only when you apply, limited to what you choose to share.",
  },
];

const CONSENT_COPY: { key: keyof ConsentDraft; label: string; description: string }[] = [
  {
    key: "showInDirectory",
    label: "Show me in the member directory",
    description:
      "Signed-in members can find you when browsing members. Has no effect while your profile is private.",
  },
  {
    key: "recruiterContact",
    label: "Allow organizations to send me introductions",
    description:
      "Approved organizations can find you in talent discovery and send an introduction, even if you haven't applied. Requires directory listing, and you're hidden while your availability is “Not looking.” They never see your NPN or email this way.",
  },
  {
    key: "showLicenses",
    label: "Show my license records to signed-in viewers",
    description:
      "Signed-in members and organizations can see your self-reported license records on your profile. Never shown to public visitors. Organizations you apply to see licenses only if you include them in that application.",
  },
  {
    key: "shareNpnOnApply",
    label: "Allow sharing my NPN when I apply",
    description:
      "Your NPN is never shown publicly or to members. When this is on and you include it in an application, only that organization sees it. Turning it off also hides your NPN from organizations you've already applied to.",
  },
];

type Cell = { ok: boolean; text: string };

export default function SettingsPage() {
  const db = useDb();
  const user = useCurrentUser();
  const profile = useMemo(() => getProfile(db, user?.id), [db, user?.id]);
  const apps = useMemo(() => (user ? applicationsForApplicant(db, user.id) : []), [db, user]);

  const initialConsent = (): ConsentDraft => ({
    recruiterContact: profile?.consent.recruiterContact ?? false,
    showInDirectory: profile?.consent.showInDirectory ?? false,
    showLicenses: profile?.consent.showLicenses ?? false,
    shareNpnOnApply: profile?.consent.shareNpnOnApply ?? false,
  });
  const [visibility, setVisibility] = useState<ProfileVisibility>(profile?.visibility ?? "members");
  const [consent, setConsent] = useState<ConsentDraft>(initialConsent);

  const dirty =
    !!profile &&
    (visibility !== profile.visibility || (Object.keys(consent) as (keyof ConsentDraft)[]).some((k) => consent[k] !== profile.consent[k]));

  const matrix = useMemo(() => {
    const visibleToMembers = visibility !== "private";
    const visibleToPublic = visibility === "public";
    const discoverable = consent.showInDirectory && consent.recruiterContact && visibility !== "private" && profile?.availability !== "not_looking";
    const rows: { label: string; publicV: Cell; member: Cell; org: Cell }[] = [
      {
        label: "Your profile",
        publicV: { ok: visibleToPublic, text: visibleToPublic ? "Visible" : "Hidden" },
        member: { ok: visibleToMembers, text: visibleToMembers ? "Visible" : "Hidden" },
        org: { ok: true, text: "When you apply" },
      },
      {
        label: "License records",
        publicV: { ok: false, text: "Never" },
        member: { ok: visibleToMembers && consent.showLicenses, text: visibleToMembers && consent.showLicenses ? "Visible" : "Hidden" },
        org: { ok: true, text: "If you include them" },
      },
      {
        label: "NPN",
        publicV: { ok: false, text: "Never" },
        member: { ok: false, text: "Never" },
        org: { ok: consent.shareNpnOnApply, text: consent.shareNpnOnApply ? "If you include it" : "Never" },
      },
      {
        label: "Email",
        publicV: { ok: false, text: "Never" },
        member: { ok: false, text: "Never" },
        org: { ok: true, text: "If you include it" },
      },
      {
        label: "Talent discovery & introductions",
        publicV: { ok: false, text: "—" },
        member: { ok: false, text: "—" },
        org: { ok: discoverable, text: discoverable ? "Discoverable" : "Not discoverable" },
      },
    ];
    return rows;
  }, [visibility, consent, profile?.availability]);

  if (!user || !profile) {
    return <EmptyState icon={<ShieldCheck className="h-5 w-5" />} title="Settings unavailable" description="This demo account doesn't have a member profile." />;
  }

  const save = () => {
    const r = updateConsent(user, consent, visibility);
    toastResult(r, "Privacy settings saved", "Your choices apply immediately across the platform.");
  };
  const discard = () => {
    setVisibility(profile.visibility);
    setConsent(initialConsent());
  };

  return (
    <div className="pb-24">
      <PageHeader
        eyebrow="Account"
        title="Privacy & consent"
        description="You decide who sees your profile and what organizations receive. Nothing is shared automatically."
        actions={<span className="text-xs text-ink-3" suppressHydrationWarning>Last updated {formatDateTime(profile.consent.updatedAt)}</span>}
      />

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_340px] lg:items-start">
        <div className="min-w-0 space-y-6">
          {/* Visibility */}
          <Card>
            <CardHeader title="Profile visibility" description="Who can open your profile page." />
            <CardBody>
              <div role="radiogroup" aria-label="Profile visibility" className="grid gap-3 md:grid-cols-3">
                {VISIBILITY_OPTIONS.map((o) => {
                  const Icon = o.icon;
                  const active = visibility === o.value;
                  return (
                    <button
                      key={o.value}
                      type="button"
                      role="radio"
                      aria-checked={active}
                      onClick={() => setVisibility(o.value)}
                      className={cn(
                        "relative flex flex-col rounded-xl border p-4 text-left transition",
                        active ? "border-navy bg-navy-50/60 ring-1 ring-navy" : "border-line hover:border-line-strong hover:bg-subtle/50",
                      )}
                    >
                      <span className="flex items-center justify-between">
                        <span className={cn("flex h-8 w-8 items-center justify-center rounded-lg", active ? "bg-navy text-white" : "bg-subtle text-ink-3 ring-1 ring-line")}>
                          <Icon className="h-4 w-4" strokeWidth={1.75} />
                        </span>
                        <span className={cn("flex h-4 w-4 items-center justify-center rounded-full border", active ? "border-navy bg-navy" : "border-line-strong")}>
                          {active && <span className="h-1.5 w-1.5 rounded-full bg-white" />}
                        </span>
                      </span>
                      <span className="mt-3 text-sm font-semibold text-ink">{o.title}</span>
                      <span className="mt-1 text-xs leading-relaxed text-ink-3">{o.body}</span>
                    </button>
                  );
                })}
              </div>
            </CardBody>
          </Card>

          {/* Consent */}
          <Card>
            <CardHeader title="Consent preferences" description="Plain-language controls for exactly what's shared, and with whom." />
            <CardBody>
              <ul className="divide-y divide-line">
                {CONSENT_COPY.map((c) => (
                  <li key={c.key} className="py-4 first:pt-0 last:pb-0">
                    <Switch checked={consent[c.key]} onChange={(v) => setConsent((s) => ({ ...s, [c.key]: v }))} label={c.label} description={c.description} />
                  </li>
                ))}
              </ul>
              {consent.recruiterContact && !consent.showInDirectory && (
                <Notice tone="warning" className="mt-5">Introductions require directory listing. Turn on “Show me in the member directory” for organizations to find you.</Notice>
              )}
            </CardBody>
          </Card>

          {/* Data shared */}
          <Card>
            <CardHeader
              title="Data shared with organizations"
              description="What you chose to include with each application. Withdrawn applications no longer grant access to your profile."
            />
            {apps.length ? (
              <>
                <div className="mt-4 hidden overflow-x-auto border-t border-line md:block">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-subtle/60 text-xs text-ink-3">
                      <tr>
                        <th scope="col" className="px-6 py-2.5 font-medium">Application</th>
                        {["Email", "Licenses", "NPN", "Work history"].map((h) => (
                          <th key={h} scope="col" className="px-3 py-2.5 text-center font-medium">{h}</th>
                        ))}
                        <th scope="col" className="px-6 py-2.5 font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-line">
                      {apps.map((a) => {
                        const opp = db.opportunities.find((o) => o.id === a.opportunityId);
                        const org = db.organizations.find((o) => o.id === a.orgId);
                        const rows = shareRows(a.share, profile.consent.shareNpnOnApply);
                        return (
                          <tr key={a.id} className={cn("align-middle", a.withdrawn && "opacity-60")}>
                            <td className="px-6 py-3">
                              <Link href={`/me/applications/${a.id}`} className="font-medium text-ink hover:underline underline-offset-4">{opp?.title ?? "Opportunity"}</Link>
                              <div className="text-xs text-ink-3">{org?.name} · {formatDate(a.submittedAt)}</div>
                            </td>
                            {rows.map((r) => (
                              <td key={r.key} className="px-3 py-3 text-center" title={r.note}>
                                <ShareIcon shared={r.shared} label={r.label} />
                              </td>
                            ))}
                            <td className="px-6 py-3"><StageBadge stage={a.stage} audience="applicant" withdrawn={a.withdrawn} /></td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <ul className="mt-4 divide-y divide-line border-t border-line md:hidden">
                  {apps.map((a) => {
                    const opp = db.opportunities.find((o) => o.id === a.opportunityId);
                    const org = db.organizations.find((o) => o.id === a.orgId);
                    return (
                      <li key={a.id} className="px-5 py-4">
                        <div className="flex items-start justify-between gap-3">
                          <div className="min-w-0">
                            <Link href={`/me/applications/${a.id}`} className="text-sm font-medium text-ink">{opp?.title ?? "Opportunity"}</Link>
                            <div className="text-xs text-ink-3">{org?.name} · {formatDate(a.submittedAt)}</div>
                          </div>
                          <StageBadge stage={a.stage} audience="applicant" withdrawn={a.withdrawn} />
                        </div>
                        <ul className="mt-3 grid grid-cols-2 gap-2">
                          {shareRows(a.share, profile.consent.shareNpnOnApply).map((r) => (
                            <li key={r.key} className="flex items-center gap-2 text-xs text-ink-2">
                              <ShareIcon shared={r.shared} label={r.label} />
                              {r.label}
                            </li>
                          ))}
                        </ul>
                      </li>
                    );
                  })}
                </ul>
              </>
            ) : (
              <CardBody>
                <EmptyState compact icon={<ShieldCheck className="h-5 w-5" />} title="Nothing shared yet" description="You haven't applied anywhere, so no organization has received any of your data." />
              </CardBody>
            )}
          </Card>
        </div>

        {/* Side rail */}
        <aside className="min-w-0 space-y-6 lg:sticky lg:top-20">
          <Card>
            <CardHeader title="Who sees what" description="Based on the settings above (including unsaved changes)." />
            <CardBody className="pt-4">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="text-ink-3">
                    <tr>
                      <th scope="col" className="pb-2 pr-2 font-medium"><span className="sr-only">Information</span></th>
                      <th scope="col" className="pb-2 pr-2 font-medium">Public</th>
                      <th scope="col" className="pb-2 pr-2 font-medium">Members</th>
                      <th scope="col" className="pb-2 font-medium">Orgs</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {matrix.map((r) => (
                      <tr key={r.label} className="align-top">
                        <th scope="row" className="py-2.5 pr-2 font-medium text-ink-2">{r.label}</th>
                        {[r.publicV, r.member, r.org].map((c, i) => (
                          <td key={i} className="py-2.5 pr-2">
                            <span className={cn("inline-flex items-start gap-1", c.ok ? "text-ink" : "text-ink-4")}>
                              {c.ok ? <Check className="mt-px h-3 w-3 shrink-0 text-success" strokeWidth={2.5} /> : <Minus className="mt-px h-3 w-3 shrink-0" />}
                              {c.text}
                            </span>
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="mt-4 text-xs leading-relaxed text-ink-3">
                Want to check? <Link href="/me/profile" className="text-navy-600 hover:text-navy">Preview your profile</Link> as any viewer.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardHeader title="Your data" description="Account-level controls." />
            <CardBody className="space-y-3 pt-4">
              {[
                { icon: Download, label: "Download a copy of my data" },
                { icon: Trash2, label: "Delete my account" },
              ].map((x) => {
                const Icon = x.icon;
                return (
                  <div key={x.label} className="flex items-center justify-between gap-3 rounded-xl border border-line px-3.5 py-3">
                    <span className="flex items-center gap-2.5 text-[13px] text-ink-3"><Icon className="h-4 w-4 text-ink-4" />{x.label}</span>
                    <Button size="xs" variant="quiet" disabled aria-disabled title="Not available in prototype">Unavailable</Button>
                  </div>
                );
              })}
              <Badge tone="gold">Not available in prototype</Badge>
              <p className="text-xs leading-relaxed text-ink-3">
                Demo data lives only in this browser. A production version would provide data export and account deletion as required by applicable law.
              </p>
            </CardBody>
          </Card>

          <Card>
            <CardBody className="space-y-2">
              <div className="eyebrow mb-1">Policies</div>
              <Link href="/legal/privacy" className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink"><FileText className="h-3.5 w-3.5 text-ink-4" />Privacy policy (placeholder)</Link>
              <Link href="/legal/producer-consent" className="flex items-center gap-2 text-[13px] text-ink-2 hover:text-ink"><FileText className="h-3.5 w-3.5 text-ink-4" />Producer data consent (placeholder)</Link>
            </CardBody>
          </Card>
        </aside>
      </div>

      {/* Save bar */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-30 border-t border-line bg-surface/95 backdrop-blur-md transition lg:left-[264px]",
          dirty ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-full opacity-0",
        )}
        aria-hidden={!dirty}
      >
        <div className="mx-auto flex max-w-[1200px] flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between sm:px-6 lg:px-10">
          <span className="text-[13px] text-ink-2">You have unsaved privacy changes.</span>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={discard} tabIndex={dirty ? 0 : -1}>Discard</Button>
            <Button variant="accent" size="sm" onClick={save} tabIndex={dirty ? 0 : -1}>Save changes</Button>
          </div>
        </div>
      </div>
    </div>
  );
}
