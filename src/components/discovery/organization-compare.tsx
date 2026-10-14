"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { ArrowLeft, ArrowRight, Check, Columns3, Minus, X } from "lucide-react";
import type { Organization } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { approvedOrganizations, getOrganizationBySlug, orgOpenOpportunities } from "@/lib/services/organizations";
import { ARRANGEMENT_LABEL, ORG_CATEGORY_DESCRIPTION, ORG_CATEGORY_LABEL, lineName } from "@/lib/data/taxonomy";
import { CoverArt, variantFor } from "@/components/brand/cover-art";
import { OrgLogo } from "@/components/brand/org-logo";
import { Kicker } from "@/components/editorial";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { EmptyState } from "@/components/ui/feedback";
import { Container } from "@/components/ui/page";
import { LineIcon } from "@/components/ui/line-icon";
import { RecruitingDot } from "@/components/domain/org-card";
import { CompensationDisclaimer } from "@/components/domain/disclaimers";
import { FOOTPRINT_LABEL, FORMAT_LABEL, LEAD_SHORT, footprintDetail } from "@/components/discover/org-facts";
import { pluralize } from "@/lib/utils/format";
import { cn } from "@/lib/utils/cn";
import { useUrlParams } from "./url-state";
import { MAX_COMPARE } from "./compare-config";

interface Row {
  label: string;
  render: (o: Organization) => ReactNode;
}
interface Group {
  title: string;
  rows: Row[];
}

