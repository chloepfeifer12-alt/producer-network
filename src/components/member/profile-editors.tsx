"use client";

import { useState, type ReactNode } from "react";
import { Plus, ShieldAlert, Trash2 } from "lucide-react";
import type {
  AccomplishmentEntry,
  AspiringDetails,
  Availability,
  AwardEntry,
  CertificationEntry,
  EducationEntry,
  EngagementType,
  ExperienceEntry,
  ExperienceLevel,
  LicenseRecord,
  LineSlug,
  ProducerProfile,
  User,
  WorkArrangement,
} from "@/lib/data/types";
import {
  ARRANGEMENT_LABEL,
  AVAILABILITY_LABEL,
  ENGAGEMENT_LABEL,
  EXPERIENCE_LABEL,
  LINES_BY_SECTOR,
  LINES_OF_AUTHORITY,
  SECTOR_LABEL,
  US_STATES,
} from "@/lib/data/taxonomy";
import { newLicense, updateProfile, type ProfilePatch } from "@/lib/services/profiles";
import { newId } from "@/lib/utils/ids";
import { Dialog } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox, ChipGroup, Field, Input, ListEditor, Select, Textarea } from "@/components/ui/form";
import { Notice } from "@/components/ui/feedback";
import { UnverifiedLicenseBadge } from "@/components/domain/badges";
import { toastResult } from "@/components/ui/toast";
import { cn } from "@/lib/utils/cn";
import { ASPIRING_STAGE_LABEL } from "./aspiring-path";

/* ------------------------------------------------------------------ */
/* Shared                                                              */
/* ------------------------------------------------------------------ */

function useSave(user: User | null, onClose: () => void) {
  return (patch: ProfilePatch, message: string) => {
    const r = updateProfile(user, patch);
    if (toastResult(r, message)) onClose();
  };
}

function EditorDialog({ title, description, onClose, onSave, children, size = "lg", saveLabel = "Save changes" }: { title: string; description?: ReactNode; onClose: () => void; onSave: () => void; children: ReactNode; size?: "md" | "lg" | "xl"; saveLabel?: string }) {
  return (
    <Dialog
      open
      onClose={onClose}
      title={title}
      description={description}
      size={size}
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="accent" onClick={onSave}>{saveLabel}</Button>
        </>
      }
    >
      <form
        onSubmit={(e) => {
          e.preventDefault();
          onSave();
        }}
        className="space-y-5"
      >
        {children}
        <button type="submit" className="sr-only" tabIndex={-1}>Save</button>
      </form>
    </Dialog>
  );
}

export const CONFIDENTIALITY_NOTICE = "Do not include client names, policy details, or any confidential/protected customer information.";

function ConfidentialityNotice() {
  return (
    <Notice tone="warning" title="Keep it confidential" icon={<ShieldAlert className="h-4 w-4" />}>
      {CONFIDENTIALITY_NOTICE}
    </Notice>
  );
}

function CharCount({ value, max }: { value: string; max: number }) {
  return <span className={cn("tabular-nums", value.length > max ? "text-danger" : "text-ink-4")}>{value.length.toLocaleString()}/{max.toLocaleString()}</span>;
}

/** Specialty picker grouped by sector ("Insurance" / "Financial services"). */
function SectorChips({ value, onChange, size = "md", label }: { value: LineSlug[]; onChange: (v: LineSlug[]) => void; size?: "sm" | "md"; label: string }) {
  return (
    <div className="space-y-4">
      {(Object.keys(LINES_BY_SECTOR) as (keyof typeof LINES_BY_SECTOR)[]).map((sector) => {
        const options = LINES_BY_SECTOR[sector].map((l) => ({ value: l.slug, label: l.name }));
        const slugs = new Set(options.map((o) => o.value));
        return (
          <div key={sector}>
            <div className="mb-2 text-xs font-medium text-ink-3">{SECTOR_LABEL[sector]}</div>
            <ChipGroup
              options={options}
              value={value.filter((v) => slugs.has(v))}
              onChange={(next) => onChange([...value.filter((v) => !slugs.has(v)), ...next])}
              size={size}
              ariaLabel={`${label}: ${SECTOR_LABEL[sector]}`}
            />
          </div>
        );
      })}
    </div>
  );
}

