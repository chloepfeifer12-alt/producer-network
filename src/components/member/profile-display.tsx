"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Eye, EyeOff, Globe, Lock, Mail, MapPin, PenLine, Plus, ShieldCheck, Users } from "lucide-react";
import type { LineSlug, ProducerProfile, ProfileVisibility, User } from "@/lib/data/types";
import type { ProfileView } from "@/lib/services/privacy";
import {
  ARRANGEMENT_LABEL,
  AVAILABILITY_LABEL,
  EXPERIENCE_LABEL,
  LINE_BY_SLUG,
  SECTOR_LABEL,
  VISIBILITY_LABEL,
  lineName,
  stateName,
} from "@/lib/data/taxonomy";
import { Avatar } from "@/components/ui/avatar";
import { Badge, Tag, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { LineIcon } from "@/components/ui/line-icon";
import { UnverifiedLicenseBadge } from "@/components/domain/badges";
import { formatDate } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";
import { AspiringNextStep, AspiringStepper, ASPIRING_STAGE_LABEL } from "./aspiring-path";
import { maskNpn } from "./utils";
import type { PortfolioKey } from "./profile-editors";

export type EditTarget = "basics" | "specialties" | "preferences" | "licenses" | "npn" | "aspiring" | "expertise" | PortfolioKey;

const AVAILABILITY_TONE: Record<ProducerProfile["availability"], BadgeTone> = {
  actively_looking: "success",
  open: "navy",
  not_looking: "neutral",
};

const VISIBILITY_ICON: Record<ProfileVisibility, typeof Globe> = { public: Globe, members: Users, private: Lock };

export function VisibilityBadge({ visibility }: { visibility: ProfileVisibility }) {
  const Icon = VISIBILITY_ICON[visibility];
  return (
    <Badge tone="outline" icon={<Icon className="h-3 w-3" />}>
      {VISIBILITY_LABEL[visibility]}
    </Badge>
  );
}

export function AvailabilityBadge({ availability }: { availability: ProducerProfile["availability"] }) {
  return <Badge tone={AVAILABILITY_TONE[availability]}>{AVAILABILITY_LABEL[availability]}</Badge>;
}

/* ------------------------------------------------------------------ */
/* Building blocks                                                     */
/* ------------------------------------------------------------------ */

function EditButton({ label, onClick, className }: { label: string; onClick: () => void; className?: string }) {
  return (
    <Button variant="ghost" size="xs" onClick={onClick} aria-label={label} className={cn("text-ink-3", className)}>
      <PenLine className="h-3.5 w-3.5" /> Edit
    </Button>
  );
}

/** A résumé section: small-caps heading in a left gutter, content on the right. */
function ResumeSection({ id, title, action, children }: { id?: string; title: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section id={id} aria-labelledby={id ? `${id}-h` : undefined} className="scroll-mt-24 border-t border-line px-5 py-7 sm:px-10 md:grid md:grid-cols-[170px_minmax(0,1fr)] md:gap-8">
      <div className="mb-3 flex items-center justify-between gap-3 md:mb-0 md:block">
        <h2 id={id ? `${id}-h` : undefined} className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3 md:pt-0.5">{title}</h2>
        {action && <div className="md:-ml-2.5 md:mt-2">{action}</div>}
      </div>
      <div className="min-w-0">{children}</div>
    </section>
  );
}

function AddPrompt({ children, onClick }: { children: ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="inline-flex items-center gap-1.5 rounded-lg border border-dashed border-line-strong px-3 py-2 text-[13px] text-ink-3 transition hover:border-ink-4 hover:bg-subtle hover:text-ink">
      <Plus className="h-3.5 w-3.5" /> {children}
    </button>
  );
}

function Empty({ editable, onAdd, addLabel, text = "Not provided." }: { editable: boolean; onAdd?: () => void; addLabel?: string; text?: string }) {
  if (editable && onAdd && addLabel) return <AddPrompt onClick={onAdd}>{addLabel}</AddPrompt>;
  return <p className="text-sm text-ink-4">{text}</p>;
}

function HiddenFromViewer({ children }: { children: ReactNode }) {
  return (
    <div className="flex items-start gap-2.5 rounded-xl border border-dashed border-line-strong bg-subtle/50 px-4 py-3 text-[13px] text-ink-3">
      <EyeOff className="mt-0.5 h-4 w-4 shrink-0 text-ink-4" />
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Résumé                                                              */
/* ------------------------------------------------------------------ */

/**
 * The profile, presented like a clean résumé that employers see. The same
 * component renders the owner's editable view and every "Preview as" view.
 */
export function ProfileResume({ user, profile, view, editable, onEdit }: { user: User; profile: ProducerProfile; view: ProfileView; editable: boolean; onEdit: (t: EditTarget) => void }) {
  const aspiring = user.kind === "aspiring";
  const location = [profile.city, profile.state ? stateName(profile.state) : ""].filter(Boolean).join(", ");
  const edit = (t: EditTarget, label: string) => (editable ? <EditButton label={label} onClick={() => onEdit(t)} /> : undefined);

  return (
    <Card className="overflow-hidden">
      {/* Document header */}
      <header id="basics" className="scroll-mt-24 px-5 pb-7 pt-8 sm:px-10 sm:pt-10">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar name={user.name} tone={profile.avatarTone} size={76} className="ring-1 ring-line" />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <h2 className="font-display text-[32px] leading-[1.08] text-ink sm:text-[38px]">{user.name}</h2>
              {edit("basics", "Edit name, headline and summary")}
            </div>
            {profile.headline ? (
              <p className="mt-1.5 max-w-2xl text-[16px] leading-relaxed text-ink-2">{profile.headline}</p>
            ) : editable ? (
              <div className="mt-2"><AddPrompt onClick={() => onEdit("basics")}>Add a professional headline</AddPrompt></div>
            ) : null}
            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[13px] text-ink-3">
              {location && <span className="inline-flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />{location}</span>}
              <span>{aspiring ? "Pre-license · career changer" : EXPERIENCE_LABEL[profile.experienceLevel]}</span>
              {!aspiring && <span>{profile.yearsInIndustry === 0 ? "New to the industry" : `${profile.yearsInIndustry} ${profile.yearsInIndustry === 1 ? "year" : "years"} in the industry`}</span>}
              {view.email && <span className="inline-flex items-center gap-1.5"><Mail className="h-3.5 w-3.5" />{view.email}</span>}
            </div>
            <div className="mt-4 flex flex-wrap items-center gap-2">
              <AvailabilityBadge availability={profile.availability} />
              {editable && <VisibilityBadge visibility={profile.visibility} />}
              {aspiring && profile.aspiring && <Badge tone="gold">{ASPIRING_STAGE_LABEL[profile.aspiring.stage]}</Badge>}
            </div>
            {editable && view.email && (
              <p className="mt-3 text-xs text-ink-4">Your email is visible only to you, and to employers you explicitly share it with when applying.</p>
            )}
          </div>
        </div>
      </header>

      <ResumeSection title="Summary" action={edit("basics", "Edit summary")}>
        {profile.bio ? (
          <p className="whitespace-pre-line text-[15px] leading-[1.75] text-ink-2">{profile.bio}</p>
        ) : (
          <Empty editable={editable} onAdd={() => onEdit("basics")} addLabel="Write a short summary" />
        )}
      </ResumeSection>

      <ResumeSection id="specialties" title="Specialties" action={edit("specialties", "Edit specialties")}>
        {profile.specialties.length ? <SpecialtiesBySector lines={profile.specialties} /> : <Empty editable={editable} onAdd={() => onEdit("specialties")} addLabel="Choose your specialties" />}
      </ResumeSection>

      {aspiring && <AspiringBlock profile={profile} editable={editable} onEdit={onEdit} />}

      <ResumeSection id={aspiring ? undefined : "licensing"} title="Licenses & registrations" action={edit("licenses", "Edit licenses and registrations")}>
        <LicensesBlock profile={profile} view={view} editable={editable} onEdit={onEdit} aspiring={aspiring} />
      </ResumeSection>

      <ResumeSection id="portfolio" title="Experience" action={view.showExperience ? edit("experience", "Edit experience") : undefined}>
        {!view.showExperience ? (
          <HiddenFromViewer>Work history was not shared with this viewer.</HiddenFromViewer>
        ) : profile.experience.length ? (
          <ol className="space-y-6">
            {profile.experience.map((e) => (
              <li key={e.id}>
                <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                  <div className="text-[15px] font-semibold tracking-[-0.01em] text-ink">{e.title}</div>
                  <div className="shrink-0 text-xs tabular-nums text-ink-3">{e.start} – {e.end ?? "Present"}</div>
                </div>
                <div className="text-[13.5px] text-ink-3">{e.organization}</div>
                {e.description && <p className="mt-1.5 text-sm leading-relaxed text-ink-2">{e.description}</p>}
              </li>
            ))}
          </ol>
        ) : (
          <Empty editable={editable} onAdd={() => onEdit("experience")} addLabel="Add work experience" />
        )}
      </ResumeSection>

      <ResumeSection title="Skills & expertise" action={edit("expertise", "Edit areas of expertise")}>
        {profile.expertise.length ? (
          <p className="text-[14.5px] leading-relaxed text-ink-2">{profile.expertise.join(" · ")}</p>
        ) : (
          <Empty editable={editable} onAdd={() => onEdit("expertise")} addLabel="Add areas of expertise" />
        )}
      </ResumeSection>

      <ResumeSection title="Education" action={edit("education", "Edit education")}>
        {profile.education.length ? (
          <ul className="space-y-3">
            {profile.education.map((e) => (
              <li key={e.id} className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink">{e.credential}</div>
                  <div className="text-[13px] text-ink-3">{e.institution}</div>
                </div>
                {e.year && <div className="shrink-0 text-xs tabular-nums text-ink-3">{e.year}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <Empty editable={editable} onAdd={() => onEdit("education")} addLabel="Add education" />
        )}
      </ResumeSection>

      <ResumeSection title="Certifications" action={edit("certifications", "Edit certifications")}>
        {profile.certifications.length ? (
          <ul className="space-y-3">
            {profile.certifications.map((c) => (
              <li key={c.id} className="flex flex-col gap-1.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink">{c.name}</div>
                  <div className="text-[13px] text-ink-3">{c.issuer}{c.year ? ` · ${c.year}` : ""}</div>
                </div>
                <Badge tone={c.status === "in_progress" ? "gold" : "outline"} className="self-start">{c.status === "in_progress" ? "In progress" : "Self-reported"}</Badge>
              </li>
            ))}
          </ul>
        ) : (
          <Empty editable={editable} onAdd={() => onEdit("certifications")} addLabel="Add a certification" />
        )}
      </ResumeSection>

      <ResumeSection title="Accomplishments" action={edit("accomplishments", "Edit accomplishments")}>
        {profile.accomplishments.length ? (
          <ul className="space-y-4">
            {profile.accomplishments.map((a) => (
              <li key={a.id}>
                <div className="flex items-baseline justify-between gap-3">
                  <div className="text-sm font-semibold text-ink">{a.title}</div>
                  {a.year && <div className="shrink-0 text-xs tabular-nums text-ink-3">{a.year}</div>}
                </div>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-2">{a.description}</p>
              </li>
            ))}
          </ul>
        ) : (
          <Empty editable={editable} onAdd={() => onEdit("accomplishments")} addLabel="Add an accomplishment" />
        )}
      </ResumeSection>

      <ResumeSection title="Awards" action={edit("awards", "Edit awards")}>
        {profile.awards.length ? (
          <ul className="space-y-3">
            {profile.awards.map((a) => (
              <li key={a.id} className="flex items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-ink">{a.title}</div>
                  <div className="text-[13px] text-ink-3">{a.issuer}</div>
                </div>
                {a.year && <div className="shrink-0 text-xs tabular-nums text-ink-3">{a.year}</div>}
              </li>
            ))}
          </ul>
        ) : (
          <Empty editable={editable} onAdd={() => onEdit("awards")} addLabel="Add an award" />
        )}
      </ResumeSection>

      <ResumeSection id="preferences" title="Looking for" action={edit("preferences", "Edit work preferences")}>
        <dl className="grid gap-5 sm:grid-cols-2">
          <div>
            <dt className="text-xs text-ink-3">Work arrangement</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {profile.arrangementPrefs.length ? profile.arrangementPrefs.map((a) => <Tag key={a}>{ARRANGEMENT_LABEL[a]}</Tag>) : <span className="text-sm text-ink-4">Not specified</span>}
            </dd>
          </div>
          <div>
            <dt className="text-xs text-ink-3">Engagement type</dt>
            <dd className="mt-1.5 flex flex-wrap gap-1.5">
              {profile.engagementPrefs.length ? (
                profile.engagementPrefs.map((e) => <Badge key={e} tone={e === "w2" ? "navy" : "gold"}>{e === "w2" ? "W-2 employment" : "Independent contractor (1099)"}</Badge>)
              ) : (
                <span className="text-sm text-ink-4">Not specified</span>
              )}
            </dd>
          </div>
          <div className="sm:col-span-2">
            <dt className="text-xs text-ink-3">Career interests</dt>
            <dd className="mt-1.5">
              {profile.careerInterests.length ? (
                <ul className="flex flex-wrap gap-1.5">{profile.careerInterests.map((c) => <li key={c}><Tag>{c}</Tag></li>)}</ul>
              ) : (
                <Empty editable={editable} onAdd={() => onEdit("preferences")} addLabel="Add career interests" />
              )}
            </dd>
          </div>
        </dl>
      </ResumeSection>

      {editable && (
        <footer className="border-t border-line bg-subtle/50 px-5 py-4 text-xs leading-relaxed text-ink-3 sm:px-10">
          Everything on this profile is self-reported. Do not include client names, policy details, or any confidential/protected customer information.
        </footer>
      )}
    </Card>
  );
}

function SpecialtiesBySector({ lines }: { lines: LineSlug[] }) {
  const groups = (Object.keys(SECTOR_LABEL) as (keyof typeof SECTOR_LABEL)[])
    .map((sector) => ({ sector, items: lines.filter((l) => LINE_BY_SLUG[l]?.sector === sector) }))
    .filter((g) => g.items.length);
  return (
    <div className="space-y-4">
      {groups.map((g) => (
        <div key={g.sector}>
          {groups.length > 1 && <div className="mb-2 text-xs text-ink-3">{SECTOR_LABEL[g.sector]}</div>}
          <ul className="flex flex-wrap gap-2">
            {g.items.map((l) => (
              <li key={l}>
                <Link href={`/explore/${l}`} className="inline-flex items-center gap-2 rounded-full border border-line px-3 py-1.5 text-[13px] text-ink-2 transition hover:border-line-strong hover:bg-subtle hover:text-ink">
                  <LineIcon line={l} className="h-3.5 w-3.5 text-navy" />
                  {lineName(l)}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}

/* ---------------- Licensing ---------------- */

function NpnRow({ profile, view, editable, onEdit }: { profile: ProducerProfile; view: ProfileView; editable: boolean; onEdit: (t: EditTarget) => void }) {
  const [revealed, setRevealed] = useState(false);
  if (!editable) {
    return view.npn ? (
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-line px-4 py-3">
        <div>
          <div className="text-xs text-ink-3">National Producer Number</div>
          <div className="mt-0.5 font-mono text-sm text-ink">{maskNpn(view.npn)}</div>
        </div>
        <span className="text-xs text-ink-3">Visible to this employer because you shared it with your application.</span>
      </div>
    ) : (
      <HiddenFromViewer>NPN is not visible to this viewer.</HiddenFromViewer>
    );
  }
  return (
    <div className="rounded-xl border border-line bg-subtle/40 px-4 py-3.5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-ink-3"><Lock className="h-3 w-3" />National Producer Number · private</div>
          <div className="mt-1 font-mono text-[15px] tracking-wide text-ink" aria-live="polite">
            {profile.npn ? (revealed ? profile.npn : maskNpn(profile.npn)) : <span className="font-sans text-sm tracking-normal text-ink-4">Not added</span>}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {profile.npn && (
            <Button variant="ghost" size="sm" onClick={() => setRevealed((r) => !r)} aria-pressed={revealed}>
              {revealed ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {revealed ? "Hide" : "Reveal"}
            </Button>
          )}
          <Button variant="secondary" size="sm" onClick={() => onEdit("npn")}>{profile.npn ? "Edit NPN" : "Add NPN"}</Button>
        </div>
      </div>
      <p className="mt-2.5 text-xs leading-relaxed text-ink-3">
        Never shown publicly or to other members. Shared with an employer only when you apply, choose to include it, and{" "}
        <Link href="/me/settings" className="text-navy-600 underline-offset-4 hover:underline">your privacy settings</Link>{" "}
        {profile.consent.shareNpnOnApply ? "allow it (currently on)." : "allow it (currently off)."}
      </p>
    </div>
  );
}

function LicenseTable({ licenses }: { licenses: ProducerProfile["licenses"] }) {
  const statusTone = (s: string): BadgeTone => (s === "active" ? "success" : s === "pending" ? "gold" : "neutral");
  const cap = (s: string) => s[0]!.toUpperCase() + s.slice(1);
  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-line lg:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-subtle/70 text-xs text-ink-3">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-medium">State</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Residency</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Lines / registrations</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Status (reported)</th>
              <th scope="col" className="px-4 py-2.5 font-medium">Verification</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {licenses.map((l) => (
              <tr key={l.id} className="align-top">
                <td className="px-4 py-3">
                  <div className="font-medium text-ink">{l.state ? stateName(l.state) : "—"}</div>
                  {l.expiresOn && <div className="mt-0.5 text-xs text-ink-4">Expires {formatDate(l.expiresOn)}</div>}
                </td>
                <td className="px-4 py-3 text-ink-2">{l.residency === "resident" ? "Resident" : "Non-resident"}</td>
                <td className="px-4 py-3 text-ink-2">{l.linesOfAuthority.length ? l.linesOfAuthority.join(", ") : <span className="text-ink-4">Not specified</span>}</td>
                <td className="px-4 py-3"><Badge tone={statusTone(l.status)}>{cap(l.status)}</Badge></td>
                <td className="px-4 py-3"><UnverifiedLicenseBadge /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <ul className="space-y-3 lg:hidden">
        {licenses.map((l) => (
          <li key={l.id} className="rounded-xl border border-line p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="font-medium text-ink">{l.state ? stateName(l.state) : "—"}</div>
                <div className="mt-0.5 text-xs text-ink-3">{l.residency === "resident" ? "Resident" : "Non-resident"}{l.expiresOn ? ` · Expires ${formatDate(l.expiresOn)}` : ""}</div>
              </div>
              <Badge tone={statusTone(l.status)}>{cap(l.status)}</Badge>
            </div>
            <div className="mt-2.5 text-[13px] text-ink-2">{l.linesOfAuthority.join(", ") || "Lines not specified"}</div>
            <div className="mt-3"><UnverifiedLicenseBadge /></div>
          </li>
        ))}
      </ul>
    </>
  );
}

function LicensesBlock({ profile, view, editable, onEdit, aspiring }: { profile: ProducerProfile; view: ProfileView; editable: boolean; onEdit: (t: EditTarget) => void; aspiring: boolean }) {
  return (
    <div className="space-y-4">
      <p className="flex items-start gap-2 text-xs leading-relaxed text-ink-3">
        <ShieldCheck className="mt-px h-3.5 w-3.5 shrink-0 text-ink-4" />
        <span>
          Insurance licenses and securities registrations are self-reported. The platform does not verify them or connect to licensing or
          registration databases in this prototype — employers should confirm independently.
        </span>
      </p>
      {!view.showLicenses ? (
        <HiddenFromViewer>Licenses and registrations are hidden from this viewer.</HiddenFromViewer>
      ) : view.licenses.length ? (
        <LicenseTable licenses={view.licenses} />
      ) : aspiring ? (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-[13px] text-ink-3">Not licensed yet. Once you are, add your license here.</p>
          {editable && <Button variant="secondary" size="sm" onClick={() => onEdit("licenses")}><Plus className="h-3.5 w-3.5" />Add license</Button>}
        </div>
      ) : (
        <Empty editable={editable} onAdd={() => onEdit("licenses")} addLabel="Add a license or registration" text="None listed." />
      )}
      {!aspiring && <NpnRow profile={profile} view={view} editable={editable} onEdit={onEdit} />}
    </div>
  );
}

function AspiringBlock({ profile, editable, onEdit }: { profile: ProducerProfile; editable: boolean; onEdit: (t: EditTarget) => void }) {
  const a = profile.aspiring;
  return (
    <ResumeSection id="licensing" title="Licensing journey" action={editable ? <EditButton label="Edit licensing journey" onClick={() => onEdit("aspiring")} /> : undefined}>
      {a ? (
        <div className="space-y-6">
          <AspiringStepper stage={a.stage} />
          <dl className="grid gap-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <dt className="text-xs text-ink-3">Working toward</dt>
              <dd className="mt-1.5 flex flex-wrap gap-1.5">
                {a.targetLines.length ? a.targetLines.map((l) => <Tag key={l}>{lineName(l)}</Tag>) : <span className="text-sm text-ink-4">Not specified</span>}
              </dd>
            </div>
            {a.motivation && (
              <div className="sm:col-span-2">
                <dt className="text-xs text-ink-3">Why this industry</dt>
                <dd className="mt-1.5 border-l-2 border-gold-200 pl-3.5 font-display text-[17px] italic leading-relaxed text-ink-2">“{a.motivation}”</dd>
              </div>
            )}
            {a.targetDate && (
              <div>
                <dt className="text-xs text-ink-3">Target timing</dt>
                <dd className="mt-1 text-sm text-ink">{a.targetDate}</dd>
              </div>
            )}
          </dl>
          {editable && <AspiringNextStep details={a} />}
        </div>
      ) : (
        <Empty editable={editable} onAdd={() => onEdit("aspiring")} addLabel="Describe your licensing goals" />
      )}
    </ResumeSection>
  );
}
