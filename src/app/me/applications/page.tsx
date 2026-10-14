"use client";

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Archive, Bookmark, CalendarClock, Search, Send } from "lucide-react";
import type { Opportunity } from "@/lib/data/types";
import { useDb } from "@/lib/store/db-store";
import { useCurrentUser } from "@/lib/auth/session";
import { applicationsForApplicant } from "@/lib/services/applications";
import { PageHeader } from "@/components/ui/page";
import { Card } from "@/components/ui/card";
import { ButtonLink } from "@/components/ui/button";
import { EmptyState, PageSkeleton } from "@/components/ui/feedback";
import { Tabs } from "@/components/ui/tabs";
import { DemoApplicationDisclaimer } from "@/components/domain/disclaimers";
import { relativeDay } from "@/lib/utils/dates";
import { ApplicationRow } from "@/components/member/application-parts";
import { JobRow } from "@/components/member/job-row";
import { isActiveApp, isClosedApp } from "@/components/member/utils";

type TabKey = "saved" | "applied" | "interviewing" | "archived";
const TABS: TabKey[] = ["saved", "applied", "interviewing", "archived"];

export default function MyJobsPage() {
  return (
    <Suspense fallback={<PageSkeleton />}>
      <MyJobs />
    </Suspense>
  );
}

function MyJobs() {
  const db = useDb();
  const user = useCurrentUser();
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const raw = params.get("tab");
  const tab: TabKey = TABS.includes(raw as TabKey) ? (raw as TabKey) : "applied";
  const setTab = (t: TabKey) => router.replace(`${pathname}?tab=${t}`, { scroll: false });

  const apps = useMemo(() => (user ? applicationsForApplicant(db, user.id) : []), [db, user]);
  const saved = useMemo(() => {
    if (!user) return [];
    return db.savedOpportunities
      .filter((s) => s.userId === user.id)
      .map((s) => ({ s, o: db.opportunities.find((o) => o.id === s.targetId) }))
      .filter((x): x is { s: typeof x.s; o: Opportunity } => !!x.o);
  }, [db, user]);
  const appliedIds = useMemo(() => new Set(apps.filter((a) => !a.withdrawn).map((a) => a.opportunityId)), [apps]);

  const groups = useMemo(
    () => ({
      applied: apps.filter((a) => isActiveApp(a) && a.stage !== "interview"),
      interviewing: apps.filter((a) => !a.withdrawn && a.stage === "interview"),
      archived: apps.filter(isClosedApp),
    }),
    [apps],
  );

  const empty: Record<TabKey, { icon: React.ReactNode; title: string; body: string }> = {
    saved: { icon: <Bookmark className="h-5 w-5" />, title: "No saved jobs", body: "Tap the bookmark on any job to keep it here while you compare." },
    applied: { icon: <Send className="h-5 w-5" />, title: "No active applications", body: "When you apply, you choose exactly what each employer receives. Your applications will appear here." },
    interviewing: { icon: <CalendarClock className="h-5 w-5" />, title: "No interviews right now", body: "When an employer schedules an interview, it shows up here with the details." },
    archived: { icon: <Archive className="h-5 w-5" />, title: "Nothing archived", body: "Hired, closed and withdrawn applications are kept here for your records." },
  };

  const list = tab === "saved" ? null : groups[tab];
  const count = tab === "saved" ? saved.length : list!.length;

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader
        title="My jobs"
        description="Jobs you've saved and applied to, in one place."
        actions={<ButtonLink href="/opportunities" variant="secondary" size="sm"><Search className="h-4 w-4" />Find jobs</ButtonLink>}
      />

      <Tabs<TabKey>
        className="mb-5"
        value={tab}
        onChange={setTab}
        items={[
          { value: "saved", label: "Saved", count: saved.length },
          { value: "applied", label: "Applied", count: groups.applied.length },
          { value: "interviewing", label: "Interviewing", count: groups.interviewing.length },
          { value: "archived", label: "Archived", count: groups.archived.length },
        ]}
      />

      <div role="tabpanel" aria-label={tab}>
        {count === 0 ? (
          <EmptyState
            compact
            icon={empty[tab].icon}
            title={empty[tab].title}
            description={empty[tab].body}
            action={tab === "saved" || tab === "applied" ? <ButtonLink href="/opportunities" variant="secondary" size="sm">Search jobs</ButtonLink> : undefined}
          />
        ) : (
          <Card className="overflow-hidden">
            <ul className="divide-y divide-line">
              {tab === "saved"
                ? saved.map(({ s, o }) => (
                    <JobRow
                      key={o.id}
                      o={o}
                      org={db.organizations.find((x) => x.id === o.orgId)}
                      applied={appliedIds.has(o.id)}
                      meta={`Saved ${relativeDay(s.savedAt).toLowerCase()}`}
                    />
                  ))
                : list!.map((a) => (
                    <ApplicationRow
                      key={a.id}
                      app={a}
                      opp={db.opportunities.find((o) => o.id === a.opportunityId)}
                      org={db.organizations.find((o) => o.id === a.orgId)}
                    />
                  ))}
            </ul>
          </Card>
        )}
        {tab === "saved" && (
          <p className="mt-4 text-[13px] text-ink-3">
            Saved organizations and resources live in <Link href="/me/saved" className="text-navy-600 hover:text-navy">your full saved list</Link>.
          </p>
        )}
      </div>
      <DemoApplicationDisclaimer className="mt-6" />
    </div>
  );
}
