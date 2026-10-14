"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ExternalLink, GraduationCap, Inbox, Mail, ShieldCheck } from "lucide-react";
import type { PortalInterest, PortalShowcase } from "@/lib/data/types";
import { OrgScope, OrgStatusNotice, type OrgContext } from "@/components/org/org-scope";
import { StateMultiSelect } from "@/components/org/form-bits";
import { interestsForOrg, setInterestStatus, updatePortalShowcase } from "@/lib/services/portal";
import { viewProfile } from "@/lib/services/privacy";
import { can } from "@/lib/auth/permissions";
import { EXPERIENCE_LABEL, lineName } from "@/lib/data/taxonomy";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Avatar } from "@/components/ui/avatar";
import { Badge, Tag, type BadgeTone } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Field, Input, ListEditor, Switch, Textarea } from "@/components/ui/form";
import { Tabs } from "@/components/ui/tabs";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { UnverifiedLicenseBadge } from "@/components/domain/badges";
import { toast } from "@/components/ui/toast";
import { relativeDay } from "@/lib/utils/dates";

const TONE: Record<PortalInterest["status"], BadgeTone> = { sent: "navy", viewed: "neutral", contacted: "success", closed: "outline" };
const LABEL: Record<PortalInterest["status"], string> = { sent: "New", viewed: "Viewed", contacted: "Responded", closed: "Closed" };

export default function OrgPortalPage() {
  return <OrgScope>{(ctx) => <Portal {...ctx} />}</OrgScope>;
}

function emptyShowcase(): PortalShowcase {
  return { participating: false, headline: "", whyJoin: ["", ""], firstYear: "", idealFor: ["Newly licensed"], statesHiring: [], licensingSupport: "" };
}

