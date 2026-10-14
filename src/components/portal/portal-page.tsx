"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, CheckCircle2, GraduationCap, MapPin, Plus, Search, Sparkles, X } from "lucide-react";
import type { ApplicationShare, LineSlug, Organization, PortalShowcase } from "@/lib/data/types";
import { useDb, useHydrated } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { expressInterest, interestsForUser, portalCompanies, withdrawInterest } from "@/lib/services/portal";
import { orgOpenOpportunities } from "@/lib/services/organizations";
import { LINES_BY_SECTOR, ORG_CATEGORY_LABEL, SECTOR_LABEL, US_STATES, stateName } from "@/lib/data/taxonomy";
import { OrgLogo } from "@/components/brand/org-logo";
import { Button, ButtonLink } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox, Field, Textarea } from "@/components/ui/form";
import { Dialog } from "@/components/ui/dialog";
import { Container } from "@/components/ui/page";
import { EmptyState, Notice } from "@/components/ui/feedback";
import { toast } from "@/components/ui/toast";
import { relativeDay } from "@/lib/utils/dates";
import { cn } from "@/lib/utils/cn";

type PortalOrg = Organization & { portal: PortalShowcase };

const STATUS_LABEL = { sent: "Sent", viewed: "Viewed by company", contacted: "Company responded", closed: "Withdrawn" } as const;

function CompanyShowcase({ org, selected, onToggle, sent, openRoles }: { org: PortalOrg; selected: boolean; onToggle: () => void; sent: boolean; openRoles: number }) {
  const p = org.portal;
  return (
    <article className={cn("group relative flex flex-col overflow-hidden rounded-[22px] border bg-surface transition duration-200", selected ? "border-navy shadow-lift ring-2 ring-navy/15" : "border-line shadow-card hover:shadow-lift")}>
      <div className="relative px-6 pb-5 pt-6" style={{ background: `linear-gradient(160deg, ${org.brand.tint}, color-mix(in oklab, ${org.brand.tint} 45%, white))` }}>
        <div className="flex items-start justify-between gap-4">
          <OrgLogo brand={org.brand} name={org.name} size={52} />
          <span className="rounded-full bg-surface/85 px-2.5 py-1 text-[11px] font-medium text-ink-2 ring-1 ring-black/5">{ORG_CATEGORY_LABEL[org.category]}</span>
        </div>
        <div className="mt-4 text-[13px] font-medium text-ink-2">{org.name}</div>
        <h3 className="mt-1 font-display text-[25px] leading-[1.15] text-ink">{p.headline}</h3>
      </div>
      <div className="flex flex-1 flex-col px-6 pb-6 pt-5">
        <ul className="space-y-2">
          {p.whyJoin.map((w) => (
            <li key={w} className="flex gap-2.5 text-[13.5px] text-ink-2">
              <Check className="mt-0.5 h-4 w-4 shrink-0 text-success" strokeWidth={2.2} />
              {w}
            </li>
          ))}
        </ul>
        <div className="mt-5 rounded-xl bg-subtle px-4 py-3">
          <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-4">Your first year</div>
          <p className="mt-1 text-[13px] leading-relaxed text-ink-2">{p.firstYear}</p>
        </div>
        <div className="mt-4 space-y-1.5 text-[12.5px] text-ink-3">
          <div className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5" />Hiring in {p.statesHiring.includes("ALL") ? "all states" : p.statesHiring.map(stateName).join(", ")}</div>
          <div className="flex items-center gap-1.5"><GraduationCap className="h-3.5 w-3.5" />{p.licensingSupport}</div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5">
          {p.idealFor.map((t) => <span key={t} className="rounded-full border border-line px-2.5 py-0.5 text-xs text-ink-2">{t}</span>)}
        </div>
        <div className="mt-auto flex items-center gap-2 pt-6">
          {sent ? (
            <span className="inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg bg-success-50 text-sm font-medium text-success"><CheckCircle2 className="h-4 w-4" />Interest sent</span>
          ) : (
            <button
              type="button"
              onClick={onToggle}
              aria-pressed={selected}
              className={cn("inline-flex h-10 flex-1 items-center justify-center gap-2 rounded-lg text-sm font-medium transition", selected ? "bg-navy text-white hover:bg-navy-600" : "border border-line-strong bg-surface text-ink hover:border-ink-4")}
            >
              {selected ? <><Check className="h-4 w-4" />Added</> : <><Plus className="h-4 w-4" />I&apos;m interested</>}
            </button>
          )}
          <ButtonLink href={`/organizations/${org.slug}`} variant="ghost" className="h-10">
            {openRoles} open {openRoles === 1 ? "role" : "roles"} <ArrowRight className="h-3.5 w-3.5" />
          </ButtonLink>
        </div>
      </div>
    </article>
  );
}

