"use client";

import { useMemo, type ReactNode } from "react";
import Link from "next/link";
import { ArrowRight, Check, Columns3, Minus, X } from "lucide-react";
import type { Organization } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { approvedOrganizations, getOrganizationBySlug, orgOpenOpportunities } from "@/lib/services/organizations";
import {
  ARRANGEMENT_LABEL,
  ENGAGEMENT_LABEL,
  LEADS_LABEL,
  ORG_CATEGORY_DESCRIPTION,
  ORG_CATEGORY_LABEL,
  lineName,
  stateName,
} from "@/lib/data/taxonomy";
import { OrgLogo } from "@/components/brand/org-logo";
import { Badge } from "@/components/ui/badge";
import { ButtonLink } from "@/components/ui/button";
import { Select } from "@/components/ui/form";
import { DemoTag, EmptyState } from "@/components/ui/feedback";
import { Container, PageHeader } from "@/components/ui/page";
import { LineIcon } from "@/components/ui/line-icon";
import { RecruitingDot } from "@/components/domain/org-card";
import { CompensationDisclaimer } from "@/components/domain/disclaimers";
import { pluralize } from "@/lib/utils/format";
import { useUrlParams } from "./url-state";
import { MAX_COMPARE } from "./compare-config";

const FOOTPRINT_LABEL: Record<Organization["footprint"], string> = {
  local: "Local",
  regional: "Regional",
  multi_state: "Multi-state",
  national: "National",
};

interface Row {
  label: string;
  render: (o: Organization) => ReactNode;
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

  const available = useMemo(() => approvedOrganizations(db).filter((o) => !orgs.some((x) => x.id === o.id)).sort((a, b) => a.name.localeCompare(b.name)), [db, orgs]);
  const openCount = useMemo(() => new Map(orgs.map((o) => [o.id, orgOpenOpportunities(db, o.id).length])), [db, orgs]);

  const setIds = (ids: string[]) => update({ ids });
  const remove = (id: string) => setIds(orgs.filter((o) => o.id !== id).map((o) => o.id));
  const add = (id: string) => id && setIds([...orgs.map((o) => o.id), id]);

  const addSelect = (
    <div className="w-full max-w-[260px]">
      <label htmlFor="compare-add" className="sr-only">
        Add an organization to compare
      </label>
      <Select id="compare-add" value="" onChange={(e) => add(e.target.value)} className="h-9 text-[13px]">
        <option value="">+ Add organization…</option>
        {available.map((o) => (
          <option key={o.id} value={o.id}>
            {o.name}
          </option>
        ))}
      </Select>
    </div>
  );

