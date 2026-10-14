"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  Award, BookOpen, Briefcase, Building2, Clock, GraduationCap, Layers, Lock, MapPin, MessageSquare, Pencil, ScrollText, ShieldCheck, Target, Trophy, Users,
} from "lucide-react";
import type { Database, ProducerProfile, User } from "@/lib/data/types";
import { EXPERIENCE_LABEL, LINE_BY_SLUG, lineName, stateName } from "@/lib/data/taxonomy";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { ROLE_LABEL } from "@/lib/auth/permissions";
import { viewProfile, type ProfileView } from "@/lib/services/privacy";
import { feedPosts, mutualCount } from "@/lib/services/network";
import { Avatar } from "@/components/ui/avatar";
import { Badge, Tag } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { EmptyState, Notice, PageSkeleton } from "@/components/ui/feedback";
import { Breadcrumbs } from "@/components/ui/page";
import { LineIcon } from "@/components/ui/line-icon";
import { OrgLogo } from "@/components/brand/org-logo";
import { UnverifiedLicenseBadge } from "@/components/domain/badges";
import { ConnectionAction } from "@/components/network/connection-action";
import { AvailabilityDot } from "@/components/network/member-card";
import { Paragraphs, PostCard } from "@/components/network/post-card";
import { ASPIRING_STAGE_LABEL, locationLabel, personInfo } from "@/components/network/people";
import { pluralize } from "@/lib/utils/format";

const crumbs = (name?: string) => [
  { href: "/network", label: "Network" },
  { href: "/network/members", label: "Members" },
  ...(name ? [{ label: name }] : []),
];

export default function MemberProfilePage() {
  const params = useParams<{ id: string }>();
  const id = decodeURIComponent(String(params.id ?? ""));
  const db = useDb();
  const viewer = useCurrentUser();
  const target = useMemo(() => db.users.find((u) => u.id === id), [db, id]);
  const profile = useMemo(() => db.profiles.find((p) => p.userId === id), [db, id]);
  const view = useMemo(() => (profile ? viewProfile(db, viewer, profile) : null), [db, viewer, profile]);

  if (!viewer) return <PageSkeleton />;

  if (!target || target.kind === "admin") {
    return (
      <Unavailable
        title="Member not found"
        reasons={["This member may have left the network, or the link is incorrect."]}
      />
    );
  }

  if (target.kind === "organization") return <OrgRepresentative db={db} viewer={viewer} target={target} />;

  if (!profile || !view) return <Unavailable title="Profile unavailable" reasons={["This member hasn't set up a profile yet."]} />;
  if (!view.visible) return <Unavailable title="This profile isn't available" reasons={view.hidden} />;

  return <MemberProfile db={db} viewer={viewer} target={target} profile={profile} view={view} />;
}

/* ------------------------------------------------------------------ */

function Unavailable({ title, reasons }: { title: string; reasons: string[] }) {
  return (
    <>
      <Breadcrumbs items={crumbs()} className="mb-6" />
      <EmptyState
        icon={<Lock className="h-5 w-5" strokeWidth={1.75} />}
        title={title}
        description={
          <span className="block space-y-1">
            {reasons.map((r) => <span key={r} className="block">{r}</span>)}
            <span className="block pt-2 text-ink-4">Members decide who can see their profile. We respect that choice.</span>
          </span>
        }
        action={<ButtonLink href="/network/members" variant="secondary" size="sm">Back to the directory</ButtonLink>}
      />
    </>
  );
}

function Section({ title, icon, children, action }: { title: string; icon: ReactNode; children: ReactNode; action?: ReactNode }) {
  return (
    <Card>
      <CardHeader title={<span className="flex items-center gap-2"><span className="text-ink-4">{icon}</span>{title}</span>} action={action} />
      <CardBody className="pt-4">{children}</CardBody>
    </Card>
  );
}

function sharedGroups(db: Database, a: string, b: string) {
  return db.groups.filter((g) => g.memberIds.includes(a) && g.memberIds.includes(b));
}