export function PortalPage() {
  const db = useDb();
  const hydrated = useHydrated();
  const user = useCurrentUser();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [state, setState] = useState("");
  const [lines, setLines] = useState<LineSlug[]>([]);
  const [noLicenseYet, setNoLicenseYet] = useState(false);
  const [selected, setSelected] = useState<string[]>([]);
  const [open, setOpen] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  const companies = useMemo(() => portalCompanies(db, { q, state, lines, noLicenseYet }), [db, q, state, lines, noLicenseYet]);
  const mine = useMemo(() => interestsForUser(db, user?.id), [db, user?.id]);
  const sentIds = useMemo(() => new Set(mine.filter((i) => i.status !== "closed").map((i) => i.orgId)), [mine]);
  const isMember = can(user, "member:apply");
  const profile = db.profiles.find((p) => p.userId === user?.id);

  const [note, setNote] = useState("");
  const [share, setShare] = useState<ApplicationShare>({ contactEmail: true, licenses: true, npn: false, experience: true });
  const [ack, setAck] = useState(false);

  const toggle = (id: string) => setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));

  const startSend = () => {
    if (!user) {
      toast("Join to raise your hand", { body: "Create a demo profile or pick a demo persona first.", tone: "info" });
      router.push("/join");
      return;
    }
    if (!isMember) {
      toast("The portal is for producers", { body: "Switch to a producer persona to express interest.", tone: "info" });
      return;
    }
    if (!note && profile) setNote(`Hi — I'm ${user.name.split(" ")[0]}${profile.city ? ` in ${profile.city}, ${profile.state}` : ""}. ${profile.headline ? profile.headline + ". " : ""}I'd love to learn about your program for new producers.`);
    setDone(null);
    setOpen(true);
  };

  const submit = () => {
    const r = expressInterest(user, { orgIds: selected, note, share, consentAcknowledged: ack });
    if (r.ok) {
      setDone(r.data);
      setSelected([]);
      setAck(false);
    } else toast("Couldn't send", { body: r.error, tone: "error" });
  };

  const lineOptions = (["insurance", "financial_services"] as const).map((sec) => ({ sec, lines: LINES_BY_SECTOR[sec] }));

  return (
    <div className="pb-32">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-line">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(50%_70%_at_85%_0%,var(--color-gold-50),transparent_70%),radial-gradient(40%_60%_at_0%_100%,var(--color-navy-50),transparent_70%)]" />
        <Container className="relative py-16 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-gold-200 bg-surface/80 px-3 py-1 text-[12.5px] font-medium text-gold-ink">
              <GraduationCap className="h-4 w-4" /> New Producer Portal
            </div>
            <h1 className="font-display text-[42px] leading-[1.04] tracking-[-0.02em] sm:text-[60px]">Just licensed? Meet the companies that hire — and train — new producers.</h1>
            <p className="mx-auto mt-5 max-w-2xl text-[16.5px] leading-relaxed text-ink-3">
              A curated room of insurance and financial services companies with real programs for people starting out. Browse their showcases, add the ones you like, and introduce yourself to all of them at once — sharing only what you choose.
            </p>
          </div>

          {/* Search */}
          <div className="mx-auto mt-10 flex max-w-3xl flex-col gap-2 rounded-2xl border border-line bg-surface p-2 shadow-lift sm:flex-row">
            <label className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 focus-within:bg-subtle">
              <Search className="h-5 w-5 text-ink-4" />
              <span className="sr-only">Company or program</span>
              <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Company or program" className="w-full bg-transparent text-[15px] outline-none placeholder:text-ink-4" />
            </label>
            <div className="hidden w-px bg-line sm:block" />
            <label className="flex flex-1 items-center gap-3 rounded-xl px-4 py-3 focus-within:bg-subtle">
              <MapPin className="h-5 w-5 text-ink-4" />
              <span className="sr-only">Licensed in</span>
              <select value={state} onChange={(e) => setState(e.target.value)} className="w-full appearance-none bg-transparent text-[15px] outline-none">
                <option value="">Licensed in any state</option>
                {US_STATES.map((s) => <option key={s.code} value={s.code}>{s.name}</option>)}
              </select>
            </label>
          </div>

          <div className="mx-auto mt-5 flex max-w-4xl flex-wrap items-center justify-center gap-2">
            <button type="button" onClick={() => setNoLicenseYet((v) => !v)} aria-pressed={noLicenseYet} className={cn("rounded-full border px-3 py-1.5 text-[13px] transition", noLicenseYet ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4")}>
              Not licensed yet
            </button>
            {lineOptions.map(({ sec, lines: ls }) => (
              <div key={sec} className="flex flex-wrap items-center gap-2">
                <span className="ml-2 text-[11px] font-semibold uppercase tracking-[0.12em] text-ink-4">{SECTOR_LABEL[sec]}</span>
                {ls.filter((l) => db.organizations.some((o) => o.portal?.participating && o.lines.includes(l.slug))).map((l) => {
                  const on = lines.includes(l.slug);
                  return (
                    <button key={l.slug} type="button" aria-pressed={on} onClick={() => setLines((v) => (on ? v.filter((x) => x !== l.slug) : [...v, l.slug]))} className={cn("rounded-full border px-3 py-1.5 text-[13px] transition", on ? "border-navy bg-navy text-white" : "border-line-strong bg-surface text-ink-2 hover:border-ink-4")}>
                      {l.shortName}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* My interest list */}
      {hydrated && isMember && mine.length > 0 && (
        <section id="my-interest" className="border-b border-line bg-surface">
          <Container className="py-8">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 className="text-[17px] font-semibold tracking-[-0.01em]">Companies you&apos;ve reached out to</h2>
              <span className="text-xs text-ink-4">Demo — introductions stay in this browser and are never sent to real companies.</span>
            </div>
            <ul className="scrollbar-none mt-4 flex gap-3 overflow-x-auto pb-1">
              {mine.map((i) => {
                const org = db.organizations.find((o) => o.id === i.orgId);
                if (!org) return null;
                return (
                  <li key={i.id} className="flex min-w-[260px] items-center gap-3 rounded-xl border border-line bg-canvas px-4 py-3">
                    <OrgLogo brand={org.brand} name={org.name} size={34} />
                    <div className="min-w-0 flex-1">
                      <div className="truncate text-[13.5px] font-medium">{org.name}</div>
                      <div className="mt-0.5 flex items-center gap-2 text-xs text-ink-3">
                        <Badge tone={i.status === "contacted" ? "success" : i.status === "closed" ? "outline" : i.status === "viewed" ? "navy" : "neutral"}>{STATUS_LABEL[i.status]}</Badge>
                        <span suppressHydrationWarning>{relativeDay(i.createdAt)}</span>
                      </div>
                    </div>
                    {i.status !== "closed" && (
                      <button type="button" className="rounded-md p-1 text-ink-4 hover:bg-sunken hover:text-ink" aria-label={`Withdraw interest in ${org.name}`} onClick={() => { const r = withdrawInterest(user, i.id); if (r.ok) toast("Interest withdrawn", { tone: "info" }); }}>
                        <X className="h-4 w-4" />
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </Container>
        </section>
      )}

      {/* Showcase grid */}
      <section>
        <Container className="py-14">
          <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
            <div>
              <div className="eyebrow mb-2">This season&apos;s participating companies</div>
              <h2 className="font-display text-[30px] leading-tight sm:text-[36px]">{companies.length} {companies.length === 1 ? "company is" : "companies are"} looking for new producers</h2>
            </div>
            <p className="max-w-sm text-[13px] leading-relaxed text-ink-3">Every company here is fictional for this prototype. Participation is curated and reviewed; it is not ranked by payment.</p>
          </div>
          {companies.length === 0 ? (
            <EmptyState icon={<Sparkles className="h-5 w-5" />} title="No companies match those filters" description="Try another state or clear a category." action={<Button variant="secondary" onClick={() => { setQ(""); setState(""); setLines([]); setNoLicenseYet(false); }}>Clear filters</Button>} />
          ) : (
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {companies.map((o) => (
                <CompanyShowcase key={o.id} org={o} selected={selected.includes(o.id)} onToggle={() => toggle(o.id)} sent={sentIds.has(o.id)} openRoles={orgOpenOpportunities(db, o.id).length} />
              ))}
            </div>
          )}
        </Container>
      </section>

      {/* How it works */}
      <section className="border-t border-line bg-surface">
        <Container className="grid gap-10 py-16 md:grid-cols-3">
          {[
            ["Browse showcases", "See how each company trains new producers, what your first year looks like, and where they hire."],
            ["Add the ones you like", "Tap “I'm interested” on as many companies as you want. Nothing is shared yet."],
            ["Introduce yourself once", "Write one short note, choose exactly which profile details to share, and send to everyone you picked."],
          ].map(([t, b], i) => (
            <div key={t}>
              <div className="font-display text-4xl text-gold">0{i + 1}</div>
              <div className="mt-3 text-[16px] font-semibold">{t}</div>
              <p className="mt-1.5 text-sm leading-relaxed text-ink-3">{b}</p>
            </div>
          ))}
        </Container>
      </section>

      {/* Sticky selection bar */}
      {selected.length > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-50 px-4">
          <div className="mx-auto flex max-w-3xl items-center gap-4 rounded-2xl bg-ink px-4 py-3 text-white shadow-pop animate-rise sm:px-5">
            <div className="flex -space-x-2">
              {selected.slice(0, 4).map((id) => {
                const o = db.organizations.find((x) => x.id === id);
                return o ? <OrgLogo key={id} brand={o.brand} name={o.name} size={30} className="ring-2 ring-ink" /> : null;
              })}
            </div>
            <div className="min-w-0 flex-1 text-sm">
              <span className="font-medium">{selected.length} {selected.length === 1 ? "company" : "companies"} selected</span>
              <span className="hidden text-white/60 sm:inline"> · introduce yourself to all at once</span>
            </div>
            <button type="button" className="text-[13px] text-white/60 hover:text-white" onClick={() => setSelected([])}>Clear</button>
            <Button variant="secondary" className="border-white" onClick={startSend}>Express interest <ArrowRight className="h-4 w-4" /></Button>
          </div>
        </div>
      )}

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        title={done != null ? "Your introductions are on their way" : "Introduce yourself"}
        description={done != null ? undefined : `To ${selected.length} ${selected.length === 1 ? "company" : "companies"}. They'll see only what you choose below.`}
        footer={
          done != null ? (
            <Button onClick={() => setOpen(false)}>Back to the portal</Button>
          ) : (
            <>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button variant="accent" onClick={submit} disabled={!ack}>Send introductions</Button>
            </>
          )
        }
      >
        {done != null ? (
          <div className="space-y-4">
            <div className="flex items-center gap-3 rounded-xl bg-success-50 px-4 py-3 text-sm text-success"><CheckCircle2 className="h-5 w-5" />Sent to {done} {done === 1 ? "company" : "companies"}.</div>
            <p className="text-sm leading-relaxed text-ink-3">You&apos;ll see each company&apos;s response in &ldquo;Companies you&apos;ve reached out to&rdquo; at the top of this page and in your notifications. You can withdraw an introduction at any time.</p>
            <Notice tone="demo">Prototype: introductions are stored only in this browser&apos;s demo data and are never transmitted to real organizations.</Notice>
            <Link href="/opportunities?exp=newly_licensed" className="inline-flex items-center gap-1.5 text-sm font-medium text-navy-600 hover:text-navy">Browse jobs for newly licensed producers <ArrowRight className="h-3.5 w-3.5" /></Link>
          </div>
        ) : (
          <div className="space-y-5">
            <Field label="Your note" id="pi-note" hint="One short note goes to every selected company.">
              <Textarea id="pi-note" value={note} onChange={(e) => setNote(e.target.value)} rows={4} />
            </Field>
            <div>
              <div className="mb-2 text-[13px] font-medium text-ink-2">Share with these companies</div>
              <div className="space-y-3 rounded-xl border border-line p-4">
                <Checkbox checked={share.contactEmail} onChange={(v) => setShare({ ...share, contactEmail: v })} label="Contact email" />
                <Checkbox checked={share.licenses} onChange={(v) => setShare({ ...share, licenses: v })} label="License & registration records" description="Shown as self-reported — not verified." />
                <Checkbox checked={share.experience} onChange={(v) => setShare({ ...share, experience: v })} label="Work history & education" />
                <Checkbox checked={share.npn} onChange={(v) => setShare({ ...share, npn: v })} label="NPN" description={profile?.consent.shareNpnOnApply ? "Allowed by your privacy settings." : "Your privacy settings currently block NPN sharing, so it won't be shared."} />
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {selected.map((id) => {
                const o = db.organizations.find((x) => x.id === id);
                return o ? <span key={id} className="inline-flex items-center gap-1.5 rounded-full border border-line bg-subtle py-0.5 pl-0.5 pr-2.5 text-xs text-ink-2"><OrgLogo brand={o.brand} name={o.name} size={20} />{o.name}</span> : null;
              })}
            </div>
            <Checkbox checked={ack} onChange={setAck} label="I understand the selected information will be shared only with the companies above, and that I can withdraw at any time." />
          </div>
        )}
      </Dialog>
    </div>
  );
}