function Portal({ db, user, org }: OrgContext) {
  const [tab, setTab] = useState<"inbox" | "showcase">("inbox");
  const [filter, setFilter] = useState<"open" | "all">("open");
  const interests = useMemo(() => interestsForOrg(db, org.id), [db, org.id]);
  const shown = filter === "open" ? interests.filter((i) => i.status !== "closed") : interests;
  const canEdit = can(user, "org:edit_profile");
  const [draft, setDraft] = useState<PortalShowcase>(() => structuredClone(org.portal ?? emptyShowcase()));

  const act = (id: string, status: PortalInterest["status"], msg: string) => {
    const r = setInterestStatus(user, id, status);
    if (r.ok) toast(msg);
    else toast("Couldn't update", { body: r.error, tone: "error" });
  };

  return (
    <div>
      <PageHeader
        eyebrow="New Producer Portal"
        title="Newly licensed talent"
        description="Members who raised their hand to your company in the curated New Producer Portal. Each introduction includes only the profile details the member chose to share."
        actions={<ButtonLink href="/launch" variant="secondary" target="_blank"><ExternalLink className="h-4 w-4" />View the portal</ButtonLink>}
      />
      <OrgStatusNotice org={org} className="mb-6" />
      <Tabs
        className="mb-6"
        value={tab}
        onChange={setTab}
        items={[
          { value: "inbox", label: "Introductions", count: interests.filter((i) => i.status === "sent").length },
          { value: "showcase", label: "Your showcase" },
        ]}
      />

      {tab === "inbox" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex gap-1 rounded-lg border border-line bg-subtle p-0.5 text-[13px]">
              {(["open", "all"] as const).map((f) => (
                <button key={f} type="button" aria-pressed={filter === f} onClick={() => setFilter(f)} className={filter === f ? "rounded-md bg-surface px-2.5 py-1 font-medium shadow-card" : "px-2.5 py-1 text-ink-3"}>
                  {f === "open" ? "Open" : "All"}
                </button>
              ))}
            </div>
            <span className="flex items-center gap-1.5 text-xs text-ink-3"><ShieldCheck className="h-3.5 w-3.5" />Shared with consent</span>
          </div>
          {!org.portal?.participating && <Notice tone="info" title="Your company isn't listed in the portal">Turn on participation under “Your showcase” to appear to newly licensed members.</Notice>}
          {shown.length === 0 ? (
            <EmptyState icon={<Inbox className="h-5 w-5" />} title="No introductions yet" description="When newly licensed members express interest in your company, they'll appear here." />
          ) : (
            shown.map((i) => {
              const member = db.users.find((u) => u.id === i.userId);
              const profile = db.profiles.find((p) => p.userId === i.userId);
              if (!member || !profile) return null;
              const view = viewProfile(db, user, profile);
              return (
                <Card key={i.id}>
                  <CardBody className="flex flex-col gap-5 lg:flex-row">
                    <div className="flex min-w-0 flex-1 gap-4">
                      <Avatar name={member.name} tone={profile.avatarTone} size={48} />
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="text-[15px] font-semibold">{member.name}</span>
                          <Badge tone={TONE[i.status]}>{LABEL[i.status]}</Badge>
                          <span className="text-xs text-ink-4" suppressHydrationWarning>{relativeDay(i.createdAt)}</span>
                        </div>
                        <div className="mt-0.5 text-[13px] text-ink-3">{profile.headline} · {profile.city}, {profile.state} · {EXPERIENCE_LABEL[profile.experienceLevel]}</div>
                        <blockquote className="mt-3 border-l-2 border-gold-200 pl-3 text-[14px] leading-relaxed text-ink-2">{i.note}</blockquote>
                        <div className="mt-3 flex flex-wrap gap-1.5">{profile.specialties.slice(0, 4).map((l) => <Tag key={l}>{lineName(l, true)}</Tag>)}</div>
                        {view.showLicenses && view.licenses.length > 0 && (
                          <ul className="mt-3 space-y-1">
                            {view.licenses.map((l) => (
                              <li key={l.id} className="flex flex-wrap items-center gap-2 text-[12.5px] text-ink-2">
                                {l.state} · {l.linesOfAuthority.join(", ")} <UnverifiedLicenseBadge compact />
                              </li>
                            ))}
                          </ul>
                        )}
                        {view.email && <div className="mt-2 flex items-center gap-1.5 text-[12.5px] text-ink-3"><Mail className="h-3.5 w-3.5" />{view.email}</div>}
                        {view.hidden.length > 0 && <p className="mt-2 text-xs text-ink-4">{view.hidden.join(" ")}</p>}
                      </div>
                    </div>
                    <div className="flex shrink-0 flex-row flex-wrap gap-2 lg:w-44 lg:flex-col">
                      {i.status === "sent" && <Button size="sm" variant="secondary" onClick={() => act(i.id, "viewed", "Marked as viewed")}>Mark viewed</Button>}
                      {(i.status === "sent" || i.status === "viewed") && <Button size="sm" variant="accent" onClick={() => act(i.id, "contacted", `${member.name.split(" ")[0]} was notified that you responded`)}>Respond</Button>}
                      {i.status !== "closed" && <Button size="sm" variant="ghost" onClick={() => act(i.id, "closed", "Introduction closed")}>Close</Button>}
                      <ButtonLink size="sm" variant="ghost" href={`/people/${member.id}`}>View profile</ButtonLink>
                    </div>
                  </CardBody>
                </Card>
              );
            })
          )}
          <p className="text-xs text-ink-4">Demo: responding only notifies the member inside this prototype. No email or message is sent.</p>
        </div>
      ) : (
        <Card>
          <CardHeader title="Portal showcase" description="How your company appears to newly licensed members in the New Producer Portal. Participation is reviewed; it is not ranked by payment." />
          <CardBody className="space-y-5">
            {!canEdit && <Notice tone="info">Only organization admins can edit the showcase.</Notice>}
            <fieldset disabled={!canEdit} className="space-y-5">
              <Switch checked={draft.participating} onChange={(v) => setDraft({ ...draft, participating: v })} label="Participate in the New Producer Portal" description="Show your company to newly licensed and soon-to-be-licensed members." />
              <Field label="Headline" id="sc-h" hint="One line, no income claims — e.g. “Your first year, with a mentor behind you.”">
                <Input id="sc-h" value={draft.headline} onChange={(e) => setDraft({ ...draft, headline: e.target.value })} />
              </Field>
              <Field label="Why new producers join">
                <ListEditor value={draft.whyJoin} onChange={(v) => setDraft({ ...draft, whyJoin: v })} addLabel="Add reason" />
              </Field>
              <Field label="What the first year looks like" id="sc-fy">
                <Textarea id="sc-fy" value={draft.firstYear} onChange={(e) => setDraft({ ...draft, firstYear: e.target.value })} />
              </Field>
              <Field label="Licensing support" id="sc-ls">
                <Input id="sc-ls" value={draft.licensingSupport} onChange={(e) => setDraft({ ...draft, licensingSupport: e.target.value })} />
              </Field>
              <Field label="Ideal for">
                <ListEditor value={draft.idealFor} onChange={(v) => setDraft({ ...draft, idealFor: v })} addLabel="Add audience" />
              </Field>
              <Field label="States hiring">
                <StateMultiSelect value={draft.statesHiring} onChange={(v) => setDraft({ ...draft, statesHiring: v })} />
              </Field>
            </fieldset>
            <div className="flex items-center justify-between border-t border-line pt-4">
              <Link href="/launch" className="inline-flex items-center gap-1.5 text-sm text-navy-600 hover:text-navy"><GraduationCap className="h-4 w-4" />Preview in the portal</Link>
              <Button
                disabled={!canEdit}
                onClick={() => {
                  const r = updatePortalShowcase(user, org.id, draft);
                  if (r.ok) toast("Showcase saved");
                  else toast("Couldn't save", { body: r.error, tone: "error" });
                }}
              >
                Save showcase
              </Button>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