export function OrganizationCompare() {
  const db = useDb();
  const { params, update } = useUrlParams();

  const orgs = useMemo(() => {
    const ids = (params.get("ids") ?? "").split(",").filter(Boolean);
    const out: Organization[] = [];
    for (const id of ids) {
      const o = getOrganizationBySlug(db, id);
      if (o && o.listingStatus === "approved" && !out.some((x) => x.id === o.id)) out.push(o);
    }
    return out.slice(0, MAX_COMPARE);
  }, [db, params]);

  const all = useMemo(() => approvedOrganizations(db).slice().sort((a, b) => a.name.localeCompare(b.name)), [db]);
  const available = useMemo(() => all.filter((o) => !orgs.some((x) => x.id === o.id)), [all, orgs]);
  const roleCounts = useMemo(
    () =>
      new Map(
        orgs.map((o) => {
          const r = orgOpenOpportunities(db, o.id);
          return [o.id, { w2: r.filter((x) => x.engagement === "w2").length, ic: r.filter((x) => x.engagement === "independent_contractor").length }];
        }),
      ),
    [db, orgs],
  );

  /** Suggested head-to-heads: companies of the same type, so first-time visitors have a starting point. */
  const suggestions = useMemo(() => {
    const byCat = new Map<string, Organization[]>();
    all.forEach((o) => byCat.set(o.category, [...(byCat.get(o.category) ?? []), o]));
    const pairs = [...byCat.values()].filter((g) => g.length >= 2).map((g) => g.slice(0, 3));
    if (pairs.length < 3) {
      const w2 = all.find((o) => o.engagementTypes.length === 1 && o.engagementTypes[0] === "w2" && o.trainingPrograms.length > 1);
      const ic = all.find((o) => o.engagementTypes.length === 1 && o.engagementTypes[0] === "independent_contractor");
      if (w2 && ic) pairs.push([w2, ic]);
    }
    return pairs.slice(0, 3);
  }, [all]);

  const setIds = (ids: string[]) => update({ ids });
  const remove = (id: string) => setIds(orgs.filter((o) => o.id !== id).map((o) => o.id));
  const add = (id: string) => id && setIds([...orgs.map((o) => o.id), id]);

  const addSelect = (
    <div className="w-full max-w-[260px]">
      <label htmlFor="compare-add" className="sr-only">
        Add an organization to compare
      </label>
      <Select id="compare-add" value="" onChange={(e) => add(e.target.value)} className="h-10 text-[13.5px]">
        <option value="">+ Add a company…</option>
        {available.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
    </div>
  );

  const groups: Group[] = [
    {
      title: "The basics",
      rows: [
        {
          label: "Type",
          render: (o) => (
            <>
              <div className="font-medium text-ink">{ORG_CATEGORY_LABEL[o.category]}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-ink-3">{ORG_CATEGORY_DESCRIPTION[o.category]}</div>
            </>
          ),
        },
        {
          label: "Footprint",
          render: (o) => (
            <>
              <div className="font-medium text-ink">{FOOTPRINT_LABEL[o.footprint]}</div>
              <div className="mt-0.5 text-[12.5px] text-ink-3">
                HQ {o.hqCity}, {o.hqState} · {footprintDetail(o)}
              </div>
              <div className="mt-0.5 text-[12.5px] text-ink-3">
                Founded {o.founded} · {o.teamSize}
              </div>
            </>
          ),
        },
        {
          label: "Specialties",
          render: (o) => (
            <ul className="space-y-1">
              {o.lines.map((l) => (
                <li key={l} className="flex items-center gap-2">
                  <LineIcon line={l} className="h-3.5 w-3.5 text-ink-4" />
                  {lineName(l)}
                </li>
              ))}
            </ul>
          ),
        },
      ],
    },
    {
      title: "How you'd work",
      rows: [
        {
          label: "Employment model",
          render: (o) => (
            <div className="flex flex-wrap gap-1.5">
              {o.engagementTypes.map((e) => (
                <Badge key={e} tone={e === "w2" ? "navy" : "gold"}>
                  {e === "w2" ? "W-2 employment" : "1099 · Independent"}
                </Badge>
              ))}
            </div>
          ),
        },
        {
          label: "Arrangements",
          render: (o) => (
            <div className="space-y-1">
              {(["remote", "hybrid", "in_person"] as const).map((a) => (
                <YesNo key={a} yes={o.arrangements.includes(a)} yesLabel={ARRANGEMENT_LABEL[a]} noLabel={ARRANGEMENT_LABEL[a]} />
              ))}
            </div>
          ),
        },
        {
          label: "Lead support",
          render: (o) => (
            <>
              <div className={cn("font-medium", o.leadProgram.policy === "available_at_cost" ? "text-warning" : "text-ink")}>{LEAD_SHORT[o.leadProgram.policy]}</div>
              <div className="mt-1 text-[12.5px] leading-snug text-ink-3">{o.leadProgram.description}</div>
            </>
          ),
        },
      ],
    },
    {
      title: "Development",
      rows: [
        {
          label: "Training",
          render: (o) =>
            o.trainingAvailable && o.trainingPrograms.length ? (
              <ol className="space-y-2.5">
                {o.trainingPrograms.map((t) => (
                  <li key={t.id}>
                    <div className="font-medium text-ink">{t.name}</div>
                    <div className="text-[12.5px] text-ink-3">
                      {FORMAT_LABEL[t.format]} · {t.duration}
                    </div>
                  </li>
                ))}
              </ol>
            ) : (
              <Absent>No formal programs listed</Absent>
            ),
        },
        {
          label: "Mentorship",
          render: (o) => (
            <>
              <YesNo yes={o.mentorship.available} yesLabel="Available" noLabel="Not offered" />
              {o.mentorship.description && <div className="mt-1 text-[12.5px] leading-snug text-ink-3">{o.mentorship.description}</div>}
            </>
          ),
        },
        {
          label: "New Producer Portal",
          render: (o) => (o.portal?.participating ? <YesNo yes yesLabel="Participating" noLabel="" /> : <Absent>Not participating</Absent>),
        },
      ],
    },
    {
      title: "Culture & pay",
      rows: [
        {
          label: "Culture",
          render: (o) => (
            <>
              {o.culture.summary && <p className="font-display text-[15.5px] italic leading-snug text-ink">{o.culture.summary}</p>}
              {o.culture.values.length > 0 && <div className="mt-1.5 text-[12.5px] text-ink-3">{o.culture.values.map((v) => v.title).join(" · ")}</div>}
            </>
          ),
        },
        { label: "Compensation approach", render: (o) => <p className="text-[13px] leading-relaxed text-ink-2">{o.compensationApproach}</p> },
      ],
    },
    {
      title: "Right now",
      rows: [
        { label: "Recruiting", render: (o) => <RecruitingDot status={o.recruitingStatus} /> },
        {
          label: "Open roles",
          render: (o) => {
            const c = roleCounts.get(o.id) ?? { w2: 0, ic: 0 };
            if (!c.w2 && !c.ic) return <Absent>None right now</Absent>;
            return (
              <div className="space-y-1.5">
                {c.w2 > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge tone="navy">Job · Employment</Badge>
                    <span className="tabular-nums">{c.w2}</span>
                  </div>
                )}
                {c.ic > 0 && (
                  <div className="flex items-center gap-2">
                    <Badge tone="gold">Affiliation · Contracting</Badge>
                    <span className="tabular-nums">{c.ic}</span>
                  </div>
                )}
                <Link href={`/organizations/${o.slug}#open-roles`} className="inline-flex items-center gap-1 pt-1 text-[12.5px] font-medium text-navy-600 hover:text-navy">
                  See {pluralize(c.w2 + c.ic, "role")} <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            );
          },
        },
      ],
    },
  ];

  return (
    <Container className="pb-24 pt-10">
      <Kicker>
        <Link href="/discover" className="inline-flex items-center gap-1.5 hover:text-ink">
          <ArrowLeft className="h-3 w-3" /> Discover
        </Link>
        <span className="mx-2 text-ink-4">/</span>Compare
      </Kicker>
      <div className="mb-10 mt-5 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="min-w-0">
          <h1 className="font-display text-[36px] leading-[1.05] tracking-[-0.015em] text-ink sm:text-[48px]">Side by side</h1>
          <p className="mt-3 max-w-2xl text-[15px] leading-relaxed text-ink-3">
            Training, lead support, W-2 or 1099, mentorship and compensation approach — line by line. Every detail is as stated by the organization.
          </p>
        </div>
        {orgs.length > 0 && orgs.length < MAX_COMPARE && <div className={cn("shrink-0", orgs.length >= 2 && "md:hidden")}>{addSelect}</div>}
      </div>

      {orgs.length < 2 ? (
        <div className="grid gap-10 lg:grid-cols-12">
          <EmptyState
            className="lg:col-span-7"
            icon={<Columns3 className="h-5 w-5" strokeWidth={1.75} />}
            title={orgs.length === 1 ? "Add one more company to compare" : "Choose companies to compare"}
            description={
              orgs.length === 1
                ? `${orgs[0]!.name} is selected. Add at least one more to see a side-by-side comparison.`
                : "Pick two or three companies here, or tap “Compare” on any card in Discover or the directory."
            }
            action={
              <div className="flex flex-col items-center gap-3">
                {orgs.length === 0 && addSelect}
                <ButtonLink href="/organizations" variant="secondary" size="sm">
                  Browse the directory
                </ButtonLink>
              </div>
            }
          />
          {suggestions.length > 0 && (
            <div className="lg:col-span-5">
              <Kicker>Suggested comparisons</Kicker>
              <ul className="mt-2">
                {suggestions.map((g) => (
                  <li key={g.map((o) => o.id).join()} className="border-b border-line">
                    <Link href={`/organizations/compare?ids=${g.map((o) => o.id).join(",")}`} className="group flex items-center gap-4 py-4">
                      <span className="flex -space-x-2">
                        {g.map((o) => (
                          <OrgLogo key={o.id} brand={o.brand} name={o.name} size={34} className="ring-2 ring-canvas" />
                        ))}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[14px] font-medium text-ink">{g.map((o) => o.name.split(" ")[0]).join(" vs ")}</span>
                        <span className="block text-[12.5px] text-ink-3">
                          {new Set(g.map((o) => o.category)).size === 1 ? `Two ${ORG_CATEGORY_LABEL[g[0]!.category]} profiles` : "W-2 employer vs independent affiliation"}
                        </span>
                      </span>
                      <ArrowRight className="h-4 w-4 text-ink-4 transition group-hover:translate-x-0.5 group-hover:text-ink" />
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
            <table className="w-full min-w-[760px] border-separate border-spacing-0 text-left text-[13.5px]">
              <caption className="sr-only">Comparison of {orgs.map((o) => o.name).join(", ")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-[170px] border-b border-line bg-surface px-4 pb-5 align-bottom sm:w-[210px] sm:px-6">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-4">{orgs.length} companies</span>
                  </th>
                  {orgs.map((o) => (
                    <th key={o.id} scope="col" className="border-b border-l border-line p-0 align-top font-normal">
                      <div className="relative h-20 overflow-hidden">
                        <CoverArt seed={o.id} variant={variantFor(o.id)} hue={o.brand.color} ground={o.brand.tint} />
                        <button
                          type="button"
                          onClick={() => remove(o.id)}
                          className="absolute right-2 top-2 rounded-full bg-surface/90 p-1.5 text-ink-3 backdrop-blur hover:bg-surface hover:text-ink"
                          aria-label={`Remove ${o.name} from comparison`}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <div className="px-4 pb-5 sm:px-6">
                        <OrgLogo brand={o.brand} name={o.name} size={44} className="-mt-6 relative ring-4 ring-surface" />
                        <Link href={`/organizations/${o.slug}`} className="mt-3 block font-display text-[20px] leading-snug tracking-[-0.01em] text-ink hover:underline hover:decoration-line-strong hover:underline-offset-4">
                          {o.name}
                        </Link>
                        <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink-3">{o.tagline}</p>
                      </div>
                    </th>
                  ))}
                  {orgs.length < MAX_COMPARE && (
                    <th scope="col" className="hidden w-[200px] border-b border-l border-line px-5 align-middle font-normal md:table-cell">
                      <div className="flex flex-col items-start gap-2 text-[12.5px] text-ink-3">
                        <span>Room for one more</span>
                        <label htmlFor="compare-add-col" className="sr-only">
                          Add a company
                        </label>
                        <Select id="compare-add-col" value="" onChange={(e) => add(e.target.value)} className="h-9 text-[13px]">
                          <option value="">+ Add…</option>
                          {available.map((o) => (
                            <option key={o.id} value={o.id}>
                              {o.name}
                            </option>
                          ))}
                        </Select>
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              {groups.map((g) => (
                <tbody key={g.title}>
                  <tr>
                    <th scope="colgroup" colSpan={orgs.length + 2} className="border-b border-line bg-subtle/70 px-4 py-2.5 text-left sm:px-6">
                      <span className="sticky left-6 text-[11px] font-semibold uppercase tracking-[0.14em] text-ink-3">{g.title}</span>
                    </th>
                  </tr>
                  {g.rows.map((r) => (
                    <tr key={r.label} className="align-top">
                      <th scope="row" className="sticky left-0 z-10 border-b border-line bg-surface px-4 py-4 text-[12.5px] font-medium text-ink-2 sm:px-6">
                        {r.label}
                      </th>
                      {orgs.map((o) => (
                        <td key={o.id} className="border-b border-l border-line px-4 py-4 text-ink-2 sm:px-6">
                          {r.render(o)}
                        </td>
                      ))}
                      {orgs.length < MAX_COMPARE && <td className="hidden border-b border-l border-line md:table-cell" />}
                    </tr>
                  ))}
                </tbody>
              ))}
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-4 sm:hidden">Scroll sideways to see every company.</p>
          <div className="mt-6 flex flex-wrap items-start justify-between gap-4">
            <CompensationDisclaimer className="max-w-3xl" />
            <span className="text-[12px] text-ink-4">All companies are fictional demo profiles.</span>
          </div>
        </>
      )}
    </Container>
  );
}

function Absent({ children }: { children: ReactNode }) {
  return <span className="text-ink-4">{children}</span>;
}

function YesNo({ yes, yesLabel, noLabel }: { yes: boolean; yesLabel: string; noLabel: string }) {
  return yes ? (
    <span className="flex items-center gap-1.5 font-medium text-success">
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> {yesLabel}
    </span>
  ) : (
    <span className="flex items-center gap-1.5 text-ink-4">
      <Minus className="h-3.5 w-3.5" strokeWidth={2.5} /> {noLabel}
    </span>
  );
}
