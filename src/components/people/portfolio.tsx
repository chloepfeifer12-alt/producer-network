"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, ArrowRight, ArrowUpRight, Award, Building2, ChevronDown, Eye, Heart, Lock, MapPin, MessageCircle, MessageSquare, Pencil, Search, ShieldCheck, UserX,
} from "lucide-react";
import type { Database, ProducerProfile, User } from "@/lib/data/types";
import { EXPERIENCE_LABEL, LINE_BY_SLUG, TOPIC_LABEL, stateName } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can, ROLE_LABEL } from "@/lib/auth/permissions";
import { viewProfile, type ProfileView } from "@/lib/services/privacy";
import { feedPosts } from "@/lib/services/network";
import { SECTION_LABEL } from "@/lib/services/insider";
import { Kicker } from "@/components/editorial";
import { CoverArt } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { Avatar, AvatarStack } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button, ButtonLink } from "@/components/ui/button";
import { Input } from "@/components/ui/form";
import { Segmented } from "@/components/ui/tabs";
import { UnverifiedLicenseBadge } from "@/components/domain/badges";
import { LineIcon } from "@/components/ui/line-icon";
import { ConnectionAction } from "@/components/network/connection-action";
import { AvailabilityDot } from "@/components/network/member-card";
import { MessagePlaceholderDialog } from "@/components/network/message-dialog";
import { ASPIRING_STAGE_LABEL, locationLabel, personInfo, relativeTime } from "@/components/network/people";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { pluralize } from "@/lib/utils/format";
import { MentorAction } from "./mentorship";
import { PersonaChoices } from "./join-prompt";
import { coverFor, featuresOf, firstName, mutualPeople, peopleHref, sharedReason, yearsLabel } from "./people-data";

const WRAP = "mx-auto w-full max-w-[1320px] px-4 sm:px-6 lg:px-8";

type Preview = "members" | "visitors" | "owner";

export function PersonPortfolio({ id }: { id: string }) {
  const db = useDb();
  const viewer = useCurrentUser();
  const target = useMemo(() => db.users.find((u) => u.id === id), [db, id]);
  const profile = useMemo(() => db.profiles.find((p) => p.userId === id), [db, id]);
  const isSelf = !!viewer && viewer.id === id;
  const [preview, setPreview] = useState<Preview>("members");

  const view = useMemo(() => {
    if (!profile) return null;
    if (!isSelf || !viewer) return viewProfile(db, viewer, profile);
    if (preview === "owner") return viewProfile(db, viewer, profile);
    if (preview === "visitors") return viewProfile(db, null, profile);
    // Preview as another signed-in member: same rules, a viewer who isn't the owner.
    return viewProfile(db, { ...viewer, id: "__member_preview__" }, profile);
  }, [db, viewer, profile, isSelf, preview]);

  if (!target || target.kind === "admin") return <NotFound />;
  if (target.kind === "organization") return <OrgPerson db={db} viewer={viewer} target={target} />;
  if (!profile || !view) {
    return <Unavailable name={target.name} title="This profile isn't set up yet" reasons={[`${firstName(target.name)} hasn't created a professional profile.`]} signedIn={!!viewer} />;
  }

  const previewBar = isSelf ? <SelfPreviewBar preview={preview} onChange={setPreview} profile={profile} /> : null;

  if (!view.visible) {
    return (
      <>
        {previewBar}
        <Unavailable
          name={isSelf ? target.name : undefined}
          title={
            isSelf
              ? "Visitors see a private notice"
              : !viewer && profile.visibility === "members"
                ? "This portfolio is shared with members only"
                : "This profile isn't available"
          }
          reasons={view.hidden}
          signedIn={!!viewer}
        />
      </>
    );
  }

  return (
    <>
      {previewBar}
      <Portfolio db={db} viewer={viewer} target={target} profile={profile} view={view} preview={isSelf ? preview : undefined} />
    </>
  );
}

/* ------------------------------------------------------------------ */
/* Self preview                                                        */
/* ------------------------------------------------------------------ */