/** Securities registrations are listed separately from insurance lines of authority. */
const isRegistration = (loa: string) => /^(SIE|Series)/.test(loa);
const LOA_GROUPS = [
  { label: "Insurance lines of authority", items: LINES_OF_AUTHORITY.filter((l) => !isRegistration(l)) },
  { label: "Securities registrations", items: LINES_OF_AUTHORITY.filter(isRegistration) },
];

/* ------------------------------------------------------------------ */
/* Basics                                                              */
/* ------------------------------------------------------------------ */

export function BasicsEditor({ user, profile, onClose, aspiring }: { user: User; profile: ProducerProfile; onClose: () => void; aspiring: boolean }) {
  const save = useSave(user, onClose);
  const [name, setName] = useState(user.name);
  const [headline, setHeadline] = useState(profile.headline);
  const [city, setCity] = useState(profile.city);
  const [state, setState] = useState(profile.state);
  const [level, setLevel] = useState<ExperienceLevel>(profile.experienceLevel);
  const [years, setYears] = useState(String(profile.yearsInIndustry));
  const [availability, setAvailability] = useState<Availability>(profile.availability);
  const [bio, setBio] = useState(profile.bio);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const submit = () => {
    const e: Record<string, string> = {};
    if (name.trim().length < 2) e.name = "Name is required.";
    if (headline.trim().length > 140) e.headline = "Keep your headline to 140 characters or fewer.";
    if (bio.length > 1500) e.bio = "Keep your biography to 1,500 characters or fewer.";
    const y = Number(years);
    if (!Number.isFinite(y) || y < 0 || y > 60) e.years = "Enter a number between 0 and 60.";
    setErrors(e);
    if (Object.keys(e).length) return;
    save({ name, headline: headline.trim(), city: city.trim(), state, experienceLevel: level, yearsInIndustry: Math.round(y), availability, bio: bio.trim() }, "Profile basics updated");
  };

  return (
    <EditorDialog title="Edit profile basics" description="Your name, headline and summary appear at the top of your profile." onClose={onClose} onSave={submit}>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Full name" id="pf-name" error={errors.name}>
          <Input id="pf-name" value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" />
        </Field>
        <Field label="Availability" id="pf-availability" hint="Shown on your profile and used by talent discovery.">
          <Select id="pf-availability" value={availability} onChange={(e) => setAvailability(e.target.value as Availability)}>
            {(Object.keys(AVAILABILITY_LABEL) as Availability[]).map((a) => <option key={a} value={a}>{AVAILABILITY_LABEL[a]}</option>)}
          </Select>
        </Field>
      </div>
      <Field label={<span className="flex w-full items-center justify-between gap-2">Professional headline <CharCount value={headline} max={140} /></span>} id="pf-headline" error={errors.headline} hint="e.g. “Commercial lines producer · Construction & manufacturing”">
        <Input id="pf-headline" value={headline} onChange={(e) => setHeadline(e.target.value)} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="City" id="pf-city">
          <Input id="pf-city" value={city} onChange={(e) => setCity(e.target.value)} autoComplete="address-level2" />
        </Field>
        <Field label="State" id="pf-state">
          <Select id="pf-state" value={state} onChange={(e) => setState(e.target.value)}>
            <option value="">Select a state</option>
            {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
          </Select>
        </Field>
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Experience level" id="pf-level">
          <Select id="pf-level" value={level} onChange={(e) => setLevel(e.target.value as ExperienceLevel)}>
            {(Object.keys(EXPERIENCE_LABEL) as ExperienceLevel[]).map((l) => <option key={l} value={l}>{EXPERIENCE_LABEL[l]}</option>)}
          </Select>
        </Field>
        <Field label="Years in the industry" id="pf-years" error={errors.years} hint={aspiring ? "Use 0 if you're new to insurance." : undefined}>
          <Input id="pf-years" type="number" inputMode="numeric" min={0} max={60} value={years} onChange={(e) => setYears(e.target.value)} />
        </Field>
      </div>
      <Field label={<span className="flex w-full items-center justify-between gap-2">About <CharCount value={bio} max={1500} /></span>} id="pf-bio" error={errors.bio} hint="Aim for 80+ characters. Focus on how you work and what you're looking for.">
        <Textarea id="pf-bio" rows={6} value={bio} onChange={(e) => setBio(e.target.value)} />
      </Field>
      <ConfidentialityNotice />
    </EditorDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Specialties                                                         */
/* ------------------------------------------------------------------ */

export function SpecialtiesEditor({ user, profile, onClose }: { user: User; profile: ProducerProfile; onClose: () => void }) {
  const save = useSave(user, onClose);
  const [value, setValue] = useState<LineSlug[]>(profile.specialties);
  return (
    <EditorDialog title="Specialties" description="Choose the insurance and financial services areas you work in or want to grow toward. Used for transparent job matching." onClose={onClose} onSave={() => save({ specialties: value }, "Specialties updated")}>
      <SectorChips value={value} onChange={setValue} label="Specialties" />
      <p className="text-xs text-ink-3">{value.length} selected. These are career categories, not license lines of authority or registrations.</p>
    </EditorDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Preferences                                                         */
/* ------------------------------------------------------------------ */

export function PreferencesEditor({ user, profile, onClose }: { user: User; profile: ProducerProfile; onClose: () => void }) {
  const save = useSave(user, onClose);
  const [arr, setArr] = useState<WorkArrangement[]>(profile.arrangementPrefs);
  const [eng, setEng] = useState<EngagementType[]>(profile.engagementPrefs);
  const [interests, setInterests] = useState<string[]>(profile.careerInterests);
  return (
    <EditorDialog
      title="Work preferences & career interests"
      onClose={onClose}
      onSave={() => save({ arrangementPrefs: arr, engagementPrefs: eng, careerInterests: interests.map((s) => s.trim()).filter(Boolean) }, "Preferences updated")}
    >
      <Field label="Work arrangement">
        <ChipGroup options={(Object.keys(ARRANGEMENT_LABEL) as WorkArrangement[]).map((v) => ({ value: v, label: ARRANGEMENT_LABEL[v] }))} value={arr} onChange={setArr} ariaLabel="Work arrangement" />
      </Field>
      <Field label="Engagement type" hint="W-2 employment means you're an employee (taxes withheld, benefits often included). Independent contractor / affiliation means you run your own practice and typically cover your own costs.">
        <ChipGroup options={(Object.keys(ENGAGEMENT_LABEL) as EngagementType[]).map((v) => ({ value: v, label: ENGAGEMENT_LABEL[v] }))} value={eng} onChange={setEng} ariaLabel="Engagement type" />
      </Field>
      <Field label="Career interests" hint="Short phrases, e.g. “Structured training” or “Agency leadership track”.">
        <ListEditor value={interests} onChange={setInterests} addLabel="Add interest" placeholder="No interests added yet." />
      </Field>
    </EditorDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Licenses                                                            */
/* ------------------------------------------------------------------ */

export function LicensesEditor({ user, profile, onClose }: { user: User; profile: ProducerProfile; onClose: () => void }) {
  const save = useSave(user, onClose);
  const [items, setItems] = useState<LicenseRecord[]>(() => (profile.licenses.length ? structuredClone(profile.licenses) : [newLicense()]));
  const [tried, setTried] = useState(false);
  const patch = (id: string, p: Partial<LicenseRecord>) => setItems((xs) => xs.map((x) => (x.id === id ? { ...x, ...p } : x)));

  const submit = () => {
    setTried(true);
    if (items.some((l) => !l.state)) return;
    save({ licenses: items }, "Licenses & registrations updated");
  };

  return (
    <EditorDialog
      title="Licenses & registrations"
      description="Add the insurance licenses and securities registrations you hold, as you understand them. Every record is shown as self-reported."
      onClose={onClose}
      onSave={submit}
      size="xl"
    >
      <Notice title="Self-reported — not verified">
        This prototype does not verify licenses or registrations, and does not connect to any licensing or registration database.
        Records you add are displayed as “Self-reported — Not verified” everywhere they appear. For securities registrations,
        choose the state you primarily work in.
      </Notice>
      {items.length === 0 && <p className="text-sm text-ink-3">No license records. Add one below, or save to keep your licensing section empty.</p>}
      <ul className="space-y-4">
        {items.map((l, i) => (
          <li key={l.id} className="rounded-xl border border-line bg-subtle/40 p-4">
            <div className="mb-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-[13px] font-medium text-ink-2">
                License {i + 1}
                <UnverifiedLicenseBadge compact />
              </div>
              <button type="button" onClick={() => setItems((xs) => xs.filter((x) => x.id !== l.id))} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ink-3 transition hover:bg-sunken hover:text-danger" aria-label={`Remove license ${i + 1}`}>
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-4">
              <Field label="State" id={`lic-state-${l.id}`} error={tried && !l.state ? "Choose a state." : undefined} className="sm:col-span-2">
                <Select id={`lic-state-${l.id}`} value={l.state} onChange={(e) => patch(l.id, { state: e.target.value })}>
                  <option value="">Select a state</option>
                  {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
                </Select>
              </Field>
              <Field label="Residency" id={`lic-res-${l.id}`}>
                <Select id={`lic-res-${l.id}`} value={l.residency} onChange={(e) => patch(l.id, { residency: e.target.value as LicenseRecord["residency"] })}>
                  <option value="resident">Resident</option>
                  <option value="non_resident">Non-resident</option>
                </Select>
              </Field>
              <Field label="Status (as you report it)" id={`lic-status-${l.id}`}>
                <Select id={`lic-status-${l.id}`} value={l.status} onChange={(e) => patch(l.id, { status: e.target.value as LicenseRecord["status"] })}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </Select>
              </Field>
            </div>
            {LOA_GROUPS.map((g) => (
              <fieldset key={g.label} className="mt-4">
                <legend className="mb-2 text-[13px] font-medium text-ink-2">{g.label}</legend>
                <div className="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
                  {g.items.map((loa) => (
                    <Checkbox
                      key={loa}
                      id={`lic-${l.id}-${loa}`}
                      label={loa}
                      checked={l.linesOfAuthority.includes(loa)}
                      onChange={(v) => patch(l.id, { linesOfAuthority: v ? [...l.linesOfAuthority, loa] : l.linesOfAuthority.filter((x) => x !== loa) })}
                    />
                  ))}
                </div>
              </fieldset>
            ))}
            <Field label="Expiration date" optional id={`lic-exp-${l.id}`} className="mt-4 sm:max-w-[220px]">
              <Input id={`lic-exp-${l.id}`} type="date" value={l.expiresOn?.slice(0, 10) ?? ""} onChange={(e) => patch(l.id, { expiresOn: e.target.value || undefined })} />
            </Field>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" onClick={() => setItems((xs) => [...xs, newLicense()])}>
        <Plus className="h-3.5 w-3.5" /> Add license record
      </Button>
    </EditorDialog>
  );
}

/* ------------------------------------------------------------------ */
/* NPN                                                                 */
/* ------------------------------------------------------------------ */

export function NpnEditor({ user, profile, onClose }: { user: User; profile: ProducerProfile; onClose: () => void }) {
  const save = useSave(user, onClose);
  const [npn, setNpn] = useState(profile.npn ?? "");
  const [error, setError] = useState<string>();
  const submit = () => {
    const v = npn.trim();
    if (v && !/^(\d{1,10}|DEMO-\d{4,10})$/.test(v)) {
      setError("Enter up to 10 digits (demo values may use the DEMO- prefix).");
      return;
    }
    save({ npn: v || undefined }, v ? "NPN saved" : "NPN removed");
  };
  return (
    <EditorDialog title="National Producer Number (NPN)" description="Your NPN is private to you." onClose={onClose} onSave={submit} size="md">
      <Field label="NPN" id="pf-npn" optional error={error} hint="Never shown publicly or to other members. Shared with an organization only when you apply AND your privacy settings allow it.">
        <Input id="pf-npn" value={npn} onChange={(e) => setNpn(e.target.value)} autoComplete="off" spellCheck={false} placeholder="e.g. 12345678" />
      </Field>
      <Notice tone="demo">Prototype: use a fictional number. Nothing is checked against any licensing database.</Notice>
    </EditorDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Aspiring                                                            */
/* ------------------------------------------------------------------ */

export function AspiringEditor({ user, profile, onClose }: { user: User; profile: ProducerProfile; onClose: () => void }) {
  const save = useSave(user, onClose);
  const base: AspiringDetails = profile.aspiring ?? { stage: "exploring", targetLines: [], motivation: "" };
  const [stage, setStage] = useState(base.stage);
  const [lines, setLines] = useState<LineSlug[]>(base.targetLines);
  const [motivation, setMotivation] = useState(base.motivation);
  const [targetDate, setTargetDate] = useState(base.targetDate ?? "");
  return (
    <EditorDialog
      title="Your licensing journey"
      description="Organizations that train career changers use this to understand where you are."
      onClose={onClose}
      onSave={() =>
        save({ aspiring: { stage, targetLines: lines, motivation: motivation.trim(), targetDate: targetDate.trim() || undefined } }, "Licensing journey updated")
      }
    >
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Where you are now" id="asp-stage">
          <Select id="asp-stage" value={stage} onChange={(e) => setStage(e.target.value as AspiringDetails["stage"])}>
            {(Object.keys(ASPIRING_STAGE_LABEL) as AspiringDetails["stage"][]).map((s) => <option key={s} value={s}>{ASPIRING_STAGE_LABEL[s]}</option>)}
          </Select>
        </Field>
        <Field label="Target timing" id="asp-date" optional hint="e.g. “Early next year”">
          <Input id="asp-date" value={targetDate} onChange={(e) => setTargetDate(e.target.value)} />
        </Field>
      </div>
      <Field label="Areas you're working toward">
        <SectorChips value={lines} onChange={setLines} size="sm" label="Target areas" />
      </Field>
      <Field label="What's drawing you to insurance?" id="asp-motivation" hint="One or two sentences is plenty.">
        <Textarea id="asp-motivation" rows={3} value={motivation} onChange={(e) => setMotivation(e.target.value)} />
      </Field>
      <p className="text-xs leading-relaxed text-ink-3">Licensing requirements vary by state. This information is educational and is not licensing advice.</p>
    </EditorDialog>
  );
}

/* ------------------------------------------------------------------ */
/* Portfolio                                                           */
/* ------------------------------------------------------------------ */

export function ExpertiseEditor({ user, profile, onClose }: { user: User; profile: ProducerProfile; onClose: () => void }) {
  const save = useSave(user, onClose);
  const [items, setItems] = useState(profile.expertise);
  return (
    <EditorDialog title="Areas of expertise" onClose={onClose} onSave={() => save({ expertise: items.map((s) => s.trim()).filter(Boolean) }, "Expertise updated")} size="md">
      <ConfidentialityNotice />
      <ListEditor value={items} onChange={setItems} addLabel="Add area" placeholder="e.g. “Fleet risk” or “Enrollment-season planning”." />
    </EditorDialog>
  );
}

interface FieldDef<T> {
  key: Extract<keyof T, string>;
  label: string;
  kind?: "text" | "textarea" | "select";
  options?: { value: string; label: string }[];
  optional?: boolean;
  placeholder?: string;
  span?: 1 | 2;
}

function EntriesEditor<T extends { id: string }>({
  title,
  description,
  initial,
  fields,
  create,
  onSubmit,
  onClose,
  noun,
}: {
  title: string;
  description?: string;
  initial: T[];
  fields: FieldDef<T>[];
  create: () => T;
  onSubmit: (items: T[]) => void;
  onClose: () => void;
  noun: string;
}) {
  const [items, setItems] = useState<T[]>(() => (initial.length ? structuredClone(initial) : [create()]));
  const [tried, setTried] = useState(false);
  const required = fields.filter((f) => !f.optional);
  const isEmpty = (v: unknown) => v == null || String(v).trim() === "";

  const submit = () => {
    setTried(true);
    if (items.some((it) => required.some((f) => isEmpty(it[f.key])))) return;
    const cleaned = items.map((it) => {
      const out = { ...it } as Record<string, unknown>;
      for (const f of fields) {
        const v = out[f.key];
        if (typeof v === "string") out[f.key] = f.optional && v.trim() === "" ? undefined : v.trim();
      }
      return out as T;
    });
    onSubmit(cleaned);
  };

  return (
    <EditorDialog title={title} description={description} onClose={onClose} onSave={submit} size="xl">
      <ConfidentialityNotice />
      {items.length === 0 && <p className="text-sm text-ink-3">Nothing here yet.</p>}
      <ul className="space-y-4">
        {items.map((it, i) => (
          <li key={it.id} className="rounded-xl border border-line bg-subtle/40 p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="text-[13px] font-medium text-ink-2">{noun} {i + 1}</div>
              <button type="button" onClick={() => setItems((xs) => xs.filter((x) => x.id !== it.id))} className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs text-ink-3 transition hover:bg-sunken hover:text-danger" aria-label={`Remove ${noun.toLowerCase()} ${i + 1}`}>
                <Trash2 className="h-3.5 w-3.5" /> Remove
              </button>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              {fields.map((f) => {
                const id = `${it.id}-${f.key}`;
                const value = (it[f.key] as unknown as string | undefined) ?? "";
                const set = (v: string) => setItems((xs) => xs.map((x) => (x.id === it.id ? { ...x, [f.key]: v } : x)));
                const error = tried && !f.optional && isEmpty(value) ? "Required." : undefined;
                return (
                  <Field key={f.key} label={f.label} id={id} optional={f.optional} error={error} className={f.span === 2 || f.kind === "textarea" ? "sm:col-span-2" : undefined}>
                    {f.kind === "textarea" ? (
                      <Textarea id={id} rows={3} value={value} placeholder={f.placeholder} onChange={(e) => set(e.target.value)} />
                    ) : f.kind === "select" ? (
                      <Select id={id} value={value} onChange={(e) => set(e.target.value)}>
                        {f.options?.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                      </Select>
                    ) : (
                      <Input id={id} value={value} placeholder={f.placeholder} onChange={(e) => set(e.target.value)} />
                    )}
                  </Field>
                );
              })}
            </div>
          </li>
        ))}
      </ul>
      <Button variant="secondary" size="sm" onClick={() => setItems((xs) => [...xs, create()])}>
        <Plus className="h-3.5 w-3.5" /> Add {noun.toLowerCase()}
      </Button>
    </EditorDialog>
  );
}

export type PortfolioKey = "experience" | "education" | "certifications" | "awards" | "accomplishments";

export function PortfolioEditor({ which, user, profile, onClose }: { which: PortfolioKey; user: User; profile: ProducerProfile; onClose: () => void }) {
  const save = useSave(user, onClose);
  switch (which) {
    case "experience":
      return (
        <EntriesEditor<ExperienceEntry>
          title="Work experience"
          description="Roles in and outside insurance. Describe skills and process — never clients."
          noun="Role"
          initial={profile.experience}
          create={() => ({ id: newId("exp"), title: "", organization: "", start: "", description: "" })}
          fields={[
            { key: "title", label: "Title" },
            { key: "organization", label: "Organization" },
            { key: "start", label: "Start year", placeholder: "2019" },
            { key: "end", label: "End year", optional: true, placeholder: "Leave blank if current" },
            { key: "description", label: "Description", kind: "textarea" },
          ]}
          onSubmit={(experience) => save({ experience }, "Experience updated")}
          onClose={onClose}
        />
      );
    case "education":
      return (
        <EntriesEditor<EducationEntry>
          title="Education"
          noun="Entry"
          initial={profile.education}
          create={() => ({ id: newId("edu"), institution: "", credential: "" })}
          fields={[
            { key: "institution", label: "Institution", span: 2 },
            { key: "credential", label: "Degree or credential" },
            { key: "year", label: "Year", optional: true },
          ]}
          onSubmit={(education) => save({ education }, "Education updated")}
          onClose={onClose}
        />
      );
    case "certifications":
      return (
        <EntriesEditor<CertificationEntry>
          title="Certifications & designations"
          description="Self-reported. The platform does not verify certifications."
          noun="Certification"
          initial={profile.certifications}
          create={() => ({ id: newId("cert"), name: "", issuer: "", status: "self_reported" })}
          fields={[
            { key: "name", label: "Name", span: 2 },
            { key: "issuer", label: "Issuer" },
            { key: "year", label: "Year", optional: true },
            { key: "status", label: "Status", kind: "select", options: [{ value: "self_reported", label: "Completed (self-reported)" }, { value: "in_progress", label: "In progress" }] },
          ]}
          onSubmit={(certifications) => save({ certifications }, "Certifications updated")}
          onClose={onClose}
        />
      );
    case "awards":
      return (
        <EntriesEditor<AwardEntry>
          title="Awards & recognition"
          noun="Award"
          initial={profile.awards}
          create={() => ({ id: newId("aw"), title: "", issuer: "" })}
          fields={[
            { key: "title", label: "Title", span: 2 },
            { key: "issuer", label: "Issued by" },
            { key: "year", label: "Year", optional: true },
          ]}
          onSubmit={(awards) => save({ awards }, "Awards updated")}
          onClose={onClose}
        />
      );
    case "accomplishments":
      return (
        <EntriesEditor<AccomplishmentEntry>
          title="Accomplishments"
          description="Describe what you built or improved, in terms of skills and process."
          noun="Accomplishment"
          initial={profile.accomplishments}
          create={() => ({ id: newId("acc"), title: "", description: "" })}
          fields={[
            { key: "title", label: "Title" },
            { key: "year", label: "Year", optional: true },
            { key: "description", label: "Description", kind: "textarea" },
          ]}
          onSubmit={(accomplishments) => save({ accomplishments }, "Accomplishments updated")}
          onClose={onClose}
        />
      );
  }
}
