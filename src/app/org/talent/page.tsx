"use client";

import { useMemo, useState } from "react";
import { Compass, MapPin, Send, ShieldCheck, SlidersHorizontal, UserRoundSearch } from "lucide-react";
import type { Availability, ExperienceLevel, Introduction, LineSlug, ProducerProfile, Sector } from "@/lib/data/types";
import { AVAILABILITY_LABEL, EXPERIENCE_LABEL, LINES_BY_SECTOR, SECTOR_LABEL, US_STATES, lineName } from "@/lib/data/taxonomy";
import { discoverableCandidates } from "@/lib/services/privacy";
import { introductionsForOrg, sendIntroduction } from "@/lib/services/talent";
import { opportunitiesForOrg } from "@/lib/services/opportunities";
import { OrgScope, OrgStatusNotice, type OrgContext } from "@/components/org/org-scope";
import { CharCount } from "@/components/org/form-bits";
import { personName } from "@/components/org/org-utils";
import { PageHeader } from "@/components/ui/page";
import { Avatar } from "@/components/ui/avatar";
import { Badge, Tag, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader } from "@/components/ui/card";
import { Dialog } from "@/components/ui/dialog";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { Field, Select, Textarea } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { relativeDay } from "@/lib/utils/dates";

const INTRO_TONE: Record<Introduction["status"], BadgeTone> = { sent: "navy", interested: "success", declined: "outline" };
const INTRO_LABEL: Record<Introduction["status"], string> = { sent: "Sent · awaiting reply", interested: "Interested", declined: "Declined" };

export default function TalentPage() {
  return <OrgScope>{(ctx) => <Talent {...ctx} />}</OrgScope>;
}