function MemberProfile({ db, viewer, target, profile, view }: { db: Database; viewer: User; target: User; profile: ProducerProfile; view: ProfileView }) {
  const isSelf = view.isSelf;
  const mutual = useMemo(() => (isSelf ? 0 : mutualCount(db, viewer.id, target.id)), [db, viewer.id, target.id, isSelf]);
  const posts = useMemo(() => feedPosts(db).filter((p) => p.authorId === target.id).slice(0, 3), [db, target.id]);
  const groups = useMemo(() => (isSelf ? db.groups.filter((g) => g.memberIds.includes(target.id)) : sharedGroups(db, viewer.id, target.id)), [db, viewer.id, target.id, isSelf]);
  const firstName = target.name.split(" ")[0];
  const awardsAndAccomplishments = profile.awards.length + profile.accomplishments.length > 0;

  return (
    <>
      <Breadcrumbs items={crumbs(target.name)} className="mb-6" />

      {isSelf && (
        <Notice className="mb-5" title="You're viewing your own profile">
          Other members see it according to your privacy settings — for example, license records are only shown if you allow it.{" "}
          <Link href="/me/profile" className="font-medium underline underline-offset-2">Edit profile</Link>
        </Notice>
      )}

      <Card className="overflow-hidden">
        <div className="h-20 bg-[linear-gradient(120deg,var(--color-navy-50),var(--color-gold-50))] sm:h-24" aria-hidden />
        <div className="px-5 pb-6 sm:px-8">
          <div className="-mt-10 flex flex-col gap-4 sm:-mt-12 sm:flex-row sm:items-end sm:justify-between">
            <Avatar name={target.name} tone={profile.avatarTone} size={88} className="ring-4 ring-surface" />
            <div className="flex flex-wrap items-center gap-2 sm:pb-1">
              {isSelf ? (
                <ButtonLink href="/me/profile" variant="secondary" size="sm">
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} /> Edit profile
                </ButtonLink>
              ) : (
                <ConnectionAction otherId={target.id} otherName={target.name} size="sm" allowWithdraw />
              )}
            </div>
          </div>
          <h1 className="mt-4 font-display text-[30px] leading-[1.1] text-ink sm:text-[34px]">{target.name}</h1>
          <p className="mt-1.5 max-w-2xl text-[15px] leading-relaxed text-ink-2">{profile.headline}</p>
          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-[13px] text-ink-3">
            <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" strokeWidth={1.75} />{locationLabel(profile)}</span>
            <span className="inline-flex items-center gap-1.5"><Briefcase className="h-3.5 w-3.5" strokeWidth={1.75} />{EXPERIENCE_LABEL[profile.experienceLevel]}</span>
            <span className="inline-flex items-center gap-1.5">
              <Clock className="h-3.5 w-3.5" strokeWidth={1.75} />
              {profile.yearsInIndustry > 0 ? `${pluralize(profile.yearsInIndustry, "year")} in the industry` : "New to the industry"}
            </span>
            <AvailabilityDot value={profile.availability} className="text-[13px]" />
            {!isSelf && mutual > 0 && (
              <span className="inline-flex items-center gap-1.5"><Users className="h-3.5 w-3.5" strokeWidth={1.75} />{pluralize(mutual, "mutual connection")}</span>
            )}
          </div>
        </div>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <div className="min-w-0 space-y-6">
          <Section title="About" icon={<BookOpen className="h-4 w-4" strokeWidth={1.75} />}>
            {profile.bio.trim() ? (
              <Paragraphs text={profile.bio} className="text-[14.5px] leading-[1.7] text-ink-2" />
            ) : (
              <p className="text-sm text-ink-3">{firstName} hasn&apos;t written a bio yet.</p>
            )}
          </Section>

          {profile.aspiring && (
            <Section title="Licensing goals" icon={<Target className="h-4 w-4" strokeWidth={1.75} />}>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="gold">{ASPIRING_STAGE_LABEL[profile.aspiring.stage]}</Badge>
                {profile.aspiring.targetDate && <span className="text-[13px] text-ink-3">Target: {profile.aspiring.targetDate}</span>}
              </div>
              {profile.aspiring.targetLines.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1.5">
                  {profile.aspiring.targetLines.map((l) => <Tag key={l}>{lineName(l)}</Tag>)}
                </div>
              )}
              {profile.aspiring.motivation && (
                <blockquote className="mt-4 border-l-2 border-gold-200 pl-4 text-[14px] italic leading-relaxed text-ink-2">{profile.aspiring.motivation}</blockquote>
              )}
            </Section>
          )}

          {view.showExperience && profile.experience.length > 0 && (
            <Section title="Experience" icon={<Briefcase className="h-4 w-4" strokeWidth={1.75} />}>
              <ol className="relative space-y-6 border-l border-line pl-5">
                {profile.experience.map((e) => (
                  <li key={e.id} className="relative">
                    <span className="absolute -left-[25px] top-1.5 h-2 w-2 rounded-full bg-navy-200 ring-4 ring-surface" aria-hidden />
                    <div className="text-[14.5px] font-semibold text-ink">{e.title}</div>
                    <div className="text-[13px] text-ink-3">{e.organization} · {e.start}–{e.end ?? "Present"}</div>
                    {e.description && <p className="mt-2 text-[13.5px] leading-relaxed text-ink-2">{e.description}</p>}
                  </li>
                ))}
              </ol>
            </Section>
          )}

          {(profile.education.length > 0 || profile.certifications.length > 0) && (
            <Section title="Education & certifications" icon={<GraduationCap className="h-4 w-4" strokeWidth={1.75} />}>
              {profile.education.length > 0 && (
                <ul className="space-y-3">
                  {profile.education.map((e) => (
                    <li key={e.id}>
                      <div className="text-[14px] font-medium text-ink">{e.credential}</div>
                      <div className="text-[13px] text-ink-3">{e.institution}{e.year ? ` · ${e.year}` : ""}</div>
                    </li>
                  ))}
                </ul>
              )}
              {profile.certifications.length > 0 && (
                <div className={profile.education.length > 0 ? "mt-5 border-t border-line pt-5" : undefined}>
                  <div className="eyebrow mb-3">Certifications · self-reported</div>
                  <ul className="space-y-3">
                    {profile.certifications.map((c) => (
                      <li key={c.id} className="flex flex-wrap items-start justify-between gap-2">
                        <div className="min-w-0">
                          <div className="text-[14px] font-medium text-ink">{c.name}</div>
                          <div className="text-[13px] text-ink-3">{c.issuer}{c.year ? ` · ${c.year}` : ""}</div>
                        </div>
                        <Badge tone={c.status === "in_progress" ? "gold" : "outline"}>{c.status === "in_progress" ? "In progress" : "Self-reported"}</Badge>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </Section>
          )}

          {awardsAndAccomplishments && (
            <Section title="Awards & accomplishments" icon={<Trophy className="h-4 w-4" strokeWidth={1.75} />}>
              <ul className="space-y-4">
                {profile.accomplishments.map((a) => (
                  <li key={a.id}>
                    <div className="text-[14px] font-medium text-ink">{a.title}{a.year && <span className="font-normal text-ink-4"> · {a.year}</span>}</div>
                    {a.description && <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{a.description}</p>}
                  </li>
                ))}
                {profile.awards.map((a) => (
                  <li key={a.id} className="flex items-start gap-2.5">
                    <Award className="mt-0.5 h-4 w-4 shrink-0 text-gold" strokeWidth={1.75} />
                    <div>
                      <div className="text-[14px] font-medium text-ink">{a.title}</div>
                      <div className="text-[13px] text-ink-3">{a.issuer}{a.year ? ` · ${a.year}` : ""}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </Section>
          )}

          {view.showLicenses && (
            <Section title="Licenses" icon={<ScrollText className="h-4 w-4" strokeWidth={1.75} />}>
              {view.licenses.length === 0 ? (
                <p className="text-sm text-ink-3">No license records added{profile.aspiring ? " yet — still working toward licensing" : ""}.</p>
              ) : (
                <>
                  <ul className="divide-y divide-line">
                    {view.licenses.map((l) => (
                      <li key={l.id} className="flex flex-col gap-2 py-3 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="text-[14px] font-medium text-ink">
                            {stateName(l.state)} <span className="font-normal text-ink-3">· {l.residency === "resident" ? "Resident" : "Non-resident"}</span>
                          </div>
                          <div className="text-[13px] text-ink-3">
                            {l.linesOfAuthority.join(", ") || "Lines not specified"} · Reported {l.status}
                          </div>
                        </div>
                        <UnverifiedLicenseBadge />
                      </li>
                    ))}
                  </ul>
                  <p className="mt-4 text-xs leading-relaxed text-ink-3">
                    License details are entered by the member and have not been verified by the platform. Confirm licensing with the applicable state department of insurance.
                  </p>
                </>
              )}
            </Section>
          )}

          <Section
            title={isSelf ? "Your recent posts" : `Recent posts by ${firstName}`}
            icon={<MessageSquare className="h-4 w-4" strokeWidth={1.75} />}
          >
            {posts.length === 0 ? (
              <p className="text-sm text-ink-3">{isSelf ? "You haven't posted yet." : `${firstName} hasn't posted in the network yet.`}{" "}
                {isSelf && <Link href="/network/conversations" className="text-navy-600 hover:underline">Start a discussion</Link>}
              </p>
            ) : (
              <div className="-mx-1 space-y-4">
                {posts.map((p) => <PostCard key={p.id} post={p} className="shadow-none" />)}
              </div>
            )}
          </Section>
        </div>

        <aside className="space-y-6">
          <Section title="Specialties" icon={<Layers className="h-4 w-4" strokeWidth={1.75} />}>
            {profile.specialties.length === 0 ? (
              <p className="text-sm text-ink-3">No specialties listed.</p>
            ) : (
              <ul className="space-y-2">
                {profile.specialties.map((s) => (
                  <li key={s} className="flex items-center gap-2.5 text-[13.5px] text-ink-2">
                    <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-navy-50 text-navy-600"><LineIcon line={s} className="h-3.5 w-3.5" /></span>
                    {LINE_BY_SLUG[s]?.name ?? s}
                  </li>
                ))}
              </ul>
            )}
          </Section>

          {(profile.careerInterests.length > 0 || profile.expertise.length > 0) && (
            <Card>
              <CardBody>
                {profile.expertise.length > 0 && (
                  <div>
                    <h3 className="eyebrow mb-2.5">Areas of expertise</h3>
                    <div className="flex flex-wrap gap-1.5">{profile.expertise.map((x) => <Tag key={x}>{x}</Tag>)}</div>
                  </div>
                )}
                {profile.careerInterests.length > 0 && (
                  <div className={profile.expertise.length > 0 ? "mt-5" : undefined}>
                    <h3 className="eyebrow mb-2.5">Career interests</h3>
                    <div className="flex flex-wrap gap-1.5">{profile.careerInterests.map((x) => <Tag key={x}>{x}</Tag>)}</div>
                  </div>
                )}
              </CardBody>
            </Card>
          )}

          <Section title={isSelf ? "Your groups" : "Shared groups"} icon={<Users className="h-4 w-4" strokeWidth={1.75} />}>
            {groups.length === 0 ? (
              <p className="text-sm text-ink-3">{isSelf ? "You haven't joined any groups." : `You and ${firstName} aren't in any of the same groups yet.`}</p>
            ) : (
              <ul className="space-y-1">
                {groups.map((g) => (
                  <li key={g.id}>
                    <Link href={`/network/groups/${g.slug}`} className="-mx-2 block rounded-lg px-2 py-1.5 text-[13.5px] text-ink-2 transition hover:bg-subtle hover:text-ink">
                      {g.name}
                      <span className="block text-[11.5px] text-ink-4">{pluralize(g.memberIds.length, "member")}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </Section>

          <div className="rounded-2xl border border-line bg-subtle/60 p-5">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-ink-2">
              <ShieldCheck className="h-4 w-4 text-ink-4" strokeWidth={1.75} /> Privacy
            </div>
            <ul className="mt-2.5 space-y-1.5 text-xs leading-relaxed text-ink-3">
              {(isSelf
                ? ["Your NPN and email are never shown in the network.", "This preview includes fields other members may not see."]
                : view.hidden.length > 0
                  ? view.hidden
                  : ["NPN and contact details are never shown in the network."]
              ).map((h) => (
                <li key={h} className="flex gap-2"><span aria-hidden className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-ink-4" />{h}</li>
              ))}
            </ul>
          </div>
        </aside>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ */

function OrgRepresentative({ db, viewer, target }: { db: Database; viewer: User; target: User }) {
  const person = useMemo(() => personInfo(db, target.id), [db, target.id]);
  const posts = useMemo(() => feedPosts(db).filter((p) => p.authorId === target.id).slice(0, 3), [db, target.id]);
  const groups = useMemo(() => sharedGroups(db, viewer.id, target.id), [db, viewer.id, target.id]);
  const isSelf = viewer.id === target.id;
  const org = person.org;
  const firstName = target.name.split(" ")[0];

  if (target.status !== "active") {
    return <Unavailable title="This member is unavailable" reasons={["This organization account isn't active on the network."]} />;
  }

  return (
    <>
      <Breadcrumbs items={crumbs(target.name)} className="mb-6" />
      <Card className="p-5 sm:p-8">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-start gap-4">
            <Avatar name={target.name} tone={person.tone} size={72} />
            <div className="min-w-0">
              <h1 className="font-display text-[28px] leading-[1.1] text-ink sm:text-[32px]">{target.name}</h1>
              <p className="mt-1.5 text-[15px] text-ink-2">
                {ROLE_LABEL(target)}
                {org && <> at {org.name}</>}
              </p>
              <div className="mt-2"><Badge tone="gold" icon={<Building2 className="h-3 w-3" />}>Organization</Badge></div>
            </div>
          </div>
          {!isSelf && <ConnectionAction otherId={target.id} otherName={target.name} size="sm" allowWithdraw />}
        </div>
        {org && (
          <div className="mt-6 flex flex-col gap-3 rounded-xl border border-line bg-subtle/50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-3">
              <OrgLogo brand={org.brand} name={org.name} size={40} />
              <div className="min-w-0">
                <div className="text-[14px] font-semibold text-ink">{org.name}</div>
                <div className="line-clamp-1 text-[13px] text-ink-3">{org.tagline}</div>
              </div>
            </div>
            {person.orgHref && <ButtonLink href={person.orgHref} variant="secondary" size="sm">View organization</ButtonLink>}
          </div>
        )}
        <p className="mt-5 text-xs leading-relaxed text-ink-3">
          Organization team members participate in industry discussions on behalf of their organization. They don&apos;t have producer profiles, and connecting
          never shares your application data with them.
        </p>
      </Card>

      <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
        <Section title={`Recent posts by ${firstName}`} icon={<MessageSquare className="h-4 w-4" strokeWidth={1.75} />}>
          {posts.length === 0 ? (
            <p className="text-sm text-ink-3">{firstName} hasn&apos;t posted in the network yet.</p>
          ) : (
            <div className="space-y-4">{posts.map((p) => <PostCard key={p.id} post={p} className="shadow-none" />)}</div>
          )}
        </Section>
        <Section title="Shared groups" icon={<Users className="h-4 w-4" strokeWidth={1.75} />}>
          {groups.length === 0 ? (
            <p className="text-sm text-ink-3">No groups in common yet.</p>
          ) : (
            <ul className="space-y-1">
              {groups.map((g) => (
                <li key={g.id}>
                  <Link href={`/network/groups/${g.slug}`} className="-mx-2 block rounded-lg px-2 py-1.5 text-[13.5px] text-ink-2 transition hover:bg-subtle hover:text-ink">{g.name}</Link>
                </li>
              ))}
            </ul>
          )}
        </Section>
      </div>
    </>
  );
}