function SelfPreviewBar({ preview, onChange, profile }: { preview: Preview; onChange: (p: Preview) => void; profile: ProducerProfile }) {
  const note: Record<Preview, string> = {
    members: "Viewing as public: this is your portfolio as other members see it.",
    visitors: profile.visibility === "public" ? "Viewing as public: this is what visitors who aren't signed in see." : "Viewing as public: visitors who aren't signed in see this.",
    owner: "Everything on your profile, including fields only you can see. Your NPN and email never appear on People.",
  };
  return (
    <div className="border-b border-line bg-navy-50/70">
      <div className={cn(WRAP, "flex flex-col gap-3 py-3 sm:flex-row sm:items-center sm:justify-between")}>
        <p className="flex items-center gap-2 text-[13px] text-navy-700">
          <Eye className="h-4 w-4 shrink-0" strokeWidth={1.75} />
          <span>{note[preview]}</span>
        </p>
        <div className="flex flex-wrap items-center gap-2">
          <Segmented
            ariaLabel="Preview your profile as"
            value={preview}
            onChange={onChange}
            items={[
              { value: "members", label: "Members" },
              { value: "visitors", label: "Visitors" },
              { value: "owner", label: "Only you" },
            ]}
          />
          <ButtonLink href="/me/profile" variant="primary" size="sm">
            <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit profile
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Portfolio                                                           */
/* ------------------------------------------------------------------ */

function Section({ kicker, children, className, id }: { kicker: ReactNode; children: ReactNode; className?: string; id?: string }) {
  return (
    <section className={cn("animate-rise", className)} aria-labelledby={id}>
      <Kicker className="mb-6"><span id={id}>{kicker}</span></Kicker>
      {children}
    </section>
  );
}

function RailBlock({ title, children, className }: { title: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={cn("border-t border-line pt-5", className)}>
      <h2 className="mb-3.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{title}</h2>
      {children}
    </div>
  );
}

/** Secondary material, closed by default so the portfolio reads first. */
function More({ label, summary, children }: { label: string; summary?: string; children: ReactNode }) {
  return (
    <details className="group/more border-t border-line pt-5">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 [&::-webkit-details-marker]:hidden">
        <span>
          <span className="block text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3 group-hover/more:text-ink">{label}</span>
          {summary && <span className="mt-1 block text-[13px] text-ink-3">{summary}</span>}
        </span>
        <ChevronDown className="h-4 w-4 shrink-0 text-ink-3 transition group-open/more:rotate-180" strokeWidth={1.75} />
      </summary>
      <div className="mt-6">{children}</div>
    </details>
  );
}

function Paras({ text }: { text: string }) {
  const paras = text.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  const [lead, ...rest] = paras;
  if (!lead) return null;
  // The first paragraph reads as an editorial lede; split a long single paragraph after its first sentence.
  const m = rest.length === 0 ? lead.match(/^([\s\S]{60,}?[.!?])\s+([\s\S]+)$/) : null;
  const ledeText = m ? m[1]! : lead;
  const body = m ? [m[2]!] : rest;
  return (
    <div className="max-w-[68ch]">
      <p className="font-display text-[19px] leading-[1.5] text-ink sm:text-[20px]">{ledeText}</p>
      {body.map((p, i) => (
        <p key={i} className="mt-4 whitespace-pre-line text-[15px] leading-[1.75] text-ink-2">{p}</p>
      ))}
    </div>
  );
}

function Portfolio({ db, viewer, target, profile, view, preview }: { db: Database; viewer: User | null; target: User; profile: ProducerProfile; view: ProfileView; preview?: Preview }) {
  const isSelf = !!preview;
  const actingViewer = isSelf ? null : viewer;
  const cover = coverFor(target.id);
  const first = firstName(target.name);
  const [messageOpen, setMessageOpen] = useState(false);

  const mine = useMemo(() => (actingViewer ? db.profiles.find((p) => p.userId === actingViewer.id) : undefined), [db, actingViewer]);
  const shared = useMemo(() => (mine ? profile.specialties.filter((s) => mine.specialties.includes(s)) : []), [mine, profile.specialties]);
  const mutuals = useMemo(() => (actingViewer ? mutualPeople(db, actingViewer.id, target.id) : []), [db, actingViewer, target.id]);
  const posts = useMemo(() => feedPosts(db).filter((p) => p.authorId === target.id).slice(0, 3), [db, target.id]);
  const features = useMemo(() => featuresOf(db, target.id), [db, target.id]);
  const groups = useMemo(() => {
    if (preview === "visitors") return [];
    if (isSelf) return db.groups.filter((g) => g.memberIds.includes(target.id));
    if (!actingViewer) return [];
    return db.groups.filter((g) => g.memberIds.includes(target.id) && g.memberIds.includes(actingViewer.id));
  }, [db, isSelf, preview, actingViewer, target.id]);
  const groupTotal = useMemo(() => db.groups.filter((g) => g.memberIds.includes(target.id)).length, [db, target.id]);

  const showMembersOnly = !!actingViewer || (isSelf && preview !== "visitors");
  const canMessage = !!actingViewer && can(actingViewer, "network:participate");
  const reason = sharedReason(shared);
  const hasRecognition = profile.accomplishments.length + profile.awards.length > 0;
  const hasEducation = profile.education.length + profile.certifications.length > 0;
  const activitySummary = [
    features.length > 0 ? pluralize(features.length, "Insider feature") : undefined,
    posts.length > 0 ? pluralize(posts.length, "recent post") : "No recent posts",
  ].filter(Boolean).join(" · ");

  return (
    <article>
      {/* Cover band */}
      <div className="relative h-24 overflow-hidden border-b border-line bg-subtle sm:h-[136px]">
        <CoverArt seed={target.id} variant={cover.variant} hue={cover.hue} ground={cover.ground} className="opacity-20 saturate-50" />
        <div className="absolute inset-x-0 top-0">
          <div className={cn(WRAP, "pt-4")}>
            <Link href="/people" className="inline-flex items-center gap-1.5 rounded-full bg-canvas/85 px-3 py-1.5 text-[12.5px] font-medium text-ink-2 ring-1 ring-line backdrop-blur hover:text-ink">
              <ArrowLeft className="h-3.5 w-3.5" /> People
            </Link>
          </div>
        </div>
      </div>

      {/* Masthead */}
      <header className={WRAP}>
        <div className="relative z-10 -mt-10 sm:-mt-12">
          <Avatar name={target.name} tone={profile.avatarTone} size={96} className="hidden ring-4 ring-canvas sm:inline-flex" />
          <Avatar name={target.name} tone={profile.avatarTone} size={80} className="ring-4 ring-canvas sm:hidden" />
        </div>

        <div className="mt-5 max-w-3xl animate-rise">
          <h1 className="font-display text-[34px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[44px]">{target.name}</h1>
          <p className="mt-2 text-[16px] leading-relaxed text-ink-2 sm:text-[17px]">{profile.headline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-3">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />{locationLabel(profile)}</span>
            <span>{yearsLabel(profile.yearsInIndustry)}</span>
            {["leadership", "newly_licensed", "no_license"].includes(profile.experienceLevel) && <span>{EXPERIENCE_LABEL[profile.experienceLevel]}</span>}
            <AvailabilityDot value={profile.availability} className="text-[13px]" />
          </div>
          {(reason || mutuals.length > 0) && (
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
              {mutuals.length > 0 && (
                <span className="inline-flex items-center gap-2 text-[13px] text-ink-2">
                  <AvatarStack people={mutuals.map((u) => ({ name: u.name, tone: db.profiles.find((p) => p.userId === u.id)?.avatarTone }))} size={22} max={3} />
                  {pluralize(mutuals.length, "mutual connection")}
                </span>
              )}
              {reason && <span className="text-[13px] font-medium text-navy-600">{reason}</span>}
            </div>
          )}
          {!isSelf && (
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <ConnectionAction otherId={target.id} otherName={target.name} size="sm" variant="primary" allowWithdraw visitorPrompt />
              <MentorAction mentorId={target.id} mentorName={target.name} mentor={profile.mentor} size="sm" onlyWhenAvailable />
              {canMessage && (
                <>
                  <Button variant="ghost" size="sm" onClick={() => setMessageOpen(true)}>
                    <MessageSquare className="h-4 w-4" strokeWidth={1.75} /> <span className="sr-only sm:not-sr-only">Message</span>
                  </Button>
                  <MessagePlaceholderDialog open={messageOpen} onClose={() => setMessageOpen(false)} name={target.name} />
                </>
              )}
            </div>
          )}
        </div>
      </header>

      {/* Two-column portfolio */}
      <div className={cn(WRAP, "mt-10")}>
      <div className="grid grid-cols-1 gap-x-16 gap-y-14 border-t border-line pb-24 pt-10 lg:grid-cols-12">
        <div className="min-w-0 space-y-14 lg:col-span-8">
          <Section kicker="About" id="about-h">
            {profile.bio.trim() ? <Paras text={profile.bio} /> : <p className="text-[15px] text-ink-3">{isSelf ? "You haven't written a bio yet." : `${first} hasn't written a bio yet.`}</p>}
            {profile.aspiring && (
              <div className="mt-8 grid gap-6 border-y border-line py-6 sm:grid-cols-[auto_1fr]">
                <div>
                  <div className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Licensing journey</div>
                  <div className="mt-1.5 font-display text-[22px] text-ink">{ASPIRING_STAGE_LABEL[profile.aspiring.stage]}</div>
                  {profile.aspiring.targetDate && <div className="mt-0.5 text-[13px] text-ink-3">Target: {profile.aspiring.targetDate}</div>}
                </div>
                <div className="sm:border-l sm:border-line sm:pl-6">
                  {profile.aspiring.motivation && <p className="font-display text-[18px] italic leading-snug text-ink">&ldquo;{profile.aspiring.motivation}&rdquo;</p>}
                  {profile.aspiring.targetLines.length > 0 && (
                    <p className="mt-2 text-[13px] text-ink-3">Working toward {profile.aspiring.targetLines.map((l) => LINE_BY_SLUG[l]?.name ?? l).join(", ")}</p>
                  )}
                </div>
              </div>
            )}
          </Section>

          {profile.experience.length > 0 && (
            <Section kicker="Career history" id="career-h">
              {view.showExperience ? (
                <ol className="relative">
                  {profile.experience.map((e, i) => (
                    <li key={e.id} className="relative grid gap-1 pb-10 last:pb-0 sm:grid-cols-[9rem_1fr] sm:gap-8">
                      <div className="text-[13px] tabular-nums text-ink-3 sm:pt-1 sm:text-right">
                        {e.start} – {e.end ?? <span className="text-ink">Present</span>}
                      </div>
                      <div className="relative border-l border-line pl-6">
                        <span className={cn("absolute -left-[5px] top-2 h-[9px] w-[9px] rounded-full ring-4 ring-canvas", i === 0 && !e.end ? "bg-navy" : "bg-line-strong")} aria-hidden />
                        <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink">{e.title}</h3>
                        <div className="mt-0.5 text-[14px] text-ink-3">{e.organization}</div>
                        {e.description && <p className="mt-3 max-w-[64ch] text-[14.5px] leading-[1.7] text-ink-2">{e.description}</p>}
                      </div>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="text-[14px] text-ink-3">{first}&apos;s work history wasn&apos;t shared with you.</p>
              )}
            </Section>
          )}

          {hasRecognition && (
            <Section kicker="Accomplishments & recognition" id="acc-h">
              {profile.accomplishments.length > 0 && (
                <ul className="divide-y divide-line border-y border-line">
                  {profile.accomplishments.map((a) => (
                    <li key={a.id} className="grid gap-1 py-5 sm:grid-cols-[4rem_1fr] sm:gap-6">
                      <div className="text-[13px] tabular-nums text-ink-3 sm:pt-0.5">{a.year ?? ""}</div>
                      <div>
                        <h3 className="text-[15.5px] font-semibold tracking-[-0.01em] text-ink">{a.title}</h3>
                        {a.description && <p className="mt-1.5 max-w-[64ch] text-[14.5px] leading-[1.7] text-ink-2">{a.description}</p>}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
              {profile.awards.length > 0 && (
                <ul className={cn("divide-y divide-line border-y border-line", profile.accomplishments.length > 0 && "mt-8")}>
                  {profile.awards.map((a) => (
                    <li key={a.id} className="flex items-start gap-4 py-4">
                      <Award className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" strokeWidth={1.5} />
                      <div className="min-w-0 flex-1">
                        <div className="text-[15px] font-medium text-ink">{a.title}</div>
                        <div className="mt-0.5 text-[13px] text-ink-3">{a.issuer}</div>
                      </div>
                      {a.year && <div className="text-[13px] tabular-nums text-ink-3">{a.year}</div>}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-4 text-xs text-ink-4">Accomplishments and awards are self-reported by the member.</p>
            </Section>
          )}

          {hasEducation && (
            <Section kicker="Education & certifications" id="edu-h">
              <div className="grid gap-10 sm:grid-cols-2">
                {profile.education.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-[13px] font-medium text-ink-3">Education</h3>
                    <ul className="space-y-4">
                      {profile.education.map((e) => (
                        <li key={e.id}>
                          <div className="text-[15px] font-medium text-ink">{e.credential}</div>
                          <div className="mt-0.5 text-[13px] text-ink-3">{e.institution}{e.year ? ` · ${e.year}` : ""}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                {profile.certifications.length > 0 && (
                  <div>
                    <h3 className="mb-3 text-[13px] font-medium text-ink-3">Certifications &amp; designations</h3>
                    <ul className="space-y-4">
                      {profile.certifications.map((c) => (
                        <li key={c.id}>
                          <div className="flex flex-wrap items-baseline gap-x-2">
                            <span className="text-[15px] font-medium text-ink">{c.name}</span>
                            {c.status === "in_progress" && <span className="text-[12px] font-medium text-gold-ink">In progress</span>}
                          </div>
                          <div className="mt-0.5 text-[13px] text-ink-3">{c.issuer}{c.year ? ` · ${c.year}` : ""}</div>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
              <p className="mt-6 text-xs text-ink-4">Education and certifications are self-reported and have not been verified by the platform.</p>
            </Section>
          )}

          {view.showLicenses && (
            <Section kicker="Licenses & registrations" id="lic-h">
              {view.licenses.length === 0 ? (
                <p className="text-[14px] text-ink-3">No license records added{profile.aspiring ? " yet; still working toward licensing" : ""}.</p>
              ) : (
                <>
                  <ul className="divide-y divide-line border-y border-line">
                    {view.licenses.map((l) => (
                      <li key={l.id} className="flex flex-col gap-2 py-4 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-[15px] font-medium text-ink">
                            {stateName(l.state)} <span className="font-normal text-ink-3">· {l.residency === "resident" ? "Resident" : "Non-resident"}</span>
                          </div>
                          <div className="mt-0.5 text-[13px] text-ink-3">{l.linesOfAuthority.join(", ") || "Lines not specified"} · Reported {l.status}</div>
                        </div>
                        <UnverifiedLicenseBadge />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 max-w-[68ch] text-xs leading-relaxed text-ink-3">
                    License details are entered by the member and have not been verified by the platform. Confirm licensing with the applicable state
                    department of insurance.
                  </p>
                </>
              )}
            </Section>
          )}

          <More label={isSelf ? "Your networking activity" : `Networking activity`} summary={activitySummary}>
            {features.length > 0 && (
              <div className="mb-10">
                <h3 className="mb-2 text-[13px] font-medium text-ink-3">Featured in The Insider <span className="text-ink-4">· fictional editorial</span></h3>
                <ul className="divide-y divide-line border-t border-line">
                  {features.map((a) => (
                    <li key={a.id} className="group relative py-4">
                      <div className="text-[12px] text-ink-4">{SECTION_LABEL[a.section]} · {formatDate(a.publishedAt)}</div>
                      <h4 className="mt-0.5 font-display text-[18px] leading-snug text-ink">
                        <Link href={`/insider/${a.slug}`} className="after:absolute after:inset-0 after:content-[''] group-hover:text-navy-600">{a.title}</Link>
                      </h4>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            <h3 className="mb-2 text-[13px] font-medium text-ink-3">{isSelf ? "Your recent posts" : `Recent posts by ${first}`}</h3>
            {posts.length === 0 ? (
              <p className="border-t border-line pt-4 text-[14px] text-ink-3">
                {isSelf ? "You haven't posted yet. " : `${first} hasn't posted in the network yet.`}
                {isSelf && <Link href="/network/conversations" className="text-navy-600 hover:underline">Start a discussion</Link>}
              </p>
            ) : (
              <ul className="divide-y divide-line border-t border-line">
                {posts.map((p) => {
                  const group = p.groupId ? db.groups.find((g) => g.id === p.groupId) : undefined;
                  return (
                    <li key={p.id} className="py-5">
                      <div className="text-[11.5px] font-medium uppercase tracking-[0.1em] text-ink-4">
                        {TOPIC_LABEL[p.topic]}{group && <> · {group.name}</>} · {relativeTime(p.createdAt)}
                      </div>
                      <p className="mt-2 line-clamp-3 max-w-[68ch] text-[15px] leading-[1.7] text-ink-2">{p.body}</p>
                      <div className="mt-2.5 flex items-center gap-4 text-[12.5px] text-ink-3">
                        <span className="inline-flex items-center gap-1"><Heart className="h-3.5 w-3.5" strokeWidth={1.75} />{p.likes.length}</span>
                        <span className="inline-flex items-center gap-1"><MessageCircle className="h-3.5 w-3.5" strokeWidth={1.75} />{p.comments.length}</span>
                        {showMembersOnly && (
                          <Link href={group ? `/network/groups/${group.slug}` : "/network/conversations"} className="ml-auto inline-flex items-center gap-1 font-medium text-ink-2 hover:text-ink">
                            Open discussion <ArrowUpRight className="h-3.5 w-3.5" />
                          </Link>
                        )}
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </More>
        </div>

        {/* Rail */}
        <aside className="space-y-9 lg:col-span-4">
          <RailBlock title="Specialties" className="border-t-0 pt-0 lg:pt-1">
            {profile.specialties.length === 0 ? (
              <p className="text-[13.5px] text-ink-3">No specialties listed.</p>
            ) : (
              <ul className="space-y-2.5">
                {profile.specialties.map((s) => (
                  <li key={s}>
                    <Link href={`/people?specialty=${s}#directory`} className="group flex items-center gap-3 text-[14px] text-ink-2 hover:text-ink">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-subtle text-ink-3 ring-1 ring-line transition group-hover:text-navy-600"><LineIcon line={s} className="h-3.5 w-3.5" /></span>
                      {LINE_BY_SLUG[s]?.name ?? s}
                      {shared.includes(s) && <span className="ml-auto text-[11.5px] font-medium text-navy-600">Shared</span>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </RailBlock>

          {profile.mentor?.available && (
            <RailBlock title="Mentorship">
              <p className="font-display text-[17px] italic leading-snug text-ink">&ldquo;{profile.mentor.note}&rdquo;</p>
              <p className="mt-3 text-[13px] leading-relaxed text-ink-2">{profile.mentor.topics.join(" · ")}</p>
            </RailBlock>
          )}

          {mutuals.length > 0 && (
            <RailBlock title={`Mutual connections · ${mutuals.length}`}>
              <ul className="space-y-3">
                {mutuals.slice(0, 5).map((u) => {
                  const info = personInfo(db, u.id);
                  return (
                    <li key={u.id}>
                      <Link href={peopleHref(u.id)} className="group flex items-center gap-3">
                        <Avatar name={u.name} tone={info.tone} size={32} decorative />
                        <span className="min-w-0">
                          <span className="block text-[13.5px] font-medium text-ink group-hover:text-navy-600">{u.name}</span>
                          <span className="block truncate text-[12px] text-ink-3">{info.subtitle}</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </RailBlock>
          )}

          {(profile.expertise.length > 0 || profile.careerInterests.length > 0 || showMembersOnly) && (
            <details className="group/more border-t border-line pt-5">
              <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3 hover:text-ink [&::-webkit-details-marker]:hidden">
                More about {isSelf ? "you" : first}
                <ChevronDown className="h-3.5 w-3.5 transition group-open/more:rotate-180" strokeWidth={1.75} />
              </summary>
              <div className="mt-6 space-y-8">
              {profile.expertise.length > 0 && (
                <RailBlock title="Expertise" className="border-t-0 pt-0">
                  <ul className="flex flex-wrap gap-1.5">
                    {profile.expertise.map((x) => (
                      <li key={x} className="rounded-full border border-line bg-surface px-3 py-1 text-[12.5px] text-ink-2">{x}</li>
                    ))}
                  </ul>
                </RailBlock>
              )}

              {profile.careerInterests.length > 0 && (
                <RailBlock title="Professional interests">
                  <ul className="space-y-1.5">
                    {profile.careerInterests.map((x) => (
                      <li key={x} className="flex gap-2 text-[14px] text-ink-2"><span aria-hidden className="mt-2.5 h-1 w-1 shrink-0 rounded-full bg-ink-4" />{x}</li>
                    ))}
                  </ul>
                </RailBlock>
              )}

              {showMembersOnly && (
                <RailBlock title={isSelf ? "Your groups" : "Groups you share"}>
                  {groups.length === 0 ? (
                    <p className="text-[13.5px] text-ink-3">
                      {isSelf ? "You haven't joined any groups yet." : `No groups in common yet${groupTotal ? `; ${first} is in ${pluralize(groupTotal, "group")}` : ""}.`}{" "}
                      <Link href="/network/groups" className="text-navy-600 hover:underline">Browse groups</Link>
                    </p>
                  ) : (
                    <ul className="space-y-1">
                      {groups.map((g) => (
                        <li key={g.id}>
                          <Link href={`/network/groups/${g.slug}`} className="-mx-2 flex items-baseline justify-between gap-3 rounded-lg px-2 py-1.5 text-[13.5px] text-ink-2 transition hover:bg-subtle hover:text-ink">
                            {g.name}
                            <span className="shrink-0 text-[11.5px] text-ink-4">{g.memberIds.length}</span>
                          </Link>
                        </li>
                      ))}
                    </ul>
                  )}
                </RailBlock>
              )}

              </div>
            </details>
          )}

          <RailBlock title="Privacy">
            <ul className="space-y-2 text-[12.5px] leading-relaxed text-ink-3">
              {(isSelf && preview === "owner"
                ? ["Your NPN and email are never shown on People.", "This view includes fields other members may not see."]
                : view.hidden.length > 0
                  ? view.hidden
                  : ["NPN and contact details are never shown on People."]
              ).map((h) => (
                <li key={h} className="flex gap-2"><ShieldCheck className="mt-0.5 h-3.5 w-3.5 shrink-0 text-ink-4" strokeWidth={1.75} />{h}</li>
              ))}
              <li className="flex gap-2 text-ink-4"><span className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />Fictional member · demo data</li>
            </ul>
          </RailBlock>
        </aside>
      </div>
      </div>
    </article>
  );
}

/* ------------------------------------------------------------------ */
/* Organization team member                                            */
/* ------------------------------------------------------------------ */

function OrgPerson({ db, viewer, target }: { db: Database; viewer: User | null; target: User }) {
  const person = useMemo(() => personInfo(db, target.id), [db, target.id]);
  const posts = useMemo(() => feedPosts(db).filter((p) => p.authorId === target.id).slice(0, 2), [db, target.id]);
  const org = person.org;
  const isSelf = viewer?.id === target.id;

  if (target.status !== "active") {
    return <Unavailable title="This person is unavailable" reasons={["This organization account isn't active on the network."]} signedIn={!!viewer} />;
  }

  return (
    <div className={cn(WRAP, "py-12 sm:py-16")}>
      <Link href="/people" className="inline-flex items-center gap-1.5 text-[13px] text-ink-3 hover:text-ink">
        <ArrowLeft className="h-3.5 w-3.5" /> People
      </Link>
      <div className="mx-auto mt-8 max-w-2xl">
        <div className="rounded-2xl border border-line bg-surface p-6 sm:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex items-center gap-5">
              <Avatar name={target.name} tone={person.tone} size={80} />
              <div className="min-w-0">
                <h1 className="font-display text-[32px] leading-[1.05] text-ink sm:text-[38px]">{target.name}</h1>
                <p className="mt-1.5 text-[15px] text-ink-2">{ROLE_LABEL(target)}{org && <> at {org.name}</>}</p>
                <Badge tone="neutral" icon={<Building2 className="h-3 w-3" />} className="mt-2.5">Organization team</Badge>
              </div>
            </div>
            {!isSelf && <ConnectionAction otherId={target.id} otherName={target.name} size="sm" allowWithdraw visitorPrompt />}
          </div>

          {org && (
            <div className="mt-8 flex flex-col gap-4 border-t border-line pt-6 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-center gap-3.5">
                <OrgLogo brand={org.brand} name={org.name} size={44} />
                <div className="min-w-0">
                  <div className="text-[15px] font-semibold text-ink">{org.name}</div>
                  <div className="line-clamp-1 text-[13px] text-ink-3">{org.tagline}</div>
                </div>
              </div>
              {person.orgHref && (
                <ButtonLink href={person.orgHref} variant="secondary" size="sm">View organization <ArrowRight className="h-3.5 w-3.5" /></ButtonLink>
              )}
            </div>
          )}

          <p className="mt-6 text-[13px] leading-relaxed text-ink-3">
            Organization team members take part in industry conversations on behalf of their organization. They don&apos;t keep producer portfolios, and
            connecting never shares your application data with them.
          </p>
        </div>

        {posts.length > 0 && (
          <div className="mt-10">
            <Kicker className="mb-4">Recent posts</Kicker>
            <ul className="divide-y divide-line">
              {posts.map((p) => (
                <li key={p.id} className="py-4">
                  <div className="text-[11.5px] font-medium uppercase tracking-[0.1em] text-ink-4">{TOPIC_LABEL[p.topic]} · {relativeTime(p.createdAt)}</div>
                  <p className="mt-1.5 line-clamp-3 text-[14.5px] leading-[1.7] text-ink-2">{p.body}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Empty states                                                        */
/* ------------------------------------------------------------------ */

function Unavailable({ title, reasons, signedIn, name }: { title: string; reasons: string[]; signedIn: boolean; name?: string }) {
  return (
    <div className={cn(WRAP, "py-16 sm:py-24")}>
      <div className="mx-auto grid max-w-4xl grid-cols-1 gap-12 lg:grid-cols-[1.1fr_0.9fr]">
        <div>
          <span className="flex h-11 w-11 items-center justify-center rounded-full bg-surface text-ink-3 ring-1 ring-line"><Lock className="h-5 w-5" strokeWidth={1.75} /></span>
          {name && <p className="mt-6 text-[13px] text-ink-3">{name}</p>}
          <h1 className="mt-3 font-display text-[36px] leading-[1.08] tracking-[-0.015em] text-ink sm:text-[44px]">{title}</h1>
          <ul className="mt-4 space-y-1.5 text-[15px] leading-relaxed text-ink-2">
            {reasons.map((r) => <li key={r}>{r}</li>)}
          </ul>
          <p className="mt-5 text-[13.5px] text-ink-3">Members decide who can see their profile. We respect that choice.</p>
          <div className="mt-8 flex flex-wrap gap-2">
            <ButtonLink href="/people" variant="secondary">
              <ArrowLeft className="h-4 w-4" /> Back to People
            </ButtonLink>
            {!signedIn && <ButtonLink href="/join" variant="primary">Create a profile</ButtonLink>}
          </div>
        </div>
        {!signedIn && (
          <div className="lg:pt-16">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">Explore as a demo member</p>
            <PersonaChoices />
          </div>
        )}
      </div>
    </div>
  );
}

function NotFound() {
  const router = useRouter();
  const [q, setQ] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    router.push(`/people${q.trim() ? `?q=${encodeURIComponent(q.trim())}` : ""}#directory`);
  };
  return (
    <div className={cn(WRAP, "py-20 sm:py-28")}>
      <div className="mx-auto max-w-2xl text-center">
        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-surface text-ink-3 ring-1 ring-line"><UserX className="h-5 w-5" strokeWidth={1.75} /></span>
        <h1 className="mt-6 font-display text-[40px] leading-[1.05] tracking-[-0.02em] text-ink sm:text-[52px]">We couldn&apos;t find that person.</h1>
        <p className="mx-auto mt-4 max-w-md text-[15.5px] leading-relaxed text-ink-3">
          The link may be mistyped, or the member may have left the network. Search the directory instead.
        </p>
        <form onSubmit={submit} role="search" className="mx-auto mt-8 flex max-w-md gap-2">
          <label htmlFor="nf-search" className="sr-only">Search people</label>
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-4" strokeWidth={1.75} />
            <Input id="nf-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Name, city or expertise" className="pl-9" />
          </div>
          <Button type="submit">Search</Button>
        </form>
        <div className="mt-8 flex flex-wrap justify-center gap-x-6 gap-y-2 text-[13.5px]">
          <Link href="/people" className="font-medium text-ink-2 hover:text-ink">People home</Link>
          <Link href="/people#mentors" className="font-medium text-ink-2 hover:text-ink">Meet the mentors</Link>
          <Link href="/insider" className="font-medium text-ink-2 hover:text-ink">The Insider</Link>
        </div>
      </div>
    </div>
  );
}
