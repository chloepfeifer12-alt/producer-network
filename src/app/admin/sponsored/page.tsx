"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { CircleCheck, CircleX, Megaphone, Pause, Play, Plus, Square } from "lucide-react";
import type { SponsoredPlacement, SponsoredSurface } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { can } from "@/lib/auth/permissions";
import { createSponsoredPlacement, setSponsoredStatus } from "@/lib/services/admin";
import { PageHeader } from "@/components/ui/page";
import { Card, CardBody, CardHeader } from "@/components/ui/card";
import { Badge, type BadgeTone } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Field, Input, Select } from "@/components/ui/form";
import { EmptyState, Notice, SponsoredTag } from "@/components/ui/feedback";
import { Segmented, Tabs } from "@/components/ui/tabs";
import { toast, toastResult } from "@/components/ui/toast";
import { OrgLogo } from "@/components/brand/org-logo";
import { GuardedButton, PermissionNotice, TableShell, Td, Th, deniedReason } from "@/components/admin/admin-kit";
import { SURFACE_DESCRIPTION, SURFACE_LABEL, SurfacePreview } from "@/components/admin/sponsored-preview";
import { formatDate, nowISO } from "@/lib/utils/dates";

const STATUS_TONE: Record<SponsoredPlacement["status"], BadgeTone> = {
  active: "success",
  scheduled: "navy",
  paused: "warning",
  ended: "outline",
  requested: "gold",
};
const SURFACES = Object.keys(SURFACE_LABEL) as SponsoredSurface[];

type Filter = "all" | SponsoredPlacement["status"];

function windowLabel(s: SponsoredPlacement) {
  return `${formatDate(s.startsOn, { month: "short", day: "numeric" })} – ${formatDate(s.endsOn, { month: "short", day: "numeric", year: "numeric" })}`;
}

function toDateInput(d: Date) {
  return d.toISOString().slice(0, 10);
}