  const rows: Row[] = [
    {
      label: "Organization type",
      render: (o) => (
        <>
          <div className="font-medium text-ink">{ORG_CATEGORY_LABEL[o.category]}</div>
          <div className="mt-1 text-[12.5px] leading-snug text-ink-3">{ORG_CATEGORY_DESCRIPTION[o.category]}</div>
        </>
      ),
    },
    {
      label: "Headquarters",
      render: (o) => (
        <>
          {o.hqCity}, {o.hqState}
          <div className="mt-0.5 text-[12.5px] text-ink-3">
            Founded {o.founded} · {o.teamSize}
          </div>
        </>
      ),
    },
    {
      label: "Footprint",
      render: (o) => (
        <>
          {FOOTPRINT_LABEL[o.footprint]}
          <div className="mt-0.5 text-[12.5px] text-ink-3">
            {o.statesServed.includes("ALL") ? "Nationwide" : o.statesServed.length <= 6 ? o.statesServed.map(stateName).join(", ") : `${o.statesServed.length} states`}
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
    { label: "Work arrangements", render: (o) => o.arrangements.map((a) => ARRANGEMENT_LABEL[a]).join(" · ") },
    { label: "Engagement types", render: (o) => <div className="space-y-1">{o.engagementTypes.map((e) => <div key={e}>{ENGAGEMENT_LABEL[e]}</div>)}</div> },
    {
      label: "Training programs",
      render: (o) =>
        o.trainingAvailable && o.trainingPrograms.length ? (
          <ul className="space-y-2">
            {o.trainingPrograms.map((t) => (
              <li key={t.id}>
                <div className="font-medium text-ink">{t.name}</div>
                <div className="text-[12.5px] text-ink-3">{t.duration}</div>
              </li>
            ))}
          </ul>
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
      label: "Lead program",
      render: (o) => (
        <>
          <Badge tone={o.leadProgram.policy === "provided" ? "success" : o.leadProgram.policy === "available_at_cost" ? "warning" : "neutral"}>{LEADS_LABEL[o.leadProgram.policy]}</Badge>
          <div className="mt-1.5 text-[12.5px] leading-snug text-ink-3">{o.leadProgram.description}</div>
        </>
      ),
    },
    { label: "Compensation approach", render: (o) => <p className="text-[13px] leading-relaxed text-ink-2">{o.compensationApproach}</p> },
    { label: "Recruiting status", render: (o) => <RecruitingDot status={o.recruitingStatus} /> },
    {
      label: "Open roles",
      render: (o) => {
        const n = openCount.get(o.id) ?? 0;
        return n ? (
          <Link href={`/organizations/${o.slug}#open-roles`} className="inline-flex items-center gap-1 font-medium text-navy-600 hover:text-navy">
            {pluralize(n, "open role")} <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <Absent>None right now</Absent>
        );
      },
    },
  ];

  return (
    <Container className="pb-24 pt-8">
      <PageHeader
        breadcrumbs={[{ href: "/organizations", label: "Organizations" }, { label: "Compare" }]}
        eyebrow="Side by side"
        title="Compare organizations"
        description="See how training, mentorship, lead programs and compensation approaches differ. Every detail is as stated by the organization."
        actions={orgs.length > 0 && orgs.length < MAX_COMPARE ? addSelect : undefined}
      />

      {orgs.length < 2 ? (
        <EmptyState
          icon={<Columns3 className="h-5 w-5" strokeWidth={1.75} />}
          title={orgs.length === 1 ? "Add one more organization to compare" : "Choose organizations to compare"}
          description={
            orgs.length === 1
              ? `${orgs[0]!.name} is selected. Add at least one more to see a side-by-side comparison.`
              : "Pick two or three organizations here, or select them with “Compare” in the directory."
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
      ) : (
        <>
          <div className="overflow-x-auto rounded-2xl border border-line bg-surface shadow-card">
            <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-[13.5px]">
              <caption className="sr-only">Comparison of {orgs.map((o) => o.name).join(", ")}</caption>
              <thead>
                <tr>
                  <th scope="col" className="sticky left-0 z-10 w-[170px] border-b border-line bg-surface px-4 py-4 align-bottom sm:w-[200px] sm:px-5">
                    <span className="eyebrow">{orgs.length} organizations</span>
                  </th>
                  {orgs.map((o) => (
                    <th key={o.id} scope="col" className="border-b border-l border-line px-4 py-4 align-top font-normal sm:px-5">
                      <div className="flex items-start justify-between gap-2">
                        <OrgLogo brand={o.brand} name={o.name} size={40} />
                        <button type="button" onClick={() => remove(o.id)} className="rounded-md p-1 text-ink-4 hover:bg-sunken hover:text-ink" aria-label={`Remove ${o.name} from comparison`}>
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                      <Link href={`/organizations/${o.slug}`} className="mt-3 block text-[15px] font-semibold leading-snug tracking-[-0.01em] text-ink hover:underline">
                        {o.name}
                      </Link>
                      <p className="mt-1 line-clamp-2 text-[12.5px] leading-snug text-ink-3">{o.tagline}</p>
                      <DemoTag className="mt-2">Fictional</DemoTag>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.label} className="align-top">
                    <th
                      scope="row"
                      className={`sticky left-0 z-10 border-line bg-subtle px-4 py-4 text-[12.5px] font-medium text-ink-2 sm:px-5 ${i < rows.length - 1 ? "border-b" : ""}`}
                    >
                      {r.label}
                    </th>
                    {orgs.map((o) => (
                      <td key={o.id} className={`border-l border-line px-4 py-4 text-ink-2 sm:px-5 ${i < rows.length - 1 ? "border-b" : ""}`}>
                        {r.render(o)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-ink-4 sm:hidden">Scroll sideways to see every organization.</p>
          <CompensationDisclaimer className="mt-6 max-w-3xl" />
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
    <span className="inline-flex items-center gap-1.5 font-medium text-success">
      <Check className="h-3.5 w-3.5" strokeWidth={2.5} /> {yesLabel}
    </span>
  ) : (
    <span className="inline-flex items-center gap-1.5 text-ink-4">
      <Minus className="h-3.5 w-3.5" strokeWidth={2.5} /> {noLabel}
    </span>
  );
}