function Talent(ctx: OrgContext) {
  const { db, org } = ctx;
  const [line, setLine] = useState<LineSlug | "">("");
  const [state, setState] = useState("");
  const [exp, setExp] = useState<ExperienceLevel | "">("");
  const [avail, setAvail] = useState<Availability | "">("");
  const [target, setTarget] = useState<ProducerProfile | null>(null);

  const candidates = useMemo(() => {
    const team = new Set(db.users.filter((u) => u.orgId === org.id).map((u) => u.id));
    return discoverableCandidates(db).filter((p) => !team.has(p.userId));
  }, [db, org.id]);
  const intros = useMemo(() => introductionsForOrg(db, org.id), [db, org.id]);
  const latestIntro = useMemo(() => {
    const m = new Map<string, Introduction>();
    for (const i of intros) if (!m.has(i.userId)) m.set(i.userId, i);
    return m;
  }, [intros]);

  const filtered = candidates.filter(
    (p) =>
      (!line || p.specialties.includes(line)) &&
      (!state || p.state === state) &&
      (!exp || p.experienceLevel === exp) &&
      (!avail || p.availability === avail),
  );
  const anyFilter = !!(line || state || exp || avail);
  const approved = org.listingStatus === "approved";

  return (
    <div>
      <PageHeader
        eyebrow="Recruiting"
        title="Talent discovery"
        description="Find members who have explicitly opted in to hearing from organizations — and reach out with a personal introduction."
      />
      <OrgStatusNotice org={org} className="mb-4" />

      <div className="mb-6 grid gap-4 rounded-2xl border border-navy-100 bg-navy-50/60 p-5 sm:grid-cols-[auto_minmax(0,1fr)] sm:p-6">
        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-surface text-navy ring-1 ring-navy-100"><ShieldCheck className="h-5 w-5" strokeWidth={1.75} /></span>
        <div>
          <h2 className="text-[15px] font-semibold text-ink">Consent-based by design</h2>
          <p className="mt-1 max-w-3xl text-[13.5px] leading-relaxed text-ink-2">
            Only members who turned on <strong className="font-medium">recruiter contact</strong> and <strong className="font-medium">directory visibility</strong> appear here, and members can switch either off at any time.
            You see directory-safe details only — licenses, NPN and contact information are shared solely when a member applies and chooses to share them.
          </p>
        </div>
      </div>

      {!approved && (
        <Notice tone="info" className="mb-6" title="Introductions unlock after approval">
          You can browse candidates now. Sending introductions requires an approved organization profile.
        </Notice>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="min-w-0">
          <div className="mb-4 grid grid-cols-2 gap-2.5 md:grid-cols-4">
            <Select aria-label="Category" value={line} onChange={(e) => setLine(e.target.value as LineSlug | "")}>
              <option value="">All categories</option>
              {(Object.keys(LINES_BY_SECTOR) as Sector[]).map((sec) => (
                <optgroup key={sec} label={SECTOR_LABEL[sec]}>
                  {LINES_BY_SECTOR[sec].map((l) => <option key={l.slug} value={l.slug}>{l.name}</option>)}
                </optgroup>
              ))}
            </Select>
            <Select aria-label="State" value={state} onChange={(e) => setState(e.target.value)}>
              <option value="">All states</option>
              {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
            </Select>
            <Select aria-label="Experience level" value={exp} onChange={(e) => setExp(e.target.value as ExperienceLevel | "")}>
              <option value="">Any experience</option>
              {Object.entries(EXPERIENCE_LABEL).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </Select>
            <Select aria-label="Availability" value={avail} onChange={(e) => setAvail(e.target.value as Availability | "")}>
              <option value="">Any availability</option>
              <option value="actively_looking">{AVAILABILITY_LABEL.actively_looking}</option>
              <option value="open">{AVAILABILITY_LABEL.open}</option>
            </Select>
          </div>
          <div className="mb-4 flex items-center justify-between text-[13px] text-ink-3">
            <span className="inline-flex items-center gap-1.5"><SlidersHorizontal className="h-3.5 w-3.5" />{filtered.length} of {candidates.length} opted-in members</span>
            {anyFilter && (
              <button type="button" className="text-navy-600 hover:text-navy" onClick={() => { setLine(""); setState(""); setExp(""); setAvail(""); }}>Clear filters</button>
            )}
          </div>

          {filtered.length === 0 ? (
            <EmptyState
              icon={<UserRoundSearch className="h-5 w-5" strokeWidth={1.75} />}
              title={candidates.length === 0 ? "No members are open to contact right now" : "No members match these filters"}
              description={candidates.length === 0 ? "Members appear here only after opting in to recruiter contact." : "Try a broader category or state."}
            />
          ) : (
            <ul className="grid gap-3 md:grid-cols-2">
              {filtered.map((p) => {
                const name = personName(db, p.userId);
                const intro = latestIntro.get(p.userId);
                return (
                  <li key={p.userId}>
                    <Card className="flex h-full flex-col p-5">
                      <div className="flex items-start gap-3">
                        <Avatar name={name} tone={p.avatarTone} size={44} />
                        <div className="min-w-0 flex-1">
                          <h3 className="truncate text-[15px] font-semibold tracking-[-0.01em] text-ink">{name}</h3>
                          <p className="line-clamp-2 text-[13px] leading-snug text-ink-3">{p.headline}</p>
                        </div>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-ink-3">
                        <span className="inline-flex items-center gap-1"><MapPin className="h-3 w-3" />{p.city}, {p.state}</span>
                        <span>{EXPERIENCE_LABEL[p.experienceLevel]}</span>
                        <span className={p.availability === "actively_looking" ? "font-medium text-success" : undefined}>{AVAILABILITY_LABEL[p.availability]}</span>
                      </div>
                      {p.specialties.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-1.5">
                          {p.specialties.slice(0, 3).map((s) => <Tag key={s}>{lineName(s, true)}</Tag>)}
                          {p.specialties.length > 3 && <Tag>+{p.specialties.length - 3}</Tag>}
                        </div>
                      )}
                      <div className="mt-auto flex items-center justify-between gap-2 border-t border-line pt-3.5 mt-4">
                        {intro ? <Badge tone={INTRO_TONE[intro.status]}>{INTRO_LABEL[intro.status]}</Badge> : <span className="text-xs text-ink-4">Not contacted</span>}
                        <Button size="sm" variant={intro?.status === "sent" ? "ghost" : "secondary"} disabled={!approved || intro?.status === "sent"} onClick={() => setTarget(p)}>
                          <Send className="h-3.5 w-3.5" /> {intro?.status === "sent" ? "Introduced" : "Send introduction"}
                        </Button>
                      </div>
                    </Card>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <aside>
          <Card>
            <CardHeader title="Introductions sent" description="Members reply from their workspace." />
            <div className="px-5 pb-5 pt-4 sm:px-6">
              {intros.length === 0 ? (
                <EmptyState compact icon={<Compass className="h-5 w-5" strokeWidth={1.75} />} title="No introductions yet" description="Introductions you send appear here with their status." />
              ) : (
                <ul className="space-y-3">
                  {intros.map((i) => {
                    const opp = i.opportunityId ? db.opportunities.find((o) => o.id === i.opportunityId) : undefined;
                    return (
                      <li key={i.id} className="rounded-xl border border-line px-3.5 py-3">
                        <div className="flex items-center justify-between gap-2">
                          <span className="truncate text-[13.5px] font-medium text-ink">{personName(db, i.userId)}</span>
                          <Badge tone={INTRO_TONE[i.status]}>{i.status === "sent" ? "Sent" : INTRO_LABEL[i.status]}</Badge>
                        </div>
                        {opp && <div className="mt-0.5 truncate text-xs text-ink-3">Re: {opp.title}</div>}
                        <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-ink-3">{i.message}</p>
                        <div className="mt-1.5 text-[11px] text-ink-4">{personName(db, i.senderId)} · {relativeDay(i.createdAt)}</div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </Card>
        </aside>
      </div>

      <IntroDialog ctx={ctx} profile={target} onClose={() => setTarget(null)} />
    </div>
  );
}

function IntroDialog({ ctx, profile, onClose }: { ctx: OrgContext; profile: ProducerProfile | null; onClose: () => void }) {
  const { db, user, org } = ctx;
  const [message, setMessage] = useState("");
  const [oppId, setOppId] = useState("");
  const [error, setError] = useState<string>();
  const published = useMemo(() => opportunitiesForOrg(db, org.id).filter((o) => o.status === "published"), [db, org.id]);
  const name = profile ? personName(db, profile.userId) : "";

  const close = () => {
    setMessage("");
    setOppId("");
    setError(undefined);
    onClose();
  };

  const send = () => {
    if (!profile) return;
    if (message.trim().length < 20) return setError("Write a short, personal note (at least 20 characters).");
    const r = sendIntroduction(user, org.id, profile.userId, message, oppId || undefined);
    if (r.ok) {
      toast("Introduction sent", { body: `${name} can reply as interested or decline. No contact details are shared until they choose to.` });
      close();
    } else setError(r.error);
  };

  return (
    <Dialog
      open={!!profile}
      onClose={close}
      title={`Introduce ${org.name}`}
      description={profile ? `To ${name}. Be specific about why you're reaching out — members can decline, and repeated unsolicited outreach may be reported.` : undefined}
      footer={
        <>
          <Button variant="ghost" size="sm" onClick={close}>Cancel</Button>
          <Button variant="accent" size="sm" onClick={send}><Send className="h-3.5 w-3.5" /> Send introduction</Button>
        </>
      }
    >
      <div className="space-y-4">
        <Field id="intro-msg" label="Message" error={error}>
          <Textarea id="intro-msg" value={message} onChange={(e) => { setMessage(e.target.value); setError(undefined); }} maxLength={1200} className="min-h-[130px]" placeholder="Hi — your work in commercial lines caught our attention. We're growing our construction practice and would welcome a no-pressure conversation…" />
          <div className="mt-1 flex justify-between gap-3">
            <span className="text-[11.5px] text-ink-4">No income claims or guarantees.</span>
            <CharCount value={message} min={20} max={1200} />
          </div>
        </Field>
        <Field id="intro-opp" label="Related opportunity" optional hint={published.length ? undefined : "You have no published listings yet."}>
          <Select id="intro-opp" value={oppId} onChange={(e) => setOppId(e.target.value)} disabled={!published.length}>
            <option value="">General introduction</option>
            {published.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
          </Select>
        </Field>
      </div>
    </Dialog>
  );
}