export default function AdminSponsoredPage() {
  const db = useDb();
  const user = useCurrentUser();
  const allowed = can(user, "admin:manage_sponsored");
  const [filter, setFilter] = useState<Filter>("all");
  const [creating, setCreating] = useState(false);
  const [confirm, setConfirm] = useState<{ s: SponsoredPlacement; to: SponsoredPlacement["status"]; title: string; body: string } | null>(null);
  const [previewSurface, setPreviewSurface] = useState<SponsoredSurface>("search_top");

  const org = (id: string) => db.organizations.find((o) => o.id === id);
  const opp = (id?: string) => (id ? db.opportunities.find((o) => o.id === id) : undefined);

  const requested = useMemo(() => db.sponsored.filter((s) => s.status === "requested"), [db]);
  const placements = useMemo(
    () => db.sponsored.filter((s) => filter === "all" || s.status === filter).sort((a, b) => b.startsOn.localeCompare(a.startsOn)),
    [db, filter],
  );
  const counts = useMemo(() => {
    const c: Record<Filter, number> = { all: db.sponsored.length, active: 0, scheduled: 0, paused: 0, ended: 0, requested: 0 };
    db.sponsored.forEach((s) => (c[s.status] += 1));
    return c;
  }, [db]);

  const previewPlacement = db.sponsored.find((s) => s.surface === previewSurface && s.status === "active") ?? db.sponsored.find((s) => s.surface === previewSurface);

  const change = (s: SponsoredPlacement, to: SponsoredPlacement["status"], msg: string) => toastResult(setSponsoredStatus(user, s.id, to), msg, `${org(s.orgId)?.name ?? "Placement"} · logged to the audit trail.`);

  const approve = (s: SponsoredPlacement) => {
    const to = s.startsOn > nowISO() ? "scheduled" : "active";
    change(s, to, to === "active" ? "Placement approved — now active" : `Placement approved — scheduled for ${formatDate(s.startsOn)}`);
  };

  const resume = (s: SponsoredPlacement) => change(s, s.startsOn > nowISO() ? "scheduled" : "active", "Placement resumed");

  return (
    <div>
      <PageHeader
        eyebrow="Marketplace"
        title="Sponsored placements"
        description="Paid visibility for approved organizations. Review requests, manage running placements and see exactly how each surface labels sponsored content."
        actions={
          <GuardedButton user={user} permission="admin:manage_sponsored" variant="primary" onClick={() => setCreating(true)}>
            <Plus className="h-4 w-4" /> Create placement
          </GuardedButton>
        }
      />
      <PermissionNotice user={user} permission="admin:manage_sponsored" what="sponsored placements" />

      <Notice tone="info" title="Sponsored placement policy" className="mb-8">
        Sponsored placements are always labeled “Sponsored”, rendered in a separate block from organic results, and never affect organic ranking, search relevance or directory order. Only approved organizations are eligible, and a linked listing must itself pass moderation.
      </Notice>

      <section aria-labelledby="requests" className="mb-10">
        <h2 id="requests" className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
          Requests awaiting review <span className="rounded-full bg-sunken px-1.5 text-[11px] tabular-nums text-ink-3">{requested.length}</span>
        </h2>
        {requested.length === 0 ? (
          <EmptyState compact icon={<Megaphone className="h-5 w-5" />} title="No pending requests" description="Organizations on Growth and Premier plans can request placements from their billing page." />
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {requested.map((s) => {
              const o = org(s.orgId);
              const linked = opp(s.opportunityId);
              return (
                <Card key={s.id}>
                  <CardBody className="space-y-4">
                    <div className="flex items-start gap-3">
                      {o && <OrgLogo brand={o.brand} name={o.name} size={38} />}
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-semibold text-ink">{o?.name}</span>
                          <Badge tone="gold">Requested</Badge>
                        </div>
                        <div className="text-[13px] text-ink-3">{SURFACE_LABEL[s.surface]} · {windowLabel(s)}</div>
                        {linked && (
                          <div className="mt-1 text-[13px]">
                            Linked listing:{" "}
                            <Link href={`/admin/opportunities?review=${linked.id}`} className="text-navy-600 hover:text-navy">{linked.title}</Link>{" "}
                            <span className="text-ink-4">({linked.status.replace("_", " ")})</span>
                          </div>
                        )}
                        <div className="mt-1 text-xs text-ink-4">Plan: {db.plans.find((p) => p.id === o?.plan)?.name} · {db.plans.find((p) => p.id === o?.plan)?.limits.sponsoredSlots} slot(s) included</div>
                      </div>
                    </div>
                    <SurfacePreview surface={s.surface} org={o} opportunity={linked} />
                    <div className="flex flex-wrap gap-2">
                      <GuardedButton user={user} permission="admin:manage_sponsored" variant="accent" size="sm" onClick={() => approve(s)}>
                        <CircleCheck className="h-3.5 w-3.5" /> Approve{s.startsOn > nowISO() ? " & schedule" : ""}
                      </GuardedButton>
                      <GuardedButton
                        user={user}
                        permission="admin:manage_sponsored"
                        variant="danger"
                        size="sm"
                        onClick={() => setConfirm({ s, to: "ended", title: "Decline request", body: `Decline ${o?.name}'s request? The placement is closed (status “ended”) and the organization is notified.` })}
                      >
                        <CircleX className="h-3.5 w-3.5" /> Decline
                      </GuardedButton>
                    </div>
                  </CardBody>
                </Card>
              );
            })}
          </div>
        )}
      </section>

      <section aria-labelledby="all-placements" className="mb-10">
        <Card>
          <CardHeader title={<span id="all-placements">All placements</span>} description="Pause, resume or end placements. Date windows are inclusive." />
          <div className="mt-3 px-5 sm:px-6">
            <Tabs<Filter>
              value={filter}
              onChange={setFilter}
              items={(["all", "active", "scheduled", "requested", "paused", "ended"] as Filter[]).map((f) => ({ value: f, label: f === "all" ? "All" : f[0]!.toUpperCase() + f.slice(1), count: counts[f] }))}
            />
          </div>
          {placements.length === 0 ? (
            <div className="border-t border-line p-5 sm:p-6"><EmptyState compact title="No placements in this state" /></div>
          ) : (
            <TableShell minWidth={900} className="border-t border-line">
              <thead>
                <tr><Th>Organization</Th><Th>Surface</Th><Th>Linked listing</Th><Th>Window</Th><Th>Status</Th><Th className="text-right">Actions</Th></tr>
              </thead>
              <tbody>
                {placements.map((s) => {
                  const o = org(s.orgId);
                  const linked = opp(s.opportunityId);
                  return (
                    <tr key={s.id}>
                      <Td>
                        <div className="flex items-center gap-2.5">
                          {o && <OrgLogo brand={o.brand} name={o.name} size={28} />}
                          <Link href={`/admin/organizations/${s.orgId}`} className="font-medium text-ink hover:text-navy">{o?.name ?? s.orgId}</Link>
                        </div>
                      </Td>
                      <Td className="whitespace-nowrap">{SURFACE_LABEL[s.surface]}</Td>
                      <Td className="max-w-[220px] truncate">{linked ? <Link href={`/admin/opportunities?review=${linked.id}`} className="hover:text-navy">{linked.title}</Link> : <span className="text-ink-4">Organization only</span>}</Td>
                      <Td className="whitespace-nowrap tabular-nums">{windowLabel(s)}</Td>
                      <Td><Badge tone={STATUS_TONE[s.status]}>{s.status}</Badge></Td>
                      <Td>
                        <div className="flex justify-end gap-1.5">
                          {s.status === "requested" && (
                            <GuardedButton user={user} permission="admin:manage_sponsored" variant="secondary" size="xs" onClick={() => approve(s)}>Approve</GuardedButton>
                          )}
                          {(s.status === "active" || s.status === "scheduled") && (
                            <GuardedButton user={user} permission="admin:manage_sponsored" variant="secondary" size="xs" onClick={() => change(s, "paused", "Placement paused")}>
                              <Pause className="h-3 w-3" /> Pause
                            </GuardedButton>
                          )}
                          {s.status === "paused" && (
                            <GuardedButton user={user} permission="admin:manage_sponsored" variant="secondary" size="xs" onClick={() => resume(s)}>
                              <Play className="h-3 w-3" /> Resume
                            </GuardedButton>
                          )}
                          {s.status !== "ended" && (
                            <GuardedButton
                              user={user}
                              permission="admin:manage_sponsored"
                              variant="danger"
                              size="xs"
                              onClick={() => setConfirm({ s, to: "ended", title: s.status === "requested" ? "Decline request" : "End placement", body: `End the ${SURFACE_LABEL[s.surface]} placement for ${o?.name}? It stops showing immediately. This can't be resumed — create a new placement instead.` })}
                            >
                              <Square className="h-3 w-3" /> {s.status === "requested" ? "Decline" : "End"}
                            </GuardedButton>
                          )}
                          {s.status === "ended" && <span className="text-xs text-ink-4">—</span>}
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </tbody>
            </TableShell>
          )}
        </Card>
      </section>

      <section aria-labelledby="preview" className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <div>
          <h2 id="preview" className="font-display text-2xl">How each surface renders “Sponsored”</h2>
          <p className="mt-2 text-sm leading-relaxed text-ink-3">
            Every surface shows the <SponsoredTag className="mx-0.5 align-middle" /> label on the card and places sponsored content in its own labeled band above organic results. Choose a surface to preview it with a real placement.
          </p>
          <div className="mt-4 overflow-x-auto pb-1">
            <Segmented<SponsoredSurface> ariaLabel="Surface" value={previewSurface} onChange={setPreviewSurface} items={SURFACES.map((s) => ({ value: s, label: SURFACE_LABEL[s].split(" · ")[0]! }))} />
          </div>
          <ul className="mt-5 space-y-2 text-[13px] text-ink-3">
            {SURFACES.map((s) => <li key={s}><span className="font-medium text-ink-2">{SURFACE_LABEL[s]}:</span> {SURFACE_DESCRIPTION[s]}</li>)}
          </ul>
        </div>
        <SurfacePreview surface={previewSurface} org={previewPlacement ? org(previewPlacement.orgId) : undefined} opportunity={opp(previewPlacement?.opportunityId)} />
      </section>

      {confirm && (
        <Dialog
          open
          onClose={() => setConfirm(null)}
          title={confirm.title}
          size="sm"
          footer={
            <>
              <Button variant="ghost" onClick={() => setConfirm(null)}>Cancel</Button>
              <Button
                variant="danger"
                disabled={!allowed}
                title={!allowed ? deniedReason(user, "admin:manage_sponsored") : undefined}
                onClick={() => {
                  if (change(confirm.s, confirm.to, confirm.s.status === "requested" ? "Request declined" : "Placement ended")) setConfirm(null);
                }}
              >
                {confirm.title}
              </Button>
            </>
          }
        >
          <p className="text-sm leading-relaxed text-ink-2">{confirm.body}</p>
          <p className="mt-2 text-xs text-ink-3">Recorded in the audit log with your name.</p>
        </Dialog>
      )}

      {creating && <CreatePlacementDialog onClose={() => setCreating(false)} />}
    </div>
  );
}

function CreatePlacementDialog({ onClose }: { onClose: () => void }) {
  const db = useDb();
  const user = useCurrentUser();
  const approved = useMemo(() => db.organizations.filter((o) => o.listingStatus === "approved").sort((a, b) => a.name.localeCompare(b.name)), [db]);
  const today = new Date();
  const [orgId, setOrgId] = useState(approved[0]?.id ?? "");
  const [surface, setSurface] = useState<SponsoredSurface>("directory_top");
  const [oppId, setOppId] = useState("");
  const [start, setStart] = useState(toDateInput(today));
  const [end, setEnd] = useState(toDateInput(new Date(today.getTime() + 30 * 86_400_000)));
  const orgOpps = useMemo(() => db.opportunities.filter((o) => o.orgId === orgId && o.status === "published"), [db, orgId]);
  const selectedOrg = approved.find((o) => o.id === orgId);
  const plan = db.plans.find((p) => p.id === selectedOrg?.plan);
  const used = db.sponsored.filter((s) => s.orgId === orgId && ["active", "scheduled", "requested"].includes(s.status)).length;
  const dateError = end <= start ? "End date must be after the start date." : undefined;

  const submit = () => {
    if (dateError) {
      toast("Check the dates", { body: dateError, tone: "error" });
      return;
    }
    const r = createSponsoredPlacement(user, { orgId, surface, opportunityId: oppId || undefined, startsOn: start, endsOn: end });
    if (toastResult(r, "Placement created", `${selectedOrg?.name} · ${SURFACE_LABEL[surface]}. Logged to the audit trail.`)) onClose();
  };

  return (
    <Dialog
      open
      onClose={onClose}
      size="lg"
      title="Create sponsored placement"
      description="Admin-created placements bypass the request queue. They start active when the start date is today or earlier, otherwise scheduled."
      footer={
        <>
          <Button variant="ghost" onClick={onClose}>Cancel</Button>
          <Button variant="primary" onClick={submit} disabled={!orgId}>Create placement</Button>
        </>
      }
    >
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Field id="spn-org" label="Organization" hint={plan ? `${plan.name} plan · ${used} of ${plan.limits.sponsoredSlots} included slot(s) in use${used >= plan.limits.sponsoredSlots ? " — admin override" : ""}` : "Only approved organizations are eligible."}>
            <Select id="spn-org" value={orgId} onChange={(e) => { setOrgId(e.target.value); setOppId(""); }}>
              {approved.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
            </Select>
          </Field>
          <Field id="spn-surface" label="Surface">
            <Select id="spn-surface" value={surface} onChange={(e) => setSurface(e.target.value as SponsoredSurface)}>
              {SURFACES.map((s) => <option key={s} value={s}>{SURFACE_LABEL[s]}</option>)}
            </Select>
          </Field>
          <Field id="spn-opp" label="Linked opportunity" optional hint={orgOpps.length ? "Only published listings can be promoted." : "This organization has no published listings."}>
            <Select id="spn-opp" value={oppId} onChange={(e) => setOppId(e.target.value)} disabled={!orgOpps.length}>
              <option value="">Organization profile only</option>
              {orgOpps.map((o) => <option key={o.id} value={o.id}>{o.title}</option>)}
            </Select>
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field id="spn-start" label="Starts">
              <Input id="spn-start" type="date" value={start} onChange={(e) => setStart(e.target.value)} />
            </Field>
            <Field id="spn-end" label="Ends" error={dateError}>
              <Input id="spn-end" type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} aria-invalid={!!dateError} />
            </Field>
          </div>
        </div>
        <div>
          <div className="mb-2 text-[13px] font-medium text-ink-2">Preview</div>
          <SurfacePreview surface={surface} org={selectedOrg} opportunity={orgOpps.find((o) => o.id === oppId)} />
        </div>
      </div>
    </Dialog>
  );
}
